import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.reports.models import Report

User = get_user_model()

@pytest.mark.django_db
class TestReportDeletion:
    def setup_method(self):
        self.client = APIClient()
        
        # Create user profiles
        self.admin = User.objects.create_user(
            email="admin@su.org",
            password="Password123!",
            name="Admin User",
            role="administrator",
            region="Kigali City"
        )
        
        self.fo1 = User.objects.create_user(
            email="fo1@su.org",
            password="Password123!",
            name="Field Officer One",
            role="field_officer",
            region="Eastern Province"
        )
        
        self.fo2 = User.objects.create_user(
            email="fo2@su.org",
            password="Password123!",
            name="Field Officer Two",
            role="field_officer",
            region="Eastern Province"
        )
        
        # Create reports
        self.fo1_report = Report.objects.create(
            title="FO1 Draft Report",
            type="Outreach",
            region="Eastern Province",
            department="Youth",
            date="2026-06-15",
            status="draft",
            submitted_by=self.fo1,
            participants=10
        )
        
        self.fo2_report = Report.objects.create(
            title="FO2 Approved Report",
            type="Training",
            region="Eastern Province",
            department="Youth",
            date="2026-06-16",
            status="approved",
            submitted_by=self.fo2,
            participants=20
        )

    def test_owner_can_delete_own_report(self):
        self.client.force_authenticate(user=self.fo1)
        url = reverse('report_detail', kwargs={'pk': self.fo1_report.id})
        
        # Delete should succeed
        res = self.client.delete(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        
        # Verify it is soft-deleted (is_deleted is True)
        self.fo1_report.refresh_from_db()
        assert self.fo1_report.is_deleted is True

    def test_non_owner_cannot_delete_report(self):
        # FO2 trying to delete FO1's report
        self.client.force_authenticate(user=self.fo2)
        url = reverse('report_detail', kwargs={'pk': self.fo1_report.id})
        
        res = self.client.delete(url)
        assert res.status_code == 403
        
        self.fo1_report.refresh_from_db()
        assert self.fo1_report.is_deleted is False

    def test_admin_can_delete_any_report(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('report_detail', kwargs={'pk': self.fo1_report.id})
        
        res = self.client.delete(url)
        assert res.status_code == 200
        assert res.data["success"] is True
        
        self.fo1_report.refresh_from_db()
        assert self.fo1_report.is_deleted is True

    def test_deleted_report_hidden_from_non_admins(self):
        # Soft delete report 1
        self.fo1_report.is_deleted = True
        self.fo1_report.save()
        
        # Authenticate as owner (non-admin)
        self.client.force_authenticate(user=self.fo1)
        url_list = reverse('report_list_create')
        url_detail = reverse('report_detail', kwargs={'pk': self.fo1_report.id})
        
        # List view should not return it
        res_list = self.client.get(url_list)
        assert res_list.status_code == 200
        report_ids = [r['id'] for r in res_list.data['data']]
        assert self.fo1_report.id not in report_ids
        
        # Detail view should return 404
        res_detail = self.client.get(url_detail)
        assert res_detail.status_code == 404

    def test_deleted_report_visible_to_admins(self):
        # Soft delete report 1
        self.fo1_report.is_deleted = True
        self.fo1_report.save()
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin)
        url_list = reverse('report_list_create')
        url_detail = reverse('report_detail', kwargs={'pk': self.fo1_report.id})
        
        # List view should return it
        res_list = self.client.get(url_list)
        assert res_list.status_code == 200
        report_ids = [r['id'] for r in res_list.data['data']]
        assert self.fo1_report.id in report_ids
        
        # Detail view should return 200
        res_detail = self.client.get(url_detail)
        assert res_detail.status_code == 200
        assert res_detail.data['id'] == self.fo1_report.id
