# SU Connect — Backend & Database Architecture Specification

This document provides a comprehensive backend and database specification for **SU Connect** (Scripture Union Rwanda AI-Powered Reporting & Support System), extracted and engineered from the frontend React/Vite application structure.

---

## 1. Data Models / Entities

The following entity definitions map directly to the frontend state structures, forms, and mock data repositories. Where specific backend constraints or relational linking tables are implied by the UI, they are explicitly marked with `[ASSUMPTION]`.

### 1.1 User
Represents organization members across various administrative and regional roles.
*   **id**: `UUID` (Primary Key)
*   **name**: `VARCHAR(255)` (Required)
*   **email**: `VARCHAR(255)` (Required, Unique, Indexed)
*   **passwordHash**: `VARCHAR(255)` (Required)
*   **role**: `ENUM('admin', 'manager', 'staff', 'coordinator')` (Required)
*   **region**: `VARCHAR(100)` (Required, e.g., 'Kigali City', 'Northern Province')
*   **department**: `VARCHAR(100)` (Required, e.g., 'Administration', 'Field Operations', 'Youth Ministry')
*   **position**: `VARCHAR(100)` (Required, e.g., 'Field Coordinator')
*   **phone**: `VARCHAR(30)` (Optional)
*   **avatar**: `VARCHAR(10)` (Generated 2-letter initials, e.g., 'EH')
*   **status**: `ENUM('active', 'inactive')` (Default: `active`)
*   **mfaEnabled**: `BOOLEAN` (Default: `false`)
*   **mfaSecret**: `VARCHAR(255)` (Nullable, used for TOTP 2FA `[ASSUMPTION]`)
*   **lastLogin**: `TIMESTAMP WITH TIME ZONE` (Nullable)
*   **joinDate**: `DATE` (Required, Default: `CURRENT_DATE`)
*   **notifPrefs**: `JSONB` `[ASSUMPTION]` (Default: `{"email": true, "sms": false, "inApp": true, "deadlineReminders": true, "reportUpdates": true, "supportUpdates": true, "prayerResponses": false}`)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)
*   **updatedAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `One-to-Many` with **Report** (as `submittedBy`)
*   `One-to-Many` with **SupportRequest** (as `requester` and `assignedTo`)
*   `One-to-Many` with **PrayerRequest** (as `submittedBy`)
*   `One-to-Many` with **Document** (as `uploadedBy`)
*   `One-to-Many` with **AuditLog** (as `user`)
*   `One-to-Many` with **UserSession** `[ASSUMPTION]`

---

### 1.2 Report (Activity Report)
Stores ministry activity submissions, attendance demographics, outcomes, and AI analysis metadata.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **title**: `VARCHAR(255)` (Required)
*   **type**: `ENUM('Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program')` (Required)
*   **region**: `VARCHAR(100)` (Required, Indexed)
*   **department**: `VARCHAR(100)` (Required)
*   **date**: `DATE` (Required, Indexed)
*   **duration**: `VARCHAR(100)` (Optional, e.g., '4 hours', '3 days')
*   **location**: `VARCHAR(255)` (Optional, e.g., 'Kimironko, Kigali')
*   **status**: `ENUM('draft', 'submitted', 'approved', 'returned')` (Required, Default: `draft`, Indexed)
*   **submittedById**: `UUID` (Foreign Key to `User.id`, Required)
*   **participants**: `INTEGER` (Required, Default: `0`)
*   **demographics**: `JSONB` (Required, Default: `{"male": 0, "female": 0, "youth": 0, "adults": 0}`)
*   **description**: `TEXT` (Required)
*   **outcomes**: `TEXT` (Optional)
*   **challenges**: `TEXT` (Optional)
*   **prayerRequests**: `TEXT` (Optional)
*   **aiCategory**: `VARCHAR(100)` (Nullable, AI classification output `[ASSUMPTION]`)
*   **confidence**: `INTEGER` (Nullable, AI confidence score 0-100 `[ASSUMPTION]`)
*   **keywords**: `TEXT[]` / `JSONB` (Array of extracted keyword strings `[ASSUMPTION]`)
*   **aiSummary**: `TEXT` (Nullable, AI-generated summary `[ASSUMPTION]`)
*   **overridden**: `BOOLEAN` (Default: `false`, tracks if AI category was manually adjusted `[ASSUMPTION]`)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)
*   **updatedAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `Many-to-One` with **User** (`submittedById`)
*   `One-to-Many` with **Document** (Supporting attachments linked via linking table `report_attachments` `[ASSUMPTION]`)

---

### 1.3 SupportRequest
Manages requests for material, financial, personnel, training, and prayer assistance.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **type**: `ENUM('Material', 'Financial', 'Personnel', 'Training', 'Prayer', 'Other')` (Required)
*   **title**: `VARCHAR(255)` (Required)
*   **description**: `TEXT` (Required)
*   **justification**: `TEXT` (Optional)
*   **requesterId**: `UUID` (Foreign Key to `User.id`, Required)
*   **region**: `VARCHAR(100)` (Required, Indexed)
*   **priority**: `ENUM('low', 'medium', 'high', 'urgent')` (Required)
*   **status**: `ENUM('submitted', 'under review', 'approved', 'fulfilled', 'closed')` (Required, Default: `submitted`, Indexed)
*   **deadline**: `DATE` (Optional)
*   **submittedDate**: `TIMESTAMP WITH TIME ZONE` (Required, Default: `NOW()`)
*   **assignedToId**: `UUID` (Foreign Key to `User.id`, Nullable)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)
*   **updatedAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `Many-to-One` with **User** (`requesterId`)
*   `Many-to-One` with **User** (`assignedToId`)
*   `One-to-Many` with **SupportComment**
*   `One-to-Many` with **Document** (Supporting attachments linked via linking table `support_attachments` `[ASSUMPTION]`)

