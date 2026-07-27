from django.db import models
from core.middleware import RegionalManager

class SupportRequest(models.Model):
    """
    Stores requests for resources, material, spiritual or administrative support.
    """
    CATEGORY_CHOICES = (
        ('Financial', 'Financial'),
        ('Equipment', 'Equipment'),
        ('Spiritual', 'Spiritual'),
        ('Technical', 'Technical'),
        ('Training', 'Training'),
    )

    URGENCY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('submitted_to_coordinator', 'Submitted to Coordinator'),
        ('submitted_to_manager', 'Submitted to Manager'),
        ('under review', 'Under Review'),
        ('approved', 'Approved'),
        ('fulfilled', 'Fulfilled'),
        ('closed', 'Closed'),
        ('returned_by_coordinator', 'Returned by Coordinator'),
        ('returned_by_manager', 'Returned by Manager'),
    )

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    description = models.TEXTField() if hasattr(models, 'TEXTField') else models.TextField()
    urgency = models.CharField(max_length=50, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='submitted')
    
    # AI Classification Fields
    ai_priority = models.CharField(
        max_length=20,
        choices=[('urgent', 'Urgent'), ('high', 'High'), ('medium', 'Medium'), ('low', 'Low')],
        null=True, blank=True,
        help_text="AI-assigned priority based on content analysis"
    )
    ai_priority_confidence = models.IntegerField(null=True, blank=True, help_text="Confidence score 0-100")
    ai_priority_reason = models.TextField(null=True, blank=True, help_text="Why AI assigned this priority")
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)
    manual_priority_override = models.BooleanField(default=False)
    
    requester = models.ForeignKey('accounts.User', on_delete=models.RESTRICT, related_name='submitted_support_requests')
    assigned_to = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_support_requests')
    recipients = models.ManyToManyField('accounts.User', related_name='received_support_requests', blank=True)
    
    deadline = models.DateField(blank=True, null=True)
    region = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = RegionalManager()

    class Meta:
        db_table = 'support_requests'
        indexes = [
            models.Index(fields=['region', 'status']),
            models.Index(fields=['requester']),
            models.Index(fields=['assigned_to']),
        ]

    def save(self, *args, **kwargs):
        if self.status == 'submitted' or not self.status:
            self.status = 'submitted_to_coordinator'
            
        # Auto-complete region from the requester
        if not self.region and self.requester:
            self.region = self.requester.region
            
        # Calculate deadline automatically based on urgency on initial creation
        if not self.deadline:
            from django.utils import timezone
            from datetime import timedelta
            
            days_mapping = {
                'low': 14,
                'medium': 7,
                'high': 3,
                'critical': 1
            }
            days_to_add = days_mapping.get(self.urgency, 7)
            self.deadline = (timezone.now() + timedelta(days=days_to_add)).date()
            
        super().save(*args, **kwargs)


class SupportComment(models.Model):
    """
    Comment threads appended to support requests.
    """
    request = models.ForeignKey(SupportRequest, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey('accounts.User', on_delete=models.RESTRICT)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'support_comments'
        indexes = [
            models.Index(fields=['request']),
        ]
