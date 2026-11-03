import logging
import threading
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from services.ai_service import AIService
from services.support_service import SupportService

logger = logging.getLogger(__name__)

@shared_task(name="su_connect.tasks.analyze_report_task")
def analyze_report_task(report_id):
    """
    Asynchronously executes report AI categorization and extraction.
    """
    try:
        return AIService.analyze_report(report_id)
    except Exception as e:
        logger.error(f"Error in analyze_report_task for report {report_id}: {e}")
        return None


def trigger_analyze_report(report_id):
    """
    Triggers the report analysis task asynchronously.
    If CELERY_TASK_ALWAYS_EAGER is True (e.g. in development/serverless), spawns a background thread
    to prevent blocking the request thread. Otherwise, runs it via celery delay with thread fallback.
    """
    if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
        threading.Thread(target=analyze_report_task, args=(report_id,), daemon=True).start()
    else:
        try:
            analyze_report_task.delay(report_id)
        except Exception as e:
            logger.warning(f"Celery unavailable ({e}), falling back to background thread for report {report_id}")
            threading.Thread(target=analyze_report_task, args=(report_id,), daemon=True).start()


@shared_task(name="su_connect.tasks.send_notification_email_task")
def send_notification_email_task(email, title, message):
    """
    Sends email alerts to users asynchronously with fail-safe error suppression.
    """
    try:
        from_addr = getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'noreply@su.rw'
        send_mail(
            subject=title,
            message=message,
            from_email=from_addr,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception as e:
        logger.warning(f"Failed to deliver email to {email}: {e}")


def safe_send_email(email, title, message):
    """
    Safely triggers email sending without ever raising an exception,
    falling back across Celery delay, background thread, and direct execution.
    """
    try:
        if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            threading.Thread(target=send_notification_email_task, args=(email, title, message), daemon=True).start()
        else:
            send_notification_email_task.delay(email, title, message)
    except Exception:
        try:
            threading.Thread(target=send_notification_email_task, args=(email, title, message), daemon=True).start()
        except Exception:
            pass


@shared_task(name="su_connect.tasks.check_support_deadlines_task")
def check_support_deadlines_task():
    """
    Scans for support tickets nearing deadlines. Run periodically.
    """
    try:
        SupportService.check_deadlines()
    except Exception as e:
        logger.error(f"Error checking support deadlines: {e}")


@shared_task(name="su_connect.tasks.detect_trends_task")
def detect_trends_task():
    """
    Runs weekly trend analysis using Gemini LLM.
    """
    try:
        return AIService.detect_trends()
    except Exception as e:
        logger.error(f"Error detecting trends: {e}")
        return None
