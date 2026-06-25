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
    GET /api/documents - list visible documents with advanced filters & search
    POST /api/documents - upload a new document with metadata
    """
    def get_throttles(self):
        if self.request.method == 'POST':
            return [UploadRateThrottle()]
        return super().get_throttles()

    def get(self, request):
        queryset = Document.objects.all().order_by('-created_at')
        
        shared = request.query_params.get('shared')
        doc_type = request.query_params.get('type')
        category = request.query_params.get('category')
        region = request.query_params.get('region')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search = request.query_params.get('search')
        
        if shared == 'true':
            queryset = queryset.filter(shared=True)
        elif shared == 'false':
            queryset = queryset.filter(shared=False)
            
        if doc_type and doc_type != 'all':
            queryset = queryset.filter(type=doc_type.upper())
            
        if category and category != 'All Documents':
            queryset = queryset.filter(category=category)
            
        if region and region != 'all':
            queryset = queryset.filter(uploaded_by__region=region)
            
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__icontains=search) |
                Q(category__icontains=search) |
                Q(uploaded_by__name__icontains=search) |
                Q(uploaded_by__email__icontains=search)
            )
            
        # Pagination
        from django.core.paginator import Paginator
        page_num = request.query_params.get('page', 1)
        limit = request.query_params.get('limit', 100) # Let's support larger listing limits
        
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
            
        category = request.data.get('category', 'Others')
        description = request.data.get('description', '')
        tags = request.data.get('tags', '')
            
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
                uploaded_by=request.user,
                category=category,
                description=description,
                tags=tags
            )
            
            return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            msg = e.messages[0] if hasattr(e, 'messages') else str(e)
            return Response({"success": False, "error": msg}, status=status.HTTP_400_BAD_REQUEST)


class DocumentDownloadView(APIView):
    """
    GET /api/documents/{id}/download - increment downloads and redirect to storage
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        try:
            doc = Document._base_manager.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Increment downloads atomically
        DocumentService.increment_downloads(doc.id)
        
        # Resolve download URL
        url = DocumentService.generate_presigned_url(doc)
        
        if request.query_params.get('download') == '1':
            import os
            from django.conf import settings
            from django.http import FileResponse
            
            file_path = os.path.join(settings.MEDIA_ROOT, doc.storage_key)
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=doc.name)
                return response

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
        if doc.uploaded_by_id != request.user.id and request.user.role not in ['administrator', 'national_manager']:
            return Response({"success": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        shared_val = request.data.get('shared', not doc.shared)
        doc.shared = shared_val
        doc.save()
        
        return Response({"success": True, "shared": doc.shared, "message": "Document vault status updated"}, status=status.HTTP_200_OK)


class DocumentDetailView(APIView):
    """
    GET /api/documents/{id} - retrieve a specific document
    PATCH /api/documents/{id} - update metadata (name, category, description, tags, shared)
    DELETE /api/documents/{id} - delete a document from database & storage
    """
    def get(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = DocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        # Owner or Admin/Manager only
        if doc.uploaded_by_id != request.user.id and request.user.role not in ['administrator', 'national_manager']:
            return Response({"success": False, "error": "Permission denied to update"}, status=status.HTTP_403_FORBIDDEN)

        # Update metadata fields
        if 'name' in request.data:
            doc.name = request.data['name']
        if 'category' in request.data:
            doc.category = request.data['category']
        if 'description' in request.data:
            doc.description = request.data['description']
        if 'tags' in request.data:
            doc.tags = request.data['tags']
        if 'shared' in request.data:
            doc.shared = request.data['shared']
            
        doc.save()
        serializer = DocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"success": False, "error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        # Owner or Admin/Manager only
        if doc.uploaded_by_id != request.user.id and request.user.role not in ['administrator', 'national_manager']:
            return Response({"success": False, "error": "Permission denied to delete"}, status=status.HTTP_403_FORBIDDEN)

        # Delete from actual file system storage
        from django.core.files.storage import default_storage
        try:
            default_storage.delete(doc.storage_key)
        except Exception:
            pass

        doc.delete()
        return Response({"success": True, "message": "Document deleted successfully"}, status=status.HTTP_200_OK)
