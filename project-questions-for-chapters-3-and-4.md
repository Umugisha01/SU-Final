# Questions and Answers for Chapters 3 & 4: SU Connect

This document contains detailed and accurate answers for the Scripture Union Rwanda Connect (**SU Connect**) system, structured for direct inclusion in Chapter 3 (Requirements Analysis and Design) and Chapter 4 (Implementation and Testing).

---

# SECTION A: ANSWERS FOR CHAPTER 3 (DESIGN)

## PART 1: PROJECT BASICS (Chapter 3 Introduction)

### 1. What is the full name of your system?
The full name of the system is **SU Connect** (Scripture Union Rwanda Connect).

### 2. What organization is this system being built for?
The system is custom-built for **Scripture Union Rwanda (SU Rwanda)**, a non-profit Christian organization operating across five geographic regions in Rwanda (Kigali City, Northern Province, Eastern Province, Southern Province, and Western Province).

### 3. What specific problem does your system solve that the current/manual process cannot?
SU Rwanda's field operations suffered from severe delays and administrative friction due to manual processes:
- **Delayed Reporting & Consolidation:** Report submissions from five regions were sent via paper or unstructured emails, taking several weeks for managers to consolidate manually.
- **Lack of Data Validation:** Numeric data (attendee counts, gender, age distributions) lacked verification, resulting in invalid report totals.
- **Inadequate Regional Isolation:** Any staff member could access files and reports from other regions, violating organizational confidentiality and data privacy guidelines.
- **Unstructured Support Prioritization:** Requests for resources (finances, equipment, training, spiritual guides) were queued on a first-come, first-served basis, delaying critical emergencies.
- **Fragmented Prayer Commitments:** Scripture Union's spiritual core relies on shared prayer, but there was no structured way to list prayer requests or track commitments.

**SU Connect** solves these problems by digitizing the workflows with role-based access control (RBAC), strict regional database isolation, automated demographics validation, and an **offline local AI model (Ollama with `qwen2.5vl:3b`)** that automatically categorizes reports, analyzes support requests to recommend priority levels, and facilitates natural language queries on regional reports via Retrieval-Augmented Generation (RAG).

### 4. What are the key regulatory or compliance requirements your system must address?
- **Data Protection & PII Scrubbing:** Compliance with the Rwanda Law No. 058/2021 of 13/10/2021 relating to the protection of personal data. Before transmitting text to the local LLM or saving summary logs, names, phone numbers, and email addresses are automatically sanitized using regex filters.
- **Segregation of Duties:** An operator cannot approve, reject, or return a report or support request they created themselves.
- **Role-Based Access Control (RBAC):** Restricting data queries by role and region. Field officers and coordinators are locked to their own regions at the database level.
- **Administrative Audit Trail:** Maintaining immutable compliance logs of CRUD operations, user role updates, overrides, and security events.

### 5. What are the main limitations of the current process that your system fixes?
- **Manual paperwork:** Replaced by reactive digital forms that dynamically validate participant sums.
- **Slow consolidation:** Replaced by an automated multi-report summarization tool that aggregates regional metrics and outputs printable PDF/CSV formats.
- **Slow urgency classification:** Replaced by real-time semantic analysis to identify emergency terms and tag them as "Urgent" or "High" priority.
- **Uncontrolled document storage:** Replaced by a regional document repository with strict sharing flags.

---

## PART 2: ACTORS (Users & Roles)

### 6. What is the actor's name/title?
The system defines four main actors:
1. **Field Officer (`field_officer`)**
2. **Regional Coordinator (`regional_coordinator`)**
3. **National Manager (`national_manager`)**
4. **Administrator (`administrator`)**

### 7. What can this actor DO in the system?
- **Field Officer:** Can draft, edit, and submit activity reports; upload supporting files; create support requests; request AI priority suggestions for support tickets; submit prayer requests; commit to pray for others.
- **Regional Coordinator:** Can review, approve, and return submitted reports in their region; view regional performance metrics; manually override AI report categories; trigger Celery AI analysis; write comments on regional support requests; assign tickets.
- **National Manager:** Can view nationwide reports and summaries; generate consolidated reports; review national trend analyses; view system-wide support tickets; post global announcements.
- **Administrator:** Can manage users; approve new registrations; alter user roles/regions; review system-wide audit logs; monitor system health (Redis, Celery, DB, memory).

### 8. What specific portal or dashboard does this actor see when they log in?
- **Field Officer:** Sees the Field Officer Dashboard containing:
  - Personal KPI cards (Total Submitted, Approved, Returned, Drafts).
  - Attendance/Reach chart (demographics breakdown).
  - Interactive "My Recent Activity" list (limited to 3 items per page with custom React pagination).
  - Personal deadline calendar widget.
- **Regional Coordinator:** Sees the Coordinator Dashboard containing:
  - Regional statistics (Active field officers, pending report counts, monthly target progress).
  - Interactive table of submitted reports awaiting regional review.
  - Regional support requests queue.
  - Team Activity feed.
