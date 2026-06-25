import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestDashboardEndpoints:
    def setup_method(self):
        self.client = APIClient()
        
        # Create user profiles for each role
        self.admin = User.objects.create_user(
            email="admin@su.org",
            password="Password123!",
            name="Admin User",
            role="administrator",
            region="Kigali City"
        )
        
        self.manager = User.objects.create_user(
            email="manager@su.org",
            password="Password123!",
            name="Manager User",
            role="national_manager",
            region="Kigali City"
        )
        
        self.coordinator = User.objects.create_user(
            email="coordinator@su.org",
            password="Password123!",
            name="Coordinator User",
            role="regional_coordinator",
            region="Eastern Province"
        )
        
        self.field_officer = User.objects.create_user(
            email="fo@su.org",
            password="Password123!",
            name="Field Officer User",
            role="field_officer",
            region="Eastern Province"
        )

    def test_unauthenticated_access_denied(self):
        # Any dashboard endpoint should reject unauthenticated users
        endpoints = [
            'dashboard-field-officer',
            'dashboard-coordinator',
            'dashboard-manager',
            'dashboard-admin',
            'dashboard-recent-activity',
            'dashboard-system-health',
            'dashboard-ai-insights'
        ]
        for name in endpoints:
            url = reverse(name)
            res = self.client.get(url)
            assert res.status_code == 401 or res.status_code == 403

    def test_field_officer_dashboard_access(self):
        self.client.force_authenticate(user=self.field_officer)
        url = reverse('dashboard-field-officer')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "metrics" in res.data
        assert "deadlines" in res.data
        assert "last_report_submitted" in res.data

    def test_field_officer_denied_admin_dashboard(self):
        self.client.force_authenticate(user=self.field_officer)
        
        url = reverse('dashboard-admin')
        res = self.client.get(url)
        assert res.status_code == 403
        
        url = reverse('dashboard-system-health')
        res = self.client.get(url)
        assert res.status_code == 403

    def test_coordinator_dashboard_access(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('dashboard-coordinator')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "metrics" in res.data
        assert "team_performance" in res.data
        assert "pending_reports" in res.data

    def test_manager_dashboard_access(self):
        self.client.force_authenticate(user=self.manager)
        url = reverse('dashboard-manager')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "metrics" in res.data
        assert "regional_performance" in res.data
        assert "ai_insights" in res.data

    def test_admin_dashboard_access(self):
        self.client.force_authenticate(user=self.admin)
        
        url = reverse('dashboard-admin')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "metrics" in res.data
        assert "pending_users" in res.data
        assert "system_activity" in res.data
        
        url = reverse('dashboard-system-health')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "apiStatus" in res.data
        assert "databaseStatus" in res.data

    def test_recent_activity_access(self):
        self.client.force_authenticate(user=self.field_officer)
        url = reverse('dashboard-recent-activity')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "activities" in res.data

    def test_ai_insights_access(self):
        self.client.force_authenticate(user=self.manager)
        url = reverse('dashboard-ai-insights')
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        assert "insights" in res.data

        # Coordinator should have access to AI insights
        self.client.force_authenticate(user=self.coordinator)
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["success"] is True

        # Field Officer should not have access to AI insights
        self.client.force_authenticate(user=self.field_officer)
        res = self.client.get(url)
        assert res.status_code == 403
