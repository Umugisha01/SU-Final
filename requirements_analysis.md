# SU Connect — System Requirements & Feature Gap Analysis

This document provides a detailed analysis of the **SU Connect** codebase (React Frontend & Django REST Backend) against the user-provided requirements for Modules 2 through 13.

---

## 📊 Summary of Implementation Status

The system is split into a client-side React SPA and a Django REST API. Below is the quick status dashboard of the 12 requested modules:

| Module | Status | Core Gaps / Mocks |
| :--- | :--- | :--- |
| **2. Dashboard Module** | **Fully Implemented** | Fully integrated with dynamic metrics APIs, alerts carousel, and trends chart. |
| **3. Activity Reporting Module** | **Fully Implemented** | Stepper form, demographics, drafts, attachments, and review workflow are fully live. |
| **4. AI Report Analysis Module** | **Partially Implemented** | Backend AI tasks and override APIs are functional. **Gaps**: RAG Chat lacks Frontend UI; Export button is mocked. |
| **5. Reporting Consolidation Module**| **Partially Implemented** | Date ranges, summary stats, map coverage, AI summaries work. **Gaps**: PDF/Word exports and scheduled distribution are missing/mocked. |
| **6. Support Request Module** | **Partially Implemented** | Kanban board, assignment, comments work. **Gaps**: Supporting files uploaded in form are not sent to backend. |
| **7. Regional & Departmental Management**| **Not Well Implemented** | UI displays static comparisons. **Gaps**: Directory, staff management, resource allocation, communication are missing/mocked. |
| **8. Notification & Communication** | **Partially Implemented** | In-app alerts, settings, broadcast validation work. **Gaps**: Frontend lacks WebSocket listeners (uses on-load fetching); SMS is missing. |
| **9. Document & Report Repository** | **Partially Implemented** | Folders, uploads, filters, sharing permissions are live. **Gaps**: Version control, access log detailing, and bulk operations are missing. |
| **10. Reporting & Analytics Module** | **Not Well Implemented** | Graphs display mock analytics. **Gaps**: Custom Report Builder is a dummy layout; exports and scheduling do nothing. |
| **11. Prayer Request Module** | **Fully Implemented** | DB prayer list, anonymous request option, intercessors counter, answered marker work. |
| **12. User & Access Management** | **Partially Implemented** | Approve/reject workflows, region permissions, and user list work. **Gaps**: Terminate session, matrix editor, and CSV import are mocked. |
| **13. Security & Audit Module** | **Not Well Implemented** | Backend logging is active. **Gaps**: Frontend displays mock audit logs, mock MFA checklists, and static compliance settings. |

---

## 🔍 Module-by-Module Detailed Breakdown

