import uuid
try:
    import magic
except ImportError:
    magic = None

from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db.models import F

ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'zip', 'jpg', 'jpeg', 'png', 'txt', 'csv']
ALLOWED_MIME_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt',
    'text/csv': 'csv'
}

class DocumentService:
    """
    Validates, uploads, and handles download logic for documents.
    """
    @staticmethod
    def validate_file(uploaded_file):
        # 1. Max size: 10MB
        if uploaded_file.size > 10 * 1024 * 1024:
            raise ValidationError("File size exceeds 10MB limit")
        
        # 2. Extension check
        name = uploaded_file.name
        ext = name.split('.')[-1].lower() if '.' in name else ''
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(f"Extension .{ext} is not allowed")

        # 3. MIME check using magic numbers
        if magic is None:
            return

        # Read the start of the file
        chunk = uploaded_file.read(2048)
        uploaded_file.seek(0)  # Reset pointer
        
        try:
            mime = magic.from_buffer(chunk, mime=True)
            mime_ext = ALLOWED_MIME_TYPES.get(mime)
            
            # Both jpg and jpeg map to image/jpeg — both are valid
            image_exts = {'jpg', 'jpeg'}
            if ext in image_exts:
                if mime not in ('image/jpeg',):
                    raise ValidationError(f"MIME type '{mime}' does not match image extension '.{ext}'")
            elif not mime_ext or mime_ext != ext:
                raise ValidationError(f"MIME type '{mime}' does not match file extension '.{ext}'")
        except Exception as e:
            if isinstance(e, ValidationError):
                raise
            # If magic is not configured/installed correctly on local OS, fall back to extension-only validation
            pass

    @staticmethod
    def upload_to_storage(uploaded_file):
        ext = uploaded_file.name.split('.')[-1].lower() if '.' in uploaded_file.name else 'bin'
        unique_key = f"documents/{uuid.uuid4()}.{ext}"
        saved_path = default_storage.save(unique_key, uploaded_file)
        return saved_path

    @staticmethod
    def generate_presigned_url(document):
        try:
            url = default_storage.url(document.storage_key)
            if url.startswith('/'):
                return f"http://localhost:8000{url}"
            return url
        except Exception:
            return f"http://localhost:8000/media/{document.storage_key}"

    @staticmethod
    def increment_downloads(document_id):
        from apps.documents.models import Document
        Document.objects.filter(id=document_id).update(downloads=F('downloads') + 1)
