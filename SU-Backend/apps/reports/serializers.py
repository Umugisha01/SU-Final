from rest_framework import serializers
from django.utils import timezone
from apps.reports.models import Report
from apps.accounts.serializers import UserSerializer
from apps.documents.models import Document

class ReportSerializer(serializers.ModelSerializer):
    """
    Serializer for creating, retrieving, and updating activity reports.
    """
    submitted_by = UserSerializer(read_only=True)
    recipients = UserSerializer(read_only=True, many=True)
    recipientIds = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False, default=list
    )
    attachmentIds = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=list
    )
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'title', 'type', 'region', 'department', 'date', 'duration', 'location',
            'status', 'submitted_by', 'participants', 'demographics', 'description', 'outcomes',
            'challenges', 'prayer_requests', 'ai_category', 'confidence', 'keywords', 'ai_summary',
            'overridden', 'attachmentIds', 'attachments', 'recipientIds', 'recipients', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'submitted_by', 'ai_category', 'confidence', 'keywords',
            'ai_summary', 'overridden', 'recipients', 'created_at', 'updated_at'
        ]

    def validate_title(self, value):
        if len(value) < 5 or len(value) > 255:
            raise serializers.ValidationError("Title must be between 5 and 255 characters.")
        return value

    def validate_description(self, value):
        if len(value) < 20:
            raise serializers.ValidationError("Description must be at least 20 characters long.")
        return value

    def validate(self, attrs):
        date = attrs.get('date')
        if date and date > timezone.now().date():
            # Determine current status context
            current_status = self.instance.status if self.instance else 'draft'
            if current_status != 'draft':
                raise serializers.ValidationError({"date": "Activity date cannot be in the future unless report is a draft."})
        return attrs

    def get_attachments(self, obj):
        # Late import to prevent circular reference
        from apps.documents.serializers import DocumentSerializer
        # We check the documents related manager defined on the document model
        if hasattr(obj, 'documents'):
            return DocumentSerializer(obj.documents.all(), many=True).data
        return []

    def create(self, validated_data):
        attachment_ids = validated_data.pop('attachmentIds', [])
        recipient_ids = validated_data.pop('recipientIds', [])
        user = self.context['request'].user
        
        # Enforce that new reports start as draft
        validated_data['submitted_by'] = user
        validated_data['status'] = 'draft'
        
        report = Report.objects.create(**validated_data)
        
        if attachment_ids:
            docs = Document.objects.filter(id__in=attachment_ids)
            report.documents.set(docs)
            
        if recipient_ids:
            from apps.accounts.models import User
            recips = User.objects.filter(id__in=recipient_ids)
            report.recipients.set(recips)
            
        return report

    def update(self, instance, validated_data):
        # Non-draft and non-returned reports cannot be updated via general PUT/PATCH
        if instance.status not in ['draft', 'returned']:
            raise serializers.ValidationError("Only reports in 'draft' or 'returned' status can be modified.")
            
        attachment_ids = validated_data.pop('attachmentIds', None)
        recipient_ids = validated_data.pop('recipientIds', None)
        
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        
        if attachment_ids is not None:
            docs = Document.objects.filter(id__in=attachment_ids)
            instance.documents.set(docs)
            
        if recipient_ids is not None:
            from apps.accounts.models import User
            recips = User.objects.filter(id__in=recipient_ids)
            instance.recipients.set(recips)
            
        return instance
