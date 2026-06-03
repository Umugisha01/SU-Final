from django.urls import path
from apps.prayer.views import (
    PrayerRequestListCreateView, PrayerRequestDetailView,
    PrayerRequestStatusView, PrayerRequestCommitView, PrayerRequestUncommitView
)

urlpatterns = [
    path('', PrayerRequestListCreateView.as_view(), name='prayer_list_create'),
    path('<int:pk>', PrayerRequestDetailView.as_view(), name='prayer_detail'),
    path('<int:id>/status', PrayerRequestStatusView.as_view(), name='prayer_status'),
    path('<int:id>/commit', PrayerRequestCommitView.as_view(), name='prayer_commit'),
    path('<int:id>/uncommit', PrayerRequestUncommitView.as_view(), name='prayer_uncommit'),
]
