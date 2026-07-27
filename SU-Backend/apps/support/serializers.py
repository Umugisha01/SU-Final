from rest_framework import serializers
from apps.support.models import SupportRequest, SupportComment
from apps.accounts.serializers import UserSerializer

class SupportCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for support request message threads.
    """
    user = UserSerializer(read_only=True)

    class Meta:
        model = SupportComment
        fields = ['id', 'request', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'request', 'user', 'created_at']


class SupportRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for creating, retrieving, and updating support tickets.
    """
    requester = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    comments = SupportCommentSerializer(many=True, read_only=True)
    recipients = UserSerializer(read_only=True, many=True)
    recipientIds = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = SupportRequest
        fields = [
            'id', 'title', 'category', 'description', 'urgency', 'status',
            'requester', 'assigned_to', 'deadline', 'region', 'comments',
            'recipientIds', 'recipients', 'created_at', 'updated_at',
            'ai_priority', 'ai_priority_confidence', 'ai_priority_reason',
            'ai_analyzed_at', 'manual_priority_override'
        ]
        read_only_fields = [
            'id', 'status', 'requester', 'assigned_to', 'deadline', 'region',
            'recipients', 'created_at', 'updated_at', 'ai_priority',
            'ai_priority_confidence', 'ai_priority_reason', 'ai_analyzed_at'
        ]

    def validate_title(self, value):
        if len(value) < 5 or len(value) > 255:
            raise serializers.ValidationError("Title must be between 5 and 255 characters.")
        return value

    def validate_description(self, value):
        if len(value) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long.")
        return value

    def create(self, validated_data):
        recipient_ids = validated_data.pop('recipientIds', [])
        user = self.context['request'].user
        validated_data['requester'] = user
        validated_data['status'] = 'submitted_to_coordinator'
        
        support_request = SupportRequest.objects.create(**validated_data)
        
        if recipient_ids:
            from apps.accounts.models import User
            recips = User.objects.filter(id__in=recipient_ids)
            support_request.recipients.set(recips)
            
            # Notify recipients
            from services.notification_service import NotificationService
            for recipient in recips:
                if recipient.id != user.id:
                    NotificationService.create_notification(
                        user=recipient,
                        type_name='support',
                        title='New Support Request Shared',
                        message=f"Support request '{support_request.title}' has been shared with you by {user.name}.",
                        icon='package'
                    )
        return support_request

    def update(self, instance, validated_data):
        recipient_ids = validated_data.pop('recipientIds', None)
        
        # If urgency is changed, set manual_priority_override to True
        if 'urgency' in validated_data and validated_data['urgency'] != instance.urgency:
            validated_data['manual_priority_override'] = True
        
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        
        if recipient_ids is not None:
            from apps.accounts.models import User
            recips = User.objects.filter(id__in=recipient_ids)
            instance.recipients.set(recips)
            
        return instance
