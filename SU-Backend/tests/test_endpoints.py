import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

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
            "role": "coordinator",
            "region": "Eastern Province",
            "department": "Youth",
            "position": "Officer",
            "phone": "+250788123456"
        }
        res = self.client.post(url, data, format='json')
        assert res.status_code == 201
        assert "token" in res.data
        assert self.client.cookies.get('su_refresh_token') is not None

    def test_login_endpoint(self):
        User.objects.create_user(
            email="login@su.org",
            password="Password123!",
            name="Login User",
            role="coordinator",
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
