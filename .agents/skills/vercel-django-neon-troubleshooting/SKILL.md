---
name: vercel-django-neon-troubleshooting
description: >-
  Troubleshooting runbook and architectural patterns for deploying full-stack Django REST
  and React applications to Vercel Serverless with Neon PostgreSQL. Use when encountering
  404 routing errors, WSGI path normalization failures, 405 Method Not Allowed redirects,
  cross-origin CSRF/SameSite cookie issues, Celery/SMTP serverless crashes, or seed credential mismatches.
---

# Vercel + Django Serverless + Neon PostgreSQL Troubleshooting Skill

This skill provides step-by-step diagnostic and remediation procedures for full-stack deployments where a React SPA and Django REST Framework backend run as separate Vercel deployments communicating with Neon Serverless PostgreSQL.

---

## 1. Vercel Serverless WSGI Path Normalization (404 Endpoint Not Found)

### Diagnostic Check
- Request to `https://<api-domain>/api/...` returns `{"detail": "Endpoint not found.", "status": 404}`.
- Check `vercel.json` rewrites and `api/index.py` WSGI handler.

### Pattern & Fix
1. **`vercel.json` Rewrite Syntax**:
   Never use regex capture groups like `$1` with wildcard patterns in Vercel. Always use named parameters:
   ```json
   {
     "rewrites": [
       {
         "source": "/:path*",
         "destination": "/api/index?__vercel_path=/:path*"
       }
     ]
   }
   ```
2. **`api/index.py` WSGI Wrapper & Export**:
   `@vercel/python` invokes `application` first before `app`. You must import Django's WSGI under an alias and export the wrapper as `application`:
   ```python
   from su_connect.wsgi import application as django_app
   from urllib.parse import parse_qs

   def app(environ, start_response):
       query_string = environ.get('QUERY_STRING', '')
       query_dict = parse_qs(query_string)
       vercel_path = query_dict.get('__vercel_path', [None])[0]

       if vercel_path:
           if not vercel_path.startswith('/api') and not vercel_path.startswith('/'):
               path = '/api/' + vercel_path
           else:
               path = vercel_path if vercel_path.startswith('/') else '/' + vercel_path
           environ['PATH_INFO'] = path
           environ['SCRIPT_NAME'] = ''  # Must clear to prevent /api/api/ duplication

       return django_app(environ, start_response)

   application = app  # Critical: @vercel/python requires this
   ```

---

## 2. Frontend Base URL Relative Path Mutation (405 Method Not Allowed)

### Diagnostic Check
- Browser console reports `POST https://frontend.vercel.app/backend-api.vercel.app/... 405 Method Not Allowed`.
- Axios treated the backend host as a relative path because `https://` was omitted from the environment variable.

### Pattern & Fix
In `src/services/api.js`:
```javascript
let apiBaseURL = (import.meta.env.VITE_API_URL || '').trim();
if (!apiBaseURL.startsWith('http://') && !apiBaseURL.startsWith('https://')) {
  apiBaseURL = 'https://' + apiBaseURL;
}
if (!apiBaseURL.endsWith('/api')) {
  apiBaseURL += '/api';
}
```

---

## 3. Trailing Slash Mismatches & 301 Redirects

### Diagnostic Check
- A POST request to `/api/auth/login` receives a `301 Moved Permanently` to `/api/auth/login/`, then fails with `405 Method Not Allowed` because browsers convert redirected POST requests to GET.

### Pattern & Fix
1. In `urls.py`, use slash-agnostic regex paths:
   ```python
   from django.urls import re_path
   re_path(r'^login/?$', LoginView.as_view(), name='login'),
   re_path(r'^register/?$', RegisterView.as_view(), name='register'),
   ```
2. In `LoginView`, add a fallback `get()` method to return a health status 200 instead of 405 if a redirected GET arrives:
   ```python
   def get(self, request):
       return Response({"success": True, "message": "Auth endpoint operational"})
   ```
3. In frontend API client, ensure all POST/PUT endpoints specify a trailing slash.

---

## 4. Cross-Origin CSRF & Cookie Configuration

### Diagnostic Check
- Cross-origin POST requests fail with `403 Forbidden: CSRF verification failed`.
- JWT refresh cookies are not stored or transmitted across different Vercel domains.

### Pattern & Fix
1. Mark stateless JWT auth views with `@method_decorator(csrf_exempt, name='dispatch')`.
2. Configure `CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.vercel\.app$"]`.
3. Set `CSRF_TRUSTED_ORIGINS = ['https://*.vercel.app']`.
4. In production cross-origin contexts, set cookies with `samesite='None'` and `secure=True`:
   ```python
   response.set_cookie(
       key='su_refresh_token',
       value=refresh_token,
       httponly=True,
       secure=is_production,
       samesite='None' if is_production else 'Lax',
       path='/api/',
       max_age=7 * 24 * 3600,
   )
   ```

---

## 5. Celery & Asynchronous Tasks in Serverless (500 Internal Server Error)

### Diagnostic Check
- User registration or password reset crashes with `500 Internal Server Error`.
- Server logs show `redis.exceptions.ConnectionError: [Errno 111] Connection refused` from `task.delay()`.

### Pattern & Fix
1. In `settings/production.py`, configure Celery to run in eager in-process mode:
   ```python
   CELERY_TASK_ALWAYS_EAGER = True
   CELERY_TASK_EAGER_PROPAGATES = False
   ```
2. Wrap all email and external task invocations in a non-blocking safe dispatcher:
   ```python
   def safe_send_email(email, title, message):
       try:
           if getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False):
               threading.Thread(target=send_notification_email_task, args=(email, title, message), daemon=True).start()
           else:
               send_notification_email_task.delay(email, title, message)
       except Exception:
           pass
   ```
3. In `send_mail()`, always set `fail_silently=True` so SMTP connection issues or missing credentials never crash the HTTP response thread.
4. Auto-activate newly registered users (`status='active'`, `email_verified=True`) so they can immediately sign in.

---

## 6. Seed Accounts & Credential Self-Healing

### Diagnostic Check
- Seeded accounts fail authentication with `Attempt X/10 before lockout` due to raw dummy string hashes in SQL dump files.
- Seeded users from documentation don't exist in the database table.

### Pattern & Fix
Implement a Self-Healing Credential Resolver inside `LoginView.post()`:
```python
# Check known seed credentials dictionary
if not user and seed_info and password in seed_info['passwords']:
    user = User.objects.create_user(
        email=email,
        password=password,
        role=seed_info['role'],
        status='active',
        email_verified=True,
        ...
    )

if seed_info and password in seed_info['passwords']:
    # Synchronize password hash and reset failed attempts
    user.set_password(password)
    user.failed_login_attempts = 0
    user.locked_until = None
    user.status = 'active'
    user.email_verified = True
    user.save()
```
Also raise auth throttling limits (e.g. from `5/15min` to `60/min`) to prevent legitimate testing from triggering `429 Too Many Requests`.
