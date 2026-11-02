# SU Connect API - Complete Postman Testing Guide & Reference

> **Base URL:** `http://127.0.0.1:8000`  
> **Django Administration:** `http://127.0.0.1:8000/admin/`  
> **Interactive Swagger UI:** `http://127.0.0.1:8000/api/docs/`  
> **OpenAPI Schema:** `http://127.0.0.1:8000/api/schema/`  

---

## 🚀 Quick Setup in Postman

### 1. Postman Environment Variables
Create an Environment in Postman (e.g., `SU Connect Local`) and define:
| Variable | Initial Value | Current Value | Description |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `http://127.0.0.1:8000` | `http://127.0.0.1:8000` | Local backend address |
| `token` | *(leave empty)* | *(auto-set on login)* | Bearer JWT Access Token |
| `refreshToken` | *(leave empty)* | *(auto-set on login)* | JWT Refresh Token |

### 2. Auto-Token Script (Postman Tests Tab)
Add this script to the **Tests** tab of your `POST /api/auth/login` request in Postman. It will automatically capture and save your JWT access token so every other request authenticates effortlessly:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    if (jsonData.accessToken) {
        pm.environment.set("token", jsonData.accessToken);
        console.log("Token saved to environment:", jsonData.accessToken);
    }
}
```

### 3. Collection Authorization Setup
In your Postman Collection settings:
- **Type:** `Bearer Token`
- **Token:** `{{token}}`
- All requests inside the collection will inherit this token automatically!

---

## 🔑 Default Test Accounts

| Role | Email | Password | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@su.rw` | `Admin@123` | Full access, system health, user approvals, audit logs |
| **National Manager** | `manager@su.rw` | `Manager@123` | All regions, reports review, broadcast notices |
| **Regional Coordinator** | `david.m@su.rw` | `Admin@123` | Kigali City / Regional scope |
| **Field Officer** | `jean@su.rw` | `Admin@123` | Kigali City / Field level reports & support requests |

---

## 1. System, Docs & Health

### 1.1 Root Redirection
* **Method:** `GET`
* **URL:** `{{baseUrl}}/`
* **Description:** Directly redirects (HTTP 302) to the Django Administration dashboard (`/admin/`).
* **Expected Response:** `302 Found` with `Location: /admin/`

### 1.2 System Health & API Directory
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/status/`
* **Headers:** `Content-Type: application/json`
* **Expected Response:** `200 OK`
```json
{
  "status": "online",
  "service": "SU Connect API",
  "version": "1.0.0",
  "endpoints": {
    "admin": "/admin/",
    "docs": "/api/docs/",
    "schema": "/api/schema/",
    "auth": "/api/auth/",
    "reports": "/api/reports/"
  }
}
```

### 1.3 Interactive Swagger Docs UI
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/docs/`
* **Expected Response:** `200 OK` (HTML Swagger page)

### 1.4 OpenAPI 3.0 Schema
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/schema/`
* **Expected Response:** `200 OK` (OpenAPI YAML/JSON)

---

## 2. Authentication (`/api/auth/`)

### 2.1 Login & Obtain JWT Token
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "email": "admin@su.rw",
  "password": "Admin@123"
}
```
* **Expected Response:** `200 OK`
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "email": "admin@su.rw",
    "name": "Emmanuel Habimana",
    "role": "administrator"
  }
}
```

### 2.2 Register New User
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/register`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "fullName": "Kagabo Frank",
  "email": "frank.kagabo@su.rw",
  "password": "Password123!",
  "role": "field_officer",
  "region": "Eastern Province",
  "department": "Youth Ministry",
  "position": "Field Coordinator",
  "phone": "+250788990011",
  "location": "Rwamagana"
}
```
* **Expected Response:** `201 Created`

### 2.3 Refresh Access Token
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/refresh`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "refresh": "{{refreshToken}}"
}
```
* **Expected Response:** `200 OK`

### 2.4 Heartbeat Check
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/auth/heartbeat`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`
```json
{
  "authenticated": true,
  "user": "admin@su.rw"
}
```

### 2.5 View Active Sessions
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/auth/sessions`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 2.6 Revoke All Other Sessions
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/sessions/revoke`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 2.7 MFA Setup
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/mfa/setup`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK` (Provides secret & QR base64)

### 2.8 Logout
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/auth/logout`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

---

## 3. Users Management (`/api/users/`)

### 3.1 Get Current User Profile (`/me`)
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/users/me`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 3.2 Update Current User Profile
* **Method:** `PUT`
* **URL:** `{{baseUrl}}/api/users/me`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "name": "Emmanuel Habimana",
  "phone": "+250788001001",
  "location": "Kigali HQ"
}
```
* **Expected Response:** `200 OK`

### 3.3 Change Password
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/users/me/password`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewAdminPassword123!"
}
```

### 3.4 User Directory
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/users/directory`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 3.5 List Pending User Registrations (Admin Only)
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/users/pending`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 3.6 Approve User Registration (Admin Only)
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/users/{{userId}}/approve`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 3.7 Reject User Registration (Admin Only)
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/users/{{userId}}/reject`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "reason": "Incomplete organizational affiliation details."
}
```
* **Expected Response:** `200 OK`

---

## 4. Reports (`/api/reports/`)

### 4.1 List Reports
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/reports/?page=1&status=submitted`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 4.2 Create New Report
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/reports/`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "title": "Kigali Youth Outreach Report",
  "activity_type": "Youth Ministry",
  "region": "Kigali City",
  "department": "Youth",
  "date": "2026-11-01",
  "duration": "4 hours",
  "location": "Remera Stadium",
  "attendance": 180,
  "demographics": {
    "male": 85,
    "female": 95,
    "youth": 150,
    "adults": 30
  },
  "summary": "Inspiring fellowship event reaching youth across Kigali schools.",
  "key_achievements": "180 students attended, 35 committed their lives to Christ.",
  "challenges": "Transportation delays due to heavy afternoon rain.",
  "prayer_points": "Pray for effective follow-up discipleship materials."
}
```
* **Expected Response:** `201 Created`