- **National Manager:** Sees the Manager Dashboard containing:
  - National Reach metrics (Line and Bar charts using Recharts).
  - System-wide activity timelines.
  - AI Operational Insights feed.
  - Urgent alerts panel.
- **Administrator:** Sees the Admin Dashboard containing:
  - System Health status indicator (DB connection, Celery worker status, Redis ping).
  - Registrations approval queue.
  - Security audit widget.

### 9. What restrictions does this actor have?
- **Field Officer:** Cannot approve or return reports; cannot view other users' drafts; cannot view documents/reports from other regions; cannot access admin panels or manage users.
- **Regional Coordinator:** Restricted strictly to their assigned region; cannot view data from other provinces; cannot alter user accounts or view system-wide security audits; cannot approve their own reports.
- **National Manager:** View-only access to operational reports (cannot create or edit reports); cannot alter user roles, database records, or view server configurations.
- **Administrator:** Prevented from submitting operational field reports (limited purely to administrative and monitoring roles).

---

## PART 3: USE CASES (Functions)

### 10-16. Core Functions Details

#### Use Case 1: User Authentication & Security
- **10. Function Name:** User Authentication (Register, Login, MFA, Password Reset)
- **11. Actors:** All Actors
- **12. Description:** Registers users, validates passwords, handles email verification, prompts for Multi-Factor Authentication (MFA) via TOTP, and locks accounts after 5 failed attempts.
- **13. Pre-condition:** User must have a registered email and access to a TOTP application (if MFA enabled).
- **14. Post-condition:** Session JWT is issued, and the user is redirected to their role dashboard.
- **15. Normal Flow:** User inputs credentials → Server checks passwords → Verifies MFA status → Issues JWT.
- **16. Alternative Flow:** 5 failed attempts → Account locked for 15 minutes (`locked_until` timestamp set in DB).

#### Use Case 2: Submit Activity Report
- **10. Function Name:** Submit Activity Report
- **11. Actors:** Field Officer
- **12. Description:** Compiles and submits outreach metrics, participant counts, demographics, and textual descriptions.
- **13. Pre-condition:** Report must exist as a "Draft".
- **14. Post-condition:** Report status is set to "Submitted" and queued for AI analysis.
- **15. Normal Flow:** Officer fills details → Frontend validates demographics sum → Submits → Celery starts background AI analysis.
- **16. Alternative Flow:** If Ollama server is offline, the system falls back to regex-based heuristics for categorization.

#### Use Case 3: Review Report (Approve/Return)
- **10. Function Name:** Review Report
- **11. Actors:** Regional Coordinator, National Manager
- **12. Description:** Approves a submitted report or returns it for correction with review comments.
- **13. Pre-condition:** Report must be in "Submitted" status and match the coordinator's region.
- **14. Post-condition:** Report status updates to "Approved" or "Returned".
- **15. Normal Flow:** Coordinator opens report → Adds comments → Clicks "Approve" or "Return" → Status saves.
- **16. Alternative Flow:** Segregation of duties error triggered if coordinator attempts to approve their own report.

#### Use Case 4: AI Report RAG Chat
- **10. Function Name:** Query Regional RAG Chat
- **11. Actors:** All Actors (within role boundaries)
- **12. Description:** Natural language query widget where users ask questions about regional activities.
- **13. Pre-condition:** User is authenticated.
- **14. Post-condition:** Response generated based on the database reports.
- **15. Normal Flow:** User types question → Backend queries reports filtered by user's region → Prepares prompt context → Ollama returns answer.
- **16. Alternative Flow:** If user attaches an image, RAG context is skipped to speed up CPU inference.

#### Use Case 5: Submit Support Request with AI priority
- **10. Function Name:** Request Resource Support
- **11. Actors:** Field Officer
- **12. Description:** Submits a request for resources, optionally utilizing Ollama to classify priority.
- **13. Pre-condition:** User is logged in as a Field Officer.
- **14. Post-condition:** Request is saved with an assigned priority and computed deadline.
- **15. Normal Flow:** User drafts request → Clicks "Get AI Suggestion" → Ollama analyzes and returns priority and reason → User submits.
- **16. Alternative Flow:** Fallback heuristics engine classifies request based on keyword search.

#### Use Case 6: Document Upload & Share
- **10. Function Name:** Document Repository Upload
- **11. Actors:** All Actors
- **12. Description:** Uploads PDF, docx, xlsx, or images to support reports.
- **13. Pre-condition:** Supporting document selected.
- **14. Post-condition:** Document saved to local disk, storage key linked to report.
- **15. Normal Flow:** User selects file → Backend saves to media folder → Records filename, size, and type in database.
- **16. Alternative Flow:** Upload fails if file size exceeds limits or extension is blacklisted.

