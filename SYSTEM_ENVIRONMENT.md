# 🌐 SU Connect — Complete System Environment & Architecture Specification

> **System**: Scripture Union Rwanda Information & Operations Management Platform (SU Connect)  
> **Documentation Version**: 2.0  
> **Environment Context**: Development, Testing, and Production Architecture  
> **Author**: Senior Systems & Frontend Architect  
> **Last Updated**: October 2026  

---

## 📑 Table of Contents
1. [System Overview & Purpose](#1-system-overview--purpose)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Technology Stack & Runtime Specifications](#3-technology-stack--runtime-specifications)
4. [Environment Variables & Configuration Matrix](#4-environment-variables--configuration-matrix)
5. [Database Architecture & Regional Isolation](#5-database-architecture--regional-isolation)
6. [Organizational Role Hierarchy & Access Matrix](#6-organizational-role-hierarchy--access-matrix)
7. [Authentication, MFA & Security Middleware](#7-authentication-mfa--security-middleware)
8. [Artificial Intelligence & Background Services](#8-artificial-intelligence--background-services)
9. [Pre-configured Test Accounts & Credentials](#9-pre-configured-test-accounts--credentials)
10. [End-to-End Installation & Quickstart Guide](#10-end-to-end-installation--quickstart-guide)
11. [API Endpoints Directory](#11-api-endpoints-directory)
12. [Workspace Directory Topology](#12-workspace-directory-topology)
13. [Troubleshooting & Environment Diagnostics](#13-troubleshooting--environment-diagnostics)

---

## 1. System Overview & Purpose

**SU Connect** is the central digital operating system designed for **Scripture Union Rwanda**, coordinating national staff, regional coordinators, and field officers across all districts and provinces of Rwanda.

### Key Mission Capabilities:
* **Activity & Impact Reporting**: Multi-step field activity submission, reach statistics, document attachments, and approval workflows.
* **Support Request Management**: Technical, financial, logistic, and emergency assistance requests with two-tier review (Coordinator → Manager) and Kanban tracking.
* **Prayer Calendar & Intercession Requests**: Daily devotionals, urgent prayer requests, and community prayer counters.
* **Document Repository**: Scripture Union digital archive, categorize file assets (PDF, DOCX, XLSX, Images), tagging, and global sharing.
* **AI Analysis & Priority Engine**: Automated priority scoring, confidence assessments, and an interactive assistant for field documentation.
* **Security & Comprehensive Audit Trails**: Immutable audit logging, session tracking, TOTP 2FA, and regional data partitioning.
* **Responsive Multi-Device UX**: 100% viewport containment, thumb-friendly mobile navigation, and zero horizontal scrolling on all phone viewports.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-----------------------------------------------------------------------------+  |
|  |  React 19 SPA (Vite 8, Lucide React, Recharts, Custom Design System CSS)    |  |
|  |  - Responsive Shell (Desktop Sidebar + Mobile Bottom Nav + Header Bar)       |  |
|  |  - Offline-resilient JWT Interceptor with Auto-Refresh & Session Expiry     |  |
|  |  - Floating AI Assistant Widget (SUConnectAI)                              |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (Port 8000) & WebSockets
                                           v
+-----------------------------------------------------------------------------------+
|                                  GATEWAY & ASGI                                   |
|  +-----------------------------------------------------------------------------+  |
|  |  Daphne ASGI Server / Django Channels (Realtime Notifications & Events)      |  |
|  +-----------------------------------------------------------------------------+  |
|  |  CORS Middleware (Allowed origins: localhost:5173, localhost:3000)           |  |
|  |  Security & Idempotency Layer (Prevents duplicate requests & replay attacks)|  |
|  |  Audit Logging Middleware (Captures IP, User Agent, Action, Endpoint)      |  |
|  |  Regional Isolation Middleware (Enforces multi-tenant provincial partition) |  |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                                  SERVICE CORE                                     |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  |   apps.accounts     |  |     apps.reports     |  |       apps.support       |  |
|  |   Custom User Model |  | Multi-step workflow  |  | Multi-tier Kanban/List   |  |
|  |   JWT Auth & 2FA    |  | Regional aggregation |  | Priority escalation    |  |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  +---------------------+  +----------------------+  +--------------------------+  |
|  |     apps.prayer     |  |    apps.documents    |  |    apps.notifications    |  |
|  | Prayer feeds & logs |  | File storage & tags  |  | In-app alerts & badges   |  |
|  +---------------------+  +----------------------+  +--------------------------+  |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+     +-------------------------------------+
|             PERSISTENCE               |     |           AI & ASYNC ENGINES        |
|  PostgreSQL 15+ / SQLite3 Fallback    |     |  - Google Gemini 2.0 / 2.5 Flash API|
|  (ACID Transactions, Indices on       |     |  - Ollama Local AI (qwen2.5vl:3b)   |
|   Region, Status, and Timestamps)     |     |  - Celery Worker & Redis Broker     |
+---------------------------------------+     +-------------------------------------+
```

---

## 3. Technology Stack & Runtime Specifications

### 🖥️ Frontend (Client Engine)
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^19.2.5` | Reactive user interface & component trees |
| **DOM Engine** | React DOM | `^19.2.5` | Browser DOM rendering |
| **Build Tool** | Vite | `^8.0.10` | Ultra-fast HMR and Rollup production bundling |
| **Routing** | React Router DOM | `^7.15.0` | Client-side routing, protected navigation guards |
| **Icons** | Lucide React | `^1.14.0` | Accessible SVG UI icons |
| **Data Viz** | Recharts | `^3.8.1` | Dashboard metrics, bar charts, trend lines |
| **HTTP Client** | Axios | `^1.16.0` | Request interceptors, JWT injection & retry |
| **Notifications**| React Hot Toast | `^2.6.0` | Toast feedback notifications |
| **Date Utility** | date-fns | `^4.1.0` | Date manipulation and localized formatting |
| **Styling** | Vanilla CSS Tokens | Custom | Design tokens, responsive grid, dark/light themes |

### ⚙️ Backend (API & Business Logic)
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Python | `3.14.x` / `3.11+` | Core execution environment |
| **Framework** | Django | `>=6.0.5` | Application framework and ORM |
| **API Engine**| Django REST Framework | `3.14.0` | Serializers, ViewSets, and API permissions |
| **Auth** | SimpleJWT | `5.3.1` | Stateless JSON Web Token authentication |
| **ASGI / WS** | Daphne & Channels | `4.0.0` | Asynchronous WebSockets & long polling |
| **Task Queue**| Celery & Redis | `5.3.6` | Asynchronous task processing (Email, batch AI) |
| **Database** | PostgreSQL / SQLite | SQLite3 (dev) | Relational persistence |
| **Security** | django-otp & qrcode | `1.3.0` | Time-based One Time Passwords (TOTP) & 2FA |
| **AI SDK** | google-genai / Ollama | `>=2.8.0` | Generative AI analysis & local model integration |
| **MIME Parsing**| python-magic-bin / pypdf| `0.4.14` | Binary inspection and metadata extraction |

---

## 4. Environment Variables & Configuration Matrix

Configuration values are parsed via `django-environ` from the root `.env` file located in `SU-Backend/.env`.

| Variable Name | Default / Dev Value | Description | Sensitivity |
| :--- | :--- | :--- | :--- |
| `SECRET_KEY` | `su-connect-dev-secret-key-123456789` | Cryptographic signing key for Django | 🔴 High |
| `DEBUG` | `True` | Debug mode (Detailed tracebacks on dev) | 🟡 Medium |
| `DATABASE_URL` | `sqlite:///db.sqlite3` or `postgresql://...` | Primary database connection string | 🔴 High |
| `REDIS_URL` | `redis://localhost:6379/0` | Cache and Channels message broker | 🔵 Low |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Celery message broker URL | 🔵 Low |
| `CELERY_RESULT_BACKEND`| `redis://localhost:6379/1` | Celery task output persistence | 🔵 Low |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini Generative AI API Key | 🔴 High |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Local Ollama inference server address | 🔵 Low |
| `OLLAMA_MODEL` | `qwen2.5vl:3b` | Target local model for offline analysis | 🔵 Low |
| `JWT_ACCESS_TOKEN_LIFETIME` | `7200` (2 hours) | Lifetime of JWT access token in seconds | 🟡 Medium |
| `JWT_REFRESH_TOKEN_LIFETIME`| `604800` (7 days) | Lifetime of JWT refresh token in seconds | 🟡 Medium |
| `CORS_ALLOWED_ORIGINS`| `http://localhost:3000,http://localhost:5173` | Allowed frontend origins for CORS | 🟡 Medium |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | SMTP email or console test backend | 🔵 Low |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP outgoing mail server | 🔵 Low |
| `EMAIL_PORT` | `587` | TLS SMTP port | 🔵 Low |
| `EMAIL_HOST_USER` | `umugishaone@gmail.com` | Notification sender account | 🟡 Medium |
| `EMAIL_HOST_PASSWORD` | App-specific password | 16-character Google App Password | 🔴 High |

---

## 5. Database Architecture & Regional Isolation

SU Connect implements **Regional Multi-Tenant Data Isolation** through a specialized middleware and custom QuerySet architecture.

### The Regional Partitioning Model:
* **Rwanda Operating Regions**:
  * `Kigali City`
  * `Northern Province`
  * `Southern Province`
  * `Eastern Province`
  * `Western Province`
* **Custom Middleware (`core.middleware.RegionalIsolationMiddleware`)**:
  * Intercepts incoming HTTP requests.
  * Checks the requesting user's `role` and `region`.
  * Automatically filters database queries for `field_officer` and `regional_coordinator` so users only retrieve records belonging to their assigned geographical zone.
* **Bypass Privileges**:
  * Users with roles `administrator` or `national_manager` possess global scope and can view, audit, and aggregate data across all five regions.
  * `User._base_manager` is utilized in internal workflows when coordinators escalate reports to national managers.

### Connection Pooling Architecture (PgBouncer):
* **PgBouncer Port**: `6432` (Django API, Daphne WebSockets, Celery workers connect here)
* **Underlying PostgreSQL Port**: `5432` (Direct database access, migrations, superuser tasks)
* **Pool Mode**: `transaction` (Maximizes connection multiplexing and concurrent throughput)
* **Max Client Connections**: 250 (Scaled to easily handle concurrent mobile/desktop clients)
* **Default Pool Size**: 25 persistent backend database connections
* **Django Settings Optimization**:
  * `DISABLE_SERVER_SIDE_CURSORS = True` configured to prevent cross-transaction cursor state issues.
  * `CONN_MAX_AGE = 0` configured so Django returns connections to PgBouncer immediately upon request completion.
  * Management scripts located in `/pgbouncer/` (`start_pgbouncer.bat`, `stop_pgbouncer.bat`, `status_pgbouncer.bat`).

---

## 6. Organizational Role Hierarchy & Access Matrix

The system implements a four-tier hierarchical governance model:

```
                  +--------------------------------+
                  |         Administrator          |
                  |  Full system audit, users, 2FA |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  |        National Manager        |
                  |  National review, ★ approvals  |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  |      Regional Coordinator      |
                  |  Regional oversight & share   |
                  +---------------+----------------+
                                  |
                                  v
                  +--------------------------------+
                  |         Field Officer          |
                  |  Ground activities & requests  |
                  +--------------------------------+
```

| Feature / Domain | Field Officer | Regional Coordinator | National Manager | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Activity Reports: Create** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Activity Reports: Approve** | ❌ No | ✅ (Level 1 Review) | ✅ (★ Final Approval)| ✅ Override |
| **Activity Reports: Share to NM**| ❌ Blocked | ✅ Exclusive Action | N/A | ✅ View all |
| **Support Requests: Submit** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Support Requests: Escalate** | ❌ Blocked | ✅ Escalates to NM | ✅ Fulfils / Closes | ✅ Admin rights |
| **Documents: Upload & Tag** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Documents: Delete Document** | Own files only | Own / Regional | ✅ All documents | ✅ All documents |
| **Security Audit Logs** | ❌ No | ❌ No | Read-only | ✅ Full Access |
| **User Directory Search** | Field & Coord only | Regional + NM | National view | Full Directory |

---

## 7. Authentication, MFA & Security Middleware

### 1. Dual-Token JWT Lifecycle
* **Access Token**: Short-lived (`7200s` / 2 hours), passed via the `Authorization: Bearer <token>` header on every request.
* **Refresh Token**: Long-lived (`604800s` / 7 days), stored securely to permit automatic token rotation via Axios interceptors on `401 Unauthorized`.

### 2. Multi-Factor Authentication (2FA)
* **TOTP Authenticator**: Compatible with Google Authenticator, Microsoft Authenticator, and Authy using standard RFC 6238 time-based tokens.
* **Email Verification**: Outgoing SMTP verification token dispatch on account registration and login challenge.
* **Backup Recovery Codes**: Cryptographically generated single-use codes for emergency account restoration.

### 3. Custom Defense-in-Depth Middleware Stack:
1. `IdempotencyMiddleware`: Uses unique headers (`X-Idempotency-Key`) to prevent double submission of forms or financial records.
2. `AuditLoggingMiddleware`: Logs user ID, IP address, request method, endpoint, and response code into the immutable audit database table.
3. `RegionalIsolationMiddleware`: Restricts querysets based on the authenticated user's geographic region.
4. `SessionTimeoutMiddleware`: Automatically invalidates sessions after prolonged inactivity.

---

## 8. Artificial Intelligence & Background Services

SU Connect incorporates hybrid AI capabilities that function both in online cloud environments and offline/low-bandwidth situations.

### AI Prioritization Engine:
* **Analyzes Support Requests**: Evaluates keywords, requester descriptions, and impact scope to suggest priority levels (`urgent`, `high`, `medium`, `low`) along with an AI confidence percentage (e.g., `92%`).
* **Manual Override Tracking**: If a Regional Coordinator or Manager changes an AI-suggested priority, the system tags the item as `(Manually Overridden)` for audit review.

### Embedded Assistant (`SUConnectAI`):
* Floating interactive copilot positioned at the bottom right.
* Answers questions regarding Scripture Union policies, report submission guidelines, and document lookups.
* **Engine Fallback Flow**:
  1. Primary: Google Gemini 2.0 / 2.5 Flash via `google-genai` SDK.
  2. Fallback: Local Ollama instance (`qwen2.5vl:3b`) running on `http://127.0.0.1:11434`.

---

## 9. Pre-configured Test Accounts & Credentials

The system includes pre-seeded, active user accounts across all organizational roles.

| Role | Full Name | Email Address | Password | Assigned Region |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Emmanuel Habimana | `admin@su.rw` | `Admin@123` | National (All) |
| **Administrator** | BUMUGISHA Neema | `umugishaone@gmail.com` | `Admin@123` | National (All) |
| **National Manager** | Pierre Nkurunziza | `pierre@su.rw` | `Password123!` | National (All) |
| **National Manager** | Grace Uwimana | `manager@su.rw` | `Manager@123` | National (All) |
| **Regional Coordinator**| Sarah Uwitonze | `sarah@su.rw` | `Password123!` | Kigali City |
| **Regional Coordinator**| Alice Mukamana | `coordinator@su.rw` | `Coord@123` | Southern Province |
| **Field Officer** | Patrick Nkurunziza | `patrick@su.rw` | `Password123!` | Kigali City |
| **Field Officer** | David Niyonzima | `david@su.rw` | `Staff@123` | Eastern Province |
| **Field Officer** | Solange Uwera | `solange@su.rw` | `Staff@123` | Northern Province |

> [!NOTE]
> All accounts above have verified emails (`email_verified = True`) and active flags enabled (`is_active = True`).

---

## 10. End-to-End Installation & Quickstart Guide

### Prerequisites:
* **Python**: Version `3.11`, `3.12`, or `3.14` installed and added to `PATH`.
* **Node.js**: Version `18.x`, `20.x`, or `22.x` with `npm`.
* **Git**: Installed for version tracking.

---

### Step 1: Clone and Inspect Workspace
```powershell
cd d:\FINAL-Project
```

---

### Step 2: Configure & Start Backend
1. **Navigate to the Backend directory**:
   ```powershell
   cd d:\FINAL-Project\SU-Backend
   ```

2. **Activate Virtual Environment**:
   ```powershell
   # Windows PowerShell
   .\venv\Scripts\Activate.ps1
   # Or using .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Run Migrations & Seed Database**:
   ```powershell
   python manage.py migrate
   python seed_orm.py
   ```

5. **Start Django Server**:
   ```powershell
   python manage.py runserver 8000
   ```
   *The API will be operational at `http://localhost:8000/api/`.*

---

### Step 3: Configure & Start Frontend
1. **Open a new terminal and navigate to Frontend**:
   ```powershell
   cd d:\FINAL-Project\Front-End
   ```

2. **Install Node Packages**:
   ```powershell
   npm install
   ```

3. **Launch Vite Development Server**:
   ```powershell
   npm run dev
   ```
   *The SPA client will be accessible at `http://localhost:5173/`.*

4. **Verify Production Build (Optional)**:
   ```powershell
   npm run build
   ```

---

## 11. API Endpoints Directory

All backend endpoints are prefixed with `/api/`:

| Module | HTTP Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login/` | Authenticate credentials & issue JWT tokens |
| **Auth** | `POST` | `/api/auth/register/` | Self-register a new field user account |
| **Auth** | `POST` | `/api/auth/refresh/` | Refresh expired access token |
| **Auth** | `GET` | `/api/auth/profile/` | Fetch current user metadata & preferences |
| **Reports** | `GET / POST` | `/api/reports/` | List or create activity impact reports |
| **Reports** | `GET / PUT` | `/api/reports/<id>/` | Fetch details or update specific report |
| **Reports** | `POST` | `/api/reports/share/` | Bulk share reports to National Managers |
| **Support** | `GET / POST` | `/api/support/` | List or create team support requests |
| **Support** | `POST` | `/api/support/share/` | Bulk escalate requests to National Managers |
| **Support** | `POST` | `/api/support/ai-prioritize/`| Run batch AI evaluation on pending tickets |
| **Prayer** | `GET / POST` | `/api/prayer/` | List prayer calendar items or submit prayer |
| **Prayer** | `POST` | `/api/prayer/<id>/pray/`| Increment public community prayer counter |
| **Documents**| `GET / POST`| `/api/documents/` | Search repository or upload archive document |
| **Documents**| `GET` | `/api/documents/<id>/download/` | Fetch file payload with download increment |
| **Audit** | `GET` | `/api/audit/` | Review immutable activity logs (Admin only) |
| **Notifs** | `GET / PUT` | `/api/notifications/` | Retrieve alerts or mark as read |

---

## 12. Workspace Directory Topology

```
d:\FINAL-Project\
│
├── Front-End/                      # Client React Application
│   ├── index.html                  # HTML5 entry with mobile viewport meta
│   ├── package.json                # Dependencies (React 19, Vite 8, Lucide)
│   ├── vite.config.js              # Vite server & build configuration
│   └── src/
│       ├── components/
│       │   ├── ai/                 # SUConnectAI floating assistant & styling
│       │   └── layout/             # Header, Sidebar, BottomNav, IdleTimer
│       ├── contexts/               # AuthContext, ThemeContext, NotificationContext
│       ├── pages/
│       │   ├── auth/               # Login, Register, Forgot Password
│       │   ├── dashboard/          # Analytics & metrics overview
│       │   ├── reports/            # ReportList, ReportDetail, ReportForm
│       │   ├── support/            # SupportRequests, SupportForm (Kanban/List)
│       │   ├── prayer/             # PrayerRequests calendar & feeds
│       │   ├── documents/          # DocumentRepository file explorer
│       │   ├── security/           # SecurityAudit trails
│       │   ├── users/              # UserManagement directory
│       │   └── settings/           # Profile, Password, Sessions, 2FA
│       ├── services/               # api.js Axios client with auto-refresh
│       └── styles/
│           └── index.css           # Global design system & mobile viewport locks
│
├── SU-Backend/                     # Django REST Framework Server
│   ├── manage.py                   # Administrative CLI utility
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Local environment secrets & connection URLs
│   ├── seed_orm.py                 # Comprehensive database seeding script
│   ├── core/                       # Middlewares (Idempotency, Audit, Isolation)
│   ├── apps/
│   │   ├── accounts/               # CustomUser, JWT authentication, 2FA
│   │   ├── reports/                # Activity report models, serializers, views
│   │   ├── support/                # Support request tickets & AI priority
│   │   ├── prayer/                 # Prayer calendar and intercession models
│   │   ├── documents/              # Repository files, categories, downloads
│   │   ├── audit/                  # Security audit logging engine
│   │   └── notifications/          # Real-time user alert dispatch
│   └── su_connect/
│       ├── asgi.py                 # Daphne ASGI server entrypoint
│       ├── wsgi.py                 # WSGI web server entrypoint
│       ├── urls.py                 # Global URL routing
│       └── settings/
│           ├── base.py             # Shared settings (Apps, Middlewares, Auth)
│           ├── development.py      # Dev settings (SQLite fallback, LocMemCache)
│           └── production.py       # Production hardening
│
├── users-pasword.txt               # Quick reference credentials file
└── SYSTEM_ENVIRONMENT.md           # Master system environment specification
```

---

## 13. Troubleshooting & Environment Diagnostics

### 1. Mobile Viewport Overflow ("Horizontal Scrolling")
* **Status**: **Permanently Resolved**.
* **Mechanism**: `index.css` enforces strict containment on `html`, `body`, `#root`, `.app-layout`, `.main-content`, and `.page-body` using `max-width: 100vw !important; overflow-x: hidden !important; min-width: 0 !important;`.
* Filter chip bars (`.support-chip-bar`) and folder pills utilize touch-swipe scrolling (`overflow-x: auto`) rather than expanding the viewport width.

### 2. CORS Errors in Development
* If encountering `Origin http://localhost:5173 is not allowed by Access-Control-Allow-Origin`:
  * Check `SU-Backend/su_connect/settings/development.py`.
  * `CORS_ALLOWED_ORIGIN_REGEXES` automatically permits any `http://localhost:\d+` or `http://127.0.0.1:\d+`. Ensure the backend server is running in development mode (`DJANGO_SETTINGS_MODULE=su_connect.settings.development`).

### 3. JWT 401 Unauthorized / Token Expiration
* The frontend Axios instance in `api.js` automatically intercepts `401` errors and triggers `/api/auth/refresh/`.
* If a session has expired completely (after 7 days), the user is redirected gracefully to `/login`.

### 4. Email Dispatch Issues in Development
* By default, development mode routes emails to the console (`django.core.mail.backends.console.EmailBackend`).
* To test live Gmail SMTP dispatch, set `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` in `SU-Backend/.env`.

---

*End of Environment & Architecture Specification.*
