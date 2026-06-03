from django.db import models
from core.middleware import RegionalQuerySet

class PrayerRequestManager(models.Manager):
    """
    Custom manager that handles visibility filtering alongside regional isolation.
    """
    def get_queryset(self):
        # We start with the base RegionalQuerySet which filters by user's region for regional items
        # but allows public and anonymous items across all regions.
        from core.middleware import get_current_user
        user = get_current_user()
        
        # If not authenticated, return none or empty
        if not user or not user.is_authenticated:
            return super().get_queryset().none()
            
        # Admin and manager see everything
        if user.role in ['admin', 'manager']:
            return super().get_queryset()
            
        # Staff and coordinators: see public, anonymous, or regional matching their region
        return super().get_queryset().filter(
            models.Q(visibility__in=['public', 'anonymous']) | 
            models.Q(visibility='regional', region=user.region) |
            models.Q(requester=user)
        )


class PrayerRequest(models.Model):
    """
    Stores prayer requests with varying visibility levels (public, regional, anonymous).
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('answered', 'Answered'),
        ('archived', 'Archived'),
    )

    VISIBILITY_CHOICES = (
        ('public', 'Public'),
        ('regional', 'Regional'),
        ('anonymous', 'Anonymous'),
    )

    title = models.CharField(max_length=255)
    
    # Store request text
    request = models.TEXTField() if hasattr(models, 'TEXTField') else models.TextField()
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='active')
    visibility = models.CharField(max_length=50, choices=VISIBILITY_CHOICES, default='public')
    
    requester = models.ForeignKey('accounts.User', on_delete=models.RESTRICT, related_name='prayer_requests')
    region = models.CharField(max_length=100, blank=True)
    
    commitments_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PrayerRequestManager()

    class Meta:
        db_table = 'prayer_requests'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['visibility', 'region']),
        ]

    def save(self, *args, **kwargs):
        if not self.region and self.requester:
            self.region = self.requester.region
        super().save(*args, **kwargs)


class PrayerCommitment(models.Model):
    """
    Tracks users committing to pray for a specific request.
    """
    request = models.ForeignKey(PrayerRequest, on_delete=models.CASCADE, related_name='commitments')
    user = models.ForeignKey('accounts.User', on_delete=models.RESTRICT)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prayer_commitments'
        indexes = [
            models.Index(fields=['request']),
            models.Index(fields=['user']),
        ]
