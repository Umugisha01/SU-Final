from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from datetime import timedelta
from apps.support.models import SupportRequest
from services.notification_service import NotificationService

class SupportService:
    """
    Manages assignment, status changes, and notifications for support requests.
    """
    @staticmethod
    def assign_request(support_request, assigned_user, manager):
        if manager.role not in ['admin', 'manager']:
            raise PermissionDenied("Only administrators and managers can assign support requests.")
        
        support_request.assigned_to = assigned_user
        if support_request.status == 'submitted':
            support_request.status = 'under review'
        support_request.save()
        
        # Notify the assigned user
        NotificationService.create_notification(
            user=assigned_user,
            type_name='support',
            title='Support Request Assigned',
            message=f"You have been assigned to support request '{support_request.title}' by {manager.name}.",
            icon='package'
        )
        return support_request

    @staticmethod
    def update_status(support_request, status, user):
        # Validate permissions
        if user.role not in ['admin', 'manager'] and support_request.requester_id != user.id:
            raise PermissionDenied("You do not have permission to modify this support request.")
        
        # Staff/coordinator requesters can only transition to 'closed'
        if user.role not in ['admin', 'manager'] and status != 'closed':
            raise PermissionDenied("Requesters can only transition requests to 'closed'.")
        
        support_request.status = status
        support_request.save()
        
        # Notify the requester if status was updated by someone else
        if support_request.requester_id != user.id:
            NotificationService.create_notification(
                user=support_request.requester,
                type_name='support',
                title='Support Status Updated',
                message=f"Your support request '{support_request.title}' status is now '{status}' (updated by {user.name}).",
                icon='package'
            )
        return support_request

    @staticmethod
    def check_deadlines():
        """
        Scans requests that are not resolved, approaching deadline in the next 48 hours.
        """
        tomorrow_limit = timezone.now().date() + timedelta(days=2)
        pending_requests = SupportRequest.objects.filter(
            status__in=['submitted', 'under review', 'approved'],
            deadline__lte=tomorrow_limit,
            deadline__gte=timezone.now().date()
        )
        
        for req in pending_requests:
            targets = [req.requester]
            if req.assigned_to:
                targets.append(req.assigned_to)
                
            for target in targets:
                NotificationService.create_notification(
                    user=target,
                    type_name='deadline',
                    title='Approaching Support Deadline',
                    message=f"The support request '{req.title}' is due on {req.deadline}.",
                    icon='clock'
                )
