"""
SU Connect Live API Verification Script
Tests root redirection to Django Admin, Swagger UI, JWT authentication, and all core endpoints.
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def log_result(test_name, success, details=""):
    mark = "PASSED" if success else "FAILED"
    print(f"[{mark}] {test_name}" + (f" -> {details}" if details else ""))
    return success

def run_tests():
    print("=" * 60)
    print("SU CONNECT BACKEND - ENDPOINT & AUTHENTICATION TEST SUITE")
    print("=" * 60)

    session = requests.Session()
    results = []

    # 1. Test Root Redirect to /admin/
    try:
        r = session.get(f"{BASE_URL}/", allow_redirects=False, timeout=5)
        is_redirect = r.status_code in (301, 302) and "/admin/" in r.headers.get("Location", "")
        results.append(log_result(
            "Root URL Direct Redirect (http://127.0.0.1:8000/ -> /admin/)",
            is_redirect,
            f"Status {r.status_code}, Location: {r.headers.get('Location')}"
        ))
    except Exception as e:
        results.append(log_result("Root URL Redirect", False, str(e)))

    # 2. Test Django Admin Page
    try:
        r = session.get(f"{BASE_URL}/admin/login/", timeout=5)
        results.append(log_result(
            "Django Admin Dashboard Login Page",
            r.status_code == 200 and "Django administration" in r.text,
            f"Status {r.status_code}"
        ))
    except Exception as e:
        results.append(log_result("Django Admin Page", False, str(e)))

    # 3. Test Swagger Documentation UI & OpenAPI Schema
    try:
        r_docs = session.get(f"{BASE_URL}/api/docs/", timeout=5)
        r_schema = session.get(f"{BASE_URL}/api/schema/", timeout=5)
        docs_ok = r_docs.status_code == 200 and r_schema.status_code == 200
        results.append(log_result(
            "Swagger Interactive UI (/api/docs/) & OpenAPI Schema (/api/schema/)",
            docs_ok,
            f"Docs Status: {r_docs.status_code}, Schema Status: {r_schema.status_code}"
        ))
    except Exception as e:
        results.append(log_result("Swagger UI", False, str(e)))

    # 4. Test API Health / Status JSON
    try:
        r = session.get(f"{BASE_URL}/api/status/", timeout=5)
        results.append(log_result(
            "API Health & Inventory Endpoint (/api/status/)",
            r.status_code == 200 and r.json().get("status") == "online",
            f"Status {r.status_code}, Service: {r.json().get('service')}"
        ))
    except Exception as e:
        results.append(log_result("API Status Endpoint", False, str(e)))

    # 5. Test Unauthenticated Access Rejection (Security Check)
    try:
        r = session.get(f"{BASE_URL}/api/users/me", timeout=5)
        results.append(log_result(
            "Security Rejection for Unauthenticated Request (401 Expected)",
            r.status_code == 401,
            f"Status {r.status_code} (Properly Protected)"
        ))
    except Exception as e:
        results.append(log_result("Security Rejection Check", False, str(e)))

    # 6. Test Authentication (Login & JWT Generation)
    access_token = None
    refresh_token = None
    try:
        login_payload = {
            "email": "admin@su.rw",
            "password": "Admin@123"
        }
        r = session.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=5)
        if r.status_code == 200:
            data = r.json()
            access_token = data.get("accessToken")
            # Can be in json or cookie
            refresh_token = session.cookies.get("su_refresh_token") or data.get("refreshToken")
            results.append(log_result(
                "Authentication Login (/api/auth/login)",
                True,
                f"Status 200, JWT Token received (length: {len(access_token) if access_token else 0})"
            ))
        else:
            results.append(log_result("Authentication Login (/api/auth/login)", False, f"Status {r.status_code}: {r.text}"))
    except Exception as e:
        results.append(log_result("Authentication Login", False, str(e)))

    if not access_token:
        print("\n[!] Cannot proceed with authenticated endpoint tests without valid JWT access token.")
        return

    auth_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # 7. Authenticated Endpoints Tests
    endpoints_to_test = [
        ("Current User Profile (/api/users/me)", "GET", f"{BASE_URL}/api/users/me", None),
        ("User Directory (/api/users/directory)", "GET", f"{BASE_URL}/api/users/directory", None),
        ("Reports List (/api/reports/)", "GET", f"{BASE_URL}/api/reports/", None),
        ("Reports Analytics Summary (/api/reports/analytics/summary)", "GET", f"{BASE_URL}/api/reports/analytics/summary", None),
        ("Support Requests (/api/support/)", "GET", f"{BASE_URL}/api/support/", None),
        ("Prayer Requests (/api/prayer/)", "GET", f"{BASE_URL}/api/prayer/", None),
        ("Documents Repository (/api/documents/)", "GET", f"{BASE_URL}/api/documents/", None),
        ("Notifications (/api/notifications/)", "GET", f"{BASE_URL}/api/notifications/", None),
        ("Audit Logs (/api/audit/)", "GET", f"{BASE_URL}/api/audit/", None),
        ("Admin Dashboard (/api/dashboard/admin/)", "GET", f"{BASE_URL}/api/dashboard/admin/", None),
        ("System Infrastructure Health (/api/dashboard/system-health/)", "GET", f"{BASE_URL}/api/dashboard/system-health/", None),
    ]

    for name, method, url, payload in endpoints_to_test:
        try:
            if method == "GET":
                r = session.get(url, headers=auth_headers, timeout=5)
            else:
                r = session.post(url, json=payload, headers=auth_headers, timeout=5)
            
            ok = r.status_code in (200, 201)
            details = f"Status {r.status_code}"
            if ok and isinstance(r.json(), dict):
                first_keys = list(r.json().keys())[:3]
                details += f", response keys: {first_keys}"
            elif ok and isinstance(r.json(), list):
                details += f", items count: {len(r.json())}"
            results.append(log_result(name, ok, details))
        except Exception as e:
            results.append(log_result(name, False, str(e)))

    # 8. Test Token Refresh (/api/auth/refresh)
    try:
        r = session.post(f"{BASE_URL}/api/auth/refresh", json={"refresh": refresh_token} if refresh_token else {}, timeout=5)
        # Note: if refresh token cookie is set, it might read cookie or body
        ok = r.status_code == 200
        results.append(log_result(
            "JWT Token Refresh (/api/auth/refresh)",
            ok,
            f"Status {r.status_code}"
        ))
    except Exception as e:
        results.append(log_result("JWT Token Refresh", False, str(e)))

    print("=" * 60)
    passed_count = sum(1 for r in results if r)
    total_count = len(results)
    percentage = (passed_count / total_count) * 100
    print(f"SUMMARY: {passed_count}/{total_count} Tests Passed ({percentage:.1f}%)")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
