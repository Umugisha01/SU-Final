from django.urls import path
from apps.reports.views import (
    ReportListCreateView, ReportDetailView, ReportStatusUpdateView,
    QueueAIAnalyzeView, AIOverrideView, DashboardSummaryView, ConsolidatedReportView
)

urlpatterns = [
    path('', ReportListCreateView.as_view(), name='report_list_create'),
    path('<int:pk>', ReportDetailView.as_view(), name='report_detail'),
    path('<int:id>/status', ReportStatusUpdateView.as_view(), name='report_status_update'),
    path('ai-analyze', QueueAIAnalyzeView.as_view(), name='report_ai_analyze'),
    path('<int:id>/ai-override', AIOverrideView.as_view(), name='report_ai_override'),
    path('analytics/summary', DashboardSummaryView.as_view(), name='report_analytics_summary'),
    path('consolidated', ConsolidatedReportView.as_view(), name='report_consolidated'),
]