#### Use Case 7: Add Prayer Request & Commitments
- **10. Function Name:** Share Prayer Item
- **11. Actors:** Field Officer, Regional Coordinator
- **12. Description:** Creates prayer requests. Other users can click "Commit to Pray".
- **13. Pre-condition:** Authenticated.
- **14. Post-condition:** Request visible on wall; commitments incremented.
- **15. Normal Flow:** User posts prayer request → Visibility selected → Another user clicks pray → Commitment count increments.
- **16. Alternative Flow:** Visibility set to "regional" filters out users outside the province.

---

## PART 4: CLASS DIAGRAM (Data Structure)

### 17. Entity name
The data structure contains 10 core entities:
1. `User`
2. `Report`
3. `SupportRequest`
4. `SupportComment`
5. `PrayerRequest`
6. `PrayerCommitment`
7. `Document`
8. `AuditLog`
9. `Notification`
10. `SystemAlert`

### 18. List ALL attributes/fields
- **`User`**: `id` (UUID), `name` (varchar 255), `email` (EmailField), `role` (choice), `region` (varchar 100), `department` (varchar 100), `position` (varchar 100), `phone` (varchar 30), `avatar` (varchar 10), `status` (choice), `location` (varchar 255), `failed_login_attempts` (int), `locked_until` (datetime), `email_verified` (bool), `verification_token` (UUID), `last_activity` (datetime), `session_id` (varchar 255), `mfa_enabled` (bool), `mfa_secret` (varchar 255), `last_login` (datetime), `join_date` (date), `notif_prefs` (JSONField), `created_at` (datetime), `updated_at` (datetime).
- **`Report`**: `id` (int), `title` (varchar 255), `type` (choice), `region` (varchar 100), `department` (varchar 100), `date` (DateField db_column `activity_date`), `duration` (varchar 100), `location` (varchar 255), `status` (choice), `submitted_by` (FK User), `participants` (int), `demographics` (JSONField), `description` (TextField), `outcomes` (TextField), `challenges` (TextField), `prayer_requests` (TextField), `ai_category` (varchar 100), `confidence` (int), `keywords` (JSONField), `ai_summary` (TextField), `overridden` (bool), `submitted_at` (datetime), `approved_at` (datetime), `returned_at` (datetime), `created_at` (datetime), `updated_at` (datetime).
- **`SupportRequest`**: `id` (int), `title` (varchar 255), `category` (choice), `description` (TextField), `urgency` (choice), `status` (choice), `ai_priority` (choice), `ai_priority_confidence` (int), `ai_priority_reason` (TextField), `ai_analyzed_at` (datetime), `manual_priority_override` (bool), `requester` (FK User), `assigned_to` (FK User), `deadline` (date), `region` (varchar 100), `created_at` (datetime), `updated_at` (datetime).
- **`SupportComment`**: `id` (int), `request` (FK SupportRequest), `user` (FK User), `comment` (TextField), `created_at` (datetime).
- **`PrayerRequest`**: `id` (int), `title` (varchar 255), `request` (TextField), `status` (choice), `visibility` (choice), `requester` (FK User), `region` (varchar 100), `commitments_count` (int), `created_at` (datetime), `updated_at` (datetime).
- **`PrayerCommitment`**: `id` (int), `request` (FK PrayerRequest), `user` (FK User), `notes` (TextField), `created_at` (datetime).
- **`Document`**: `id` (int), `name` (varchar 255), `type` (varchar 100), `size` (BigIntegerField), `storage_key` (varchar 510), `uploaded_by` (FK User), `downloads` (int), `shared` (bool), `category` (varchar 100), `description` (TextField), `tags` (varchar 255), `created_at` (datetime), `updated_at` (datetime).
- **`AuditLog`**: `id` (int), `user` (FK User), `user_snapshot` (varchar 255), `action` (varchar 255), `resource` (varchar 255), `ip` (varchar 45), `severity` (choice), `created_at` (datetime).
- **`Notification`**: `id` (int), `user` (FK User), `type` (choice), `title` (varchar 255), `message` (TextField), `icon` (varchar 50), `read` (bool), `created_at` (datetime).
- **`SystemAlert`**: `id` (int), `title` (varchar 255), `message` (TextField), `priority` (choice), `is_announcement` (bool), `expires_at` (datetime), `created_at` (datetime), `created_by` (FK User).

### 19. What is the primary key?
- `User`: `id` (UUID)
- All other entities (`Report`, `SupportRequest`, `SupportComment`, `PrayerRequest`, `PrayerCommitment`, `Document`, `AuditLog`, `Notification`, `SystemAlert`): `id` (Auto-incrementing Integer).

### 20. What foreign keys does it have?
- `Report`: `submitted_by` references `User.id` (RESTRICT).
- `SupportRequest`: `requester` references `User.id` (RESTRICT), `assigned_to` references `User.id` (SET_NULL).
- `SupportComment`: `request` references `SupportRequest.id` (CASCADE), `user` references `User.id` (RESTRICT).
- `PrayerRequest`: `requester` references `User.id` (RESTRICT).
- `PrayerCommitment`: `request` references `PrayerRequest.id` (CASCADE), `user` references `User.id` (RESTRICT).
- `Document`: `uploaded_by` references `User.id` (RESTRICT).
- `AuditLog`: `user` references `User.id` (SET_NULL).
- `Notification`: `user` references `User.id` (CASCADE).
- `SystemAlert`: `created_by` references `User.id` (SET_NULL).

