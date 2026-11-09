from django.urls import re_path
from apps.notifications.views import (
    NotificationListView, MarkNotificationsReadView, MarkSingleNotificationReadView,
    DeleteNotificationView, BroadcastTargetListView, BroadcastNotificationView,
    CreateSystemAlertView, ActiveSystemAlertListView, DismissSystemAlertView
)

urlpatterns = [
    re_path(r'^$', NotificationListView.as_view(), name='notification_list'),
    re_path(r'^mark-read/?$', MarkNotificationsReadView.as_view(), name='notifications_mark_read'),
    re_path(r'^(?P<id>\d+)/read/?$', MarkSingleNotificationReadView.as_view(), name='notification_mark_single_read'),
    re_path(r'^(?P<id>\d+)/?$', DeleteNotificationView.as_view(), name='notification_delete'),
    
    # Broadcast Notification endpoints
    re_path(r'^broadcast-targets/?$', BroadcastTargetListView.as_view(), name='broadcast_targets'),
    re_path(r'^broadcast/?$', BroadcastNotificationView.as_view(), name='broadcast_send'),
    
    # System Alerts endpoints
    re_path(r'^system-alerts/?$', CreateSystemAlertView.as_view(), name='system_alert_create'),
    re_path(r'^system-alerts/active/?$', ActiveSystemAlertListView.as_view(), name='system_alert_active'),
    re_path(r'^system-alerts/(?P<id>\d+)/dismiss/?$', DismissSystemAlertView.as_view(), name='system_alert_dismiss'),
]
