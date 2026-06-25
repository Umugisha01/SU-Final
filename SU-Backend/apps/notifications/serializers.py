from rest_framework import serializers
from apps.notifications.models import Notification, SystemAlert

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'icon', 'read', 'created_at']

class SystemAlertSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.name')

    class Meta:
        model = SystemAlert
        fields = ['id', 'title', 'message', 'priority', 'is_announcement', 'expires_at', 'created_at', 'created_by', 'created_by_name']
        read_only_fields = ['id', 'created_at', 'created_by', 'created_by_name']

