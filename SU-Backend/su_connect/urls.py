from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

def status_view(request):
    """
    Status / Health endpoint returning API endpoints inventory.
    """
    return JsonResponse({
        "status": "online",
        "service": "SU Connect API",
        "version": "1.0.0",
        "message": "Scripture Union Rwanda Operations Platform Backend is running successfully.",
        "endpoints": {
            "admin": "/admin/",
            "docs": "/api/docs/",
            "schema": "/api/schema/",
            "redoc": "/api/redoc/",
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
    return JsonResponse({
        "detail": "Endpoint not found.",
        "status": 404,
        "path": request.path,
        "path_info": request.path_info,
        "debug_meta": {
            k: str(v) for k, v in request.META.items() 
            if k.startswith('HTTP_') or 'PATH' in k or 'URI' in k or 'QUERY' in k
        }
    }, status=404)

def custom_500(request):
    return JsonResponse({"detail": "Internal server error.", "status": 500}, status=500)

handler404 = 'su_connect.urls.custom_404'
handler500 = 'su_connect.urls.custom_500'

urlpatterns = [
    # Direct redirect to Django Admin Dashboard
    path('', RedirectView.as_view(url='/admin/', permanent=False), name='root_redirect'),
    
    # Django Admin Dashboard
    path('admin/', admin.site.urls),
    
    # Interactive OpenAPI / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-noslash'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Health & Status
    path('api', status_view, name='root_api_base'),
    path('api/', status_view, name='root_api_base_slash'),
    path('api/status', status_view, name='root_api_status_noslash'),
    path('api/status/', status_view, name='root_api_status'),
    path('favicon.ico', favicon_view, name='favicon'),

    # Application APIs (with standard /api/ prefix)
    re_path(r'^api/auth/', include('apps.accounts.urls_auth')),
    re_path(r'^api/users/', include('apps.accounts.urls_users')),
    re_path(r'^api/reports/', include('apps.reports.urls')),
    re_path(r'^api/support/', include('apps.support.urls')),
    re_path(r'^api/prayer/', include('apps.prayer.urls')),
    re_path(r'^api/documents/', include('apps.documents.urls')),
    re_path(r'^api/audit/', include('apps.audit.urls')),
    re_path(r'^api/notifications/', include('apps.notifications.urls')),
    re_path(r'^api/dashboard/', include('apps.reports.urls_dashboard')),

    # Application APIs (direct aliases without /api/ prefix for direct frontend requests)
    re_path(r'^auth/', include('apps.accounts.urls_auth')),
    re_path(r'^users/', include('apps.accounts.urls_users')),
    re_path(r'^reports/', include('apps.reports.urls')),
    re_path(r'^support/', include('apps.support.urls')),
    re_path(r'^prayer/', include('apps.prayer.urls')),
    re_path(r'^documents/', include('apps.documents.urls')),
    re_path(r'^audit/', include('apps.audit.urls')),
    re_path(r'^notifications/', include('apps.notifications.urls')),
    re_path(r'^dashboard/', include('apps.reports.urls_dashboard')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
