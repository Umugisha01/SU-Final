from rest_framework import serializers
from apps.prayer.models import PrayerRequest, PrayerCommitment
from apps.accounts.serializers import UserSerializer

class PrayerCommitmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PrayerCommitment
        fields = ['id', 'request', 'user', 'notes', 'created_at']
        read_only_fields = ['id', 'request', 'user', 'created_at']


class PrayerRequestSerializer(serializers.ModelSerializer):
    requester = serializers.SerializerMethodField()
    hasCommitted = serializers.SerializerMethodField()

    class Meta:
        model = PrayerRequest
        fields = [
            'id', 'title', 'request', 'status', 'visibility',
            'requester', 'region', 'commitments_count', 'hasCommitted',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'commitments_count', 'hasCommitted', 'region', 'created_at', 'updated_at']

    def validate_title(self, value):
        if len(value) < 5 or len(value) > 255:
            raise serializers.ValidationError("Title must be between 5 and 255 characters.")
        return value

    def validate_request(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("Prayer request text must be at least 10 characters long.")
        return value

    def get_requester(self, obj):
        request_user = self.context['request'].user
        
        # Mask details for anonymous prayers unless request_user is admin/manager or owner
        if obj.visibility == 'anonymous':
            if request_user.is_authenticated and (request_user.role in ['admin', 'manager'] or obj.requester_id == request_user.id):
                return UserSerializer(obj.requester).data
            return {
                "name": "Anonymous Member",
                "avatar": "AN",
                "region": obj.region,
                "email": ""
            }
        return UserSerializer(obj.requester).data

    def get_hasCommitted(self, obj):
        request_user = self.context['request'].user
        if request_user and request_user.is_authenticated:
            return obj.commitments.filter(user=request_user).exists()
        return False

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['requester'] = user
        validated_data['status'] = 'active'
        return PrayerRequest.objects.create(**validated_data)
