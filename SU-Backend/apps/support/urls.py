from django.urls import path
from apps.support.views import (
    SupportRequestListCreateView, SupportRequestDetailView, 
    SupportRequestStatusView, SupportRequestAssignView, AddSupportCommentView,
    SupportRequestAIAnalyzeView, SupportRequestBatchAIAnalyzeView,
    SupportRequestAITaskStatusView, SupportRequestAISuggestView,
    SupportRequestConsolidateView
)

urlpatterns = [
    path('', SupportRequestListCreateView.as_view(), name='support_list_create'),
    path('<int:pk>', SupportRequestDetailView.as_view(), name='support_detail'),
    path('<int:id>/status', SupportRequestStatusView.as_view(), name='support_status'),
    path('<int:id>/assign', SupportRequestAssignView.as_view(), name='support_assign'),
    path('<int:id>/comments', AddSupportCommentView.as_view(), name='support_comment'),
    
    # AI Priority endpoints
    path('<int:pk>/ai-analyze', SupportRequestAIAnalyzeView.as_view(), name='support-ai-analyze'),
    path('ai-batch', SupportRequestBatchAIAnalyzeView.as_view(), name='support-ai-batch'),
    path('ai-status/<str:task_id>', SupportRequestAITaskStatusView.as_view(), name='support-ai-status'),
    path('ai-suggest', SupportRequestAISuggestView.as_view(), name='support-ai-suggest'),
    path('consolidate', SupportRequestConsolidateView.as_view(), name='support_consolidate'),
]
