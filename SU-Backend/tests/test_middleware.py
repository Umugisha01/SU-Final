import pytest
from django.contrib.auth import get_user_model
from django.test import RequestFactory
from django.core.cache import cache
from apps.reports.models import Report
from apps.audit.models import AuditLog
from core.middleware import set_current_user, clear_current_user, RegionalIsolationMiddleware
from core.idempotency import IdempotencyMiddleware

User = get_user_model()

@pytest.mark.django_db
class TestRegionalIsolation:
    def setup_method(self):
        # Clean current user thread-local
        clear_current_user()
        
        # Create users
        self.kigali_staff = User.objects.create_user(
            email="kigali@su.org",
            password="Password123!",
            name="Kigali Staff",
            role="staff",
            region="Kigali City",
            department="Youth",
            position="Officer"
        )
        self.west_staff = User.objects.create_user(
            email="west@su.org",
            password="Password123!",
            name="West Staff",
            role="staff",
            region="Western Province",
            department="Youth",
            position="Officer"
        )
        self.admin_user = User.objects.create_user(
            email="admin@su.org",
            password="Password123!",
            name="Admin User",
            role="admin",
            region="Kigali City",
            department="Admin",
            position="Director"
        )

        # Create reports
        self.rep1 = Report.objects.create(
            title="Kigali Report",
            type="Youth Program",
            region="Kigali City",
            department="Youth",
            date="2026-05-19",
            submitted_by=self.kigali_staff,
            description="Kigali region youth event report description."
        )
        self.rep2 = Report.objects.create(
            title="West Report",
            type="Bible Study",
            region="Western Province",
            department="Youth",
            date="2026-05-19",
            submitted_by=self.west_staff,
            description="Western province Bible study report description."
        )

    def teardown_method(self):
        clear_current_user()

    def test_kigali_isolation(self):
        set_current_user(self.kigali_staff)
        reports = list(Report.objects.all())
        assert len(reports) == 1
        assert reports[0].title == "Kigali Report"

    def test_western_isolation(self):
        set_current_user(self.west_staff)
        reports = list(Report.objects.all())
        assert len(reports) == 1
        assert reports[0].title == "West Report"

    def test_admin_isolation_bypass(self):
        set_current_user(self.admin_user)
        reports = list(Report.objects.all())
        assert len(reports) == 2


@pytest.mark.django_db
class TestIdempotencyMiddleware:
    def test_duplicate_post_rejection(self, monkeypatch):
        factory = RequestFactory()
        request1 = factory.post('/api/reports', data={"title": "Test"}, content_type='application/json')
        request1.META['HTTP_IDEMPOTENCY_KEY'] = 'test-key-123'
        
        request2 = factory.post('/api/reports', data={"title": "Test"}, content_type='application/json')
        request2.META['HTTP_IDEMPOTENCY_KEY'] = 'test-key-123'
        
        # Clear cache keys
        cache.delete('idempotent:test-key-123')
        
        # Instantiate middleware
        def get_response(req):
            from django.http import HttpResponse
            import json
            return HttpResponse(json.dumps({"success": True}), content_type="application/json", status=201)
            
        middleware = IdempotencyMiddleware(get_response)
        
        # First request should pass
        res1 = middleware(request1)
        # We simulate writing "processing" is locked
        
        # Second request should be rejected as Conflict (409) if still processing
        cache.set('idempotent:test-key-123', 'processing', timeout=60)
        res2 = middleware(request2)
        assert res2.status_code == 409
        
        cache.delete('idempotent:test-key-123')
