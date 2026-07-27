import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch, mock_open
import os
from django.conf import settings
from apps.reports.models import Report
from apps.support.models import SupportRequest
from apps.documents.models import Document
from services.report_service import ReportService
from services.support_service import SupportService
from services.document_service import DocumentService
from services.ai_service import AIService

User = get_user_model()

@pytest.mark.django_db
class TestReportService:
    def setup_method(self):
        self.staff_user = User.objects.create_user(
            email="staff@su.org",
            password="Password123!",
            name="Staff User",
            role="field_officer",
            region="Kigali City"
        )
        self.manager_user = User.objects.create_user(
            email="manager@su.org",
            password="Password123!",
            name="Manager User",
            role="national_manager",
            region="Kigali City"
        )
        self.report = Report.objects.create(
            title="Youth outreach event",
            type="Youth Program",
            region="Kigali City",
            department="Youth",
            date="2026-05-19",
            submitted_by=self.staff_user,
            description="We reached out to 50 young individuals with Bible teachings."
        )

    def test_report_submission(self):
        assert self.report.status == 'draft'
        ReportService.submit_report(self.report, self.staff_user)
        self.report.refresh_from_db()
        assert self.report.status == 'submitted_to_coordinator'

    def test_segregation_of_duties_approval(self):
        # Manager cannot approve report if they created it
        self.report.submitted_by = self.manager_user
        self.report.status = 'submitted_to_manager'
        self.report.save()
        
        with pytest.raises(PermissionDenied):
            ReportService.approve_report(self.report, self.manager_user)

    def test_successful_approval(self):
        self.report.status = 'submitted_to_manager'
        self.report.save()
        
        ReportService.approve_report(self.report, self.manager_user, "Good report!")
        self.report.refresh_from_db()
        assert self.report.status == 'approved'


@pytest.mark.django_db
class TestSupportService:
    def test_deadline_calculation(self):
        staff = User.objects.create_user(
            email="staff2@su.org",
            password="Password123!",
            name="Staff 2",
            role="field_officer",
            region="Kigali City"
        )
        
        # Urgency Low -> 14 days
        req_low = SupportRequest.objects.create(
            title="Low urgency request",
            category="Technical",
            description="Need some support fixing the internet connection.",
            urgency="low",
            requester=staff
        )
        assert (req_low.deadline - req_low.created_at.date()).days == 14

        # Urgency Critical -> 1 day
        req_crit = SupportRequest.objects.create(
            title="Critical urgency request",
            category="Financial",
            description="Need funds immediately for regional conference deposit.",
            urgency="critical",
            requester=staff
        )
        assert (req_crit.deadline - req_crit.created_at.date()).days == 1


