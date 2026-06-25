"""
Django signals to auto-trigger AI analysis
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.support.models import SupportRequest
from apps.support.tasks import analyze_support_priority


@receiver(post_save, sender=SupportRequest)
def auto_analyze_on_create(sender, instance, created, **kwargs):
    """
    Automatically analyze new support requests with AI
    """
    if created:
        # Run AI analysis asynchronously
        analyze_support_priority.delay(instance.id)
        print(f"[AI] Analysis triggered for support request #{instance.id}")
    
    elif not instance.manual_priority_override and instance.status == 'submitted':
        # Re-analyze if status changed back to submitted (and not manually overridden)
        analyze_support_priority.delay(instance.id)
        print(f"[AI] Re-analysis triggered for support request #{instance.id}")
