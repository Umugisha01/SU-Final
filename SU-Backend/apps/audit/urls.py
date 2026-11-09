from django.urls import re_path
from apps.audit.views import AuditLogListView

urlpatterns = [
    re_path(r'^$', AuditLogListView.as_view(), name='audit_list'),
]
