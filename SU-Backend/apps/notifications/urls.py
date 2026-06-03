from django.urls import path
from apps.notifications.views import (
    NotificationListView, MarkNotificationsReadView, MarkSingleNotificationReadView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('mark-read', MarkNotificationsReadView.as_view(), name='notifications_mark_read'),
    path('<int:id>/read', MarkSingleNotificationReadView.as_view(), name='notification_mark_single_read'),
]
