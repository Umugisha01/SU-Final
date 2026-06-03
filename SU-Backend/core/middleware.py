import threading
from django.db import models
from django.utils.deprecation import MiddlewareMixin
from services.audit_service import AuditService

# Thread-local storage for request user
_thread_locals = threading.local()

def get_current_user():
    """
    Retrieve the current request user from thread-local storage.
    """
    request = getattr(_thread_locals, 'request', None)
    if request:
        return getattr(request, 'user', None)
    return getattr(_thread_locals, 'user', None)


def set_current_user(user):
    """
    Set the current request user in thread-local storage (useful for testing).
    """
    _thread_locals.user = user


def clear_current_user():
    """
    Clear the current request user from thread-local storage.
    """
    if hasattr(_thread_locals, 'user'):
        del _thread_locals.user
    if hasattr(_thread_locals, 'request'):
        del _thread_locals.request


class RegionalQuerySet(models.QuerySet):
    def filter_by_region(self, user=None):
        if not user:
            user = get_current_user()
        
        if user and user.is_authenticated:
            # Regional isolation applies only to staff and coordinators
            if user.role in ['staff', 'coordinator']:
                # If model is User, filter by region
                if self.model.__name__ == 'User':
                    return self.filter(region=user.region)
                # For other models, filter by region if field exists
                elif hasattr(self.model, 'region'):
                    # Documents can have 'All Regions' or specific region
                    if self.model.__name__ == 'Document':
                        return self.filter(region__in=[user.region, 'All Regions'])
                    if self.model.__name__ == 'Report':
                        # Allow access if region matches OR user is a recipient OR user is the submitter
                        from django.db.models import Q
                        return self.filter(Q(region=user.region) | Q(recipients=user) | Q(submitted_by=user)).distinct()
                    return self.filter(region=user.region)
        return self


class RegionalManager(models.Manager):
    """
    Custom manager that automatically filters querysets based on the current user's region.
    """
    def get_queryset(self):
        return RegionalQuerySet(self.model, using=self._db).filter_by_region()


class RegionalIsolationMiddleware(MiddlewareMixin):
    """
    Middleware that sets the current user in thread-local storage
    for model managers to enforce regional isolation at the ORM level.
    """
    def process_request(self, request):
        _thread_locals.request = request
        return None

    def process_response(self, request, response):
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
        return response


class AuditLoggingMiddleware(MiddlewareMixin):
    """
    Middleware that automatically logs all successful CREATE, UPDATE, DELETE requests
    to the AuditLog model.
    """
    def process_response(self, request, response):
        # We only log mutating HTTP methods that succeeded (2xx or 3xx)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            if 200 <= response.status_code < 400:
                # Do not audit log the audit log collection itself
                if 'audit-logs' not in request.path:
                    try:
                        # Safely trigger log
                        AuditService.log_action(request, response)
                    except Exception as e:
                        # Ensure middleware never crashes the request
                        print(f"Error writing audit log in middleware: {e}")
        return response
