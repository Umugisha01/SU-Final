from django.contrib import admin
from django.urls import path, include

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
]