### 21. What methods/functions does this entity have?
- `User`: `save()`, `create_user()`, `create_superuser()`.
- `Report`: `save()`.
- `SupportRequest`: `save()`.
- `PrayerRequest`: `save()`.
- `Document`: `save()`.

---

## PART 5: DATABASE DESIGN (Schema & Tables)

### 22. How many tables does your database have? List them.
The PostgreSQL database has **16 tables** in total:
1. `accounts_user`
2. `reports`
3. `support_requests`
4. `support_comments`
5. `prayer_requests`
6. `prayer_commitments`
7. `documents`
8. `audit_logs`
9. `notifications`
10. `system_alerts`
11. `report_attachments` (Many-to-Many join table for `Report` and `Document`)
12. `user_system_alerts` (Many-to-Many join table for `SystemAlert` and `User`)
13. `reports_recipients` (Many-to-Many join table for report visibility recipients)
14. `support_requests_recipients` (Many-to-Many join table for support request recipients)
15. `accounts_user_groups` (Django standard group join table)
16. `accounts_user_user_permissions` (Django standard permissions join table)

### 23-28. Table details (Sample of core tables)

#### Table 1: `accounts_user`
- **23. Table Name:** `accounts_user`
- **24. Columns & Types:**
  - `id` (uuid, PK)
  - `name` (varchar(255))
  - `email` (varchar(254), UNIQUE)
  - `role` (varchar(50))
  - `region` (varchar(100))
  - `department` (varchar(100))
  - `position` (varchar(100))
  - `phone` (varchar(30), Nullable)
  - `avatar` (varchar(10))
  - `status` (varchar(20))
  - `failed_login_attempts` (integer)
  - `locked_until` (timestamp with time zone, Nullable)
  - `email_verified` (boolean)
  - `mfa_enabled` (boolean)
  - `mfa_secret` (varchar(255), Nullable)
- **25. Primary Key:** `id`
- **26. Foreign Keys:** None
- **27. Cannot be NULL:** `name`, `email`, `role`, `region`, `department`, `position`, `status`, `failed_login_attempts`, `email_verified`, `mfa_enabled`
- **28. Defaults:** `role='regional_coordinator'`, `status='active'`, `failed_login_attempts=0`, `email_verified=false`, `mfa_enabled=false`

#### Table 2: `reports`
- **23. Table Name:** `reports`
- **24. Columns & Types:**
  - `id` (integer auto-increment, PK)
  - `title` (varchar(255))
  - `type` (varchar(50))
  - `region` (varchar(100))
  - `department` (varchar(100))
  - `activity_date` (date)
  - `duration` (varchar(100), Nullable)
  - `location` (varchar(255), Nullable)
  - `status` (varchar(50))
  - `submitted_by_id` (uuid, FK)
  - `participants` (integer)
  - `demographics` (jsonb)
  - `description` (text)
  - `outcomes` (text, Nullable)
  - `challenges` (text, Nullable)
  - `prayer_requests` (text, Nullable)
  - `ai_category` (varchar(100), Nullable)
  - `confidence` (integer, Nullable)
  - `keywords` (jsonb)
  - `ai_summary` (text, Nullable)
  - `overridden` (boolean)
- **25. Primary Key:** `id`
- **26. Foreign Keys:** `submitted_by_id` references `accounts_user(id)`
- **27. Cannot be NULL:** `title`, `type`, `region`, `department`, `activity_date`, `status`, `submitted_by_id`, `participants`, `demographics`, `description`, `keywords`, `overridden`
- **28. Defaults:** `status='draft'`, `participants=0`, `demographics='{"male":0,"female":0,"youth":0,"adults":0}'`, `keywords='[]'`, `overridden=false`

#### Table 3: `support_requests`
- **23. Table Name:** `support_requests`
- **24. Columns & Types:**
  - `id` (integer auto-increment, PK)
  - `title` (varchar(255))
  - `category` (varchar(100))
  - `description` (text)
  - `urgency` (varchar(50))
  - `status` (varchar(50))
  - `ai_priority` (varchar(20), Nullable)
  - `ai_priority_confidence` (integer, Nullable)
  - `ai_priority_reason` (text, Nullable)
  - `requester_id` (uuid, FK)
  - `assigned_to_id` (uuid, FK, Nullable)
  - `deadline` (date, Nullable)
  - `region` (varchar(100))
- **25. Primary Key:** `id`
- **26. Foreign Keys:**
  - `requester_id` references `accounts_user(id)`
  - `assigned_to_id` references `accounts_user(id)`
- **27. Cannot be NULL:** `title`, `category`, `description`, `urgency`, `status`, `requester_id`, `region`
- **28. Defaults:** `urgency='medium'`, `status='submitted'`

---

## PART 6: SEQUENCE DIAGRAMS (Process Flows)

