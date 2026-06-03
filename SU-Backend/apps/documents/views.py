from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import redirect
from django.core.exceptions import ValidationError
from core.throttling import UploadRateThrottle
from apps.documents.models import Document
from apps.documents.serializers import DocumentSerializer
from services.document_service import DocumentService

class DocumentListUploadView(APIView):
    """
    GET /api/documents - list visible documents
    POST /api/documents - upload a new document
    """
    throttle_classes = [UploadRateThrottle]

    def get(self, request):
        queryset = Document.objects.all().order_by('-created_at')
        
        shared = request.query_params.get('shared')
        doc_type = request.query_params.get('type')
        search = request.query_params.get('search')
        
        if shared == 'true':
            queryset = queryset.filter(shared=True)
        elif shared == 'false':
            queryset = queryset.filter(shared=False)
            
        if doc_type:
            queryset = queryset.filter(type=doc_type.upper())
        if search:
            queryset = queryset.filter(name__icontains=search)
            
        # Pagination
        from django.core.paginator import Paginator
        page_num = request.query_params.get('page', 1)
        limit = request.query_params.get('limit', 10)
        
        paginator = Paginator(queryset, limit)
        page_obj = paginator.get_page(page_num)
        
        serializer = DocumentSerializer(page_obj.object_list, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "pagination": {
                "total": paginator.count,
                "page": page_obj.number,
                "limit": paginator.per_page,
                "totalPages": paginator.num_pages
            }
        })

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"success": False, "error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Run validation pipeline
            DocumentService.validate_file(file_obj)
            
            # S3/local storage upload
            storage_key = DocumentService.upload_to_storage(file_obj)
            
            # Save mapping in database
            ext = file_obj.name.split('.')[-1].lower() if '.' in file_obj.name else 'bin'
            doc = Document.objects.create(
                name=file_obj.name,
                type=ext.upper(),
                size=file_obj.size,
                storage_key=storage_key,
                uploaded_by=request.user
            )
            
            return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            # Retrieve string message
            msg = e.messages[0] if hasattr(e, 'messages') else str(e)
            return Response({"success": False, "error": msg}, status=status.HTTP_400_BAD_REQUEST)


class DocumentDownloadView(APIView):
    """
    GET /api/documents/{id}/download - increment downloads and redirect to storage
    """
    def get(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Increment downloads atomically
        DocumentService.increment_downloads(doc.id)
        
        # Resolve download URL
        url = DocumentService.generate_presigned_url(doc)
        return redirect(url)


class DocumentShareView(APIView):
    """
    PATCH /api/documents/{id}/share - toggle sharing vault status
    """
    def patch(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Owner or Admin/Manager only
        if doc.uploaded_by_id != request.user.id and request.user.role not in ['admin', 'manager']:
            return Response({"success": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        shared_val = request.data.get('shared', not doc.shared)
        doc.shared = shared_val
        doc.save()
        
        return Response({"success": True, "shared": doc.shared, "message": "Document vault status updated"}, status=status.HTTP_200_OK)


class DocumentDeleteView(APIView):
    """
    DELETE /api/documents/{id} - delete a document from database & storage
    """
    def delete(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Owner or Admin/Manager only
        if doc.uploaded_by_id != request.user.id and request.user.role not in ['admin', 'manager']:
            return Response({"success": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        # Delete from actual file system storage
        from django.core.files.storage import default_storage
        try:
            default_storage.delete(doc.storage_key)
        except Exception:
            pass
            
        doc.delete()
        return Response({"success": True, "message": "Document deleted successfully"}, status=status.HTTP_200_OK)
