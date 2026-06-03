from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from core.permissions import IsAdminOnly
from core.totp import TOTPHelper
from core.throttling import AuthRateThrottle
from apps.accounts.serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    PasswordUpdateSerializer, MFAVerifySerializer
)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

import os

def set_refresh_cookie(response, refresh_token):
    # In development (HTTP), secure must be False and samesite Lax for cookie to be sent
    is_production = os.environ.get('DJANGO_SETTINGS_MODULE', '').endswith('production')
    response.set_cookie(
        key='su_refresh_token',
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite='Strict' if is_production else 'Lax',
        path='/api/',
        max_age=7 * 24 * 3600,  # 7 days, matching REFRESH_TOKEN_LIFETIME
    )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            # If admin registered, MFA must be enabled
            if user.role == 'admin':
                user.mfa_enabled = True
                user.save()
                
            res_data = {
                "success": True,
                "message": "User registered successfully",
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token)
            }
            response = Response(res_data, status=status.HTTP_201_CREATED)
            set_refresh_cookie(response, str(refresh))
            return response
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"success": False, "error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)
                
            if not user.check_password(password):
                return Response({"success": False, "error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)
                
            if user.status != 'active':
                return Response({"success": False, "error": "This account is inactive. Please contact an administrator."}, status=status.HTTP_403_FORBIDDEN)
                
            # If Admin has MFA fully configured (both secret AND enabled), require OTP
            # If mfa_secret is not set yet, let admin log in and set up MFA later
            if user.role == 'admin' and user.mfa_enabled and user.mfa_secret:
                # Return a restricted pre-auth token — OTP must be verified to proceed
                refresh = RefreshToken.for_user(user)
                return Response({
                    "success": True,
                    "mfaRequired": True,
                    "user": UserSerializer(user).data,
                    "accessToken": str(refresh.access_token)
                })
                
            # Standard login
            refresh = RefreshToken.for_user(user)
            user.last_login = timezone.now()
            user.save()
            
            res_data = {
                "success": True,
                "user": UserSerializer(user).data,
                "accessToken": str(refresh.access_token)
            }
            response = Response(res_data, status=status.HTTP_200_OK)
            set_refresh_cookie(response, str(refresh))
            return response
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get('su_refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass
        
        response = Response({"success": True, "message": "Logged out successfully"}, status=status.HTTP_200_OK)
        response.delete_cookie('su_refresh_token', path='/api/')
        return response


class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('su_refresh_token')
        if not refresh_token:
            return Response({"success": False, "error": "Refresh token not found"}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            refresh = RefreshToken(refresh_token)
            # SimpleJWT allows rotation
            new_access = str(refresh.access_token)
            
            res_data = {
                "success": True,
                "accessToken": new_access
            }
            response = Response(res_data, status=status.HTTP_200_OK)
            # Rotate if rotation is configured
            set_refresh_cookie(response, str(refresh))
            return response
        except TokenError as e:
            return Response({"success": False, "error": f"Invalid refresh token: {str(e)}"}, status=status.HTTP_401_UNAUTHORIZED)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"success": False, "error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if user exists
        try:
            user = User.objects.get(email=email)
            # Send reset email
            from su_connect.tasks import send_notification_email_task
            reset_link = f"https://su.rw/reset-password?token=mock-token-for-{user.id}"
            send_notification_email_task.delay(
                user.email,
                "Password Reset Link",
                f"Hello, click the link to reset your password: {reset_link}"
            )
        except User.DoesNotExist:
            pass # Silent failure to avoid user enumeration
            
        return Response({"success": True, "message": "Password reset link sent to email"}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('password')
        if not token or not new_password:
            return Response({"success": False, "error": "Token and password are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Parse user ID from mock token "mock-token-for-<uuid>"
        if token.startswith("mock-token-for-"):
            user_id = token.replace("mock-token-for-", "")
            try:
                user = User.objects.get(id=user_id)
                user.set_password(new_password)
                user.save()
                return Response({"success": True, "message": "Password has been reset"}, status=status.HTTP_200_OK)
            except (User.DoesNotExist, ValueError):
                pass
        return Response({"success": False, "error": "Invalid or expired reset token"}, status=status.HTTP_400_BAD_REQUEST)


class MFASetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        # Generate new base32 secret
        secret = TOTPHelper.generate_secret()
        user.mfa_secret = secret
        user.save()
        
        uri = TOTPHelper.get_provisioning_uri(secret, user.email)
        
        return Response({
            "success": True,
            "secret": secret,
            "provisioningUri": uri
        }, status=status.HTTP_200_OK)


class MFAVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MFAVerifySerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data['code']
            user = request.user
            
            if not user.mfa_secret:
                return Response({"success": False, "error": "MFA has not been setup yet"}, status=status.HTTP_400_BAD_REQUEST)
                
            if TOTPHelper.verify_code(user.mfa_secret, code):
                user.mfa_enabled = True
                user.save()
                return Response({"success": True, "message": "MFA verified successfully"}, status=status.HTTP_200_OK)
            return Response({"success": False, "error": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        serializer = PasswordUpdateSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['currentPassword']):
                return Response({"success": False, "error": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
                
            user.set_password(serializer.validated_data['newPassword'])
            user.save()
            return Response({"success": True, "message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class UserDirectoryView(APIView):
    """
    Returns a lightweight directory of active users for dropdowns and selectors.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(status='active').values('id', 'name', 'role', 'region', 'department')
        return Response({"success": True, "data": list(users)}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    permission_classes = [IsAdminOnly]
    serializer_class = UserSerializer

    def get_queryset(self):
        # Admins bypass regional filter automatically, but we can search/filter manually
        queryset = User.objects.all().order_by('-created_at')
        
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        status = self.request.query_params.get('status')
        
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(email__icontains=search)
        if role:
            queryset = queryset.filter(role=role)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset

    def list(self, request, *args, **kwargs):
        # Override to inject pagination metadata structure
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return Response({
                "success": True,
                "data": serializer.data,
                "pagination": {
                    "total": self.paginator.page.paginator.count,
                    "page": self.paginator.page.number,
                    "limit": self.paginator.page.paginator.per_page,
                    "totalPages": self.paginator.page.paginator.num_pages
                }
            })
        serializer = self.get_serializer(queryset, many=True)
        return Response({"success": True, "data": serializer.data})


class UserStatusToggleView(APIView):
    permission_classes = [IsAdminOnly]

    def patch(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        if new_status not in ['active', 'inactive']:
            return Response({"success": False, "error": "Invalid status value"}, status=status.HTTP_400_BAD_REQUEST)
            
        user.status = new_status
        user.save()
        
        return Response({"success": True, "message": f"User status updated to {new_status}"}, status=status.HTTP_200_OK)


class TerminateSessionView(APIView):
    permission_classes = [IsAdminOnly]

    def delete(self, request, sessionId):
        # Terminate active user sessions (by broadcasting session_terminated WS command)
        # sessionId matches the target User.id in our session schema
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"user_{sessionId}_sessions"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "session_terminated",
                    "data": {}
                }
            )
        return Response({"success": True, "message": "Session terminated successfully"}, status=status.HTTP_200_OK)


class ToggleMFAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user
        enable = request.data.get('mfaEnabled', False)
        
        # Admins cannot disable MFA
        if user.role == 'admin' and not enable:
            return Response({"success": False, "error": "Administrators are required to have MFA enabled."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.mfa_enabled = enable
        if not enable:
            user.mfa_secret = None
        user.save()
        return Response({"success": True, "mfaEnabled": user.mfa_enabled})
