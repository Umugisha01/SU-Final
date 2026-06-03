from rest_framework import serializers
from apps.audit.models import AuditLog
from apps.accounts.serializers import UserSerializer

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_snapshot', 'action', 'resource', 'ip', 'severity', 'created_at']
