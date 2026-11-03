from django.urls import path, re_path
from apps.accounts.views import (
    RegisterView, LoginView, LogoutView, ForgotPasswordView, 
    ResetPasswordView, TokenRefreshView, MFASetupView, MFAVerifyView,
    VerifyEmailView, ResendVerificationView, HeartbeatView, SessionsView,
    RevokeSessionsView, SendMFACodeEmailView
)

urlpatterns = [
    re_path(r'^register/?$', RegisterView.as_view(), name='auth_register'),
    re_path(r'^login/?$', LoginView.as_view(), name='auth_login'),
    re_path(r'^logout/?$', LogoutView.as_view(), name='auth_logout'),
    re_path(r'^forgot-password/?$', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    re_path(r'^reset-password/?$', ResetPasswordView.as_view(), name='auth_reset_password'),
    re_path(r'^refresh/?$', TokenRefreshView.as_view(), name='auth_refresh'),
    re_path(r'^mfa/setup/?$', MFASetupView.as_view(), name='auth_mfa_setup'),
    re_path(r'^mfa/verify/?$', MFAVerifyView.as_view(), name='auth_mfa_verify'),
    re_path(r'^mfa/send-email/?$', SendMFACodeEmailView.as_view(), name='auth_mfa_send_email'),
    re_path(r'^verify-email/?$', VerifyEmailView.as_view(), name='auth_verify_email'),
    re_path(r'^resend-verification/?$', ResendVerificationView.as_view(), name='auth_resend_verification'),
    re_path(r'^heartbeat/?$', HeartbeatView.as_view(), name='auth_heartbeat'),
    re_path(r'^sessions/?$', SessionsView.as_view(), name='auth_sessions'),
    re_path(r'^sessions/revoke/?$', RevokeSessionsView.as_view(), name='auth_sessions_revoke'),
]