@pytest.mark.django_db
class TestAIService:
    def test_pii_scrubbing(self):
        raw_text = "My name is Jean Bosco, and you can reach me at jean@gmail.com or +250 788 123 456."
        scrubbed = AIService.scrub_pii(raw_text)
        assert "[EMAIL]" in scrubbed
        assert "[PHONE]" in scrubbed
        assert "Jean Bosco" not in scrubbed

    def test_classification_heuristics(self):
        title = "Weekly Bible Study meeting"
        desc = "We studied Genesis and shared scripture verses."
        res = AIService.run_heuristics(title, desc)
        assert res['category'] == 'Bible Study'
        assert res['confidence'] == 60

    def test_extract_text_from_document_text_file(self):
        user = User.objects.create_user(
            email="uploader@su.org",
            password="Password123!",
            name="Uploader User"
        )
        doc = Document.objects.create(
            name="test_doc.txt",
            type="TXT",
            size=100,
            storage_key="documents/test_doc.txt",
            uploaded_by=user
        )
        
        with patch("os.path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data="This is a test document content.")):
            text = AIService.extract_text_from_document(doc)
            assert text == "This is a test document content."

    def test_extract_text_from_document_file_not_found(self):
        user = User.objects.create_user(
            email="uploader_nf@su.org",
            password="Password123!",
            name="Uploader NF"
        )
        doc = Document.objects.create(
            name="missing.txt",
            type="TXT",
            size=100,
            storage_key="documents/missing.txt",
            uploaded_by=user
        )
        with patch("os.path.exists", return_value=False):
            text = AIService.extract_text_from_document(doc)
            assert "File not found on disk" in text

    @patch("requests.post")
    def test_chat_assistant(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "message": {
                "content": "This is a mocked response from local qwen2.5vl:3b"
            }
        }

        user = User.objects.create_user(
            email="chat_user@su.org",
            password="Password123!",
            name="Chat User",
            role="field_officer",
            region="Kigali City"
        )

        doc = Document.objects.create(
            name="attached_doc.txt",
            type="TXT",
            size=100,
            storage_key="documents/attached_doc.txt",
            uploaded_by=user
        )

        with patch("os.path.exists", return_value=True), \
             patch("builtins.open", mock_open(read_data="Extracted text from doc")):
            reply, citations = AIService.chat_assistant(
                user=user,
                user_message="Summarize this doc.",
                document_ids=[doc.id]
            )

        assert reply == "This is a mocked response from local qwen2.5vl:3b"
        assert citations == []
        assert mock_post.called
        
        # Verify the payload structure
        args, kwargs = mock_post.call_args
        payload = kwargs.get("json", {})
        assert payload.get("model") == getattr(settings, "OLLAMA_TEXT_MODEL", "mistral:7b-instruct-q4_K_M")
        messages = payload.get("messages", [])
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert "attached_doc.txt" in messages[1]["content"]
        assert "Extracted text from doc" in messages[1]["content"]

    def test_text_normalization(self):
        from services.ai_service import normalize_text
        assert normalize_text("What is this? Test!!") == "what is this test"
        assert normalize_text("  multiple   spaces  ") == "multiple spaces"

    @patch("builtins.open", new_callable=mock_open, read_data="### Q1. What is system name?\nSystem name is SU Connect.\n### 2. Who is it for?\nSU Rwanda.\n---\n")
    @patch("os.path.exists", return_value=True)
    def test_load_reference_qa(self, mock_exists, mock_file):
        from services.ai_service import load_reference_qa
        qa = load_reference_qa()
        assert "What is system name?" in qa
        assert qa["What is system name?"] == "System name is SU Connect."
        assert "Who is it for?" in qa
        assert qa["Who is it for?"] == "SU Rwanda."

    @patch("services.ai_service.get_reference_qa")
    def test_find_matching_qa(self, mock_get_qa):
        from services.ai_service import find_matching_qa
        mock_get_qa.return_value = {
            "What is the statement of the problem?": "Before development, operations suffered...",
            "Who is this actor?": "The actor represents a user."
        }
        
        # Test exact match
        res = find_matching_qa("What is the statement of the problem?")
        assert res == "Before development, operations suffered..."
        
        # Test case/punctuation variance
        res = find_matching_qa("what is the statement of the problem")
        assert res == "Before development, operations suffered..."
        
        # Test substring / extra words
        res = find_matching_qa("Can you explain what is the statement of the problem in detail?")
        assert res == "Before development, operations suffered..."
        
        # Test keyword overlap
        res = find_matching_qa("problem statement description")
        assert res == "Before development, operations suffered..."

    @patch("services.ai_service.find_matching_qa")
    def test_chat_assistant_qa_bypass(self, mock_find_match):
        from services.ai_service import AIService
        mock_find_match.return_value = "Detailed answer from reference sheet."
        
        user = User.objects.create_user(
            email="test_bypass@su.org",
            password="Password123!",
            name="Bypass User",
            role="field_officer",
            region="Kigali City"
        )
        
        reply, citations = AIService.chat_assistant(
            user=user,
            user_message="What is the statement of the problem?"
        )
        assert reply == "Detailed answer from reference sheet."
        assert citations == []
        mock_find_match.assert_called_with("What is the statement of the problem?")

    @patch("requests.post")
    def test_chat_assistant_mistral_image_advice(self, mock_post):
        from services.ai_service import AIService
        from apps.documents.models import Document
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.create_user(
            email="test_advice@su.org",
            password="Password123!",
            name="Advice User",
            role="field_officer",
            region="Kigali City"
        )
        
        doc = Document.objects.create(
            name="test_image.png",
            type="PNG",
            size=100,
            storage_key="documents/test_image.png",
            uploaded_by=user
        )
        
        with patch("os.path.exists", return_value=True), \
             patch("PIL.Image.open") as mock_img:
            # Setup image mock to bypass actual file load and yield b64_data
            mock_img.return_value.__enter__.return_value.size = (10, 10)
            mock_img.return_value.__enter__.return_value.width = 10
            mock_img.return_value.__enter__.return_value.height = 10
            mock_img.return_value.__enter__.return_value.mode = "RGB"
            
            reply, citations = AIService.chat_assistant(
                user=user,
                user_message="Explain this photo.",
                document_ids=[doc.id],
                model_override="mistral:7b-instruct-q4_K_M"
            )
            
        assert "Mistral (7B)" in reply
        assert "analyze an image" in reply
        assert "Please switch to **Qwen-2.5-VL (Fast 3B)**" in reply
        assert citations == []
