import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestAdminUserUpdate:
    def setup_method(self):
        self.client = APIClient()
        # Admin user
        self.admin = User.objects.create_user(
            email="admin@su.org",
            password="Password123!",
            name="System Admin",
            role="administrator",
            region="Kigali City",
            department="Administration",
            position="Administrator",
            is_staff=True,
            is_superuser=True
        )
        # Field officer user to edit
        self.field_officer = User.objects.create_user(
            email="fo@su.org",
            password="Password123!",
            name="Field Officer",
            role="field_officer",
            region="Northern Province",
            department="Youth Ministry",
            position="Officer"
        )

    def test_admin_can_update_user(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('admin_user_update', kwargs={'id': self.field_officer.id})
        data = {
            "name": "Updated Field Officer Name",
            "email": "updated_fo@su.org",
            "role": "regional_coordinator",
            "region": "Eastern Province",
            "department": "Bible Study",
            "position": "Coordinator",
            "phone": "+250788888888",
            "status": "active"
        }
        res = self.client.put(url, data, format='json')
        assert res.status_code == 200
        assert res.data["success"] is True
        
        # Verify changes in DB
        self.field_officer.refresh_from_db()
        assert self.field_officer.name == "Updated Field Officer Name"
        assert self.field_officer.email == "updated_fo@su.org"
        assert self.field_officer.role == "regional_coordinator"
        assert self.field_officer.region == "Eastern Province"
        assert self.field_officer.department == "Bible Study"
        assert self.field_officer.position == "Coordinator"
        assert self.field_officer.phone == "+250788888888"

    def test_non_admin_cannot_update_user(self):
        # Authenticate as field officer itself
        self.client.force_authenticate(user=self.field_officer)
        url = reverse('admin_user_update', kwargs={'id': self.field_officer.id})
        data = {
            "name": "Malicious Update",
            "role": "administrator"
        }
        res = self.client.put(url, data, format='json')
        # Non-admin should be rejected (403 Forbidden)
        assert res.status_code == 403
