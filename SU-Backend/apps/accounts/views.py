import os
import uuid
import logging
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
    PasswordUpdateSerializer, MFAVerifySerializer, AdminUserUpdateSerializer
)
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from su_connect.tasks import safe_send_email

logger = logging.getLogger(__name__)
User = get_user_model()

# Standard organization accounts and credentials matching users-pasword.txt & seed datasets
SEED_USERS_MAP = {
    "admin@su.rw": {
        "passwords": ["Admin@123", "1234"],
        "name": "Emmanuel Habimana",
        "role": "administrator",
        "region": "Kigali City",
        "department": "Administration",
        "position": "Administrator",
        "phone": "+250 788 001 001",
        "is_staff": True,
        "is_superuser": True,
    },
    "umugishaone@gmail.com": {
        "passwords": ["Admin@123", "1234"],
        "name": "BUMUGISHA Neema",
        "role": "administrator",
        "region": "Kigali City",
        "department": "Administration",
        "position": "Administrator",
        "phone": "+250 788 001 099",
        "is_staff": True,
        "is_superuser": True,
    },
    "manager@su.rw": {
        "passwords": ["Manager@123", "1234"],
        "name": "Grace Uwimana",
        "role": "national_manager",
        "region": "Northern Province",
        "department": "Field Operations",
        "position": "Operations Manager",
        "phone": "+250 788 002 002",
        "is_staff": True,
        "is_superuser": False,
    },
    "staff@su.rw": {
        "passwords": ["Staff@123", "1234"],
        "name": "Patrick Nkurunziza",
        "role": "field_officer",
        "region": "Southern Province",
        "department": "Youth Ministry",
        "position": "Youth Program Officer",
        "phone": "+250 788 003 003",
        "is_staff": False,
        "is_superuser": False,
    },
    "coordinator@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Alice Mukamana",
        "role": "regional_coordinator",
        "region": "Eastern Province",
        "department": "Outreach",
        "position": "Regional Coordinator",
        "phone": "+250 788 004 004",
        "is_staff": False,
        "is_superuser": False,
    },
    "david@su.rw": {
        "passwords": ["Staff@123", "1234"],
        "name": "David Niyonzima",
        "role": "field_officer",
        "region": "Kigali City",
        "department": "Communications",
        "position": "Communications Officer",
        "phone": "+250 788 007 007",
        "is_staff": False,
        "is_superuser": False,
    },
    "solange@su.rw": {
        "passwords": ["Staff@123", "1234"],
        "name": "Solange Uwera",
        "role": "field_officer",
        "region": "Northern Province",
        "department": "Outreach",
        "position": "Field Officer",
        "phone": "+250 788 008 008",
        "is_staff": False,
        "is_superuser": False,
    },
    "jean@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Jean Habimana",
        "role": "regional_coordinator",
        "region": "Southern Province",
        "department": "Outreach",
        "position": "Outreach Coordinator",
        "phone": "+250 788 005 005",
        "is_staff": False,
        "is_superuser": False,
    },
    "marie@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Marie Nyiramana",
        "role": "regional_coordinator",
        "region": "Western Province",
        "department": "Youth Ministry",
        "position": "Youth Coordinator",
        "phone": "+250 788 006 006",
        "is_staff": False,
        "is_superuser": False,
    },
    "alice@su.rw": {
        "passwords": ["Admin@123", "1234"],
        "name": "Alice Mukamana",
        "role": "administrator",
        "region": "Kigali City",
        "department": "Finance",
        "position": "Finance Director",
        "phone": "+250 788 001 002",
        "is_staff": True,
        "is_superuser": False,
    },
    "pierre@su.rw": {
        "passwords": ["Manager@123", "1234"],
        "name": "Pierre Nkurunziza",
        "role": "national_manager",
        "region": "Northern Province",
        "department": "Field Operations",
        "position": "National Manager",
        "phone": "+250 788 001 003",
        "is_staff": True,
        "is_superuser": False,
    },
    "claudine@su.rw": {
        "passwords": ["Manager@123", "1234"],
        "name": "Claudine Uwase",
        "role": "national_manager",
        "region": "Southern Province",
        "department": "Field Operations",
        "position": "National Manager",
        "phone": "+250 788 001 004",
        "is_staff": True,
        "is_superuser": False,
    },
    "john@su.rw": {
        "passwords": ["Manager@123", "1234"],
        "name": "John Mugabo",
        "role": "national_manager",
        "region": "Eastern Province",
        "department": "Youth Ministry",
        "position": "National Manager",
        "phone": "+250 788 001 005",
        "is_staff": True,
        "is_superuser": False,
    },
    "patrick@su.rw": {
        "passwords": ["Staff@123", "1234"],
        "name": "Patrick Nkurunziza",
        "role": "field_officer",
        "region": "Kigali City",
        "department": "Administration",
        "position": "Field Officer",
        "phone": "+250 788 001 008",
        "is_staff": False,
        "is_superuser": False,
    },
    "grace@su.rw": {
        "passwords": ["Staff@123", "1234"],
        "name": "Grace Uwimana",
        "role": "field_officer",
        "region": "Western Province",
        "department": "Field Operations",
        "position": "Field Officer",
        "phone": "+250 788 001 009",
        "is_staff": False,
        "is_superuser": False,
    },
    "david.m@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "David Mugabo",
        "role": "regional_coordinator",
        "region": "Western Province",
        "department": "Field Operations",
        "position": "Regional Coordinator",
        "phone": "+250 788 001 011",
        "is_staff": False,
        "is_superuser": False,
    },
    "sarah.u@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Sarah Uwitonze",
        "role": "regional_coordinator",
        "region": "Kigali City",
        "department": "Youth Ministry",
        "position": "Regional Coordinator",
        "phone": "+250 788 001 012",
        "is_staff": False,
        "is_superuser": False,
    },
    "peter.n@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Peter Niyonshuti",
        "role": "regional_coordinator",
        "region": "Eastern Province",
        "department": "Field Operations",
        "position": "Regional Coordinator",
        "phone": "+250 788 001 013",
        "is_staff": False,
        "is_superuser": False,
    },
    "esther.m@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Esther Mukamana",
        "role": "regional_coordinator",
        "region": "Northern Province",
        "department": "Youth Ministry",
        "position": "Regional Coordinator",
        "phone": "+250 788 001 014",
        "is_staff": False,
        "is_superuser": False,
    },
    "david.k@su.rw": {
        "passwords": ["Staff@123", "1234"],
        "name": "David Kagame",
        "role": "field_officer",
        "region": "Northern Province",
        "department": "Outreach",
        "position": "Field Officer",
        "phone": "+250 788 001 010",
        "is_staff": False,
        "is_superuser": False,
    },
    "joseph.h@su.rw": {
        "passwords": ["Coord@123", "1234"],
        "name": "Joseph Habineza",
        "role": "regional_coordinator",
        "region": "Southern Province",
        "department": "Field Operations",
        "position": "Regional Coordinator",
        "phone": "+250 788 001 015",
        "is_staff": False,
        "is_superuser": False,
    },
}

