from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from services.ai_service import AIService
from services.support_service import SupportService

@shared_task(name="su_connect.tasks.analyze_report_task")
def analyze_report_task(report_id):
    """
    Asynchronously executes report AI categorization and extraction.
    """
    return AIService.analyze_report(report_id)


def trigger_analyze_report(report_id):
    """
    Triggers the report analysis task asynchronously.
    If CELERY_TASK_ALWAYS_EAGER is True (e.g. in development), spawns a background thread
    to prevent blocking the request thread. Otherwise, runs it via celery delay.
    """
    import threading
    if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
        threading.Thread(target=analyze_report_task, args=(report_id,)).start()
    else:
        analyze_report_task.delay(report_id)


@shared_task(name="su_connect.tasks.send_notification_email_task")
def send_notification_email_task(email, title, message):
    """
    Sends email alerts to users asynchronously.
    """
    send_mail(
        subject=title,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


@shared_task(name="su_connect.tasks.check_support_deadlines_task")
def check_support_deadlines_task():
    """
    Scans for support tickets nearing deadlines. Run periodically.
    """
    SupportService.check_deadlines()


@shared_task(name="su_connect.tasks.detect_trends_task")
def detect_trends_task():
    """
    Runs weekly trend analysis using Gemini LLM.
    """
    return AIService.detect_trends()