---

### 1.4 SupportComment
Tracks discussion and status update notes on support requests.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **supportRequestId**: `BIGINT` / `UUID` (Foreign Key to `SupportRequest.id`, Required, Indexed)
*   **authorId**: `UUID` (Foreign Key to `User.id`, Required)
*   **text**: `TEXT` (Required)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `Many-to-One` with **SupportRequest**
*   `Many-to-One` with **User**

---

### 1.5 PrayerRequest
Centralized intercessory prayer management with anonymous support and theme tagging.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **title**: `VARCHAR(255)` (Required)
*   **description**: `TEXT` (Required)
*   **submittedById**: `UUID` (Foreign Key to `User.id`, Nullable if submitted anonymously)
*   **submittedByName**: `VARCHAR(255)` (Stored snapshot or 'Anonymous')
*   **region**: `VARCHAR(100)` (Required, Indexed)
*   **type**: `ENUM('Revival', 'Protection', 'Resources', 'Health', 'Unity', 'Youth', 'Staff', 'General')` (Required)
*   **priority**: `ENUM('low', 'medium', 'high', 'urgent')` (Required)
*   **status**: `ENUM('pending', 'prayed', 'answered')` (Required, Default: `pending`, Indexed)
*   **anonymous**: `BOOLEAN` (Default: `false`)
*   **date**: `DATE` (Required, Default: `CURRENT_DATE`)
*   **responsesCount**: `INTEGER` (Default: `0`)
*   **themes**: `TEXT[]` / `JSONB` (Array of theme tags, e.g., `['Revival', 'Church Growth']`)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)
*   **updatedAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `Many-to-One` with **User** (`submittedById`)
*   `One-to-Many` with **PrayerResponse** `[ASSUMPTION]`

---

### 1.6 PrayerResponse `[ASSUMPTION]`
Tracks individual prayer commitments and encouragement messages.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **prayerRequestId**: `BIGINT` / `UUID` (Foreign Key to `PrayerRequest.id`, Required, Indexed)
*   **userId**: `UUID` (Foreign Key to `User.id`, Required)
*   **message**: `TEXT` (Optional, encouragement note)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

---