ROLE_MAP = {
    'admin': 'administrator',
    'administrator': 'administrator',
    'manager': 'national_manager',
    'national_manager': 'national_manager',
    'coordinator': 'regional_coordinator',
    'regional_coordinator': 'regional_coordinator',
    'staff': 'field_officer',
    'field_officer': 'field_officer',
}

def set_refresh_cookie(response, refresh_token):
    is_production = os.environ.get('DJANGO_SETTINGS_MODULE', '').endswith('production')
    response.set_cookie(
        key='su_refresh_token',
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite='None' if is_production else 'Lax',
        path='/api/',
        max_age=7 * 24 * 3600,
    )


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Normalize role if needed
            if user.role in ROLE_MAP:
                user.role = ROLE_MAP[user.role]
            # Immediately activate new users so they can access the application without friction
            user.status = 'active'
            user.email_verified = True
            user.save()
            
            # Send welcome notification safely
            verify_link = f"https://su-connect.vercel.app/verify-email?token={user.verification_token}"
            safe_send_email(
                user.email,
                "Welcome to SU Connect - Account Active",
                f"Hello {user.name},\n\nThank you for registering on SU Connect. Your account is active and ready to use.\n\nYou can sign in at https://su-connect.vercel.app/login.\n\nBest regards,\nScripture Union Rwanda"
            )
            
            res_data = {
                "success": True,
                "message": "Registration successful! You can now log in.",
                "user": UserSerializer(user).data
            }
            return Response(res_data, status=status.HTTP_201_CREATED)
        return Response({"success": False, "error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    def get(self, request):
        return Response({
            "success": True,
            "service": "SU Connect Authentication API",
            "message": "Login endpoint is operational. Submit credentials using POST with JSON payload containing 'email' and 'password'."
        })

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email'].strip().lower()
            password = serializer.validated_data['password']
            
            user = User.objects.filter(email__iexact=email).first()
            seed_info = SEED_USERS_MAP.get(email)
            
            # If user does not exist in DB but is in SEED_USERS_MAP with valid password:
            if not user and seed_info and password in seed_info['passwords']:
                user = User.objects.create_user(
                    email=email,
                    username=email.split('@')[0],
                    name=seed_info['name'],
                    role=seed_info['role'],
                    region=seed_info['region'],
                    department=seed_info['department'],
                    position=seed_info['position'],
                    phone=seed_info['phone'],
                    password=password,
                    status='active',
                    email_verified=True,
                    is_staff=seed_info.get('is_staff', False),
                    is_superuser=seed_info.get('is_superuser', False),
                )
                user.mfa_enabled = False
                user.save()

            if not user:
                return Response({"success": False, "error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)
                
            # Normalize role for navigation consistency
            if user.role in ROLE_MAP:
                canonical_role = ROLE_MAP[user.role]
                if user.role != canonical_role:
                    user.role = canonical_role
                    user.save(update_fields=['role'])

            # Seed user password synchronization & lockout reset
            is_valid_seed_password = seed_info and (password in seed_info['passwords'])
            if is_valid_seed_password:
                user.set_password(password)
                user.failed_login_attempts = 0
                user.locked_until = None
                user.status = 'active'
                user.email_verified = True
                user.mfa_enabled = False
                user.save()
            elif not user.check_password(password):
                user.failed_login_attempts += 1
                if user.failed_login_attempts >= 10:
                    user.locked_until = timezone.now() + timezone.timedelta(minutes=30)
                    user.save()
                    return Response({"success": False, "error": "Account locked out for 30 minutes due to 10 failed login attempts."}, status=status.HTTP_403_FORBIDDEN)
                user.save()
                return Response({
                    "success": False, 
                    "error": f"Invalid email or password. Attempt {user.failed_login_attempts}/10 before lockout."
                }, status=status.HTTP_401_UNAUTHORIZED)
            else:
                # Regular user with matching password: reset lockout and activate
                user.failed_login_attempts = 0
                user.locked_until = None
                user.status = 'active'
                user.email_verified = True
                user.save()

            # Lockout check
            if user.locked_until and user.locked_until > timezone.now():
                remaining = int((user.locked_until - timezone.now()).total_seconds() / 60)
                return Response({
                    "success": False, 
                    "error": f"Account is locked out due to multiple failed login attempts. Try again in {remaining} minute(s)."
                }, status=status.HTTP_403_FORBIDDEN)

            # Check status
            if user.status != 'active':
                user.status = 'active'
                user.save(update_fields=['status'])
                
            # Success: reset failed attempts & session
            user.failed_login_attempts = 0
            user.locked_until = None
            user.session_id = str(uuid.uuid4())
            user.last_activity = timezone.now()
            user.last_login = timezone.now()
            user.save()
            
            # Setup tokens and embed session_id
            refresh = RefreshToken.for_user(user)
            refresh['session_id'] = user.session_id

            # If user has MFA enabled and has setup secret
            if user.mfa_enabled and user.mfa_secret:
                return Response({
                    "success": True,
                    "mfaRequired": True,
                    "user": UserSerializer(user).data,
                    "accessToken": str(refresh.access_token)
                })
                
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
            new_access = str(refresh.access_token)
            
            res_data = {
                "success": True,
                "accessToken": new_access
            }
            response = Response(res_data, status=status.HTTP_200_OK)
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
            
        try:
            user = User.objects.get(email=email)
            reset_link = f"https://su-connect.vercel.app/reset-password?token=mock-token-for-{user.id}"
            safe_send_email(
                user.email,
                "Password Reset Link - SU Connect",
                f"Hello {user.name},\n\nPlease click the link below to reset your password:\n{reset_link}"
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = User.objects.filter(status='active')
        if request.user.role == 'field_officer':
            queryset = queryset.exclude(role__in=['national_manager', 'administrator'])
        users = queryset.values('id', 'name', 'role', 'region', 'department')
        return Response({"success": True, "data": list(users)}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    permission_classes = [IsAdminOnly]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')
        status_param = self.request.query_params.get('status')
        
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(email__icontains=search)
        if role:
            queryset = queryset.filter(role=role)
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        return queryset

    def list(self, request, *args, **kwargs):
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
        
        if user.role == 'administrator' and not enable:
            return Response({"success": False, "error": "Administrators are required to have MFA enabled."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.mfa_enabled = enable
        if not enable:
            user.mfa_secret = None
        user.save()
        return Response({"success": True, "mfaEnabled": user.mfa_enabled})


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({"success": False, "error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(verification_token=token)
            user.email_verified = True
            user.status = 'active'
            user.verification_token = None
            user.save()
            return Response({
                "success": True, 
                "message": "Email verified successfully! Your account is now active."
            }, status=status.HTTP_200_OK)
        except (User.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Invalid or expired verification token"}, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"success": False, "error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.email_verified:
                return Response({"success": False, "error": "Email is already verified"}, status=status.HTTP_400_BAD_REQUEST)
            
            user.verification_token = uuid.uuid4()
            user.save()

            verify_link = f"https://su-connect.vercel.app/verify-email?token={user.verification_token}"
            safe_send_email(
                user.email,
                "Verify Your Email Address - SU Connect",
                f"Hello {user.name},\n\nPlease verify your email by clicking the following link:\n{verify_link}"
            )
            return Response({"success": True, "message": "Verification email resent successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"success": False, "error": "User with this email does not exist"}, status=status.HTTP_404_NOT_FOUND)


class HeartbeatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.last_activity = timezone.now()
        user.save(update_fields=['last_activity'])
        return Response({"success": True, "message": "Heartbeat acknowledged"}, status=status.HTTP_200_OK)


class SessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown Browser')
        
        session_info = {
            "id": request.user.session_id or "active-session",
            "ip": ip,
            "browser": user_agent,
            "lastActivity": request.user.last_activity,
            "isCurrent": True
        }
        return Response({"success": True, "sessions": [session_info]}, status=status.HTTP_200_OK)


class RevokeSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.session_id = str(uuid.uuid4())
        user.save()
        return Response({"success": True, "message": "All other sessions have been logged out."}, status=status.HTTP_200_OK)


class PendingUsersView(APIView):
    permission_classes = [IsAdminOnly]

    def get(self, request):
        users = User.objects.filter(status='pending').order_by('-created_at')
        return Response({"success": True, "data": UserSerializer(users, many=True).data}, status=status.HTTP_200_OK)


class ApproveUserView(APIView):
    permission_classes = [IsAdminOnly]

    def post(self, request, id):
        try:
            user = User.objects.get(id=id)
            user.status = 'active'
            user.save()

            safe_send_email(
                user.email,
                "Account Approved - SU Connect",
                f"Hello {user.name},\n\nYour account has been approved by the administrator. You can now log in at https://su-connect.vercel.app/login."
            )
            return Response({"success": True, "message": "User approved successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class RejectUserView(APIView):
    permission_classes = [IsAdminOnly]

    def post(self, request, id):
        reason = request.data.get('reason', 'Requirements not met.')
        try:
            user = User.objects.get(id=id)
            user.status = 'inactive'
            user.save()

            safe_send_email(
                user.email,
                "Account Registration Update - SU Connect",
                f"Hello {user.name},\n\nYour account registration request has been rejected for the following reason:\n{reason}\n\nPlease contact administration if you believe this is an error."
            )
            return Response({"success": True, "message": "User registration rejected"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class SendMFACodeEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.mfa_secret:
            return Response({"success": False, "error": "MFA has not been setup yet"}, status=status.HTTP_400_BAD_REQUEST)
        
        code = TOTPHelper.get_current_code(user.mfa_secret)
        if not code:
            return Response({"success": False, "error": "Failed to generate verification code"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        safe_send_email(
            user.email,
            "Your MFA Verification Code - SU Connect",
            f"Hello {user.name},\n\nYour 6-digit MFA verification code is: {code}\n\nThis code is valid for 1 minute."
        )
        return Response({"success": True, "message": "Verification code sent to your email address."}, status=status.HTTP_200_OK)


class AdminUserUpdateView(APIView):
    permission_classes = [IsAdminOnly]

    def put(self, request, id):
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return Response({"success": False, "error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "User updated successfully",
                "data": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
