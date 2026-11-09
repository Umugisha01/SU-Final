from django.urls import re_path
from apps.prayer.views import (
    PrayerRequestListCreateView, PrayerRequestDetailView,
    PrayerRequestStatusView, PrayerRequestCommitView, PrayerRequestUncommitView
)

urlpatterns = [
    re_path(r'^$', PrayerRequestListCreateView.as_view(), name='prayer_list_create'),
    re_path(r'^(?P<id>\d+)/status/?$', PrayerRequestStatusView.as_view(), name='prayer_status'),
    re_path(r'^(?P<id>\d+)/commit/?$', PrayerRequestCommitView.as_view(), name='prayer_commit'),
    re_path(r'^(?P<id>\d+)/uncommit/?$', PrayerRequestUncommitView.as_view(), name='prayer_uncommit'),
    re_path(r'^(?P<pk>\d+)/?$', PrayerRequestDetailView.as_view(), name='prayer_detail'),
]
