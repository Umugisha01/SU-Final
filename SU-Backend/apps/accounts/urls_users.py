from django.urls import path
from apps.accounts.views import (
    UserProfileView, PasswordChangeView, UserListView,
    UserStatusToggleView, TerminateSessionView, ToggleMFAView, UserDirectoryView
)

urlpatterns = [
    path('directory', UserDirectoryView.as_view(), name='user_directory'),
    path('me', UserProfileView.as_view(), name='user_profile'),
    path('me/password', PasswordChangeView.as_view(), name='user_password_change'),
    path('', UserListView.as_view(), name='user_list'),
    path('<uuid:id>/status', UserStatusToggleView.as_view(), name='user_status_toggle'),
    path('sessions/<str:sessionId>', TerminateSessionView.as_view(), name='user_session_terminate'),
    path('me/mfa', ToggleMFAView.as_view(), name='user_mfa_toggle'),
]
