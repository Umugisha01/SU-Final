# 🚀 SU Connect — Complete Production Deployment Guide
## Deploying Frontend (Vercel) + Backend (Vercel Serverless) + Database (Neon PostgreSQL)

> **Document Version**: 1.0  
> **Target Environment**: Production (Live Cloud)  
> **Architecture**: React 19 SPA (Vercel) + Django REST API (Vercel Serverless WSGI) + Neon Serverless PostgreSQL (Built-in PgBouncer)  
> **Repository**: `SU-Final` (`Front-End` & `SU-Backend`)  

---

## 📑 Table of Contents
1. [Architecture & Flow Diagram](#1-architecture--flow-diagram)
2. [Prerequisites & Account Setup](#2-prerequisites--account-setup)
3. [Step 1: Set Up Database on Neon (Serverless PostgreSQL)](#step-1-set-up-database-on-neon-serverless-postgresql)
4. [Step 2: Prepare & Adapt Django Backend for Vercel](#step-2-prepare--adapt-django-backend-for-vercel)
5. [Step 3: Run Database Migrations & Initial Data Seeding](#step-3-run-database-migrations--initial-data-seeding)
6. [Step 4: Deploy Django Backend to Vercel](#step-4-deploy-django-backend-to-vercel)
7. [Step 5: Prepare & Adapt React Frontend for Vercel](#step-5-prepare--adapt-react-frontend-for-vercel)
8. [Step 6: Deploy React Frontend to Vercel](#step-6-deploy-react-frontend-to-vercel)
9. [Step 7: Finalize CORS & Environment Alignment](#step-7-finalize-cors--environment-alignment)
10. [Step 8: Critical Production Considerations (Celery, WebSockets & Media)](#step-8-critical-production-considerations-celery-websockets--media)
11. [Step 9: End-to-End Go-Live Verification Checklist](#step-9-end-to-end-go-live-verification-checklist)
12. [Step 10: Troubleshooting & Common Pitfalls](#step-10-troubleshooting--common-pitfalls)

---

## 1. Architecture & Flow Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    INTERNET USERS                                       |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
                      +---------------------------------------------+
                      |         FRONTEND: Vercel Global Edge        |
                      |  - Project: su-connect-frontend             |
                      |  - Framework: React 19 + Vite 8 SPA         |
                      |  - URL: https://su-connect.vercel.app       |
                      +----------------------+----------------------+
                                             |
                                             | HTTPS REST API Calls
                                             | (with JWT Auth Bearer Tokens)
                                             v
                      +---------------------------------------------+
                      |         BACKEND: Vercel Serverless          |
                      |  - Project: su-connect-api                  |
                      |  - Runtime: Python WSGI (@vercel/python)    |
                      |  - Entry Point: api/index.py                |
                      |  - URL: https://su-connect-api.vercel.app   |
                      +----------------------+----------------------+
                                             |
                                             | Port 5432 / Transaction Pooling
                                             | SSL Mode: require
                                             v
                      +---------------------------------------------+
                      |       DATABASE: Neon Serverless Postgres     |
                      |  - Engine: PostgreSQL 16+                   |
                      |  - Built-in PgBouncer (host contains -pooler)|
                      |  - Auto-scaling & Instant Branching         |
                      +---------------------------------------------+
```

---

## 2. Prerequisites & Account Setup

Before starting, ensure you have:

1. **GitHub Repository**:
   - Push your code to GitHub (`SU-Final` repository with `Front-End` and `SU-Backend` folders).
2. **Neon Account**:
   - Register at [neon.tech](https://neon.tech) (Free tier includes generous storage and serverless compute).
3. **Vercel Account**:
   - Register at [vercel.com](https://vercel.com) using your GitHub account for continuous deployments.
4. **Local Tools**:
   - Python 3.11 or 3.12 installed.
   - Node.js 20+ and npm installed.
   - Vercel CLI (optional but recommended): `npm i -g vercel`.

---

## Step 1: Set Up Database on Neon (Serverless PostgreSQL)

Neon provides fully managed, serverless PostgreSQL with native connection pooling powered by PgBouncer.

### 1.1 Create a Neon Project
1. Log in to [Neon Console](https://console.neon.tech/).
2. Click **Create Project**.
3. Fill in the details:
   - **Project Name**: `su-connect-prod`
   - **Postgres Version**: `16` (or latest recommended)
   - **Region**: Choose the region closest to your Vercel deployment (e.g., `AWS eu-west-1 / Ireland` or `AWS us-east-1`).
4. Click **Create Project**.

### 1.2 Retrieve Both Connection Strings
Neon provides **two** essential connection strings under the **Dashboard** / **Connection Details**:

#### A. Pooled Connection String (For Runtime Vercel Serverless Functions)
* Check the toggle **"Connection pooling"**.
* Notice the host contains `-pooler` (e.g., `ep-cold-shadow-123456-pooler.us-east-1.aws.neon.tech`).
* Format:
  ```text
  postgresql://su_user:PASSWORD@ep-cold-shadow-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
* **Use this for**: `DATABASE_URL` in production backend!

#### B. Direct Connection String (For Migrations & Schema DDL)
* Uncheck **"Connection pooling"**.
* The host will **not** contain `-pooler` (e.g., `ep-cold-shadow-123456.us-east-1.aws.neon.tech`).
* Format:
  ```text
  postgresql://su_user:PASSWORD@ep-cold-shadow-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```
* **Use this for**: `DIRECT_DATABASE_URL` for running `manage.py migrate` and schema changes (DDL commands fail through transaction poolers).

---

## Step 2: Prepare & Adapt Django Backend for Vercel

Vercel hosts Python apps using Serverless Functions. We need to provide a WSGI bridge and tell Vercel how to route requests.

### 2.1 Create the Serverless Handler `api/index.py`
Inside `SU-Backend/`, create a new folder `api/` and a file `index.py`:

```python
# File: SU-Backend/api/index.py
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'su_connect.settings.production')

# Import Django WSGI application
from su_connect.wsgi import application

# Vercel looks for the callable named 'app'
app = application
```

### 2.2 Create `vercel.json` in `SU-Backend/`
Create `SU-Backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "15mb",
        "runtime": "python3.11"
      }
    },
    {
      "src": "staticfiles/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/staticfiles/$1"
    },
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

### 2.3 Verify `settings/base.py` PgBouncer & Database Settings
Confirm that `SU-Backend/su_connect/settings/base.py` already includes PgBouncer optimizations for Neon:

```python
# Database Setup with PgBouncer Optimization
_db_config = env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
if 'postgresql' in _db_config.get('ENGINE', ''):
    _db_config['CONN_MAX_AGE'] = int(env('DB_CONN_MAX_AGE', default=0))
    # Top-level Django setting required for PgBouncer transaction pooling
    _db_config['DISABLE_SERVER_SIDE_CURSORS'] = True

DATABASES = {
    'default': _db_config
}

# Direct connection alias for running migrations
if env('DIRECT_DATABASE_URL', default=''):
    DATABASES['direct'] = env.db('DIRECT_DATABASE_URL')
```
> [!NOTE]
> `DISABLE_SERVER_SIDE_CURSORS = True` and `CONN_MAX_AGE = 0` are already implemented in `su_connect/settings/base.py`. This ensures zero errors when communicating through Neon's PgBouncer pooler.

### 2.4 Add WhiteNoise to `requirements.txt`
To serve static files (e.g. Django REST Framework browseable API, Django Admin UI CSS/JS) efficiently in serverless mode:
Add `whitenoise>=6.6.0` to `SU-Backend/requirements.txt`.

In `SU-Backend/su_connect/settings/base.py`, add WhiteNoise directly under SecurityMiddleware:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # <-- Add here
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    ...
]

# Static files storage
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 2.5 Generate Static Files for Deployment
Run locally once before deploying or during build:
```bash
python manage.py collectstatic --noinput
```

---

## Step 3: Run Database Migrations & Initial Data Seeding

> [!IMPORTANT]
> **Never run `migrate` through Neon's `-pooler` connection string!**  
> DDL statements (like `CREATE TABLE`, `ALTER TABLE`) can fail or lock in transaction pooling mode. Always use Neon's **Direct Connection String** for migrations.

### 3.1 Run Migrations from Your Local Machine
From your local terminal inside `SU-Backend/`:

```powershell
# Set temporary environment variable pointing to Neon DIRECT database
$env:DATABASE_URL="postgresql://su_user:PASSWORD@ep-cold-shadow-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
$env:DJANGO_SETTINGS_MODULE="su_connect.settings.production"
$env:SECRET_KEY="temporary-secret-for-migration-runner"

# Run migrations
python manage.py migrate
```

### 3.2 Create Initial Superuser
```powershell
python manage.py createsuperuser
# Enter email (e.g. admin@su.rw), name, and secure password
```

### 3.3 Seed Initial Roles & Data (Optional)
If you have initial data or seeds:
```powershell
python seed_orm.py
```

---

## Step 4: Deploy Django Backend to Vercel

### 4.1 Import Backend Project to Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your GitHub repository (`SU-Final`).
3. Set **Project Name**: `su-connect-api`.
4. In **Root Directory**, click **Edit** and select:
   ```
   SU-Backend
   ```
5. Framework Preset: Leave as **Other**.

### 4.2 Configure Backend Environment Variables in Vercel
Expand **Environment Variables** and add the following:

| Variable Name | Value / Description | Example |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | Production settings path | `su_connect.settings.production` |
| `SECRET_KEY` | Strong 50+ character random key | `django-insecure-prod-xyz89745120...` |
| `DEBUG` | Must be False in production | `False` |
| `DATABASE_URL` | **Neon Pooled Connection String** (contains `-pooler`) | `postgresql://su_user:PASS@ep-...-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_DATABASE_URL` | Neon Direct Connection String | `postgresql://su_user:PASS@ep-...region.aws.neon.tech/neondb?sslmode=require` |
| `ALLOWED_HOSTS` | Vercel domain wildcards + custom domain | `.vercel.app,localhost` |
| `CORS_ALLOWED_ORIGINS` | Temporary until Frontend is deployed | `https://localhost:5173` *(update in Step 7)* |
| `GEMINI_API_KEY` | Google Gemini AI Key | `AIzaSy...` |
| `JWT_ACCESS_TOKEN_LIFETIME` | JWT Token expiration (seconds) | `900` |
| `JWT_REFRESH_TOKEN_LIFETIME` | Refresh Token expiration (seconds) | `604800` |
| `AWS_ACCESS_KEY_ID` | (Optional: S3 for documents) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | (Optional: S3 for documents) | `wJalr...` |
| `AWS_STORAGE_BUCKET_NAME` | (Optional: S3 bucket name) | `su-connect-media` |
| `AWS_S3_REGION_NAME` | S3 Region | `us-east-1` |

### 4.3 Click Deploy
Click **Deploy**. Vercel will:
1. Detect Python WSGI entrypoint `api/index.py`.
2. Install dependencies from `requirements.txt`.
3. Deploy the serverless function.
4. Provide a live URL: `https://su-connect-api.vercel.app`.

### 4.4 Verify Backend Health
Open your browser and navigate to:
```
https://su-connect-api.vercel.app/api/dashboard/system-health/
```
or
```
https://su-connect-api.vercel.app/admin/
```
You should see the Django Admin login page or REST API response!

---

## Step 5: Prepare & Adapt React Frontend for Vercel

### 5.1 Update API Base URL in `Front-End/src/services/api.js`
Currently, `Front-End/src/services/api.js` contains a hardcoded `http://localhost:8000/api`.
Update it to dynamically read `import.meta.env.VITE_API_URL`:

```javascript
// File: Front-End/src/services/api.js (Lines 3-9)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

And in `chatStream` (around line 341):
```javascript
const baseURL = import.meta.env.VITE_API_URL || api.defaults.baseURL || 'http://localhost:8000/api';
```

### 5.2 Create `Front-End/vercel.json` (SPA Routing)
React SPA uses `react-router-dom` for client-side routing. Without rewrite rules, refreshing a route like `/reports` or `/dashboard` produces a `404 Not Found` on Vercel.

Create `Front-End/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Step 6: Deploy React Frontend to Vercel

### 6.1 Import Frontend Project to Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your repository (`SU-Final`).
3. Set **Project Name**: `su-connect`.
4. In **Root Directory**, click **Edit** and select:
   ```
   Front-End
   ```
5. Framework Preset: Automatically detected as **Vite**.
6. Build Command: `npm run build` (or leave default).
7. Output Directory: `dist` (or leave default).

### 6.2 Configure Frontend Environment Variables in Vercel
Add the following under **Environment Variables**:

| Variable Name | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://su-connect-api.vercel.app/api` | The live Vercel backend URL with `/api` suffix |

### 6.3 Click Deploy
Vercel will run `vite build` and deploy the compiled assets to Vercel Edge Network.
You will receive your live frontend URL:
```
https://su-connect.vercel.app
```

---

## Step 7: Finalize CORS & Environment Alignment

Now that both frontend and backend are deployed, connect the security bridge:

### 7.1 Update Backend `CORS_ALLOWED_ORIGINS`
1. Go to [vercel.com](https://vercel.com) -> Select your `su-connect-api` project.
2. Go to **Settings** -> **Environment Variables**.
3. Edit `CORS_ALLOWED_ORIGINS`:
   ```
   https://su-connect.vercel.app
   ```
   *(If you have a custom domain like `https://connect.su.rw`, add it separated by comma)*:
   ```
   https://su-connect.vercel.app,https://connect.su.rw
   ```
4. Edit `ALLOWED_HOSTS`:
   ```
   .vercel.app,su-connect-api.vercel.app,connect.su.rw
   ```

### 7.2 Redeploy Backend
1. Go to **Deployments** tab on `su-connect-api`.
2. Click the three dots `...` next to the latest deployment -> **Redeploy**.
3. Now the backend accepts requests from the live frontend with complete CSRF and JWT authorization!

---

## Step 8: Critical Production Considerations (Celery, WebSockets & Media)

Because Vercel runs on a **Serverless Architecture**, understanding runtime boundaries is key to a flawless production setup:

### 8.1 Celery & Background Workers
* **Constraint**: Vercel Serverless Functions terminate after request handling (10-15 second timeout). They cannot run persistent Celery worker daemons (`celery -A su_connect worker`).
* **Solutions**:
  1. **Direct Synchronous Execution (Quickest)**: For standard operations, Django executes AI and DB logic directly in API requests.
  2. **Dedicated Worker Container (Recommended for Heavy Batch AI)**: Deploy Celery on a free/inexpensive container host (e.g. Render Background Worker, Railway, or Fly.io) connecting to Upstash Redis and Neon DB.

### 8.2 Real-time WebSockets (Django Channels / Daphne)
* **Constraint**: Vercel does not support persistent stateful WebSocket connections through Python serverless functions.
* **Solutions**:
  1. The frontend React application gracefully handles standard HTTP REST polling for notifications.
  2. If real-time instant push notifications are strictly required, Daphne can be hosted on Render/Railway, or use an external service like Pusher / Ably.

### 8.3 File Uploads & Media Storage
* **Constraint**: Serverless filesystems are read-only and ephemeral; files saved to local `media/` disappear on the next request.
* **Solution**:
  Use **AWS S3** or **Cloudinary**. SU Connect's `su_connect/settings/production.py` is already configured for S3!
  Simply supply your AWS credentials in Vercel backend environment variables:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_STORAGE_BUCKET_NAME`
  - `AWS_S3_REGION_NAME`

---

## Step 9: End-to-End Go-Live Verification Checklist

Follow this checklist to verify your live deployment:

- [ ] **1. Database Verification**:
  - Open Neon SQL Editor.
  - Run `SELECT count(*) FROM accounts_user;`.
  - Confirm tables and superuser exist.
- [ ] **2. Backend Healthcheck**:
  - Visit `https://su-connect-api.vercel.app/api/dashboard/system-health/`.
  - Ensure status returns `200 OK`.
- [ ] **3. Admin Panel Check**:
  - Visit `https://su-connect-api.vercel.app/admin/`.
  - Log in with your superuser credentials.
- [ ] **4. Frontend Live Load**:
  - Visit `https://su-connect.vercel.app`.
  - Check browser console (F12) — verify there are 0 red console errors.
- [ ] **5. User Authentication Flow**:
  - Log in with an active account.
  - Verify JWT access token is stored and refresh token cookie is set.
- [ ] **6. Report Submission Flow**:
  - Submit a test activity report.
  - Verify it shows up immediately in the table and Neon database.
- [ ] **7. AI Analysis**:
  - Trigger priority analysis on a support request or run AI Chat.
  - Verify Gemini API responds with structured insights.
- [ ] **8. Mobile UX Verification**:
  - Open `https://su-connect.vercel.app` on a mobile device (iPhone/Android).
  - Verify bottom navigation bar, touch targets, and responsive layout.

---

## Step 10: Troubleshooting & Common Pitfalls

| Symptom | Cause | Solution |
|---|---|---|
| **CORS error in browser console** | Backend `CORS_ALLOWED_ORIGINS` does not match Frontend domain exactly. | Ensure `CORS_ALLOWED_ORIGINS` includes exact URL including `https://` with no trailing slash. |
| **404 on page refresh (React)** | Vercel trying to serve missing file instead of `index.html`. | Ensure `Front-End/vercel.json` has the SPA rewrites rule to `index.html`. |
| **Database `Too many connections`** | Backend connecting to Direct URL instead of Pooled URL. | Change `DATABASE_URL` in Vercel to the Neon connection string containing `-pooler`. |
| **OperationalError: prepared statement already exists** | Server-side cursors conflicting with PgBouncer. | Ensure `DISABLE_SERVER_SIDE_CURSORS = True` in `base.py` (already pre-configured). |
| **Static assets (CSS/JS) missing in Admin** | Static files not gathered or served in serverless. | Run `python manage.py collectstatic --noinput` and ensure `WhiteNoiseMiddleware` is enabled. |
| **504 Gateway Timeout on AI requests** | AI generation taking longer than Vercel Serverless timeout (10s free). | Ensure streaming response (`chatStream`) is utilized or upgrade Vercel function maxDuration to 30-60s in `vercel.json`. |

---

## 🎉 Summary: You Are Live!
Following these steps guarantees that:
1. **Neon** handles all PostgreSQL storage with zero connection exhaustion via built-in PgBouncer.
2. **Vercel Backend** auto-scales serverlessly with zero server maintenance costs.
3. **Vercel Frontend** serves lightning-fast cached assets globally via Edge CDN.
