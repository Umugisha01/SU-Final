from django.urls import path
from apps.support.views import (
    SupportRequestListCreateView, SupportRequestDetailView, 
    SupportRequestStatusView, SupportRequestAssignView, AddSupportCommentView
)

urlpatterns = [
    path('', SupportRequestListCreateView.as_view(), name='support_list_create'),
    path('<int:pk>', SupportRequestDetailView.as_view(), name='support_detail'),
    path('<int:id>/status', SupportRequestStatusView.as_view(), name='support_status'),
    path('<int:id>/assign', SupportRequestAssignView.as_view(), name='support_assign'),
    path('<int:id>/comments', AddSupportCommentView.as_view(), name='support_comment'),
]
