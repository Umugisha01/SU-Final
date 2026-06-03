from django.db import models
from core.middleware import RegionalManager
from django.core.validators import MinValueValidator, MaxValueValidator

class Report(models.Model):
    """
    Stores activity reports including participants, AI metadata, and workflow statuses.
    """
    TYPE_CHOICES = (
        ('Outreach', 'Outreach'),
        ('Bible Study', 'Bible Study'),
        ('Training', 'Training'),
        ('Meeting', 'Meeting'),
        ('Community Event', 'Community Event'),
        ('Prayer Meeting', 'Prayer Meeting'),
        ('Youth Program', 'Youth Program'),
    )
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('returned', 'Returned'),
    )

    title = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    region = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    
    # Map model attribute 'date' to DB column 'activity_date' to satisfy both spec representations
    date = models.DateField(db_column='activity_date')
    
    duration = models.CharField(max_length=100, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    submitted_by = models.ForeignKey('accounts.User', on_delete=models.RESTRICT, related_name='reports')
    
    participants = models.IntegerField(default=0)
    demographics = models.JSONField(default=dict)  # {"male": 0, "female": 0, "youth": 0, "adults": 0}
    
    recipients = models.ManyToManyField('accounts.User', related_name='received_reports', blank=True)
    
    description = models.TEXTField() if hasattr(models, 'TEXTField') else models.TextField()
    outcomes = models.TextField(blank=True, null=True)
    challenges = models.TextField(blank=True, null=True)
    prayer_requests = models.TextField(blank=True, null=True)
    
    # AI Fields
    ai_category = models.CharField(max_length=100, blank=True, null=True)
    confidence = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True,
        null=True
    )
    keywords = models.JSONField(blank=True, default=list)
    ai_summary = models.TextField(blank=True, null=True)
    overridden = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = RegionalManager()

    class Meta:
        db_table = 'reports'
        indexes = [
            models.Index(fields=['region', 'status']),
            models.Index(fields=['date']),
            models.Index(fields=['submitted_by']),
        ]

    def save(self, *args, **kwargs):
        # Enforce defaults for demographics if empty
        if not self.demographics:
            self.demographics = {"male": 0, "female": 0, "youth": 0, "adults": 0}
        super().save(*args, **kwargs)
