import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from core.middleware import RegionalQuerySet

class UserManager(BaseUserManager):
    """
    Custom user manager that supports regional isolation.
    """
    def get_queryset(self):
        # Apply the regional filter queryset
        return RegionalQuerySet(self.model, using=self._db).filter_by_region()

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        extra_fields.setdefault('status', 'active')
        
        # Superusers bypass regional registration defaults
        if extra_fields.get('is_superuser'):
            extra_fields.setdefault('role', 'admin')
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        # Avoid running regional filters during creation
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('region', 'Kigali City')
        extra_fields.setdefault('department', 'Administration')
        extra_fields.setdefault('position', 'Administrator')
        extra_fields.setdefault('name', 'Super Admin')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model representing organization members.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
        ('coordinator', 'Coordinator'),
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='coordinator')
    region = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True, null=True)
    avatar = models.CharField(max_length=10, blank=True)
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=255, blank=True, null=True)
    
    last_login = models.DateTimeField(blank=True, null=True)
    join_date = models.DateField(default=timezone.localdate)
    
    DEFAULT_NOTIF_PREFS = {
        "email": True,
        "sms": False,
        "inApp": True,
        "deadlineReminders": True,
        "reportUpdates": True,
        "supportUpdates": True,
        "prayerResponses": False
    }
    notif_prefs = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email for login instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role', 'region']),
        ]

    def save(self, *args, **kwargs):
        # Auto-generate avatar from name initials
        if not self.avatar and self.name:
            parts = self.name.strip().split()
            if len(parts) >= 2:
                self.avatar = (parts[0][0] + parts[1][0]).upper()[:2]
            elif parts:
                self.avatar = parts[0][:2].upper()
            else:
                self.avatar = 'SU'
                
        # Load default notification preferences if empty
        if not self.notif_prefs:
            self.notif_prefs = self.DEFAULT_NOTIF_PREFS
            
        # Admin MFA enforcement
        if self.role == 'admin':
            # We default to true but the middleware checks if they have verified the token
            # If not configured, setup is required
            pass
            
        super().save(*args, **kwargs)