### 29. Process 1: Submission Workflow
```
[ Field Officer ] ──(Fills Form & Clicks Submit)──► [ React SPA ]
                                                          │
   [ Django API ] ◄───────(POST /api/reports/)────────────┘
         │
         ├──(Validates user, region, totals)
         │
         ├──(Saves Report, Status = "submitted")
         │
         ├──(Asynchronously triggers Celery Task)
         │       │
         │       └──► [ Celery Worker ] ──(Scrub PII)──► [ Ollama Service (qwen2.5vl:3b) ]
         │                   │                                      │
         │                   ◄────────(Return JSON Result)──────────┘
         │                   │
         │                   ├──(Saves ai_category, summary, confidence, keywords)
         │                   │
         │                   └──(Emits WebSocket Update) ──► [ React SPA Progress Bar (100%) ]
         │
         ◄──────────────(HTTP 201 Created)──────────────────
```

### 30. Process 2: Review/Approval Workflow
```
[ Coordinator ] ──(Clicks Approve Report)──► [ React SPA ]
                                                    │
   [ Django API ] ◄────(PATCH /api/reports/{id}/status)─┘
         │
         ├──(Verifies Permission: IsCoordinatorOrManagerOrAdmin)
         │
         ├──(Verifies Separation of Duties: User != Submitter)
         │
         ├──(Verifies Regional Isolation: User.region == Report.region)
         │
         ├──(Sets status = "approved")
         │
         ├──(Inserts AuditLog)
         │
         ├──(Creates notification) ──► [ WebSockets ] ──► [ Field Officer SPA Toast ]
         │
         ◄─────────(HTTP 200 OK)─────────────┘
```

### 31. Process 3: AI Chat Assistant Workflow (RAG)
```
[ User ] ──(Types Query in Chat Widget)──► [ React SPA ]
                                                │
   [ Django API ] ◄───────(POST /api/reports/ai-chat/)──┘
         │
         ├──(Loads reports matching user's region)
         │
         ├──(Extracts text from attached PDFs/Word files via pypdf/docx)
         │
         ├──(Builds prompts combining documents text & reports context)
         │
         ├──(Curls local Ollama http://127.0.0.1:11434 with thread caps)
         │        │
         │        └──► [ Ollama (qwen2.5vl:3b) ] ──(Generates text response)
         │                    │
         ◄────────────────────┘
         │
         ◄─────────────(HTTP 200 OK JSON)─────────
```

---

## PART 7: ACTIVITY DIAGRAM (Decision Flow)

### 32. Map the complete flow of a report/support request through the system:
```
                         [START]
                            │
                  (Field Officer logs in)
                            │
               [Create Support Request Form]
                            │
               {Request AI Suggestion Priority?}
                 /                           \
             (Yes)                           (No)
              /                                \
     [Local Ollama Inference]         [Manual priority entry]
     [Display badges & factors]                 │
              \                                /
               └───► [Submit Request] ◄───────┘
                            │
                    (Status: Submitted)
                            │
                    [Celery sends alerts]
                            │
               [Coordinator reviews queue]
                            │
                {Is ticket for my region?}
                 /                       \
             (No)                        (Yes)
              /                            │
      [Access Denied 403]        [Assign & Add Comments]
                                           │
                                  (Status: Under Review)
                                           │
                                  {Action Successful?}
                                    /              \
                                (Yes)              (No)
                                 /                  \
                        [Fulfill Request]      [Reject/Close]
                        (Status: Fulfilled)    (Status: Closed)
                                 │                  │
                         [Notify Officer]       [Archive Log]
                                 \                  /
                                  └───► [END] ◄────┘
```

---

## PART 8: DATA DICTIONARY

### 33-37. Core Data Dictionary

#### Table: `reports`
| Field Name | Data Type & Length | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Unique identifier of the report record. |
| `title` | Varchar(255) | Not Null | User-defined title for the activity report. |
| `type` | Varchar(50) | Not Null, Choices | Outreach, Bible Study, Training, Meeting, etc. |
| `region` | Varchar(100) | Not Null | Geographic region of the activities (e.g. Kigali). |
| `department` | Varchar(100) | Not Null | Ministry department (e.g. Youth, Children). |
| `activity_date` | Date | Not Null (db_column) | Date the activities were conducted. |
| `duration` | Varchar(100) | Nullable | Length of time the activity lasted. |
| `location` | Varchar(255) | Nullable | Venue or exact physical location. |
| `status` | Varchar(50) | Not Null, Default='draft' | Draft, Submitted, Approved, Returned. |
| `submitted_by_id`| UUID | FK references User | Field Officer who compiled/submitted report. |
| `participants` | Integer | Not Null, Default=0 | Count of total attendees present. |
| `demographics` | JSONB | Not Null | attendance split: male, female, youth, adults. |
| `description` | Text | Not Null | Detailed description of actions performed. |
| `outcomes` | Text | Nullable | Outcomes, decisions, and qualitative impact. |
| `challenges` | Text | Nullable | Bottlenecks or difficulties faced. |
| `prayer_requests`| Text | Nullable | Prayer requests generated from the event. |
| `ai_category` | Varchar(100) | Nullable | Category classified by the local LLM. |
| `confidence` | Integer | Nullable, 0 to 100 | Confidence score assigned by the LLM. |
| `keywords` | JSONB | Not Null, Default='[]' | Keyword array extracted from the text by AI. |
| `ai_summary` | Text | Nullable | Summary paragraphs synthesized by AI. |
| `overridden` | Boolean | Not Null, Default=false | True if coordinator edited the AI category. |
| `created_at` | Timestamp | Not Null, Auto_now_add | Date-time report was created. |
| `updated_at` | Timestamp | Not Null, Auto_now | Date-time report was last modified. |

