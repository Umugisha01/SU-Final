"""
Celery tasks for AI priority analysis of support requests
"""

import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(name='analyze_support_priority')
def analyze_support_priority(request_id):
    """
    Celery task to analyze support request priority using local Ollama model
    """
    from apps.support.models import SupportRequest
    from services.ai_priority_service import ai_priority_service
    
    try:
        support_request = SupportRequest.objects.get(id=request_id)
        
        # Skip if manually overridden
        if support_request.manual_priority_override:
            logger.info(f"Skipping AI analysis for request {request_id}: Manually overridden")
            return {'status': 'skipped', 'reason': 'Manually overridden'}
        
        # Run AI classification
        result = ai_priority_service.classify(support_request)
        
        # Update database fields
        support_request.ai_priority = result['priority']
        support_request.ai_priority_confidence = result['confidence']
        support_request.ai_priority_reason = result['reason']
        support_request.ai_analyzed_at = timezone.now()
        
        # Auto-set deadline if not set
        if not support_request.deadline:
            support_request.deadline = timezone.now().date() + timedelta(days=result['suggested_days'])
        
        # Temporarily disconnect signal to prevent infinite recursion
        from django.db.models.signals import post_save
        from apps.support.signals import auto_analyze_on_create
        
        post_save.disconnect(auto_analyze_on_create, sender=SupportRequest)
        try:
            support_request.save()
        finally:
            post_save.connect(auto_analyze_on_create, sender=SupportRequest)
        
        logger.info(f"AI analysis complete for request {request_id}: {result['priority']} ({result['confidence']}%)")
        
        # Trigger notification for urgent requests
        if result['priority'] == 'urgent' and result['confidence'] >= 80:
            notify_urgent_request.delay(request_id)
        
        return {
            'status': 'success',
            'request_id': request_id,
            'priority': result['priority'],
            'confidence': result['confidence']
        }
        
    except SupportRequest.DoesNotExist:
        logger.error(f"SupportRequest {request_id} not found")
        return {'status': 'error', 'reason': 'Request not found'}
    except Exception as e:
        logger.error(f"AI Analysis task failed for request {request_id}: {e}")
        return {'status': 'error', 'reason': str(e)}


@shared_task(name='batch_analyze_support_priorities')
def batch_analyze_support_priorities(limit=50):
    """
    Batch analyze multiple support requests that haven't been processed by AI
    """
    from apps.support.models import SupportRequest
    
    pending = SupportRequest.objects.filter(
        ai_priority__isnull=True,
        manual_priority_override=False,
        status__in=['submitted', 'under review']
    )[:limit]
    
    results = []
    for request in pending:
        task = analyze_support_priority.delay(request.id)
        results.append({'id': request.id, 'task_id': task.id})
    
    return {'total': len(results), 'started': results}


@shared_task(name='notify_urgent_request')
def notify_urgent_request(request_id):
    """
    Send real-time and email notifications for urgent support requests
    """
    from apps.support.models import SupportRequest
    from services.notification_service import NotificationService
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        request = SupportRequest.objects.get(id=request_id)
        
        # Notify all managers and admins
        managers = User.objects.filter(role__in=['administrator', 'national_manager'])
        
        notified_count = 0
        for manager in managers:
            NotificationService.create_notification(
                user=manager,
                type_name='support',
                title='🚨 Urgent Support Request',
                message=f"Urgent request: '{request.title}' - {request.ai_priority_reason[:120]}",
                icon='alert-circle'
            )
            notified_count += 1
            
        logger.info(f"Sent urgent alerts to {notified_count} staff members for request {request_id}")
        return {'status': 'success', 'notified': notified_count}
        
    except SupportRequest.DoesNotExist:
        logger.error(f"SupportRequest {request_id} not found for urgent notification")
        return {'status': 'error', 'reason': 'Request not found'}
    except Exception as e:
        logger.error(f"Failed to send urgent notifications for request {request_id}: {e}")
        return {'status': 'error', 'reason': str(e)}
