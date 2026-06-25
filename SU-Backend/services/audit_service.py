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
        import re
        method = request.method
        path = request.path
        
        action = f"{method} {path}"
        resource = path
        severity = 'info'
        
        user = request.user if request.user and request.user.is_authenticated else None
        user_snapshot = getattr(user, 'name', 'Anonymous')
        
        # Extract numeric IDs if available
        nums = re.findall(r'/(\d+)', path)
        obj_id = f"#{nums[0]}" if nums else ""
        
        # Categorize actions by endpoint
        if 'auth/login' in path:
            email = request.data.get('email', 'unknown') if hasattr(request, 'data') else 'unknown'
            resource = "Logged in to SU Connect"
            if response.status_code == 200:
                action = 'Successful Login'
            else:
                action = 'Failed Login Attempt'
                resource = f"Failed login for {email}"
                severity = 'warning'
        elif 'auth/register' in path:
            email = request.data.get('email', 'unknown') if hasattr(request, 'data') else 'unknown'
            action = 'User Registered'
            resource = f"New user registered: {email}"
        elif 'reports' in path:
            if method == 'POST':
                if 'ai-analyze' in path:
                    action = 'AI Analysis Queued'
                    resource = "Report AI analysis"
                else:
                    action = 'Report Created'
                    resource = "New report draft"
            elif method in ['PUT', 'PATCH']:
                if 'status' in path:
                    status_val = request.data.get('status', 'unknown')
                    action = f"Report Status Updated"
                    resource = f"Report {obj_id} status changed to {status_val}"
                elif 'ai-override' in path:
                    action = 'AI Classification Overridden'
                    resource = f"Report {obj_id} AI classification changed"
                    severity = 'warning'
                else:
                    action = 'Report Updated'
                    resource = f"Report {obj_id}" if obj_id else "Report"
            elif method == 'DELETE':
                action = 'Report Deleted'
                resource = f"Report {obj_id}" if obj_id else "Report"
                severity = 'danger'
        elif 'support' in path:
            if method == 'POST':
                if 'comments' in path:
                    action = 'Support Comment Added'
                    resource = f"Comment on support request {obj_id}" if obj_id else "Support request comment"
                else:
                    action = 'Support Request Created'
                    resource = "New support request"
            elif method in ['PUT', 'PATCH']:
                action = 'Support Request Updated'
                resource = f"Support Request {obj_id}" if obj_id else "Support request"
        elif 'prayer' in path:
            if method == 'POST':
                if 'responses' in path or 'commit' in path:
                    action = 'Prayer Commitment Created'
                    resource = f"Prayer Request {obj_id} (Commitment)" if obj_id else "Prayer commitment"
                else:
                    action = 'Prayer Request Created'
                    resource = "New prayer request"
            elif method in ['PUT', 'PATCH']:
                action = 'Prayer Request Updated'
                resource = f"Prayer Request {obj_id}" if obj_id else "Prayer request"
        elif 'documents' in path:
            if method == 'POST':
                action = 'Document Uploaded'
                resource = "New document"
            elif method == 'DELETE':
                action = 'Document Deleted'
                resource = f"Document {obj_id}" if obj_id else "Document"
                severity = 'danger'
            elif 'share' in path:
                action = 'Document Shared Status Toggled'
                resource = f"Document {obj_id}" if obj_id else "Document"
            elif method in ['PUT', 'PATCH']:
                action = 'Document Updated'
                resource = f"Document {obj_id}" if obj_id else "Document"
        
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
