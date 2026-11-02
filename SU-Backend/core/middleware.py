import sys
import traceback
import threading
from django.db import models
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse, HttpResponse
from services.audit_service import AuditService

class ExceptionLoggingMiddleware:
    """
    Middleware that intercepts unhandled exceptions, prints the full traceback
    to stderr (visible in Vercel logs), and returns the detailed traceback.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as exception:
            tb = traceback.format_exc()
            print(f"CRITICAL DJANGO ERROR on {request.path}:\n{tb}", file=sys.stderr)
            return HttpResponse(
                f"EXACT DJANGO ERROR on {request.path}:\n\n{type(exception).__name__}: {exception}\n\nTraceback:\n{tb}",
                content_type="text/plain; charset=utf-8",
                status=500
            )

    def process_exception(self, request, exception):
        tb = traceback.format_exc()
        print(f"CRITICAL DJANGO ERROR on {request.path}:\n{tb}", file=sys.stderr)
        return HttpResponse(
            f"EXACT DJANGO ERROR on {request.path}:\n\n{type(exception).__name__}: {exception}\n\nTraceback:\n{tb}",
            content_type="text/plain; charset=utf-8",
            status=500
        )

from django.utils.functional import empty

# Thread-local storage for request user
_thread_locals = threading.local()

def get_current_user():
    """
    Retrieve the current request user from thread-local storage safely without triggering
    premature evaluation of SimpleLazyObject during authentication.
    """
    request = getattr(_thread_locals, 'request', None)
    if request:
        raw_user = getattr(request, 'user', None)
        # If it's an unresolved SimpleLazyObject, do NOT force-evaluate it here to avoid recursion
        if hasattr(raw_user, '_wrapped') and raw_user._wrapped is empty:
            return None
        return raw_user
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
        # Prevent recursion if already inside filter_by_region
        if getattr(_thread_locals, '_in_filter_by_region', False):
            return self

        request = getattr(_thread_locals, 'request', None)
        # Never apply regional filtering to Django Admin internal views
        if request and getattr(request, 'path', '').startswith('/admin/'):
            return self

        if not user:
            user = get_current_user()

        if not user:
            return self

        try:
            _thread_locals._in_filter_by_region = True
            
            if not getattr(user, 'is_authenticated', False):
                return self

            # Admins, managers, and staff see all regions
            if (
                getattr(user, 'role', None) in ['administrator', 'national_manager']
                or getattr(user, 'is_superuser', False)
                or getattr(user, 'is_staff', False)
            ):
                return self

            # Regional isolation applies only to field officers and regional coordinators
            if getattr(user, 'role', None) in ['field_officer', 'regional_coordinator']:
                user_region = getattr(user, 'region', None)
                if not user_region:
                    return self

                if self.model.__name__ == 'User':
                    return self.filter(region=user_region)
                elif hasattr(self.model, 'region'):
                    if self.model.__name__ == 'Document':
                        return self.filter(region__in=[user_region, 'All Regions'])
                    if self.model.__name__ == 'Report':
                        from django.db.models import Q
                        return self.filter(Q(region=user_region) | Q(recipients=user) | Q(submitted_by=user)).distinct()
                    if self.model.__name__ == 'SupportRequest':
                        from django.db.models import Q
                        return self.filter(Q(region=user_region) | Q(recipients=user) | Q(requester=user) | Q(assigned_to=user)).distinct()
                    return self.filter(region=user_region)
        finally:
            _thread_locals._in_filter_by_region = False

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


class SessionTimeoutMiddleware(MiddlewareMixin):
    """
    Checks the user's last activity. If more than 15 minutes have passed,
    forces logout. Otherwise updates last activity.
    """
    def process_request(self, request):
        # Allow admin and static/media routes to rely on standard Django session handling
        if request.path.startswith('/admin/') or request.path.startswith('/static/') or request.path.startswith('/media/'):
            return None

        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            now = timezone.now()
            
            # Allow public heartbeat and auth routes to bypass timeout checks
            if any(path in request.path for path in ['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email']):
                return None

            if user.last_activity:
                elapsed = now - user.last_activity
                if elapsed > timedelta(minutes=15):
                    # Force session termination
                    user.session_id = None
                    user.save(update_fields=['session_id'])
                    return JsonResponse({
                        "success": False,
                        "error": "Session expired due to inactivity. Please log in again."
                    }, status=401)
            
            # Update last activity at most once every 60 seconds to optimize DB writes
            if not user.last_activity or (now - user.last_activity) > timedelta(seconds=60):
                user.last_activity = now
                user.save(update_fields=['last_activity'])
        return None