### 1.7 Document (Repository File & Attachment)
Centralized file tracking for consolidated reports, guidelines, photos, and supporting evidence.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **name**: `VARCHAR(255)` (Required, e.g., 'Q1 2025 Consolidated Report.pdf')
*   **storageKey**: `VARCHAR(512)` (Required, S3/Blob storage path `[ASSUMPTION]`)
*   **type**: `ENUM('pdf', 'docx', 'xlsx', 'zip', 'jpg', 'png')` (Required)
*   **sizeBytes**: `BIGINT` (Required)
*   **region**: `VARCHAR(100)` (Required, 'All Regions' or specific region, Indexed)
*   **category**: `ENUM('All Documents', 'Consolidated Reports', 'Planning Documents', 'Policies & Guidelines', 'Activity Photos', 'Training Materials', 'Prayer Documents', 'Schedules')` (Required, Indexed)
*   **uploadedById**: `UUID` (Foreign Key to `User.id`, Required)
*   **uploadedByName**: `VARCHAR(255)` (Snapshot of uploader's name)
*   **date**: `DATE` (Required, Default: `CURRENT_DATE`)
*   **tags**: `TEXT[]` / `JSONB` (Array of tags, e.g., `['Q1', '2025', 'Consolidated']`)
*   **version**: `VARCHAR(20)` (Default: `1.0`)
*   **shared**: `BOOLEAN` (Default: `false`)
*   **downloads**: `INTEGER` (Default: `0`)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `Many-to-One` with **User** (`uploadedById`)
*   `Many-to-Many` with **Report** (via `report_attachments` `[ASSUMPTION]`)
*   `Many-to-Many` with **SupportRequest** (via `support_attachments` `[ASSUMPTION]`)

---

### 1.8 AuditLog
Immutable security and system activity tracking trail.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **userId**: `UUID` (Foreign Key to `User.id`, Nullable for system/unauthenticated actions)
*   **userSnapshot**: `VARCHAR(255)` (Required, e.g., 'Emmanuel Habimana' or 'Unknown')
*   **action**: `VARCHAR(255)` (Required, e.g., 'Report Approved', 'Failed Login Attempt', 'User Created')
*   **resource**: `VARCHAR(512)` (Required, e.g., 'Report #1: Kigali Youth Outreach', 'admin@su.rw')
*   **time**: `TIMESTAMP WITH TIME ZONE` (Required, Default: `NOW()`, Indexed)
*   **ip**: `VARCHAR(45)` (Required, IPv4/IPv6 address)
*   **severity**: `ENUM('info', 'warning', 'danger')` (Required, Indexed)

**Relationships:**
*   `Many-to-One` with **User** (`userId`)

---

### 1.9 Notification
User-specific system alerts, reminders, and activity updates.
*   **id**: `BIGSERIAL` / `UUID` (Primary Key)
*   **userId**: `UUID` (Foreign Key to `User.id`, Required, Indexed)
*   **type**: `ENUM('report', 'deadline', 'support', 'prayer', 'system')` (Required)
*   **title**: `VARCHAR(255)` (Required)
*   **message**: `TEXT` (Required)
*   **icon**: `VARCHAR(50)` (Optional, e.g., 'check', 'clock', 'package', 'heart', 'alert')
*   **read**: `BOOLEAN` (Default: `false`, Indexed)
*   **createdAt**: `TIMESTAMP WITH TIME ZONE` (Default: `NOW()`)

**Relationships:**
*   `Many-to-One` with **User** (`userId`)

---
---

## 2. API Endpoints Needed

### 2.1 Authentication & User Management

#### `POST /api/auth/register`
Registers a new user account.
*   **Request Body**:
    ```json
    {
      "role": "coordinator",
      "fullName": "Jean Habimana",
      "email": "jean@su.rw",
      "phone": "+250 788 005 005",
      "region": "Southern Province",
      "department": "Outreach",
      "position": "Field Coordinator",
      "password": "SecurePassword@123"
    }
    ```
*   **Success Response** (`201 Created`):
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "user": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Jean Habimana",
        "email": "jean@su.rw",
        "role": "coordinator",
        "region": "Southern Province",
        "department": "Outreach",
        "avatar": "JH"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Error Response** (`400 Bad Request`):
    ```json
    {
      "success": false,
      "error": "Email already exists or password does not meet security requirements"
    }
    ```

#### `POST /api/auth/login`
Authenticates a user and returns JWT tokens.
*   **Request Body**:
    ```json
    {
      "email": "admin@su.rw",
      "password": "Admin@123"
    }
    ```
*   **Success Response** (`200 OK`):
    ```json
    {
      "success": true,
      "user": {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Emmanuel Habimana",
        "email": "admin@su.rw",
        "role": "admin",
        "region": "Kigali City",
        "department": "Administration",
        "avatar": "EH",
        "mfaEnabled": true
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Error Response** (`401 Unauthorized`):
    ```json
    {
      "success": false,
      "error": "Invalid email or password"
    }
    ```

#### `POST /api/auth/logout`
Invalidates the active session/refresh token.
*   **Request Header**: `Authorization: Bearer <token>`
*   **Success Response** (`200 OK`):
    ```json
    { "success": true, "message": "Logged out successfully" }
    ```

#### `POST /api/auth/forgot-password`
Initiates password reset workflow.
*   **Request Body**: `{ "email": "staff@su.rw" }`
*   **Success Response** (`200 OK`):
    ```json
    { "success": true, "message": "Password reset link sent to email" }
    ```

#### `GET /api/users/me`
Retrieves current authenticated user profile.
*   **Request Header**: `Authorization: Bearer <token>`
*   **Success Response** (`200 OK`): `User` object.

#### `PUT /api/users/me`
Updates current user profile information.
*   **Request Body**: `{ "name": "Emmanuel H.", "phone": "+250 788 001 002", "notifPrefs": {...} }`
*   **Success Response** (`200 OK`): Updated `User` object.

#### `PUT /api/users/me/password`
Updates user password.
*   **Request Body**: `{ "currentPassword": "Admin@123", "newPassword": "NewStrongPassword#2025" }`
*   **Success Response** (`200 OK`): `{ "success": true, "message": "Password updated successfully" }`

#### `GET /api/users`
Retrieves paginated, filtered user list (Admin only).
*   **Query Parameters**: `search=Emmanuel`, `role=admin`, `status=active`, `page=1`, `limit=10`
*   **Success Response** (`200 OK`):
    ```json
    {
      "success": true,
      "data": [ /* Array of User objects */ ],
      "pagination": { "total": 8, "page": 1, "limit": 10, "totalPages": 1 }
    }
    ```

#### `PATCH /api/users/:id/status`
Toggles user status between active and inactive (Admin only).
*   **Request Body**: `{ "status": "inactive" }`
*   **Success Response** (`200 OK`): `{ "success": true, "message": "User status updated" }`

#### `DELETE /api/users/sessions/:sessionId` `[ASSUMPTION]`
Terminates an active user session (Admin only).
*   **Success Response** (`200 OK`): `{ "success": true, "message": "Session terminated" }`

---

### 2.2 Activity Reports

#### `GET /api/reports`
Retrieves paginated, filtered activity reports.
*   **Query Parameters**: `region=Kigali City`, `department=Youth Ministry`, `status=approved`, `type=Outreach`, `startDate=2025-05-01`, `endDate=2025-05-31`, `page=1`, `limit=10`
*   **Success Response** (`200 OK`):
    ```json
    {
      "success": true,
      "data": [ /* Array of Report objects */ ],
      "pagination": { "total": 38, "page": 1, "limit": 10, "totalPages": 4 }
    }
    ```

#### `GET /api/reports/:id`
Retrieves full details of a specific report including attachments.
*   **Success Response** (`200 OK`): Full `Report` object with populated `attachments`.

#### `POST /api/reports`
Submits a new activity report. Supports `Idempotency-Key` header.
*   **Request Body**:
    ```json
    {
      "title": "Kigali Youth Outreach Program",
      "type": "Outreach",
      "region": "Kigali City",
      "department": "Youth Ministry",
      "date": "2025-05-01",
      "duration": "6 hours",
      "location": "Kimironko, Kigali",
      "status": "submitted",
      "participants": 124,
      "demographics": { "male": 58, "female": 66, "youth": 89, "adults": 35 },
      "description": "Successfully conducted youth outreach...",
      "outcomes": "Strong interest in Bible study groups...",
      "challenges": "Limited venue space...",
      "prayerRequests": "Pray for follow-up...",
      "attachmentIds": ["doc-uuid-1", "doc-uuid-2"]
    }
    ```
*   **Success Response** (`201 Created`): Created `Report` object.

#### `PUT /api/reports/:id`
Updates an existing draft report.
*   **Request Body**: Partial or complete report fields.
*   **Success Response** (`200 OK`): Updated `Report` object.

#### `PATCH /api/reports/:id/status`
Updates report workflow status (Approve/Return — Manager/Admin only).
*   **Request Body**: `{ "status": "approved", "comments": "Excellent outreach results." }`
*   **Success Response** (`200 OK`): `{ "success": true, "status": "approved" }`

#### `POST /api/reports/ai-analyze` `[ASSUMPTION]`
Triggers asynchronous AI analysis on pending reports.
*   **Success Response** (`202 Accepted`): `{ "success": true, "message": "AI analysis job queued", "jobId": "job-123" }`

#### `PATCH /api/reports/:id/ai-override`
Manually overrides AI classification for a report.
*   **Request Body**: `{ "aiCategory": "Bible Study" }`
*   **Success Response** (`200 OK`): `{ "success": true, "message": "AI classification overridden", "reportId": 1 }`

#### `GET /api/reports/analytics/summary`
Retrieves aggregated statistics for the analytics dashboard.
*   **Query Parameters**: `period=monthly`, `region=all`
*   **Success Response** (`200 OK`):
    ```json
    {
      "success": true,
      "monthlyTrend": [ { "month": "Jan", "reports": 28, "approved": 22, "participants": 890 }, ... ],
      "byRegion": [ { "region": "Kigali City", "reports": 38, "participants": 1240 }, ... ],
      "byType": [ { "type": "Outreach", "count": 38, "color": "#2e7d32" }, ... ],
      "supportTrend": [ { "month": "Jan", "submitted": 8, "resolved": 6 }, ... ]
    }
    ```

#### `GET /api/reports/consolidated`
Generates data for consolidated multi-region/period reports.
*   **Query Parameters**: `period=Monthly`, `startDate=2025-05-01`, `endDate=2025-05-31`, `region=all`, `department=all`
*   **Success Response** (`200 OK`): Aggregated summary metrics, matching reports list, and geographic distribution data.

---

### 2.3 Support Requests

#### `GET /api/support`
Retrieves paginated support requests.
*   **Query Parameters**: `region=all`, `priority=high`, `status=submitted`, `page=1`, `limit=10`
*   **Success Response** (`200 OK`): Paginated `SupportRequest` array.

#### `GET /api/support/:id`
Retrieves specific support request with nested comments.
*   **Success Response** (`200 OK`): `SupportRequest` object with `comments` array.

#### `POST /api/support`
Submits a new support request.
*   **Request Body**: `{ "type": "Material", "title": "Bible Study Materials", "description": "Need 200 workbooks...", "priority": "high", "region": "Northern Province", "deadline": "2025-05-15", "attachmentIds": [] }`
*   **Success Response** (`201 Created`): Created `SupportRequest` object.

#### `PATCH /api/support/:id`
Updates support request status, priority, or assignment (Manager/Admin).
*   **Request Body**: `{ "status": "approved", "assignedToId": "uuid-of-emmanuel" }`
*   **Success Response** (`200 OK`): Updated `SupportRequest` object.

#### `POST /api/support/:id/comments`
Adds a discussion comment to a support request.
*   **Request Body**: `{ "text": "Approved. Will be ready by May 12." }`
*   **Success Response** (`201 Created`): Created `SupportComment` object.

---

### 2.4 Prayer Requests

#### `GET /api/prayer`
Retrieves paginated prayer requests.
*   **Query Parameters**: `region=all`, `theme=Revival`, `status=pending`, `page=1`, `limit=10`
*   **Success Response** (`200 OK`): Paginated `PrayerRequest` array.

#### `POST /api/prayer`
Submits a new prayer request.
*   **Request Body**: `{ "title": "Revival in Eastern Province", "description": "Pray for spiritual awakening...", "type": "Revival", "priority": "high", "anonymous": false }`
*   **Success Response** (`201 Created`): Created `PrayerRequest` object.

#### `PATCH /api/prayer/:id/status`
Updates prayer request status (e.g., marking as answered or prayed for).
*   **Request Body**: `{ "status": "answered" }`
*   **Success Response** (`200 OK`): Updated `PrayerRequest` object.

#### `POST /api/prayer/:id/responses` `[ASSUMPTION]`
Logs a user's commitment to pray for a request.
*   **Request Body**: `{ "message": "Praying for you from Kigali!" }`
*   **Success Response** (`200 OK`): `{ "success": true, "responsesCount": 9 }`

---

### 2.5 Document Repository

#### `GET /api/documents`
Retrieves paginated document metadata.
*   **Query Parameters**: `category=All Documents`, `region=all`, `type=pdf`, `search=Q1`, `page=1`, `limit=10`
*   **Success Response** (`200 OK`): Paginated `Document` array.

#### `POST /api/documents/upload`
Uploads a file to the repository or as a supporting attachment.
*   **Request Header**: `Content-Type: multipart/form-data`
*   **Form Data**: `file` (Binary), `region`, `category`, `tags`
*   **Success Response** (`201 Created`):
    ```json
    {
      "success": true,
      "document": { "id": "doc-uuid-1", "name": "Q1 2025 Consolidated Report.pdf", "url": "https://storage.su.rw/docs/q1-2025.pdf", "sizeBytes": 2516582 }
    }
    ```

#### `GET /api/documents/:id/download`
Retrieves secure download URL and increments the document's download counter.
*   **Success Response** (`200 OK`): `{ "success": true, "downloadUrl": "https://storage.su.rw/docs/q1-2025.pdf?sig=xyz", "downloads": 35 }`

#### `PATCH /api/documents/:id/share`
Toggles document sharing status.
*   **Request Body**: `{ "shared": true }`
*   **Success Response** (`200 OK`): `{ "success": true, "shared": true }`

#### `DELETE /api/documents/:id`
Deletes a document from storage and database (Admin/Owner only).
*   **Success Response** (`200 OK`): `{ "success": true, "message": "Document deleted" }`

---

### 2.6 Security & Audit Logs

#### `GET /api/audit-logs`
Retrieves paginated system audit logs (Admin only).
*   **Query Parameters**: `search=Failed`, `severity=danger`, `page=1`, `limit=20`
*   **Success Response** (`200 OK`): Paginated `AuditLog` array.

#### `GET /api/audit-logs/export` `[ASSUMPTION]`
Generates downloadable CSV/PDF audit trail report (Admin only).
*   **Success Response** (`200 OK`): Binary file stream or download URL.

---

### 2.7 Notifications

#### `GET /api/notifications`
Retrieves current user's notifications.
*   **Success Response** (`200 OK`): Array of `Notification` objects and `unreadCount`.

#### `PATCH /api/notifications/:id/read`
Marks a specific notification as read.
*   **Success Response** (`200 OK`): `{ "success": true }`

#### `PATCH /api/notifications/read-all`
Marks all unread notifications as read for the current user.
*   **Success Response** (`200 OK`): `{ "success": true }`

#### `DELETE /api/notifications/:id`
Dismisses/deletes a notification.
*   **Success Response** (`200 OK`): `{ "success": true }`

---
---

## 3. Authentication & Authorization

### 3.1 Authentication Mechanism
SU Connect utilizes a highly secure, stateless **JSON Web Token (JWT)** architecture paired with robust session management controls:
1.  **Access Token**: Short-lived JWT (e.g., 15-minute expiration) signed with `HS256` or `RS256`. Contains user identity (`id`, `role`, `region`, `department`). Sent via the `Authorization: Bearer <token>` HTTP header.
2.  **Refresh Token** `[ASSUMPTION]`: Long-lived cryptographically secure token (e.g., 7-day expiration) stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Used to obtain new Access Tokens without re-prompting user credentials.

### 3.2 Token Storage & Transmission
*   **Frontend**: In the current frontend prototype, `localStorage.getItem('su-user')` is utilized for rapid prototyping. For production deployment, the frontend will store the Access Token in memory (React state/context) and rely on the backend `HttpOnly` cookie for persistent authentication across sessions.
*   **Transmission**: All API requests requiring authentication must include the header:
    ```http
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    ```

### 3.3 Protected Routes & Role-Based Access Control (RBAC)
The system enforces strict RBAC based on the `PERMISSION_MATRIX` established in `UserManagement.jsx`.

| Feature / Route | Admin | Manager | Staff | Coordinator | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `POST /api/reports` | ✅ | ✅ | ✅ | ✅ | Submit activity reports |
| `PATCH /api/reports/:id/status` | ✅ | ✅ | ❌ | ❌ | Approve/Return submitted reports |
| `GET /api/reports?region=all` | ✅ | ✅ | ❌ | ❌ | View reports across all regions |
| `GET /api/reports/analytics/*` | ✅ | ✅ | ❌ | ❌ | View organizational analytics |
| `GET /api/reports/consolidated` | ✅ | ✅ | ❌ | ❌ | Generate consolidated reports |
| `POST /api/reports/ai-analyze` | ✅ | ✅ | ❌ | ❌ | Trigger AI analysis & overrides |
| `GET /api/users` | ✅ | ❌ | ❌ | ❌ | User management & creation |
| `GET /api/audit-logs` | ✅ | ❌ | ❌ | ❌ | Security audit trail access |
| `POST /api/support` | ✅ | ✅ | ✅ | ✅ | Submit support requests |
| `POST /api/prayer` | ✅ | ✅ | ✅ | ✅ | Submit prayer requests |

---
---

## 4. Validation Rules

### 4.1 Field-Level Validation

| Entity | Field | Validation Rules | Error Message Example |
| :--- | :--- | :--- | :--- |
| **User** | `email` | Required, valid email regex matching `\S+@\S+\.\S+` | "Valid email required" |
| **User** | `name` | Required, `min: 2`, `max: 255` | "Full name is required" |
| **User** | `password` | Required on creation, `min: 8`, must contain uppercase, number, and special char | "Password must be at least 8 characters with 1 number and 1 special character" |
| **Report** | `title` | Required, `min: 5`, `max: 255`, cannot be blank | "Report title is required" |
| **Report** | `type` | Required, must match `ACTIVITY_TYPES` enum | "Activity type is required" |
| **Report** | `region` | Required, must match `REGIONS` enum | "Region is required" |
| **Report** | `date` | Required, valid ISO date string (`YYYY-MM-DD`) | "Activity date is required" |
| **Report** | `description` | Required, `min: 20` characters | "Activity description is required (min 20 chars)" |
| **Support**| `title` | Required, `min: 5`, `max: 255` | "Request title is required" |
| **Support**| `priority` | Required, must match `PRIORITIES` enum | "Select priority level" |
| **Document**| `file` | Required on upload, max size `10MB`, allowed extensions: `pdf, docx, xlsx, zip, jpg, png` | "File size exceeds 10MB limit" |

### 4.2 Business Rules & Domain Constraints
1.  **Segregation of Duties**: Field Coordinators and Staff Members cannot approve their own reports. An attempt by a `staff` or `coordinator` role to call `PATCH /api/reports/:id/status` with `status: 'approved'` will be rejected with `403 Forbidden`.
2.  **Regional Isolation**: Users with `staff` or `coordinator` roles can only view reports, documents, and support requests associated with their assigned region (e.g., a coordinator in 'Southern Province' cannot query `GET /api/reports?region=Northern Province`).
3.  **Draft Ownership**: A report in `draft` status can only be viewed, edited, or submitted by the user who created it (`submittedById`).
4.  **MFA Enforcement**: All users with the `admin` role are required to have MFA enabled. If an admin logs in without MFA configured, the backend restricts their access token permissions to only allow calls to `PUT /api/users/me/mfa` until setup is complete.
5.  **Immutable Audit Trail**: Audit log entries cannot be modified or deleted by any user, including administrators. `DELETE` or `UPDATE` SQL operations on the `audit_logs` table are blocked at the database user permission level.

---
---

## 5. Database Schema Suggestions

### 5.1 Relational Schema (PostgreSQL)
The following DDL defines the optimized PostgreSQL relational schema supporting the SU Connect backend.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'coordinator')),
    region VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    avatar VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notif_prefs JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "inApp": true, "deadlineReminders": true, "reportUpdates": true, "supportUpdates": true, "prayerResponses": false}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_region ON users(role, region);

-- REPORTS TABLE
CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Outreach', 'Bible Study', 'Training', 'Meeting', 'Community Event', 'Prayer Meeting', 'Youth Program')),
    region VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    activity_date DATE NOT NULL,
    duration VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
    submitted_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    participants INTEGER NOT NULL DEFAULT 0,
    demographics JSONB NOT NULL DEFAULT '{"male": 0, "female": 0, "youth": 0, "adults": 0}',
    description TEXT NOT NULL,
    outcomes TEXT,
    challenges TEXT,
    prayer_requests TEXT,
    ai_category VARCHAR(100),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    keywords TEXT[],
    ai_summary TEXT,
    overridden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_region_status ON reports(region, status);
CREATE INDEX idx_reports_activity_date ON reports(activity_date);
CREATE INDEX idx_reports_submitted_by ON reports(submitted_by_id);

-- SUPPORT REQUESTS TABLE
CREATE TABLE support_requests (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Material', 'Financial', 'Personnel', 'Training', 'Prayer', 'Other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    region VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under review', 'approved', 'fulfilled', 'closed')),
    deadline DATE,
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_region_status ON support_requests(region, status);
CREATE INDEX idx_support_requester ON support_requests(requester_id);

-- SUPPORT COMMENTS TABLE
CREATE TABLE support_comments (
    id BIGSERIAL PRIMARY KEY,
    support_request_id BIGINT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_comments_req ON support_comments(support_request_id);

-- PRAYER REQUESTS TABLE
CREATE TABLE prayer_requests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    submitted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_by_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Revival', 'Protection', 'Resources', 'Health', 'Unity', 'Youth', 'Staff', 'General')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'prayed', 'answered')),
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    responses_count INTEGER NOT NULL DEFAULT 0,
    themes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prayer_region_status ON prayer_requests(region, status);

-- DOCUMENTS TABLE
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pdf', 'docx', 'xlsx', 'zip', 'jpg', 'png')),
    size_bytes BIGINT NOT NULL,
    region VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_by_name VARCHAR(255) NOT NULL,
    upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags TEXT[],
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    shared BOOLEAN NOT NULL DEFAULT FALSE,
    downloads INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_category_region ON documents(category, region);

-- LINKING TABLES FOR ATTACHMENTS
CREATE TABLE report_attachments (
    report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, document_id)
);

CREATE TABLE support_attachments (
    support_request_id BIGINT NOT NULL REFERENCES support_requests(id) ON DELETE CASCADE,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (support_request_id, document_id)
);

-- AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_snapshot VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(512) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'danger'))
);

CREATE INDEX idx_audit_logs_time_severity ON audit_logs(event_time, severity);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('report', 'deadline', 'support', 'prayer', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### 5.2 NoSQL Alternative Schema (MongoDB) `[ASSUMPTION]`
If a NoSQL document store like MongoDB is preferred, the schema can be denormalized to embed comments and demographics directly within parent documents for optimized read performance.

```javascript
// Collection: reports
{
  "_id": ObjectId("65f1a2b3c4d5e6f7a8b9c0d1"),
  "title": "Kigali Youth Outreach Program",
  "type": "Outreach",
  "region": "Kigali City",
  "department": "Youth Ministry",
  "date": ISODate("2025-05-01T00:00:00Z"),
  "status": "approved",
  "submittedBy": {
    "userId": ObjectId("65f1a111c4d5e6f7a8b9c000"),
    "name": "Patrick Nkurunziza",
    "avatar": "PN"
  },
  "participants": 124,
  "demographics": { "male": 58, "female": 66, "youth": 89, "adults": 35 },
  "description": "Successfully conducted youth outreach...",
  "outcomes": "Strong interest in Bible study groups...",
  "challenges": "Limited venue space...",
  "prayerRequests": "Pray for follow-up...",
  "aiAnalysis": {
    "category": "Outreach",
    "confidence": 92,
    "keywords": ["ministry", "outreach", "youth", "kigali"],
    "summary": "AI analysis identifies this as a youth outreach...",
    "overridden": false
  },
  "attachments": [
    {
      "documentId": ObjectId("65f1a333c4d5e6f7a8b9c111"),
      "name": "attendance_list.pdf",
      "url": "https://storage.su.rw/docs/att-1.pdf",
      "sizeBytes": 142500
    }
  ],
  "createdAt": ISODate("2025-05-01T14:22:10Z"),
  "updatedAt": ISODate("2025-05-02T09:15:00Z")
}

// Collection: support_requests
{
  "_id": ObjectId("65f1a444c4d5e6f7a8b9c222"),
  "type": "Material",
  "title": "Bible Study Materials — Northern Province",
  "description": "Need 200 printed Bible study workbooks...",
  "requester": {
    "userId": ObjectId("65f1a111c4d5e6f7a8b9c001"),
    "name": "Alice Mukamana"
  },
  "region": "Northern Province",
  "priority": "high",
  "status": "approved",
  "deadline": ISODate("2025-05-15T00:00:00Z"),
  "assignedTo": {
    "userId": ObjectId("65f1a111c4d5e6f7a8b9c002"),
    "name": "Emmanuel Habimana"
  },
  "comments": [
    {
      "commentId": ObjectId("65f1a555c4d5e6f7a8b9c333"),
      "authorId": ObjectId("65f1a111c4d5e6f7a8b9c002"),
      "authorName": "Emmanuel Habimana",
      "text": "Approved. Will be ready by May 12.",
      "createdAt": ISODate("2025-05-02T10:00:00Z")
    }
  ],
  "attachments": [],
  "createdAt": ISODate("2025-04-30T11:20:00Z"),
  "updatedAt": ISODate("2025-05-02T10:00:00Z")
}
```

---
---

## 6. State Management & Frontend Hints

### 6.1 Frontend Caching Strategy
To ensure a highly responsive, premium user experience that mirrors the instant feedback of the current mock implementation, the frontend should utilize a robust asynchronous state management library such as **React Query (@tanstack/react-query)** or **Redux Toolkit Query (RTK Query)** `[ASSUMPTION]`.
*   **Cached Entities**: `reports`, `supportRequests`, `prayerRequests`, `documents`, `analyticsSummary`, `userProfile`.
*   **Stale-While-Revalidate (SWR)**: Queries for `GET /api/reports` and `GET /api/support` should be configured with a `staleTime` of 5 minutes. Background refetches ensure data freshness without blocking UI rendering.
*   **Optimistic Updates**: When a user marks a prayer request as answered (`PATCH /api/prayer/:id/status`) or adds a support comment (`POST /api/support/:id/comments`), the frontend should optimistically update the local cache instantly, rolling back only if the backend returns an error.

### 6.2 API Call Timing (Page Load vs. User Action)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend (React)
    participant BE as Backend API
    participant DB as Database / Cache

    Note over User,DB: Page Load Initialization (Dashboard)
    User->>FE: Navigates to /dashboard
    par Fetch User & Notifications
        FE->>BE: GET /api/users/me
        FE->>BE: GET /api/notifications
    and Fetch Analytics & Reports
        FE->>BE: GET /api/reports/analytics/summary
        FE->>BE: GET /api/reports?limit=5
    end
    BE->>DB: Query tables
    DB-->>BE: Return rows
    BE-->>FE: JSON responses
    FE-->>User: Renders Dashboard UI

    Note over User,DB: User Action Execution (Submit Report)
    User->>FE: Fills ReportForm & clicks Submit
    FE->>BE: POST /api/reports (w/ Idempotency-Key)
    BE->>DB: INSERT INTO reports
    DB-->>BE: Success (id: 42)
    BE-->>FE: 201 Created (Report #42)
    FE->>FE: Invalidate 'reports' cache & show Toast notification
    FE-->>User: Redirects to /reports
```

### 6.3 Idempotency Requirements
To protect against duplicate record creation caused by double-clicking submit buttons or intermittent mobile network retries during field operations:
1.  **Idempotency Key Generation**: When a user opens `ReportForm.jsx` or `SupportForm.jsx`, the frontend generates a unique `UUIDv4` stored in component state as `idempotencyKey`.
2.  **Header Transmission**: The key is sent on submission:
    ```http
    POST /api/reports HTTP/1.1
    Idempotency-Key: c9a646d3-9c61-4cb7-8b39-123456789abc
    ```
3.  **Backend Handling**: The backend checks an in-memory cache (e.g., Redis `[ASSUMPTION]`) for the `Idempotency-Key`. If found, the backend bypasses database insertion and instantly returns the cached `201 Created` response from the initial request.

---
---

## 7. Edge Cases & Constraints

### 7.1 File Upload Limits & Security
*   **Maximum File Size**: Enforced at `10MB` per file at the API Gateway/Reverse Proxy level (e.g., Nginx `client_max_body_size 10M;`) and validated within the backend controller.
*   **Allowed MIME Types**: Strict server-side verification of file headers (magic numbers), rejecting files that do not match allowed extensions (`pdf, docx, xlsx, zip, jpg, png`).
*   **Malware Scanning** `[ASSUMPTION]`: Files uploaded to `DocumentRepository` should pass through an asynchronous ClamAV scanning queue before being marked `status: 'available'` for public/team download.

### 7.2 Rate Limiting Needs
To protect the SU Connect API against brute-force attacks and denial-of-service:
*   **Auth Endpoints** (`/api/auth/login`, `/api/auth/forgot-password`): Maximum **5 requests per 15 minutes** per IP address. Subsequent requests receive `429 Too Many Requests`.
*   **Standard API Routes** (`/api/reports`, `/api/support`): Maximum **120 requests per minute** per authenticated `User.id` or IP address.
*   **AI Analysis Trigger** (`/api/reports/ai-analyze`): Maximum **5 batch requests per hour** per organization admin to prevent excessive LLM API billing.

### 7.3 Real-Time Requirements
Several dynamic features in the frontend imply real-time or near-real-time synchronization:
1.  **Notification Center**: Implemented via **Server-Sent Events (SSE)** or **WebSockets** `[ASSUMPTION]`. When a manager approves a report, the backend instantly pushes a live notification event to the submitting user's active client session.
2.  **AI Analysis Progress**: When `AIAnalysisDashboard.jsx` triggers `runAnalysis`, the backend initiates a background worker job (e.g., Celery/BullMQ `[ASSUMPTION]`) and streams progress percentages (`10%... 50%... 100%`) back to the client via WebSockets.
3.  **Active Session Termination**: In `UserManagement.jsx`, when an admin clicks "Terminate" on an active session, the backend revokes the session token in Redis and emits a WebSocket `session_terminated` event, forcing the target user's browser to instantly execute `logout()` and redirect to `/login`.

---
---

## 8. Example Data Flow

### 8.1 Complete Walkthrough: User Registration & Authentication Flow

This section details the step-by-step lifecycle of a new field coordinator joining Scripture Union Rwanda, registering an account, receiving approval, and obtaining authorization tokens.

```mermaid
sequenceDiagram
    autonumber
    actor Coord as Field Coordinator
    participant FE as Frontend (React)
    participant BE as Backend API (Express/NestJS)
    participant DB as PostgreSQL Database
    participant Log as Audit Logger

    Coord->>FE: Fills Register Form (Role, Name, Email, PW)
    FE->>FE: Client-side validation (PW strength, required fields)
    FE->>BE: POST /api/auth/register
    
    Note over BE,DB: Backend Processing & Security
    BE->>DB: SELECT id FROM users WHERE email = 'jean@su.rw'
    DB-->>BE: 0 rows (Email is unique)
    BE->>BE: Hash password using Bcrypt (cost: 12)
    BE->>DB: INSERT INTO users (name, email, password_hash, role, region, department...)
    DB-->>BE: Returns new User row (id: UUID-1234)
    
    Note over BE,Log: Audit & Token Generation
    BE->>Log: Log event: "User Created: jean@su.rw"
    BE->>BE: Generate JWT Access Token (15m exp)
    BE->>BE: Generate Secure Refresh Token (7d exp)
    BE-->>FE: 201 Created + User Object + Access Token (Set Cookie: RefreshToken)
    
    Note over Coord,FE: Client State Hydration
    FE->>FE: Store User in AuthContext & memory
    FE-->>Coord: Redirects to /dashboard
```

#### Step 1: Client Form Submission
The user (`Jean Habimana`) navigates to `/register`, completes the multi-step form selecting `coordinator` role, `Southern Province`, and inputs their credentials. The client validates password strength and dispatches the payload:
```http
POST /api/auth/register HTTP/1.1
Host: api.su.rw
Content-Type: application/json

{
  "role": "coordinator",
  "fullName": "Jean Habimana",
  "email": "jean@su.rw",
  "phone": "+250 788 005 005",
  "region": "Southern Province",
  "department": "Outreach",
  "position": "Field Coordinator",
  "password": "SecurePassword@2025"
}
```

#### Step 2: Backend Validation & Sanitization
The backend controller intercepts the request, sanitizes string inputs, and verifies that `jean@su.rw` does not already exist in the `users` table.

#### Step 3: Cryptographic Hashing
The backend executes a key-derivation function (e.g., `bcrypt.hash(password, 12)` or `argon2id` `[ASSUMPTION]`) to convert `SecurePassword@2025` into a secure salted hash: `$2b$12$Kix...`.

#### Step 4: Database Persistence
The backend executes the insertion transaction:
```sql
INSERT INTO users (id, name, email, password_hash, role, region, department, position, phone, avatar, status)
VALUES (uuid_generate_v4(), 'Jean Habimana', 'jean@su.rw', '$2b$12$Kix...', 'coordinator', 'Southern Province', 'Outreach', 'Field Coordinator', '+250 788 005 005', 'JH', 'active')
RETURNING id, name, email, role, region, department, avatar;
```

#### Step 5: Token Generation
The backend signs a JWT Access Token containing the user's essential authorization claims:
```json
{
  "sub": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "email": "jean@su.rw",
  "role": "coordinator",
  "region": "Southern Province",
  "iat": 1747598400,
  "exp": 1747599300
}
```
Simultaneously, a cryptographically random Refresh Token string is generated and stored in a backend `user_sessions` table `[ASSUMPTION]`.

#### Step 6: Audit Trail Logging
An immutable record is written to the `audit_logs` table:
```sql
INSERT INTO audit_logs (user_id, user_snapshot, action, resource, ip_address, severity)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Jean Habimana', 'User Created', 'User Registration: jean@su.rw', '196.12.1.5', 'info');
```

#### Step 7: Client Response & Hydration
The backend attaches the Refresh Token as an `HttpOnly` cookie and returns the JSON response:
```http
HTTP/1.1 201 Created
Set-Cookie: su_refresh_token=r1e2f3...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth
Content-Type: application/json

{
  "success": true,
  "user": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "name": "Jean Habimana",
    "email": "jean@su.rw",
    "role": "coordinator",
    "region": "Southern Province",
    "department": "Outreach",
    "avatar": "JH"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
The frontend `AuthProvider` stores `user` in React state, places the `token` in an in-memory API client interceptor, and navigates the user directly to `/dashboard`.

---
*End of Specification.*
