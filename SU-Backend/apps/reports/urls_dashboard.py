from django.urls import re_path
from apps.reports.views_dashboard import (
    FieldOfficerDashboardView,
    CoordinatorDashboardView,
    ManagerDashboardView,
    AdminDashboardView,
    RecentActivityView,
    SystemHealthView,
    AIInsightsView
)

urlpatterns = [
    re_path(r'^field-officer/?$', FieldOfficerDashboardView.as_view(), name='dashboard-field-officer'),
    re_path(r'^coordinator/?$', CoordinatorDashboardView.as_view(), name='dashboard-coordinator'),
    re_path(r'^manager/?$', ManagerDashboardView.as_view(), name='dashboard-manager'),
    re_path(r'^admin/?$', AdminDashboardView.as_view(), name='dashboard-admin'),
    re_path(r'^recent-activity/?$', RecentActivityView.as_view(), name='dashboard-recent-activity'),
    re_path(r'^system-health/?$', SystemHealthView.as_view(), name='dashboard-system-health'),
    re_path(r'^ai-insights/?$', AIInsightsView.as_view(), name='dashboard-ai-insights'),
]
