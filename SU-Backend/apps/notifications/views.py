from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.notifications.models import Notification, SystemAlert
from apps.notifications.serializers import NotificationSerializer, SystemAlertSerializer
from services.notification_service import NotificationService
from core.permissions import IsAdminOnly

User = get_user_model()

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


class DeleteNotificationView(APIView):
    """
    DELETE /api/notifications/{id} - deletes a notification
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, id):
        try:
            notification = Notification.objects.get(id=id)
        except Notification.DoesNotExist:
            return Response({"success": False, "error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
            
        notification.delete()
        return Response({
            "success": True, 
            "message": "Notification deleted successfully"
        }, status=status.HTTP_200_OK)


class BroadcastTargetListView(APIView):
    """
    GET /api/notifications/broadcast-targets
    Returns simple directory of active users that the current user is allowed to send broadcasts to.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role == 'field_officer':
            return Response({
                "success": False, 
                "error": "Field officers are not authorized to send broadcasts."
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Enforce role hierarchy rules
        if role == 'regional_coordinator':
            # Coordinators can only broadcast to field officers in their region
            targets = User.objects.filter(role='field_officer', region=user.region, status='active')
        elif role == 'national_manager':
            # Managers can broadcast to coordinators and field officers
            targets = User.objects.filter(role__in=['regional_coordinator', 'field_officer'], status='active')
        elif role == 'administrator':
            # Admins can broadcast to all active users
            targets = User.objects.filter(status='active').exclude(id=user.id)
        else:
            targets = User.objects.none()

        data = [{"id": str(t.id), "name": t.name, "role": t.role, "region": t.region, "email": t.email} for t in targets]
        return Response({"success": True, "data": data}, status=status.HTTP_200_OK)


class BroadcastNotificationView(APIView):
    """
    POST /api/notifications/broadcast
    Sends a notification to selected targeted under-level users.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        role = user.role

        if role == 'field_officer':
            return Response({
                "success": False, 
                "error": "Field officers are not authorized to send broadcasts."
            }, status=status.HTTP_403_FORBIDDEN)

        recipient_ids = request.data.get('recipient_ids', [])
        category = request.data.get('category')  # 'report', 'deadline', 'support', 'prayer', 'system', 'other'
        title = request.data.get('title', 'Broadcast Message')
        message = request.data.get('message')

        if not recipient_ids:
            return Response({"success": False, "error": "At least one recipient must be selected."}, status=status.HTTP_400_BAD_REQUEST)
        if not category or category not in [c[0] for c in Notification.TYPE_CHOICES]:
            return Response({"success": False, "error": f"A valid category must be selected ({', '.join([c[0] for c in Notification.TYPE_CHOICES])})."}, status=status.HTTP_400_BAD_REQUEST)
        if not message:
            return Response({"success": False, "error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce under-level recipient check
        if role == 'regional_coordinator':
            valid_recipients = User.objects.filter(id__in=recipient_ids, role='field_officer', region=user.region, status='active')
        elif role == 'national_manager':
            valid_recipients = User.objects.filter(id__in=recipient_ids, role__in=['regional_coordinator', 'field_officer'], status='active')
        elif role == 'administrator':
            valid_recipients = User.objects.filter(id__in=recipient_ids, status='active')
        else:
            valid_recipients = User.objects.none()

        valid_ids = {str(r.id) for r in valid_recipients}
        invalid_ids = [rid for rid in recipient_ids if rid not in valid_ids]
        
        if invalid_ids:
            return Response({
                "success": False, 
                "error": "You can only broadcast to your authorized under-level users."
            }, status=status.HTTP_403_FORBIDDEN)

        notifications_sent = 0
        for r in valid_recipients:
            notif = NotificationService.create_notification(
                user=r,
                type_name=category,
                title=f"{title}",
                message=message,
                icon='bell'
            )
            if notif:
                notifications_sent += 1

        return Response({
            "success": True, 
            "message": f"Broadcast message sent successfully to {notifications_sent} users."
        }, status=status.HTTP_201_CREATED)


class CreateSystemAlertView(APIView):
    """
    POST /api/notifications/system-alerts
    Admin-only endpoint to create system-wide/targeted alerts.
    """
    permission_classes = [IsAdminOnly]

    def post(self, request):
        title = request.data.get('title')
        message = request.data.get('message')
        priority = request.data.get('priority', 'medium')
        is_announcement = request.data.get('is_announcement', False)
        duration_hours = request.data.get('duration_hours')  # duration in hours
        user_ids = request.data.get('user_ids', [])  # Targeted user IDs (empty means all active users)

        if not title or not message:
            return Response({"success": False, "error": "Title and message are required."}, status=status.HTTP_400_BAD_REQUEST)
        if priority not in [p[0] for p in SystemAlert.PRIORITY_CHOICES]:
            return Response({"success": False, "error": "Invalid priority level."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            hours = int(duration_hours) if duration_hours else 24
        except ValueError:
            return Response({"success": False, "error": "Duration must be an integer (in hours)."}, status=status.HTTP_400_BAD_REQUEST)

        expires_at = timezone.now() + timezone.timedelta(hours=hours)

        if not user_ids:
            target_users = User.objects.filter(status='active')
        else:
            target_users = User.objects.filter(id__in=user_ids, status='active')

        if not target_users.exists():
            return Response({"success": False, "error": "No valid active target users selected."}, status=status.HTTP_400_BAD_REQUEST)

        alert = SystemAlert.objects.create(
            title=title,
            message=message,
            priority=priority,
            is_announcement=is_announcement,
            expires_at=expires_at,
            created_by=request.user
        )
        alert.users.set(target_users)

        # Broadcast via WebSockets
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            alert_data = {
                "id": alert.id,
                "title": alert.title,
                "message": alert.message,
                "priority": alert.priority,
                "is_announcement": alert.is_announcement,
                "expires_at": alert.expires_at.isoformat(),
                "created_at": alert.created_at.isoformat()
            }
            for u in target_users:
                async_to_sync(channel_layer.group_send)(
                    f"user_{u.id}_notifications",
                    {
                        "type": "new_system_alert",
                        "data": alert_data
                    }
                )

        return Response({
            "success": True,
            "message": "System alert created successfully.",
            "data": SystemAlertSerializer(alert).data
        }, status=status.HTTP_201_CREATED)


class ActiveSystemAlertListView(APIView):
    """
    GET /api/notifications/system-alerts/active
    Retrieves unexpired system alerts targeted to the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        alerts = SystemAlert.objects.filter(
            users=user,
            expires_at__gt=now
        ).order_by('-created_at')

        serializer = SystemAlertSerializer(alerts, many=True)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)


class DismissSystemAlertView(APIView):
    """
    POST /api/notifications/system-alerts/{id}/dismiss
    Dismisses a system alert for the current user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        try:
            alert = SystemAlert.objects.get(id=id)
        except SystemAlert.DoesNotExist:
            return Response({"success": False, "error": "System alert not found."}, status=status.HTTP_404_NOT_FOUND)

        alert.users.remove(request.user)
        return Response({"success": True, "message": "Alert dismissed successfully."}, status=status.HTTP_200_OK)

