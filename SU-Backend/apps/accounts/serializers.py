import re
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving and updating user profile information.
    """
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'role', 'region', 'department', 
            'position', 'phone', 'avatar', 'status', 'mfa_enabled', 
            'join_date', 'notif_prefs', 'created_at'
        ]
        read_only_fields = ['id', 'role', 'avatar', 'status', 'mfa_enabled', 'join_date', 'created_at']

    def validate_name(self, value):
        if len(value) < 2 or len(value) > 255:
            raise serializers.ValidationError("Name must be between 2 and 255 characters.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new user accounts.
    """
    password = serializers.CharField(write_only=True)
    fullName = serializers.CharField(source='name', min_length=2, max_length=255)

    class Meta:
        model = User
        fields = ['fullName', 'email', 'password', 'role', 'region', 'department', 'position', 'phone']

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PasswordUpdateSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True)

    def validate_newPassword(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")
        return value


class MFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)
