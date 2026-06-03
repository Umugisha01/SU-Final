class AuditService:
    """
    Service responsible for parsing incoming mutating requests and generating audit trail events.
    """
    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        return ip

    @staticmethod
    def log_action(request, response):
        method = request.method
        path = request.path
        
        action = f"{method} {path}"
        resource = path
        severity = 'info'
        
        user = request.user if request.user and request.user.is_authenticated else None
        user_snapshot = getattr(user, 'name', 'Anonymous')
        
        # Categorize actions by endpoint
        if 'auth/login' in path:
            email = request.data.get('email', 'unknown') if hasattr(request, 'data') else 'unknown'
            resource = f"User: {email}"
            if response.status_code == 200:
                action = 'Successful Login'
            else:
                action = 'Failed Login Attempt'
                severity = 'warning'
        elif 'auth/register' in path:
            email = request.data.get('email', 'unknown') if hasattr(request, 'data') else 'unknown'
            action = 'User Registered'
            resource = f"New User Account: {email}"
        elif 'reports' in path:
            if method == 'POST':
                if 'ai-analyze' in path:
                    action = 'AI Analysis Queued'
                else:
                    action = 'Report Created'
            elif method in ['PUT', 'PATCH']:
                if 'status' in path:
                    status = request.data.get('status', 'unknown')
                    action = f"Report Status Updated to {status}"
                elif 'ai-override' in path:
                    action = 'AI Classification Overridden'
                    severity = 'warning'
                else:
                    action = 'Report Updated'
            elif method == 'DELETE':
                action = 'Report Deleted'
                severity = 'danger'
        elif 'support' in path:
            if method == 'POST':
                if 'comments' in path:
                    action = 'Support Comment Added'
                else:
                    action = 'Support Request Created'
            elif method in ['PUT', 'PATCH']:
                action = 'Support Request Updated'
        elif 'prayer' in path:
            if method == 'POST':
                if 'responses' in path:
                    action = 'Prayer Commitment Created'
                else:
                    action = 'Prayer Request Created'
            elif method in ['PUT', 'PATCH']:
                action = 'Prayer Request Updated'
        elif 'documents' in path:
            if method == 'POST':
                action = 'Document Uploaded'
            elif method == 'DELETE':
                action = 'Document Deleted'
                severity = 'danger'
            elif 'share' in path:
                action = 'Document Shared Status Toggled'
        
        # Save to database
        from apps.audit.models import AuditLog
        
        AuditLog.objects.create(
            user=user,
            user_snapshot=user_snapshot,
            action=action,
            resource=resource,
            ip=AuditService.get_client_ip(request),
            severity=severity
        )