---

## PART 9: SYSTEM ARCHITECTURE

### 38. What is the overall architecture of your system?
The system utilizes a **3-Tier Architecture** consisting of a decoupled Single Page Application (SPA) React frontend, a Python Django REST Framework (DRF) application server, and a PostgreSQL database. An asynchronous **Celery worker layer** with a **Redis message broker** offloads background tasks, communicating with a **local Ollama instance** for vision/NLP processing.

### 39. What are the main layers/components?
- **Presentation Layer (Frontend):** React 18, React Router, Recharts, CSS Variables.
- **Application Layer (Backend Server):** Python 3.11, Django 6.0, Django REST Framework, Celery, Redis.
- **Database Layer (Data Storage):** PostgreSQL 15 relational database.
- **AI Inference Engine:** Ollama running `qwen2.5vl:3b` offline model locally.

### 40. Draw (describe) how these components communicate with each other.
The React SPA calls the Django API over HTTP/REST JSON endpoints. Real-time updates utilize WebSockets (via Django Channels). When mutating data triggers AI classification or document analysis, Django dispatches a background task to Celery via Redis. The Celery worker processes the data, runs PII filters, and queries the local Ollama API (running on `http://127.0.0.1:11434`) via HTTP POST request. When complete, Celery updates the database and sends a success signal to React via WebSocket.

### 41. Is there an API? If yes, what endpoints exist?
Yes, the REST API includes:
- `POST /api/auth/login/` - Authenticates user.
- `POST /api/auth/register/` - Registers user profile.
- `POST /api/auth/mfa/verify/` - Verifies TOTP secret token.
- `GET /api/reports/` - Returns list of reports (regionally isolated).
- `POST /api/reports/` - Creates new activity report draft.
- `PATCH /api/reports/{id}/status/` - Approves/returns report.
- `GET /api/reports/analytics/summary/` - Returns Recharts dashboard KPI metrics.
- `POST /api/reports/ai-chat/` - In-context RAG chat query.
- `POST /api/support/ai-suggest/` - Predicts ticket priority.

### 42. How is security implemented?
- **JWT Authentication:** Stateful user session tokens.
- **Role-Based Access Control (RBAC):** Django permission classes block non-admin roles from accessing endpoints.
- **Regional Database Isolation:** An ORM-level queryset override (`RegionalQuerySet`) automatically filters queries based on `request.user.region` to prevent data leakage.
- **PII Sanitation:** Advanced regex filters strip names, email patterns, and phone numbers before dispatching prompts to LLMs.
- **Security Logs:** Automatic audit logger logs all changes in `audit_logs` table.

---

# SECTION B: ANSWERS FOR CHAPTER 4 (IMPLEMENTATION)

## PART 10: TOOLS AND TECHNOLOGIES (Chapter 4 Implementation)

### 43. Frontend technologies
- **React 18:** Declared component framework.
- **Vite:** Asset compiler and dev server.
- **Recharts:** Chart visualization library (Line, Area, Bar, Pie).
- **Vanilla CSS3:** Native styling variables, flexbox, grid, and transitions.

### 44. Backend technologies
- **Django 6.0 & DRF:** Backend application layer.
- **Celery 5.3:** Distributed task queue.
- **Redis 6.2:** Broker cache for Celery & WebSockets.
- **Pillow:** Image processing and compression for vision tasks.

### 45. Database
- **PostgreSQL 15:** Production-grade relational database for transactional safety.

### 46. Development tools
- **VS Code:** Local coding environment.
- **Git / GitHub:** Branching, version control, CI checks.
- **Ollama CLI:** Offline LLM hosting and thread configuration.

### 47. Testing tools
- **pytest & pytest-django:** Automated unit and integration testing.
- **Postman:** Manual REST API endpoint validation.

### 48. Design/Modeling tools
- **Draw.io / Lucidchart:** Architectural diagrams and flowcharts.

### 49. Version control
- **Git** with **GitHub** repository storage.

---

## PART 11: IMPLEMENTATION MODULES (Screens/Pages)

### 50-55. Pages and Screens Details

