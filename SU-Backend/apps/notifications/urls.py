from django.urls import path
from apps.notifications.views import (
    NotificationListView, MarkNotificationsReadView, MarkSingleNotificationReadView,
    DeleteNotificationView, BroadcastTargetListView, BroadcastNotificationView,
    CreateSystemAlertView, ActiveSystemAlertListView, DismissSystemAlertView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('mark-read', MarkNotificationsReadView.as_view(), name='notifications_mark_read'),
    path('<int:id>/read', MarkSingleNotificationReadView.as_view(), name='notification_mark_single_read'),
    path('<int:id>/', DeleteNotificationView.as_view(), name='notification_delete'),
    
    # Broadcast Notification endpoints
    path('broadcast-targets', BroadcastTargetListView.as_view(), name='broadcast_targets'),
    path('broadcast', BroadcastNotificationView.as_view(), name='broadcast_send'),
    
    # System Alerts endpoints
    path('system-alerts', CreateSystemAlertView.as_view(), name='system_alert_create'),
    path('system-alerts/active', ActiveSystemAlertListView.as_view(), name='system_alert_active'),
    path('system-alerts/<int:id>/dismiss', DismissSystemAlertView.as_view(), name='system_alert_dismiss'),
]

