from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.core.mail import send_mail
from django.conf import settings
from apps.notifications.models import Notification

class NotificationService:
    """
    Handles creating user notifications, transmitting them via WebSockets,
    and triggering async emails for critical alerts.
    """
    @staticmethod
    def create_notification(user, type_name, title, message, icon=None):
        # Create notification in database
        notification = Notification.objects.create(
            user=user,
            type=type_name,
            title=title,
            message=message,
            icon=icon
        )
        
        # Send WebSocket update
        NotificationService.send_websocket(user.id, notification)
        
        # Send email based on preferences
        prefs = getattr(user, 'notif_prefs', {})
        if prefs.get('email', True):
            # Send emails for deadlines, system alerts, or if user explicitly requested updates
            should_email = False
            if type_name == 'deadline' and prefs.get('deadlineReminders', True):
                should_email = True
            elif type_name == 'report' and prefs.get('reportUpdates', True):
                should_email = True
            elif type_name == 'support' and prefs.get('supportUpdates', True):
                should_email = True
            elif type_name == 'prayer' and prefs.get('prayerResponses', True):
                should_email = True
            elif type_name == 'system':
                should_email = True

            if should_email:
                NotificationService.send_email(user.email, title, message)
        
        return notification

    @staticmethod
    def send_websocket(user_id, notification):
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"user_{user_id}_notifications"
            # Serialize notification
            data = {
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "icon": notification.icon,
                "read": notification.read,
                "createdAt": notification.created_at.isoformat()
            }
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "new_notification",
                    "data": data
                }
            )

    @staticmethod
    def send_email(email_address, title, message):
        # Execute via celery worker
        from su_connect.tasks import send_notification_email_task
        send_notification_email_task.delay(email_address, title, message)