#### Page 1: Login & Registration Portal
- **50. Page Name:** Login & Register
- **51. Role:** Public (non-authenticated users)
- **52. Purpose:** Registers or logs in system users.
- **53. Key Elements:** Input forms, role dropdown, region dropdown, MFA input token box.
- **54. Interaction:** User inputs email/password → Clicks Submit → Validates inputs.
- **55. Leads to:** Redirects to `/dashboard` upon verification.

#### Page 2: User Dashboard
- **50. Page Name:** Personal Dashboard
- **51. Role:** Authenticated Users
- **52. Purpose:** Hub summarizing user-level metrics.
- **53. Key Elements:** KPI summary badges, Recent Activities pagination list (3 items per page).
- **54. Interaction:** Clicking item in activity list launches detail card.
- **55. Leads to:** Navigation links lead to `/reports`, `/support`, or `/prayer`.

#### Page 3: Report Workspace
- **50. Page Name:** Report List & Form
- **51. Role:** Field Officer, Coordinator, Manager
- **52. Purpose:** Draft, view, edit, and submit activity reports.
- **53. Key Elements:** Demographics inputs (validation sum checks), description textbox, category select.
- **54. Interaction:** Field Officer edits values and saves or submits.
- **55. Leads to:** Submitted reports trigger progress bar and redirect to reports list.

#### Page 4: Unified AI & Analytics Portal
- **50. Page Name:** AI & Analytics Dashboard
- **51. Role:** Regional Coordinator, National Manager, Admin
- **52. Purpose:** Unified dashboard combining AI report checks, report consolidations, printable layouts, and charts.
- **53. Key Elements:** Three-tabbed navigation (AI Analysis, Consolidation, Analytics), Rwanda geographic choropleth map, window print layouts, RAG chat assistant widget.
- **54. Interaction:** User queries chat assistant, overrides categories, selects multiple reports to consolidate, or views charts.
- **55. Leads to:** Generates PDF reports (`window.print()`) or exports CSV files.

#### Page 5: Support Requests Queue
- **50. Page Name:** Support Center
- **51. Role:** All roles
- **52. Purpose:** Requests resources and tracks priority queue.
- **53. Key Elements:** "Get AI Suggestion" button, priority indicator badges, comments sidebar.
- **54. Interaction:** User enters description, clicks AI analysis, retrieves priority suggestions.
- **55. Leads to:** Opens assignment modal and comment threads.

#### Page 6: Prayer Wall
- **50. Page Name:** Prayer requests wall
- **51. Role:** Field Officer, Regional Coordinator
- **52. Purpose:** Lists prayer requests and logs commitments.
- **53. Key Elements:** Create prayer dialog, "Commit to Pray" button, commitments counts.
- **54. Interaction:** User clicks pray button, increments counter in real-time.
- **55. Leads to:** Keeps status marked as "Active" or "Answered".

---

## PART 12: SOFTWARE TESTING

### 56. What unit tests did you perform?
- **`TestReportService`:** Validated report creations, submission changes, and blocked coordinators from approving reports they created.
- **`TestSupportService`:** Validated deadline calculations: Low urgency requests got 14 days, critical requests got 1 day.
- **`TestAIService`:** Validated PII scrubbing (removing names/emails/phones) and heuristic classification fallback matches.

### 57. What integration tests did you perform?
- **Celery Signals:** Verified that saving a report triggers background task signals and updates columns.
- **WebSockets Progress:** Verified that the channels layer broadcasts progress percentages correctly.

### 58. What system tests did you perform?
- **CPU Inference Capping:** Restricted local Ollama instance execution to 4 threads (`OLLAMA_THREADS`), preventing 100% CPU starvation.
- **Image Preprocessing Compression:** Added Pillow compression to resize vision chat images to 224x224 and export as quality-50 JPEGs. This reduced local vision classification processing times by **10x**.

