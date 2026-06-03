from django.db import models

class AuditLog(models.Model):
    """
    Stores system operation logs for administrative compliance auditing.
    """
    SEVERITY_CHOICES = (
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('danger', 'Danger'),
    )

    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    user_snapshot = models.CharField(max_length=255)
    
    action = models.CharField(max_length=255)
    resource = models.CharField(max_length=255)
    ip = models.CharField(max_length=45)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='info')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
        ]
