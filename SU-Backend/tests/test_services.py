import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.reports.models import Report
from apps.support.models import SupportRequest
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
            role="staff",
            region="Kigali City"
        )
        self.manager_user = User.objects.create_user(
            email="manager@su.org",
            password="Password123!",
            name="Manager User",
            role="manager",
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
        assert self.report.status == 'submitted'

    def test_segregation_of_duties_approval(self):
        # Manager cannot approve report if they created it
        self.report.submitted_by = self.manager_user
        self.report.status = 'submitted'
        self.report.save()
        
        with pytest.raises(PermissionDenied):
            ReportService.approve_report(self.report, self.manager_user)

    def test_successful_approval(self):
        self.report.status = 'submitted'
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
            role="staff",
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
