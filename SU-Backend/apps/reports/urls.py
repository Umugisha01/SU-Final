from django.urls import re_path
from apps.reports.views import (
    ReportListCreateView, ReportDetailView, ReportStatusUpdateView,
    QueueAIAnalyzeView, AIOverrideView, DashboardSummaryView, ConsolidatedReportView,
    AIChatView, OllamaHealthView, ReportShareView
)

urlpatterns = [
    re_path(r'^$', ReportListCreateView.as_view(), name='report_list_create'),
    re_path(r'^(?P<id>\d+)/status/?$', ReportStatusUpdateView.as_view(), name='report_status_update'),
    re_path(r'^(?P<id>\d+)/ai-override/?$', AIOverrideView.as_view(), name='report_ai_override'),
    re_path(r'^(?P<pk>\d+)/?$', ReportDetailView.as_view(), name='report_detail'),
    re_path(r'^share/?$', ReportShareView.as_view(), name='report_share'),
    re_path(r'^ai-analyze/?$', QueueAIAnalyzeView.as_view(), name='report_ai_analyze'),
    re_path(r'^analytics/summary/?$', DashboardSummaryView.as_view(), name='report_analytics_summary'),
    re_path(r'^consolidated/?$', ConsolidatedReportView.as_view(), name='report_consolidated'),
    re_path(r'^ai-chat/?$', AIChatView.as_view(), name='report_ai_chat'),
    re_path(r'^ai-status/?$', OllamaHealthView.as_view(), name='report_ai_status'),
]
