from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications - retrieves list of target user's notifications
    """
    serializer_class = NotificationSerializer

    def get_queryset(self):
        # NotificationManager automatically filters by current user
        queryset = Notification.objects.all().order_by('-created_at')
        
        read_param = self.request.query_params.get('read')
        if read_param == 'true':
            queryset = queryset.filter(read=True)
        elif read_param == 'false':
            queryset = queryset.filter(read=False)
            
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


class MarkNotificationsReadView(APIView):
    """
    POST /api/notifications/mark-read - marks multiple or all notifications as read
    """
    def post(self, request):
        ids = request.data.get('ids', [])
        
        # Filter strictly user's notifications
        queryset = Notification.objects.all()
        
        if ids:
            updated = queryset.filter(id__in=ids).update(read=True)
        else:
            updated = queryset.filter(read=False).update(read=True)
            
        return Response({
            "success": True, 
            "message": f"Marked {updated} notifications as read"
        }, status=status.HTTP_200_OK)


class MarkSingleNotificationReadView(APIView):
    """
    PUT /api/notifications/{id}/read - marks a single notification as read
    """
    def put(self, request, id):
        try:
            notification = Notification.objects.get(id=id)
        except Notification.DoesNotExist:
            return Response({"success": False, "error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
            
        notification.read = True
        notification.save()
        
        return Response({
            "success": True, 
            "message": "Notification marked as read",
            "notification": NotificationSerializer(notification).data
        }, status=status.HTTP_200_OK)
