import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from unittest.mock import patch

User = get_user_model()

@pytest.mark.django_db
class TestAuthEndpoints:
    def setup_method(self):
        self.client = APIClient()

    def test_register_endpoint(self):
        url = reverse('auth_register')
        data = {
            "fullName": "Jean Doe",
            "email": "jean.doe@su.org",
            "password": "Password123!",
            "role": "regional_coordinator",
            "region": "Eastern Province",
            "department": "Youth",
            "position": "Officer",
            "phone": "+250788123456",
            "location": "Kigali"
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 201
        assert res.data["success"] is True
        assert "message" in res.data
        
        # Verify user created is pending and unverified
        user = User.objects.get(email="jean.doe@su.org")
        assert user.status == 'pending'
        assert user.email_verified is False

    def test_login_endpoint(self):
        User.objects.create_user(
            email="login@su.org",
            password="Password123!",
            name="Login User",
            role="regional_coordinator",
            region="Kigali City",
            department="Youth",
            position="Officer"
        )
        
        url = reverse('auth_login')
        data = {
            "email": "login@su.org",
            "password": "Password123!"
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 200
        assert "accessToken" in res.data
        assert self.client.cookies.get('su_refresh_token') is not None

    def test_mfa_send_email_endpoint(self):
        user = User.objects.create_user(
            email="mfa_email@su.org",
            password="Password123!",
            name="MFA Email User",
            role="regional_coordinator",
            region="Kigali City",
            department="Youth",
            position="Officer",
            mfa_secret="JHGVSNWXH5IWHDGWLYSWX76II4M4ZE6"
        )
        self.client.force_authenticate(user=user)
        url = reverse('auth_mfa_send_email')
        
        res = self.client.post(url, format='json')
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "Verification code sent" in res.data["message"]


@pytest.mark.django_db
class TestAIEndpoints:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="ai_test@su.org",
            password="Password123!",
            name="AI Test User",
            role="field_officer",
            region="Kigali City"
        )
        self.client.force_authenticate(user=self.user)

    @patch("services.ai_service.AIService.chat_assistant")
    def test_ai_chat_endpoint(self, mock_chat):
        mock_chat.return_value = ("Hello from mocked AI assistant!", [])
        
        url = reverse('report_ai_chat')
        data = {
            "message": "Hello AI",
            "documentIds": []
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 200
        assert res.data["success"] is True
        assert res.data["reply"] == "Hello from mocked AI assistant!"
        assert res.data["citations"] == []
        mock_chat.assert_called_once_with(self.user, "Hello AI", [], [])


@pytest.mark.django_db
class TestAdministrationLevelsEndpoints:
    def setup_method(self):
        self.client = APIClient()
        self.field_officer = User.objects.create_user(
            email="fo_test@su.org",
            password="Password123!",
            name="Field Officer Test",
            role="field_officer",
            region="Kigali City",
            department="Youth Ministry",
            position="Officer"
        )
        self.manager = User.objects.create_user(
            email="manager_test@su.org",
            password="Password123!",
            name="Manager Test",
            role="national_manager",
            region="Kigali City",
            department="Youth Ministry",
            position="Manager"
        )
        self.coordinator = User.objects.create_user(
            email="coordinator_test@su.org",
            password="Password123!",
            name="Coordinator Test",
            role="regional_coordinator",
            region="Kigali City",
            department="Youth Ministry",
            position="Coordinator"
        )

    def test_field_officer_cannot_add_manager_as_recipient_report(self):
        self.client.force_authenticate(user=self.field_officer)
        url = reverse('report_list_create')
        data = {
            "title": "Kigali Outreach Report",
            "type": "Outreach",
            "region": "Kigali City",
            "department": "Youth Ministry",
            "date": "2025-06-01",
            "description": "Activity outreach report description that is long enough.",
            "recipientIds": [str(self.manager.id)]
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 400

    def test_field_officer_cannot_add_manager_as_recipient_support(self):
        self.client.force_authenticate(user=self.field_officer)
        url = reverse('support_list_create')
        data = {
            "title": "Equipment Request",
            "type": "Material",
            "description": "Need basic training materials and workbooks for Eastern province.",
            "priority": "medium",
            "recipientIds": [str(self.manager.id)]
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 400

    def test_user_directory_excludes_managers_for_field_officer(self):
        self.client.force_authenticate(user=self.field_officer)
        url = reverse('user_directory')
        res = self.client.get(url, format='json')
        assert res.status_code == 200
        roles = [u['role'] for u in res.data['data']]
        assert 'national_manager' not in roles
        assert 'administrator' not in roles

    def test_share_reports(self):
        from apps.reports.models import Report
        self.client.force_authenticate(user=self.coordinator)
        report = Report.objects.create(
            title="Kigali Outreach Report 2",
            type="Outreach",
            region="Kigali City",
            department="Youth Ministry",
            date="2025-06-01",
            description="Activity outreach report description that is long enough.",
            submitted_by=self.field_officer,
            status="submitted_to_coordinator"
        )
        url = reverse('report_share')
        data = {
            "reportIds": [report.id]
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 200
        assert res.data["success"] is True

    def test_share_support(self):
        from apps.support.models import SupportRequest
        self.client.force_authenticate(user=self.coordinator)
        req = SupportRequest.objects.create(
            title="Equipment Request 2",
            category="Equipment",
            description="Need basic training materials and workbooks for Eastern province.",
            urgency="medium",
            requester=self.field_officer,
            status="submitted_to_coordinator"
        )
        url = reverse('support_share')
        data = {
            "requestIds": [req.id]
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 200
        assert res.data["success"] is True
