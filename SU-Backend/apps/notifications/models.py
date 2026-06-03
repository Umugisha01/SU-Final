from django.db import models

class NotificationManager(models.Manager):
    """
    Ensures users can only query and retrieve their own notifications.
    """
    def get_queryset(self):
        from core.middleware import get_current_user
        user = get_current_user()
        if not user or not getattr(user, 'is_authenticated', False):
            return super().get_queryset().none()
        return super().get_queryset().filter(user=user)


class Notification(models.Model):
    """
    System push alerts and notifications mapped to users.
    """
    TYPE_CHOICES = (
        ('report', 'Report Update'),
        ('support', 'Support Request'),
        ('prayer', 'Prayer Commitment'),
        ('deadline', 'Deadline Reminder'),
        ('system', 'System Alert'),
    )

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    icon = models.CharField(max_length=50, blank=True, null=True)
    
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = NotificationManager()

    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['user', 'read']),
            models.Index(fields=['created_at']),
        ]
