from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse

def root_view(request):
    """
    Root endpoint confirming the SU Connect API is healthy and live.
    """
    return JsonResponse({
        "status": "online",
        "service": "SU Connect API",
        "version": "1.0.0",
        "message": "Scripture Union Rwanda Operations Platform Backend is running successfully.",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "users": "/api/users/",
            "reports": "/api/reports/",
            "support": "/api/support/",
            "prayer": "/api/prayer/",
            "documents": "/api/documents/",
            "audit": "/api/audit/",
            "notifications": "/api/notifications/",
            "dashboard": "/api/dashboard/"
        }
    })

def favicon_view(request):
    return HttpResponse(status=204)

def custom_404(request, exception=None):
    return JsonResponse({"detail": "Endpoint not found.", "status": 404}, status=404)

def custom_500(request):
    return JsonResponse({"detail": "Internal server error.", "status": 500}, status=500)

handler404 = 'su_connect.urls.custom_404'
handler500 = 'su_connect.urls.custom_500'

urlpatterns = [
    path('', root_view, name='root'),
    path('favicon.ico', favicon_view, name='favicon'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls_auth')),
    path('api/users/', include('apps.accounts.urls_users')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/prayer/', include('apps.prayer.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/dashboard/', include('apps.reports.urls_dashboard')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
