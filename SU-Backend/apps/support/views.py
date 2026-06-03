from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from core.permissions import IsManagerOrAdmin
from apps.support.models import SupportRequest, SupportComment
from apps.support.serializers import SupportRequestSerializer, SupportCommentSerializer
from services.support_service import SupportService

User = get_user_model()

class SupportRequestListCreateView(generics.ListCreateAPIView):
    """
    GET /api/support - list support requests
    POST /api/support - create support request
    """
    serializer_class = SupportRequestSerializer

    def get_queryset(self):
        queryset = SupportRequest.objects.all().order_by('-created_at')
        
        status_param = self.request.query_params.get('status')
        urgency = self.request.query_params.get('urgency')
        category = self.request.query_params.get('category')
        assigned = self.request.query_params.get('assigned')  # 'me', 'unassigned', or 'all'
        search = self.request.query_params.get('search')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if urgency:
            queryset = queryset.filter(urgency=urgency)
        if category:
            queryset = queryset.filter(category=category)
            
        if assigned == 'me':
            queryset = queryset.filter(assigned_to=self.request.user)
        elif assigned == 'unassigned':
            queryset = queryset.filter(assigned_to__isnull=True)
            
        if search:
            queryset = queryset.filter(title__icontains=search) | queryset.filter(description__icontains=search)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                "success": True,
                "data": serializer.data,
                "pagination": {
                    "total": self.paginator.page.paginator.count,
                    "page": self.paginator.page.number,
                    "limit": self.paginator.page.paginator.per_page,
                    "totalPages": self.paginator.page.paginator.num_pages
                }
            })
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})


class SupportRequestDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/support/{id} - retrieve request details
    PUT /api/support/{id} - update request properties
    """
    queryset = SupportRequest.objects.all()
    serializer_class = SupportRequestSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Enforce that only requester can modify properties of their own ticket
        if instance.requester_id != request.user.id and request.user.role not in ['admin', 'manager']:
            return Response({"success": False, "error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class SupportRequestStatusView(APIView):
    """
    PATCH /api/support/{id}/status - transition status of ticket
    """
    def patch(self, request, id):
        try:
            req = SupportRequest.objects.get(id=id)
        except SupportRequest.DoesNotExist:
            return Response({"success": False, "error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        if not new_status:
            return Response({"success": False, "error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            SupportService.update_status(req, new_status, request.user)
            return Response({"success": True, "status": new_status}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SupportRequestAssignView(APIView):
    """
    PATCH /api/support/{id}/assign - assign to support staff (Manager/Admin only)
    """
    permission_classes = [IsManagerOrAdmin]

    def patch(self, request, id):
        try:
            req = SupportRequest.objects.get(id=id)
        except SupportRequest.DoesNotExist:
            return Response({"success": False, "error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        assignee_id = request.data.get('userId')
        if not assignee_id:
            return Response({"success": False, "error": "userId is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            assignee = User.objects.get(id=assignee_id)
        except User.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            SupportService.assign_request(req, assignee, request.user)
            return Response({"success": True, "message": "Assignee updated successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AddSupportCommentView(APIView):
    """
    POST /api/support/{id}/comments - post comment to thread
    """
    def post(self, request, id):
        try:
            req = SupportRequest.objects.get(id=id)
        except SupportRequest.DoesNotExist:
            return Response({"success": False, "error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        comment_text = request.data.get('comment')
        if not comment_text:
            return Response({"success": False, "error": "Comment content cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
            
        comment = SupportComment.objects.create(
            request=req,
            user=request.user,
            comment=comment_text
        )
        
        # Trigger notifications for comments
        from services.notification_service import NotificationService
        # Notify assignee if requester commented
        if request.user.id == req.requester_id and req.assigned_to:
            NotificationService.create_notification(
                user=req.assigned_to,
                type_name='support',
                title='New Comment on Support Request',
                message=f"{request.user.name} added a comment on support request '{req.title}'.",
                icon='package'
            )
        # Notify requester if assignee/manager commented
        elif request.user.id != req.requester_id:
            NotificationService.create_notification(
                user=req.requester,
                type_name='support',
                title='New Comment on Support Request',
                message=f"{request.user.name} added a comment on support request '{req.title}'.",
                icon='package'
            )
            
        return Response(SupportCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
