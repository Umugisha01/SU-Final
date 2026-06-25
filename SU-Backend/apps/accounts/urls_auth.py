from django.urls import path
from apps.accounts.views import (
    RegisterView, LoginView, LogoutView, ForgotPasswordView, 
    ResetPasswordView, TokenRefreshView, MFASetupView, MFAVerifyView,
    VerifyEmailView, ResendVerificationView, HeartbeatView, SessionsView,
    RevokeSessionsView, SendMFACodeEmailView
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth_register'),
    path('login', LoginView.as_view(), name='auth_login'),
    path('logout', LogoutView.as_view(), name='auth_logout'),
    path('forgot-password', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('reset-password', ResetPasswordView.as_view(), name='auth_reset_password'),
    path('refresh', TokenRefreshView.as_view(), name='auth_refresh'),
    path('mfa/setup', MFASetupView.as_view(), name='auth_mfa_setup'),
    path('mfa/verify', MFAVerifyView.as_view(), name='auth_mfa_verify'),
    path('mfa/send-email', SendMFACodeEmailView.as_view(), name='auth_mfa_send_email'),
    path('verify-email', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('resend-verification', ResendVerificationView.as_view(), name='auth_resend_verification'),
    path('heartbeat', HeartbeatView.as_view(), name='auth_heartbeat'),
    path('sessions', SessionsView.as_view(), name='auth_sessions'),
    path('sessions/revoke', RevokeSessionsView.as_view(), name='auth_sessions_revoke'),
]
