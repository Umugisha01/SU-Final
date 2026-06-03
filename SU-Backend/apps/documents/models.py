from django.db import models

class DocumentManager(models.Manager):
    """
    Handles regional isolation for files (shared documents vs regional uploads).
    """
    def get_queryset(self):
        from core.middleware import get_current_user
        user = get_current_user()
        if not user or not user.is_authenticated:
            return super().get_queryset().none()
            
        if user.role in ['admin', 'manager']:
            return super().get_queryset()
            
        return super().get_queryset().filter(
            models.Q(shared=True) | 
            models.Q(uploaded_by__region=user.region) |
            models.Q(uploaded_by=user)
        )


class Document(models.Model):
    """
    Tracks files uploaded to storage bucket (PDF, Word, Excel, JPG, PNG).
    """
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    size = models.BigIntegerField()  # in bytes
    storage_key = models.CharField(max_length=510, unique=True)
    
    uploaded_by = models.ForeignKey('accounts.User', on_delete=models.RESTRICT, related_name='uploaded_documents')
    downloads = models.IntegerField(default=0)
    shared = models.BooleanField(default=False)
    
    # Many-to-many relationship linking uploaded files to activity reports
    reports = models.ManyToManyField('reports.Report', db_table='report_attachments', related_name='documents')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DocumentManager()

    class Meta:
        db_table = 'documents'
        indexes = [
            models.Index(fields=['shared']),
            models.Index(fields=['uploaded_by']),
        ]
