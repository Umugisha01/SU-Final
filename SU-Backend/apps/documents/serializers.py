from rest_framework import serializers
from apps.documents.models import Document
from apps.accounts.serializers import UserSerializer
from services.document_service import DocumentService

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'name', 'type', 'size', 'uploaded_by', 'downloads', 'shared', 'url', 'created_at']
        read_only_fields = ['id', 'type', 'size', 'uploaded_by', 'downloads', 'url', 'created_at']

    def get_url(self, obj):
        return DocumentService.generate_presigned_url(obj)
