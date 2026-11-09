from django.urls import re_path
from apps.support.views import (
    SupportRequestListCreateView, SupportRequestDetailView, 
    SupportRequestStatusView, SupportRequestAssignView, AddSupportCommentView,
    SupportRequestAIAnalyzeView, SupportRequestBatchAIAnalyzeView,
    SupportRequestAITaskStatusView, SupportRequestAISuggestView,
    SupportRequestConsolidateView, SupportRequestShareView
)

urlpatterns = [
    re_path(r'^$', SupportRequestListCreateView.as_view(), name='support_list_create'),
    re_path(r'^(?P<id>\d+)/status/?$', SupportRequestStatusView.as_view(), name='support_status'),
    re_path(r'^(?P<id>\d+)/assign/?$', SupportRequestAssignView.as_view(), name='support_assign'),
    re_path(r'^(?P<id>\d+)/comments/?$', AddSupportCommentView.as_view(), name='support_comment'),
    re_path(r'^(?P<pk>\d+)/ai-analyze/?$', SupportRequestAIAnalyzeView.as_view(), name='support-ai-analyze'),
    re_path(r'^(?P<pk>\d+)/?$', SupportRequestDetailView.as_view(), name='support_detail'),
    re_path(r'^share/?$', SupportRequestShareView.as_view(), name='support_share'),
    re_path(r'^ai-batch/?$', SupportRequestBatchAIAnalyzeView.as_view(), name='support-ai-batch'),
    re_path(r'^ai-status/(?P<task_id>[^/]+)/?$', SupportRequestAITaskStatusView.as_view(), name='support-ai-status'),
    re_path(r'^ai-suggest/?$', SupportRequestAISuggestView.as_view(), name='support-ai-suggest'),
    re_path(r'^consolidate/?$', SupportRequestConsolidateView.as_view(), name='support_consolidate'),
]
