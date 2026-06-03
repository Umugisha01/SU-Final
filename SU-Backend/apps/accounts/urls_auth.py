from django.urls import path
from apps.accounts.views import (
    RegisterView, LoginView, LogoutView, ForgotPasswordView, 
    ResetPasswordView, TokenRefreshView, MFASetupView, MFAVerifyView
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
]
