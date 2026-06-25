from django.core.exceptions import PermissionDenied, ValidationError
from apps.reports.models import Report
from services.notification_service import NotificationService

class ReportService:
    """
    Handles report state transitions (submission, approval, returning) and notifications.
    """
    @staticmethod
    def can_user_approve(report, user):
        # Must be administrator, national_manager, or regional_coordinator (restricted to their region)
        if user.role not in ['administrator', 'national_manager', 'regional_coordinator']:
            return False
        if user.role == 'regional_coordinator' and user.region != report.region:
            return False
        return report.submitted_by_id != user.id

    @staticmethod
    def submit_report(report, user):
        if report.submitted_by_id != user.id:
            raise PermissionDenied("You can only submit your own reports.")
        if report.status not in ['draft', 'returned', 'submitted']:
            raise ValidationError("Only draft, submitted, or returned reports can be submitted.")
        
        from django.utils import timezone
        report.status = 'submitted'
        report.submitted_at = timezone.now()
        report.save()
        
        # Queue the AI classification analysis asynchronously in Celery
        from su_connect.tasks import analyze_report_task
        analyze_report_task.delay(report.id)
        
        # Notify managers of the region, all admins, regional coordinators, and specific recipients
        from django.contrib.auth import get_user_model
        User = get_user_model()
        managers_admins = User.objects.filter(role__in=['administrator', 'national_manager', 'regional_coordinator'])
        
        users_to_notify = set()
        for recipient in managers_admins:
            # Admins and National Managers see everything; regional coordinators only see their own region's reports
            if recipient.role in ['administrator', 'national_manager'] or recipient.region == report.region:
                users_to_notify.add(recipient)
                
        # Also include explicitly selected recipients
        for recipient in report.recipients.all():
            users_to_notify.add(recipient)
        
        # Remove submitter so they don't get a notification for their own submission
        if user in users_to_notify:
            users_to_notify.remove(user)
            
        for recipient in users_to_notify:
            NotificationService.create_notification(
                user=recipient,
                type_name='report',
                title='New Report Shared' if recipient in report.recipients.all() else 'New Report Submitted',
                message=f"Report '{report.title}' has been shared with you by {user.name}." if recipient in report.recipients.all() else f"Report '{report.title}' has been submitted by {user.name} ({report.region}).",
                icon='clock'
            )
        return report

    @staticmethod
    def approve_report(report, manager, comments=None):
        if not ReportService.can_user_approve(report, manager):
            raise PermissionDenied("You do not have permission to approve this report or it is your own submission.")
        
        if report.status != 'submitted':
            raise ValidationError("Only submitted reports can be approved.")
        
        from django.utils import timezone
        report.status = 'approved'
        report.approved_at = timezone.now()
        report.save()
        
        # Notify the submitter
        NotificationService.create_notification(
            user=report.submitted_by,
            type_name='report',
            title='Report Approved',
            message=f"Your report '{report.title}' was approved by {manager.name}. {comments or ''}",
            icon='check'
        )
        return report

    @staticmethod
    def return_report(report, manager, comments):
        if not ReportService.can_user_approve(report, manager):
            raise PermissionDenied("You do not have permission to return this report or it is your own submission.")
        
        if not comments:
            raise ValidationError("Comments specifying the reason for returning are required.")
            
        if report.status != 'submitted':
            raise ValidationError("Only submitted reports can be returned.")
        
        from django.utils import timezone
        report.status = 'returned'
        report.returned_at = timezone.now()
        report.save()
        
        # Notify the submitter
        NotificationService.create_notification(
            user=report.submitted_by,
            type_name='report',
            title='Report Returned',
            message=f"Your report '{report.title}' was returned by {manager.name}. Reason: {comments}",
            icon='alert'
        )
        return report
