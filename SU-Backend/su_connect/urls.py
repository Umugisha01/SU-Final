from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
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

