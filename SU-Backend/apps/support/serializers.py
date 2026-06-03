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

    class Meta:
        model = SupportRequest
        fields = [
            'id', 'title', 'category', 'description', 'urgency', 'status',
            'requester', 'assigned_to', 'deadline', 'region', 'comments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'requester', 'assigned_to', 'deadline', 'region', 'created_at', 'updated_at']

    def validate_title(self, value):
        if len(value) < 5 or len(value) > 255:
            raise serializers.ValidationError("Title must be between 5 and 255 characters.")
        return value

    def validate_description(self, value):
        if len(value) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long.")
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['requester'] = user
        validated_data['status'] = 'submitted'
        return SupportRequest.objects.create(**validated_data)