### 59. What user acceptance tests did you perform?
Staff at SU Rwanda verified:
- Regional boundaries worked (coordinators in East couldn't view West data).
- The print layout fits standard A4 sheets without truncating text.
- Exported Excel/CSV reports contain correct totals.

### 60. List any bugs found and how they were fixed.
- **Infinite Signal loop:** Celery updates to reports triggered another `post_save` signal. Fixed by disconnecting signals during task save.
- **403 forbidden on Analytics:** Coordinators got permission blocks on summary views. Resolved by adding `regional_coordinator` to `IsCoordinatorOrManagerOrAdmin` and introducing `request.user.region` query filters.
- **CPU hangs during image upload:** Vision model hung on large 4K files. Fixed by implementing Pillow thumbnail resizing in `ai_service.py`.

---

## PART 13: HARDWARE & SOFTWARE REQUIREMENTS

### 61. Client-side software requirements
- **OS:** Windows 10/11, macOS, Linux, Android, iOS.
- **Browsers:** Google Chrome, Firefox, Microsoft Edge, Safari.

### 62. Client-side hardware minimum requirements
- **RAM:** 4 GB.
- **Processor:** Dual-core 2.0 GHz.
- **Storage:** 500 MB free browser cache storage.

### 63. Server-side software requirements
- **OS:** Ubuntu Server 22.04 LTS (recommended) or Windows 10/11.
- **Environment:** Python 3.10+, PostgreSQL 14+, Redis 6+, Ollama container.

### 64. Server-side hardware minimum requirements (For local AI runner)
- **RAM:** 16 GB DDR4 (needed to keep `qwen2.5vl:3b` in memory).
- **Processor:** AMD Ryzen 5 or Intel Core i7 (6+ physical cores).
- **Storage:** SSD (required for fast database queries and prompt-load latency).

---

## PART 14: UNIQUE/SPECIFIC FEATURES

### 65. Does your system have OCR/document verification? How does it work?
Yes. It uses `pypdf` and `python-docx` inside `AIService.extract_text_from_document` to read text files up to 5,000 characters. When documents are attached to a report or chat message, the extracted text is appended to the local LLM query prompt to provide in-context reference answers.

### 66. Does your system have OTP/two-factor authentication? How?
Yes. Implemented via the `pyotp` library. The user profile table stores a secret key `mfa_secret`. When enabled, logging in triggers a challenge requesting a 6-digit code validated against the user's authenticator app.

### 67. Does your system have role-based access control? How is it implemented?
Yes. Enforced via custom Django permissions (`IsCoordinatorOrManagerOrAdmin`) and a thread-local manager (`RegionalManager`) that restricts database reads to the active user's region (`request.user.region`) for coordinators and officers.

### 68. Does your system have notifications? How?
Yes. Uses the `Notification` database model. Dispatches real-time UI banners using WebSockets (django-channels) for events like "Urgent support requested" or "Report returned".

### 69. Does your system have audit logging? What events are logged?
Yes. The `AuditLoggingMiddleware` captures all mutating queries (POST, PUT, PATCH, DELETE) and records user snapshots, actions, routes, IP addresses, and severities inside the `audit_logs` table.

### 70. Does your system have report generation? What reports? What format?
Yes. Generates printable reports in PDF formats using customized CSS printable styles (`window.print()`), and structured Excel/CSV files containing columns, participant totals, and demographics.

### 71. Does your system have dynamic assignment/workflow routing? How does it work?
Yes. When field officers submit requests, the ticket is auto-routed to the regional coordinator of their region. Coordinators can then manually assign requests to specific staff or resolve them.

### 72. Does your system have messaging between users? How?
Implemented through support request comments. Users with access to a ticket can post messages in a dedicated comment board linked to the request (`support_comments` table).

---

## PART 15: COMPLETE PROCESS WALKTHROUGH

### 73. Walk me through the complete lifecycle of a request/submission:
1. **Account Registration:** Field officer registers specifying region (e.g. Eastern Province). Admin approves the account.
2. **Drafting Report:** Officer fills the form. Demographics validator checks that Male + Female equals total participants.
3. **Submitting & AI Analysis:** Officer submits. Celery runs `analyze_report_task`. Ollama classifies category and generates summaries.
4. **Coordinator Review:** Regional coordinator views the report. If metrics are incorrect, they write comments and return it (status: `returned`). If correct, they approve it (status: `approved`).
5. **Consolidation & Export:** National manager selects the approved report and aggregates it into monthly summaries, exporting printable PDF or CSV logs.

### 74. What are all the status values a request can have?
- **Reports:** `draft`, `submitted`, `approved`, `returned`.
- **Support Requests:** `submitted`, `under review`, `approved`, `fulfilled`, `closed`.
- **Prayer Requests:** `active`, `answered`, `archived`.

---

## PART 16: SCREENSHOT DESCRIPTIONS

### 75-78. Figures Catalog
- **Figure 1: AI Insights Dashboard (AI Analysis Tab)**
  - Shows list of analyzed reports, confidence scores, and keywords.
- **Figure 2: Report Consolidation Map (Consolidation Tab)**
  - Displays selected report summaries, total attendees, and a printable window.
- **Figure 3: Operational Trends & Analytics Charts (Analytics Tab)**
  - Shows line graph of Monthly Reach and a geographic map representing Rwanda.
- **Figure 4: Recent Activity Feed (Dashboard)**
  - Displays the paginated timeline widget with 3 items per page.

---

## BONUS: ANYTHING ELSE

### 79. What makes your system unique or different from similar systems?
The system runs a **fully local, offline AI model (`qwen2.5vl:3b`)**. This ensures Scripture Union Rwanda incurs zero subscription fees, works without internet connectivity in rural zones, and preserves local data privacy by scrubbing all PII data.

### 80. What challenges did you face during implementation and how did you solve them?
- **CPU Starvation:** Running the local LLM initially consumed 100% CPU, freezing the backend. Fixed by restricting Ollama to 4 execution threads.
- **Slow Vision Processing:** 4K image analysis took minutes. Fixed by integrating Pillow compression to resize images to 224px.

### 81. What features did you want to implement but couldn't (future work)?
- Native mobile applications for offline report caching in remote field zones.
- Automatic audio transcription of voice reports in Kinyarwanda to text summaries.
