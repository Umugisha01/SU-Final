from django.urls import path, re_path
from apps.accounts.views import (
    UserProfileView, PasswordChangeView, UserListView,
    UserStatusToggleView, TerminateSessionView, ToggleMFAView, UserDirectoryView,
    PendingUsersView, ApproveUserView, RejectUserView, AdminUserUpdateView
)

urlpatterns = [
    re_path(r'^directory/?$', UserDirectoryView.as_view(), name='user_directory'),
    re_path(r'^me/?$', UserProfileView.as_view(), name='user_profile'),
    re_path(r'^me/password/?$', PasswordChangeView.as_view(), name='user_password_change'),
    re_path(r'^me/mfa/?$', ToggleMFAView.as_view(), name='user_mfa_toggle'),
    re_path(r'^pending/?$', PendingUsersView.as_view(), name='user_pending_list'),
    re_path(r'^$', UserListView.as_view(), name='user_list'),
    re_path(r'^(?P<id>[0-9a-f-]+)/?$', AdminUserUpdateView.as_view(), name='admin_user_update'),
    re_path(r'^(?P<id>[0-9a-f-]+)/status/?$', UserStatusToggleView.as_view(), name='user_status_toggle'),
    re_path(r'^sessions/(?P<sessionId>[^/]+)/?$', TerminateSessionView.as_view(), name='user_session_terminate'),
    re_path(r'^(?P<id>[0-9a-f-]+)/approve/?$', ApproveUserView.as_view(), name='user_approve'),
    re_path(r'^(?P<id>[0-9a-f-]+)/reject/?$', RejectUserView.as_view(), name='user_reject'),
]