### 2. Dashboard Module
* **Status**: **Fully Implemented**
* **Findings**:
  * **Role-Based Views**: Implemented in [Dashboard.jsx](file:///d:/FINAL-Project/Front-End/src/pages/Dashboard.jsx#L275-L281). Dynamically adjusts titles and actions based on user roles (`administrator`, `national_manager`, `regional_coordinator`, `field_officer`).
  * **Summary Cards**: Displays dynamic numbers fetched from the backend (Reports Submitted, Pending Review, Active Users/Participants, Approved Reports) using data mapping [Dashboard.jsx:L88-L95](file:///d:/FINAL-Project/Front-End/src/pages/Dashboard.jsx#L88-L95).
  * **Activity Feed & Deadlines**: Renders recent logs and upcoming deadlines inline.
  * **Quick Actions**: Navigates users to key modules (submit report, view reports, request support) based on permission filters.
  * **System Announcements / Alerts**: Fully implemented with a modal creator for Admins [Dashboard.jsx:L453-L597](file:///d:/FINAL-Project/Front-End/src/pages/Dashboard.jsx#L453-L597) and a sliding carousel warning feed for users.

---

### 3. Activity Reporting Module
* **Status**: **Fully Implemented**
* **Findings**:
  * **Activity Report Submission Form**: Implemented as a 4-step wizard in [ReportForm.jsx](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportForm.jsx) (Details, Content & Outcomes, Attendance, Support & Files).
  * **Form Fields**: Captures title, date, location, duration, activity type (outreach, Bible study, training, meeting, event), description, outcomes, challenges, prayer requests, and file attachments.
  * **Attendance Breakdown**: Form Stage 3 captures total participants and detailed demographics (Male, Female, Youth under 25, Adults 25+) [ReportForm.jsx:L303-L324](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportForm.jsx#L303-L324).
  * **Save as Draft**: Fully supported. Clicking "Save Draft" bypasses required fields validation and saves reports in `draft` status.
  * **Double-Pass Review**: Submitting updates status to `submitted`. Managers or Coordinators can approve (state changes to `approved`) or return with comments (state changes to `returned`) via [ReportDetail.jsx:L62-L86](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportDetail.jsx#L62-L86).
  * **Segregation of Duties**: Django backend validates that users cannot approve or return their own reports [views.py:L135-L137](file:///d:/FINAL-Project/SU-Backend/apps/reports/views.py#L135-L137).

---

### 4. AI Report Analysis Module
* **Status**: **Partially Implemented**
* **Findings**:
  * **Automated Categorization**: Fully implemented on the backend in [ai_service.py:L155-L281](file:///d:/FINAL-Project/SU-Backend/services/ai_service.py#L155-L281). An async Celery task queries a local Ollama model to classify report texts, summarize impacts, and extract keywords.
  * **Fallback Heuristics**: If the local Ollama LLM is offline, a regex-based keyword matching service automatically classifies the activity type [ai_service.py:L54-L85](file:///d:/FINAL-Project/SU-Backend/services/ai_service.py#L54-L85).
  * **Confidence & Overrides**: Reports save confidence scores. National Managers/Admins can select categories to override AI choices in [ReportDetail.jsx:L111-L120](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportDetail.jsx#L111-L120) which calls the backend patch endpoint `/api/reports/:id/ai-override`.
  * **Gaps**: 
    1. **RAG Chat Assistant**: The backend has a robust RAG assistant (`AIChatView` at `/api/reports/ai-chat` calling `AIService.chat_assistant` in [ai_service.py:L425-L663](file:///d:/FINAL-Project/SU-Backend/services/ai_service.py#L425-L663)) which extracts text from PDFs/Word files and answers user questions within role constraints. **However, the Frontend React app has NO UI page or chat layout to access this feature.**
    2. **AI Dashboard Mocks**: The AI Dashboard page ([AIAnalysisDashboard.jsx](file:///d:/FINAL-Project/Front-End/src/pages/ai-analysis/AIAnalysisDashboard.jsx)) operates entirely on mock frontend data and local state overrides instead of fetching/updating reports via backend API services.
    3. **Export Results**: The "Export Analysis" button has no handler.

---

### 5. Reporting Consolidation Module
* **Status**: **Partially Implemented**
* **Findings**:
  * **Consolidation Engine**: Fully implemented in [ConsolidationDashboard.jsx](file:///d:/FINAL-Project/Front-End/src/pages/consolidation/ConsolidationDashboard.jsx). Users select dates, departments, and regions, then click "Generate".
  * **Aggregation**: Dynamically aggregates metrics (total reports, participants, prayer counts) and displays circles on an SVG-based map of Rwandan provinces.
  * **AI Consolidated Summary**: Calls `/api/reports/consolidated` which uses a local LLM or Gemini to summarize all matched activity outcomes in a structured layout [ConsolidationDashboard.jsx:L85-L133](file:///d:/FINAL-Project/Front-End/src/pages/consolidation/ConsolidationDashboard.jsx#L85-L133).
  * **Gaps**:
    1. **Scheduled Consolidation**: No interface or backend celery task exists to set up automatic weekly or monthly summaries.
    2. **Distribution Management**: No email distribution list configurator is implemented.
    3. **Document Exports**: The "Export Word" and "Export PDF" buttons in the report preview modal have no click handlers/logic.

---

### 6. Support Request Management Module
* **Status**: **Partially Implemented**
* **Findings**:
  * **Submission Form**: Form in [SupportForm.jsx](file:///d:/FINAL-Project/Front-End/src/pages/support/SupportForm.jsx) captures title, category (material, financial, personnel, training, prayer, other), description, justification, region, deadline, and recipients list.
  * **Status & Assignments**: A Kanban board and list view in [SupportRequests.jsx](file:///d:/FINAL-Project/Front-End/src/pages/support/SupportRequests.jsx) allow status progression and ticket assignment to specific coordinators.
  * **Comments & Alerts**: Users can chat via comment boxes, triggering in-app alerts on the backend [views.py:L155-L174](file:///d:/FINAL-Project/SU-Backend/apps/support/views.py#L155-L174).
  * **Gaps**:
    1. **File Upload Integration**: Although [SupportForm.jsx](file:///d:/FINAL-Project/Front-End/src/pages/support/SupportForm.jsx#L175-L191) has a visual drag-and-drop file attachment zone, the `handleSubmit` routine completely ignores the `files` array and does not send them to the database or upload service.

---

### 7. Regional & Departmental Management Module
* **Status**: **Not Well Implemented** (Primarily Mocks)
* **Findings**:
  * **Dashboard Layout**: [RegionsDashboard.jsx](file:///d:/FINAL-Project/Front-End/src/pages/regions/RegionsDashboard.jsx) provides regional comparison graphs and stat grids, but relies entirely on hardcoded frontend arrays (`REGIONS_DATA` in line 8).
  * **Role Restriction**: Correctly redirects users who are not `administrator` back to the dashboard, conforming to role requirements.
  * **Gaps**:
    1. **Missing Directory & Profile Management**: No interface exists to edit region details, coordinator profiles, or department configurations.
    2. **Mock Coordinators & Staff**: The coordinators list and staff counts are hardcoded.
    3. **Missing Resource Allocation**: No resource scheduling or allocation tool is present.
    4. **Missing Communication Tools**: No messaging features exist for regional coordinators to chat or broadcast regional alerts.

---

### 8. Notification & Communication Module
* **Status**: **Partially Implemented**
* **Findings**:
  * **Notification Center**: [NotificationCenter.jsx](file:///d:/FINAL-Project/Front-End/src/pages/notifications/NotificationCenter.jsx) lists system alerts, report updates, support updates, and prayer alerts.
  * **Preferences**: Toggles for notification types (reports, support, deadlines, system) are saved in user profiles.
  * **Broadcast Messaging**: Administrators, Managers, and Coordinators can compose broadcast announcements to targeted users within hierarchical bounds [views.py:L144-L207](file:///d:/FINAL-Project/SU-Backend/apps/notifications/views.py#L144-L207).
  * **Gaps**:
    1. **Lack of Real-Time Push UI**: While the backend Daphne ASGI server configuration has Channels group-sending for system alerts [views.py:L269-L276](file:///d:/FINAL-Project/SU-Backend/apps/notifications/views.py#L269-L276), the frontend [NotificationContext.jsx](file:///d:/FINAL-Project/Front-End/src/contexts/NotificationContext.jsx) has no WebSocket client listener. It relies on standard REST polling on page load.
    2. **SMS Integration**: There is no SMS gateway provider or script in the backend, and no SMS connectivity indicators in the UI.

---

### 9. Document & Report Repository Module
* **Status**: **Partially Implemented**
* **Findings**:
  * **Folders & Directory**: Categorizes files in [DocumentRepository.jsx](file:///d:/FINAL-Project/Front-End/src/pages/documents/DocumentRepository.jsx) (Activity Reports, Planning Documents, Training Materials, Policies, etc.).
  * **Upload & Download**: Integrates with `/api/documents` to upload, download, and delete raw documents [views.py:L82-L115](file:///d:/FINAL-Project/SU-Backend/apps/documents/views.py#L82-L115).
  * **Access Control**: Implements region-level isolation or globally shared vaults.
  * **Gaps**:
    1. **No Version Control**: Modifying a document details only updates metadata (name, tags, description), and does not support uploading file revisions.
    2. **No Access Audit Logs**: Download counts are incremented atomically, but the system does not log which specific user performed the download.
    3. **Bulk Operations**: Users cannot select multiple files to delete, share, or download in bulk.
    4. **No Retention Settings**: Retention rules cannot be configured in the UI.

---

### 10. Reporting & Analytics Module
* **Status**: **Not Well Implemented** (Primarily Mocks)
* **Findings**:
  * **Charts**: Renders visual distribution and line trends using Recharts.
  * **Gaps**:
    1. **Mock Analytics**: [AnalyticsDashboard.jsx](file:///d:/FINAL-Project/Front-End/src/pages/analytics/AnalyticsDashboard.jsx) loads data entirely from hardcoded arrays (`mockAnalytics`), completely bypassing backend API analytical data services.
    2. **Dummy Report Builder**: The Custom Report Builder displays dropdowns and instructions, but the "Generate" button triggers no calculations or database queries.
    3. **Missing Automated Scheduling**: The "Schedule Auto-Report" configuration is a non-functional mock button.
    4. **Mock Exports**: Clicking export alert-boxes a timeout message.

---

### 11. Prayer Request Management Module
* **Status**: **Fully Implemented**
* **Findings**:
  * **Submission**: Submits prayer requests to the DB, including an "Anonymous" toggle that hides submitter profiles.
  * **Pledge Prayers**: Clicking "Pray" calls the backend POST `/api/prayer/:id/commit` to record an intercessors pledge.
  * **Status Toggles**: Users/managers can mark requests as Answered, showing an encouragement alert banner.
  * **Gaps**:
    1. **Sharing with Prayer Teams**: Missing specific prayer-team forwarding or group access directories.

---

### 12. User & Access Management Module
* **Status**: **Partially Implemented**
* **Findings**:
  * **User Management Console**: Lists and searches active users. Admins can update roles and regions.
  * **Self-Registration Approval**: Integrates with the backend pending queue (`GET /api/users/pending`). Administrators can click Approve or Reject (which prompts for a rejection reason) [UserManagement.jsx:L95-L124](file:///d:/FINAL-Project/Front-End/src/pages/users/UserManagement.jsx#L95-L124).
  * **Gaps**:
    1. **Mock Session Management**: The Sessions tab lists active logins, but the "Terminate Session" button has no onClick handlers or API integrations. IPs are mock-rendered using the user ID.
    2. **Static Permission Matrix**: The Permission Matrix shows feature access checkboxes as static, read-only emoji tables with no custom configurability.
    3. **Dummy CSV import**: The "Import CSV" button has no upload handler.

---

### 13. Security & Audit Module
* **Status**: **Not Well Implemented** (Primarily Mocks)
* **Findings**:
  * **Backend Audit Logging**: The backend has a robust audit interceptor in [audit_service.py](file:///d:/FINAL-Project/SU-Backend/services/audit_service.py) that logs logins, creations, overrides, and deletions.
  * **Gaps**:
    1. **Frontend Mocks**: The [SecurityAudit.jsx](file:///d:/FINAL-Project/Front-End/src/pages/security/SecurityAudit.jsx) dashboard ignores the backend `/api/audit` database logs entirely, displaying a static array of mock logs (`mockAuditLogs` in line 29) instead.
    2. **Mock MFA Checklist**: Displays a hardcoded list of users and their MFA status, completely bypassing DB profile indicators.
    3. **Static Indicators**: Data encryption indicators and data retention policy tables are static visual tables with no database integrations.

---

## 🛠️ Action Plan & Implementation Guidance

To move the partially implemented and mocked features to production readiness, we recommend the following tasks:

### Phase 1: Connect Frontend Pages to Existing Backend APIs
1. **AI Chat Interface**: Create a RAG Chat UI in the frontend (possibly in the AI page or as a floating panel) that connects to `POST /api/reports/ai-chat`.
2. **Security & Audit Logs**: Modify `SecurityAudit.jsx` to fetch active logs from `GET /api/audit` instead of reading `mockAuditLogs`.
3. **Consolidation PDF/Word Export**: Integrate client-side or server-side libraries (such as `jspdf` or docx-generation API endpoints) to compile the consolidation previews into downloads.

### Phase 2: Complete Backend Logic for Missing Components
1. **Support Attachments**: Modify `SupportForm.jsx` and the support backend views to upload drag-and-dropped files, map them into the `Document` DB model, and attach them to the support request.
2. **Scheduled Jobs & Beats**: Write Celery Beat schedules to run recurring analytical summaries and handle report email/SMS distributions automatically.
