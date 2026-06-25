from django.urls import path
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
    path('field-officer/', FieldOfficerDashboardView.as_view(), name='dashboard-field-officer'),
    path('coordinator/', CoordinatorDashboardView.as_view(), name='dashboard-coordinator'),
    path('manager/', ManagerDashboardView.as_view(), name='dashboard-manager'),
    path('admin/', AdminDashboardView.as_view(), name='dashboard-admin'),
    path('recent-activity/', RecentActivityView.as_view(), name='dashboard-recent-activity'),
    path('system-health/', SystemHealthView.as_view(), name='dashboard-system-health'),
    path('ai-insights/', AIInsightsView.as_view(), name='dashboard-ai-insights'),
]
