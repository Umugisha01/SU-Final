from django.core.exceptions import PermissionDenied, ValidationError
from apps.reports.models import Report
from services.notification_service import NotificationService

class ReportService:
    """
    Handles report state transitions (submission, approval, returning) and notifications.
    """
    @staticmethod
    def can_user_approve(report, user):
        # Segregation of duties: cannot approve own submission
        if report.submitted_by_id == user.id:
            return False
        
        if user.role == 'regional_coordinator':
            # Coordinators can only approve/action reports in their region that are submitted to them
            if user.region != report.region:
                return False
            return report.status in ['submitted_to_coordinator', 'submitted']
            
        elif user.role in ['administrator', 'national_manager']:
            # Managers and Admins can only approve reports submitted to them
            return report.status == 'submitted_to_manager'
            
        return False

    @staticmethod
    def submit_report(report, user):
        if report.submitted_by_id != user.id:
            raise PermissionDenied("You can only submit your own reports.")
        if report.status not in ['draft', 'returned', 'returned_by_coordinator', 'returned_by_manager', 'submitted']:
            raise ValidationError("Only draft or returned reports can be submitted.")
        
        from django.utils import timezone
        
        # Determine the next status based on user role
        if user.role == 'field_officer':
            report.status = 'submitted_to_coordinator'
        elif user.role == 'regional_coordinator':
            report.status = 'submitted_to_manager'
        else:
            # Fallback for admin or manager submitting their own report
            report.status = 'submitted_to_manager'
            
        report.submitted_at = timezone.now()
        report.save()
        
        # Queue the AI classification analysis asynchronously in Celery (or thread in development)
        from su_connect.tasks import trigger_analyze_report
        trigger_analyze_report(report.id)
        
        # Notify managers of the region, all admins, regional coordinators, and specific recipients
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users_to_notify = set()
        
        if report.status == 'submitted_to_coordinator':
            # Notify regional coordinators of this region
            coordinators = User.objects.filter(role='regional_coordinator', region=report.region)
            for rc in coordinators:
                users_to_notify.add(rc)
        elif report.status == 'submitted_to_manager':
            # Notify national managers and administrators
            managers_admins = User.objects.filter(role__in=['administrator', 'national_manager'])
            for ma in managers_admins:
                users_to_notify.add(ma)
                
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
            raise PermissionDenied("You do not have permission to approve this report or it is in an invalid status.")
        
        from django.utils import timezone
        
        # If coordinator is approving, they forward it to the Manager
        if manager.role == 'regional_coordinator':
            report.status = 'submitted_to_manager'
            # Notify Managers/Admins
            from django.contrib.auth import get_user_model
            User = get_user_model()
            managers_admins = User.objects.filter(role__in=['administrator', 'national_manager'])
            for ma in managers_admins:
                NotificationService.create_notification(
                    user=ma,
                    type_name='report',
                    title='Report Forwarded by Coordinator',
                    message=f"Report '{report.title}' was reviewed and forwarded by Coordinator {manager.name}.",
                    icon='clock'
                )
        # If manager is approving, it becomes 'approved' (final state)
        else:
            report.status = 'approved'
            report.approved_at = timezone.now()
            
        report.save()
        
        # Notify the submitter
        NotificationService.create_notification(
            user=report.submitted_by,
            type_name='report',
            title='Report Forwarded' if manager.role == 'regional_coordinator' else 'Report Approved',
            message=f"Your report '{report.title}' was forwarded to Manager by {manager.name}." if manager.role == 'regional_coordinator' else f"Your report '{report.title}' was approved by {manager.name}. {comments or ''}",
            icon='check'
        )
        return report

    @staticmethod
    def return_report(report, manager, comments):
        if not ReportService.can_user_approve(report, manager):
            raise PermissionDenied("You do not have permission to return this report or it is in an invalid status.")
        
        if not comments:
            raise ValidationError("Comments specifying the reason for returning are required.")
        
        from django.utils import timezone
        if manager.role == 'regional_coordinator':
            report.status = 'returned_by_coordinator'
        else:
            report.status = 'returned_by_manager'
            
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