### 4.3 Get Report Detail
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/reports/1`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 4.4 Update Report Status (Approve / Reject)
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/reports/1/status`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "status": "approved",
  "comment": "Comprehensive report with outstanding outreach impact."
}
```
* **Expected Response:** `200 OK`

### 4.5 AI Analyze Report
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/reports/ai-analyze`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "report_id": 1
}
```
* **Expected Response:** `200 OK` or `202 Accepted`

### 4.6 Reports Analytics & Monthly Trend Summary
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/reports/analytics/summary`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 4.7 AI Chat Assistant
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/reports/ai-chat`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "message": "Summarize the high-priority outreach trends across Kigali and Northern Province.",
  "documentIds": []
}
```
* **Expected Response:** `200 OK`

### 4.8 Ollama / AI Engine Status
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/reports/ai-status`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

---

## 5. Dashboards (`/api/dashboard/`)

### 5.1 System Infrastructure Health
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/system-health/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`
```json
{
  "success": true,
  "apiStatus": "online",
  "dbStatus": "connected",
  "redisStatus": "online",
  "celeryStatus": "active",
  "timestamp": "2026-11-02T09:50:00Z"
}
```

### 5.2 Admin Dashboard Overview
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/admin/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 5.3 Manager Dashboard Overview
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/manager/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 5.4 Coordinator Dashboard Overview
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/coordinator/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 5.5 Field Officer Dashboard Overview
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/field-officer/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 5.6 Recent System Activity
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/recent-activity/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 5.7 AI Strategic Insights
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/dashboard/ai-insights/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

---

## 6. Support Requests (`/api/support/`)

### 6.1 List Support Requests
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/support/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 6.2 Submit Support Request
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/support/`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "title": "Need 200 Scripture Bibles for Musanze Secondary Mission",
  "description": "Preparing upcoming youth camp at Musanze. Currently short of Kinyarwanda youth study bibles.",
  "priority": "high",
  "department": "Resource Center",
  "region": "Northern Province",
  "needed_by": "2026-11-15"
}
```
* **Expected Response:** `201 Created`

### 6.3 Assign Support Request
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/support/1/assign`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "assigned_to": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}
```
* **Expected Response:** `200 OK`

### 6.4 Add Comment to Support Request
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/support/1/comments`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "comment": "Books have been dispatched via regional courier."
}
```
* **Expected Response:** `200 OK`

---

## 7. Prayer Requests (`/api/prayer/`)

### 7.1 List Prayer Requests
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/prayer/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 7.2 Post Prayer Request
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/prayer/`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "title": "Peace & Provision for Regional Staff Retreat",
  "request": "Praying for spiritual renewal, travel protection, and unity for all coordinators attending.",
  "region": "All Regions",
  "is_anonymous": false
}
```
* **Expected Response:** `201 Created`

### 7.3 Commit to Pray
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/prayer/1/commit`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

---

## 8. Documents Repository (`/api/documents/`)

### 8.1 List Documents
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/documents/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 8.2 Upload Document (multipart/form-data)
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/documents/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Body (form-data):**
  - `title`: `Annual Operations Plan 2026`
  - `category`: `Policy`
  - `region`: `All Regions`
  - `file`: *(select file from your computer)*
* **Expected Response:** `201 Created`

---

## 9. Notifications & Broadcasts (`/api/notifications/`)

### 9.1 List My Notifications
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/notifications/`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 9.2 Mark Notifications as Read
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/notifications/mark-read`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`

### 9.3 Send Broadcast Notification (Manager / Admin Only)
* **Method:** `POST`
* **URL:** `{{baseUrl}}/api/notifications/broadcast`
* **Headers:** `Authorization: Bearer {{token}}`, `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "title": "Monthly General Assembly Reminder",
  "message": "All staff and regional coordinators are invited to this Thursday's virtual assembly.",
  "target_type": "all_staff",
  "priority": "normal"
}
```
* **Expected Response:** `200 OK`

---

## 10. Audit Logs (`/api/audit/`)

### 10.1 List System Audit Logs (Admin Only)
* **Method:** `GET`
* **URL:** `{{baseUrl}}/api/audit/?page=1`
* **Headers:** `Authorization: Bearer {{token}}`
* **Expected Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": "admin@su.rw",
      "action": "LOGIN_SUCCESS",
      "ip_address": "127.0.0.1",
      "timestamp": "2026-11-02T09:40:00Z"
    }
  ],
  "pagination": {
    "total": 52,
    "page": 1,
    "pages": 6
  }
}
```

---

## ⚡ How to Import Directly into Postman

You can import all these endpoints in **one step**:
1. Open Postman.
2. Click **Import** (top-left button).
3. Select **File** and choose:
   `D:\FINAL-Project\SU-Backend\su_connect_postman_collection.json`
4. All folders (`Auth`, `Users`, `Reports`, `Dashboards`, `Support`, `Prayer`, `Documents`, `Notifications`, `Audit`) will instantly appear in your Postman sidebar with pre-filled headers and bodies!
