# Scripture Union Connect (SU Connect) — Full Project Book Q&A Reference Guide

This document contains the complete and detailed questions and answers covering all chapters of the final year project book for **SU Connect** (Scripture Union Rwanda AI-Powered Reporting & Support System), structured for direct compilation and academic reference.

---

# CHAPTER 1: GENERAL INTRODUCTION

### Q1. What is the background of the study and how does digital transformation apply to faith-based organizations?
Faith-based non-governmental organizations (NGOs) and student fellowships play a crucial role in the social and spiritual development of youth in Rwanda. However, many of these organizations continue to rely on manual, paper-based, and unstructured digital communication (like WhatsApp and email) to manage their field operations. This causes reporting delays, data loss, lack of accountability, and difficulty in consolidating national-level data.
**SU Connect** is a digital transformation initiative custom-built for **Scripture Union Rwanda (SU Rwanda)**, a non-profit Christian organization operating across five geographic regions in Rwanda (Kigali City, Northern Province, Eastern Province, Southern Province, and Western Province). The project transitions SU Rwanda's operational workflows from manual processes to a secure, role-based, AI-enhanced Management Information System (MIS) to automate report submission, track support requests, coordinate prayer requests, organize files, and generate national analytics.

### Q2. What is the statement of the problem?
Before the development of SU Connect, SU Rwanda's field operations suffered from several administrative challenges:
1. **Delayed Reporting & Consolidation:** Report submissions from five regions were sent via paper or unstructured emails, taking several weeks for managers to consolidate manually.
2. **Lack of Data Validation:** Numeric data (attendee counts, gender, and age distributions) lacked verification, resulting in invalid report totals.
3. **Inadequate Regional Isolation:** Any staff member could access files and reports from other regions, violating organizational confidentiality and data privacy guidelines.
4. **Unstructured Support Prioritization:** Requests for resources (finances, equipment, training, spiritual guides) were queued on a first-come, first-served basis, delaying critical emergencies.
5. **Fragmented Prayer Commitments:** Scripture Union's spiritual core relies on shared prayer, but there was no structured way to list prayer requests or track commitments.

### Q3. What is the choice and motivation of the study?
- **To AUCA:** Demonstrates the university's commitment to practical IT application, innovation, and digital transformation, aligning with Rwanda's Vision 2050.
- **To the SU Fellowship:** Solves real operational bottlenecks, enhances administrative efficiency, improves financial and resource tracking transparency, and supports the organization's regional coordinators and field officers.
- **To the Developers:** Provides hands-on experience in full-stack software engineering (React, Django REST Framework, PostgreSQL) and integrating local/cloud artificial intelligence (Ollama Qwen, Google Gemini RAG) into secure, multi-role environments.

### Q4. What is the general objective of the study?
To design, develop, and deploy a web-based, AI-powered Management Information System (SU Connect) for Scripture Union Rwanda to digitize activity reporting, automate workflows, isolate regional access, track support requests, and generate consolidated national analytics.

### Q5. What are the specific objectives of the study?
1. To design and implement a secure, role-based authentication system enforcing a four-tier hierarchy: Administrator, National Manager, Regional Coordinator, and Field Officer.
2. To build an activity report submission workspace with client-side and server-side validation (including demographics sum checks).
3. To implement a double-pass review workflow enforcing segregation of duties (users cannot approve their own submissions).
4. To integrate a local AI model (Ollama `qwen2.5vl:3b`) and Google Gemini API for automatic report classification, keyword extraction, and executive summarization.
5. To design an AI-powered insights dashboard and a regional RAG chat assistant for querying the report corpus.
6. To implement a support request ticketing module with automatic urgency-based deadline calculations and comments threads.
7. To develop a prayer request wall supporting public, regional, and anonymous visibility modes with intercessor pledge tracking.
8. To build a secure document repository with MIME magic file signature check and provincial access controls.
9. To deploy administrative controls, including immutable security audit logs, Multi-Factor Authentication (MFA) for admins, and rate-limiting.

### Q6. What is the scope of the project?
- **Inclusions:** React SPA, Django REST API, PostgreSQL database, Redis task broker, Celery worker queue, local media file storage, local Ollama API, Google Gemini API, role-based dashboards, double-pass report approval, support request queue, prayer wall, document vault, and audit logs.
- **Exclusions:** Native mobile applications (iOS/Android), offline-first Progressive Web App capabilities, SMS gateway connectivity, integration with banking/payment APIs, and integration with Rwanda's national e-Government portals (Irembo).

### Q7. What research methodologies and data collection techniques were used?
- **Research Design:** Applied and descriptive research design utilizing Agile (Scrum) software development methodology with iterative two-week sprints.
- **Data Collection:**
  - *Interviews:* Structured and semi-structured sessions with the National Director, two National Managers, three Regional Coordinators, and four Field Officers.
  - *Observation:* Examination of paper report forms, WhatsApp chains, and manual consolidation spreadsheets.
  - *Document Review:* Study of SU Rwanda's constitution, annual report templates, and historical registers.
- **System Testing:** Unit testing (Pytest), integration testing (Celery tasks, WebSockets), system testing (inference throttling, image compression), and manual User Acceptance Testing (UAT).

### Q8. What are the expected results of the system?
The deployment of SU Connect is expected to:
- Reduce the report approval and consolidation cycle from 2-4 weeks to under 24 hours.
- Eliminate 100% of demographic math errors during report submission via frontend validation.
- Securely isolate regional data so that regional coordinators and field officers can only access their assigned provinces.
- Enable instant, natural-language operational querying via the RAG chat assistant.
- Provide transparent tracking and priority tagging of all resource support requests.

### Q9. How is the report organized?
- **Chapter 1: General Introduction** (Context, objectives, scope, methodology).
- **Chapter 2: Analysis of the Existing System** (Current workflows, PIECES problems, functional/non-functional requirements).
- **Chapter 3: Design of the New System** (Architecture, UML diagrams, ER diagram, database dictionary).
- **Chapter 4: Implementation and Testing** (Tools, code screenshots, test cases, results, bug fixes).
- **Chapter 5: Conclusion and Recommendations** (Summary of findings, recommendations for SU Rwanda and future researchers).

---

# CHAPTER 2: ANALYSIS OF THE CURRENT SYSTEM

### Q10. What is the historical background, vision, and mission of Scripture Union Rwanda?
- **Historical Background:** SU Rwanda is a Christian non-profit organization established to serve youth across Rwanda. It operates through school-based groups, camps, and community initiatives in five provinces.
- **Vision:** To see lives transformed by God's word and youth empowered to serve their communities.
- **Mission:** To make Jesus Christ known to young people through Bible reading, discipleship, and evangelism, fostering moral integrity and spiritual growth.

### Q11. Describe the environment and processes of the legacy system.
1. **Member Registration:** Handled via manual paper forms or static Word documents.
2. **Attendance Tracking:** Signed on paper registers at meetings, which were easily misplaced or falsified.
3. **Event Planning:** Managed through informal phone calls and text messages with no permanent history.
4. **Prayer Requests:** Shared verbally or posted in WhatsApp group chats where they quickly got buried.
5. **Financial Contributions:** Collected in cash, recorded in hand-written ledgers, and lacking transparency.
6. **Reporting:** Field officers wrote narrative Word documents, emailed them to coordinators, who manually copied metrics into consolidated Excel sheets for national submission.
7. **Communication:** Fragmented across multiple WhatsApp groups, notice boards, and emails.

### Q12. What are the key issues identified using the PIECES framework?
- **Performance:** Delays of up to 4 weeks for reports to move from the field to national managers.
- **Information:** Unstructured text, missing metrics, demographic totals that did not add up, and data loss due to staff turnover or phone upgrades.
- **Economics:** Substantial administrative hours wasted on manual copy-pasting, formatting, and follow-up phone calls.
- **Control:** Absence of role boundaries; staff in one region could view or modify files from another; no audit trail to track changes.
- **Efficiency:** Triple-entry of data (field paper -> email Word doc -> coordinator summary Excel -> manager master sheet) leading to transcription errors.
- **Service:** Field staff had no visibility into support request progress, and managers could not produce on-demand national statistics for donors.

### Q13. What proposed solutions does SU Connect implement?
- **Unified Web Portal:** Centralized digital database for all roles.
- **Demographics Validator:** Automatic check enforcing `Male + Female = Total Participants` and `Youth + Adults = Total Participants`.
- **Double-Pass Approval:** Digital submission, review, approval, or return-for-correction workflow.
- **Regional Isolation:** Middleware restriction enforcing `WHERE region = user.region` for Level 1 and 2 users.
- **AI Classification & RAG:** Local LLM analysis of reports and interactive conversational querying.
- **Support Tickets:** Structured ticketing queue with deadline auto-setting based on urgency.
- **Immutable Audit Trail:** Logging all write actions with snapshots, user IDs, and origin IPs.

### Q14. What are the core Functional Requirements (FRs)?
- **FR-01 (Auth):** Secure login returning JWT tokens.
- **FR-02 (MFA):** Mandatory TOTP Multi-Factor Authentication for Administrators.
- **FR-03 (User Mgmt):** Admin controls to create, edit, activate, and deactivate users.
- **FR-04 (Reports):** Field officers can draft, save, and edit activity reports.
- **FR-05 (Submission):** Report submission changes status to `submitted` and queues AI tasks.
- **FR-06 (Review):** Coordinators can approve or return reports (with return comments).
- **FR-07 (Duties Segregation):** Users cannot approve reports they authored.
- **FR-08 (AI Analysis):** Async Celery tasks run Ollama/Gemini to extract summary, keywords, and category.
- **FR-09 (Override):** Managers can manually override AI-assigned categories.
- **FR-10 (Support):** Users can submit resource requests with deadline calculation.
- **FR-11 (Comments):** Support request threads allow comments between request parties.
- **FR-12 (Prayer):** Prayer requests with public, regional, or anonymous visibility.
- **FR-13 (Pledges):** Users can click "Commit to Pray" to increment intercessory counter.
- **FR-14 (Doc Repository):** Uploading files with magic byte signature checks and regional filters.
- **FR-15 (Audit Logs):** System logs all CRUD operations to database.

### Q15. What are the core Non-Functional Requirements (NFRs)?
- **Security:** JWT authentication, HTTPOnly refresh cookies, login throttling (5 per 15 mins), and api rate limits (120 per min).
- **Performance:** CRUD endpoints respond in less than 500ms.
- **Reliability:** Heuristic regex keyword fallback if local LLM/Gemini is offline.
- **Privacy:** Scrubbing names, emails, and phone numbers before sending data to AI models.
- **Usability:** Responsive interface supporting mobile and desktop, with dark/light themes.
- **Maintainability:** OpenAPI 3.0 documentation via Swagger at `/api/schema/swagger-ui/`.

---

# CHAPTER 3: REQUIREMENTS ANALYSIS AND DESIGN OF THE NEW SYSTEM

### Q16. Detail the System Architecture Design.
SU Connect uses a **3-Tier Decoupled Architecture**:
1. **Presentation Layer (React Frontend):** React 18 Single-Page Application (SPA) served via Vite. Communicates with backend using Axios REST calls and listens to WebSocket groups for live notifications.
2. **Business Logic Layer (Django REST Backend):** Python Django and Django REST Framework running under Daphne ASGI server to support synchronous HTTP and asynchronous Channels WebSockets. Handles authorization, validations, and dispatches background tasks.
3. **Asynchronous Worker Layer (Celery & Redis):** Redis acts as the message broker and cache. Celery workers execute long-running tasks: document text extraction, PII scrubbing, local Ollama API requests (`http://127.0.0.1:11434`), and email dispatches.
4. **Data Layer (PostgreSQL):** Relational database storing user profiles, reports, support requests, documents, and audit logs.
5. **AI Inference Layer:** Local Ollama runner hosting `qwen2.5vl:3b` with CPU thread limits. Google Gemini API (`gemini-1.5-flash`) acts as a primary/fallback engine.

```
[React Client UI] <--- REST / WebSockets ---> [Daphne ASGI (Django)]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
             [PostgreSQL Database] <--- Read/Write Schema ---> [Redis Cache/Broker] <---> [Celery Workers]
                                                                                                 │
                                                                                                 ▼
                                                                                       [Ollama / Gemini API]
```

### Q17. Detail the Use Case Diagram and key use cases.
- **Actors:** Field Officer, Regional Coordinator, National Manager, Administrator.
- **Key Use Cases:**
  - *User Authentication:* All actors log in. Pre-condition: Registered. Post-condition: JWT token generated.
  - *Submit Activity Report:* Field Officer submits. Pre-condition: Report exists in `draft`. Post-condition: Status changes to `submitted`, Celery task triggered.
  - *Review Report:* Coordinator reviews. Pre-condition: Report status is `submitted` and matches region. Post-condition: Status set to `approved` or `returned`.
  - *AI RAG Chat:* All roles query chat. Pre-condition: Authenticated. Post-condition: Context fetched, LLM response returned.
  - *Request Support:* Field Officer submits. Pre-condition: Valid description. Post-condition: Ticket created with urgency-based deadline.

### Q18. Detail the Database Design and Data Dictionary.
The database schema consists of **16 tables** normalized to Third Normal Form (3NF).
Key tables include:
1. `accounts_user`: Stores user records, roles, regions, departments, and MFA secrets. PK: `id` (UUID).
2. `reports`: Activity descriptions, participants, demographics (JSONB), and AI results. PK: `id` (BigInt), FK: `submitted_by_id`.
3. `support_requests`: Resource requests, assignee, urgency, status, and deadline. PK: `id` (BigInt), FKs: `requester_id`, `assigned_to_id`.
4. `support_comments`: Threaded comments for tickets. PK: `id` (BigInt), FK: `request_id`, `user_id`.
5. `prayer_requests`: Prayer items, anonymous flags, and intercessors count. PK: `id` (BigInt), FK: `requester_id`.
6. `prayer_commitments`: Links users who committed to pray. PK: `id` (BigInt), FK: `request_id`, `user_id`.
7. `documents`: File uploads metadata, sizes, MIME types, and storage keys. PK: `id` (BigInt), FK: `uploaded_by_id`.
8. `audit_logs`: Immutable security action log. PK: `id` (BigInt), FK: `user_id`.

```
Table: accounts_user
+-----------------------+--------------+-------------+
| Column                | Type         | Constraint  |
+-----------------------+--------------+-------------+
| id                    | UUID         | PK          |
| email                 | VARCHAR(254) | Unique, NN  |
| name                  | VARCHAR(255) | NN          |
| role                  | VARCHAR(50)  | NN          |
| region                | VARCHAR(100) | NN          |
| mfa_enabled           | BOOLEAN      | Default F   |
| mfa_secret            | VARCHAR(255) | Nullable    |
+-----------------------+--------------+-------------+

Table: reports
+-----------------------+--------------+-------------+
| Column                | Type         | Constraint  |
+-----------------------+--------------+-------------+
| id                    | BIGINT       | PK          |
| title                 | VARCHAR(255) | NN          |
| status                | VARCHAR(50)  | Default dft |
| submitted_by_id       | UUID         | FK User     |
| participants          | INTEGER      | Default 0   |
| demographics          | JSONB        | Default {}  |
| description           | TEXT         | NN          |
| ai_category           | VARCHAR(100) | Nullable    |
| ai_summary            | TEXT         | Nullable    |
+-----------------------+--------------+-------------+
```

### Q19. How is Regional Database Isolation technically implemented?
A custom Django manager called `RegionalQuerySet` overrides backend queries. For `field_officer` and `regional_coordinator` roles, the backend automatically appends a `WHERE region = request.user.region` clause to all `SELECT` queries on reports, support requests, documents, and prayer requests. Administrators and National Managers bypass this filter to view nationwide data.

### Q20. Describe the Double-Pass Report Verification workflow.
1. Field Officer fills the report form. Demographics validator checks that Male + Female = Total Attendees.
2. Officer clicks Submit (status changes to `submitted`).
3. Celery worker runs `analyze_report_task`, scrubs PII, queries local Ollama (or Gemini), saves classification results, and triggers a WebSocket notification to the Regional Coordinator.
4. Coordinator reviews the report.
   - If incorrect, coordinator enters comments and clicks Return (status becomes `returned` / draft).
   - If correct, coordinator clicks Approve (status becomes `approved`).
   - The backend blocks the coordinator if they are the report author (enforcing Segregation of Duties).

---

# CHAPTER 4: IMPLEMENTATION AND TESTING

### Q21. What technologies were used to develop SU Connect?
- **Frontend:** React 18, Vite, Recharts, Lucide Icons, Axios, React Hook Form, Vanilla CSS3 (Custom variables).
- **Backend:** Python 3.11, Django 6.0, Django REST Framework, Django Channels (WebSockets), Daphne.
- **Task Queue & Cache:** Celery 5.3, Redis 6.2 (as task broker, WebSocket backend, and cache).
- **Database:** PostgreSQL 15.
- **AI Integrations:** Ollama (hosting `qwen2.5vl:3b` offline), Google Generative AI Python SDK (`gemini-1.5-flash`).
- **Security & Libraries:** `python-magic` (MIME validation), `pypdf` / `python-docx` (document text extraction), `django-otp` (TOTP MFA), `pytest` (testing).

### Q22. Detail the hardware and software requirements for running the system.
- **Client Requirements:**
  - OS: Windows 10/11, macOS, Linux, Android, iOS.
  - Browser: Chrome, Firefox, Safari, Edge (latest versions).
  - RAM: 4 GB.
- **Server Requirements (With Offline LLM Runner):**
  - OS: Ubuntu Server 22.04 LTS or Windows 10/11.
  - CPU: AMD Ryzen 5 or Intel Core i7 (6+ physical cores).
  - RAM: 16 GB DDR4 (minimum to keep the 3B model in RAM).
  - Storage: SSD with at least 20 GB free space.
  - Runtime: Python 3.10+, PostgreSQL 14+, Redis 6+, Ollama container.

### Q23. Describe the main user interface pages and portals.
1. **Login & Register Portal:** Features email/password forms, role/region selection dropdowns, rate-limiting, and TOTP MFA code validation.
2. **Field Officer Dashboard:** Personalized overview displaying Personal KPI cards, upcoming reporting deadlines with color-coding, and a paginated recent activity feed (3 items per page).
3. **Report Workspace:** Form utilizing a stepper workflow, inputs for participant counts/demographics, draft options, and file upload zone.
4. **AI & Analytics Dashboard:** Visualizes nationwide data via Recharts (Outreach Trends, Regional Breakdown, Demographics). Features AI overrides and the conversational RAG chatbot.
5. **Support Requests Queue:** Kanban board layout showing requests grouped by status. Urgency levels (`low`, `medium`, `high`, `critical`) color-code cards. Clicking a card opens assignment controls and comment threads.
6. **Prayer Wall:** Displays a card layout of prayer items. Features an "I Will Pray" button that triggers instant WebSocket increments.
7. **Document Repository:** Grid layout of uploaded files with search tags and regional sharing folders.
8. **Admin Dashboard:** Displays system health charts (Redis ping, Celery worker status, DB connections) and user registration approval tables.

### Q24. What unit, integration, and system tests were performed?
- **Unit Testing (Pytest):** Tested `TestReportService` (report validation, status changes, segregation of duties block), `TestSupportService` (deadline calculator: critical urgency set to 1 day, low set to 14 days), and `TestAIService` (regex-based PII scrubbing).
- **Integration Testing:** Verified that report saves successfully dispatches Celery tasks, and Channels layer broadcasts progress percentages (`ai_progress_report_id` WebSocket group).
- **System Testing:**
  - *CPU Inference Throttling:* Configured `OLLAMA_THREADS = 4` to limit local LLM threads, preventing 100% CPU starvation during inferences.
  - *Image Compression:* Integrated Pillow resize/compress pipeline to resize vision chat images to 224x224 and compress as quality-50 JPEGs. This reduced local vision classification processing times by 10x.
- **User Acceptance Testing (UAT):** SU Rwanda staff verified regional visibility constraints and printed report layouts (`window.print()`).

### Q25. What bugs were found during development and how were they fixed?
1. **Infinite Signal loop:** Celery updates to reports triggered another `post_save` django signal. Fixed by disconnecting signals during task save operations in `ai_service.py`.
2. **403 Forbidden on Analytics:** Coordinators got permission blocks on summary views. Resolved by adding `regional_coordinator` to `IsCoordinatorOrManagerOrAdmin` and introducing `request.user.region` query filters.
3. **CPU hangs during image upload:** Vision model hung on large 4K files. Fixed by implementing Pillow thumbnail resizing in `ai_service.py` before sending the base64 payload to Ollama.

---

# CHAPTER 5: CONCLUSION AND RECOMMENDATIONS

### Q26. Summarize the findings of the study.
- **Objective Fulfillment:** The project met all 9 specific objectives, producing a secure, modular full-stack web application.
- **Workflow Improvement:** Report approval loops were reduced from weeks to under 24 hours. Form-level math checks eliminated demographic data mismatch issues.
- **AI Utility:** Local Ollama (`qwen2.5vl:3b`) and Gemini successfully classified reports (with >88% confidence) and generated concise summaries, reducing manual collation effort.
- **Access Control:** Regional database-level isolation and RBAC prevented cross-provincial data leakage.

### Q27. What are the potential limitations of the system?
1. **Resource Constraints:** Running offline LLM models requires at least 16 GB RAM on the server, which may increase hosting costs.
2. **Internet Dependency:** While the AI is offline, client access to the web portal still requires active internet connectivity.
3. **Training Curve:** Staff operating in rural areas with low digital literacy may experience a learning curve when adopting the system.
4. **API Limits:** Fallback heuristics must handle API rate limits if the cloud Gemini key is used extensively.

### Q28. What are the recommendations to SU Rwanda, AUCA, and future researchers?
- **To Scripture Union Rwanda:**
  - Formally adopt SU Connect and designate a System Administrator.
  - Conduct training workshops for field officers and regional coordinators.
  - Set up daily PostgreSQL database backups to secure storage (AWS S3).
- **To AUCA:**
  - Standardize SU Connect as a reference implementation for student MIS projects.
  - Provide stable campus Wi-Fi infrastructure to support digital fellowships.
- **To Future Researchers:**
  - *Mobile App:* Build native Android/iOS apps (using Flutter or React Native) supporting offline report caching in remote field zones.
  - *Kinyarwanda Audio Summarizer:* Integrate speech-to-text models to translate Kinyarwanda voice recordings into report drafts.
  - *Predictive Modeling:* Use machine learning regression to forecast provincial support requests and participant turnout.

### Q29. What are the final remarks?
SU Connect represents a significant digital advancement for Scripture Union Rwanda. By combining modern web architectures with offline AI capabilities, the system proves that faith-based non-profit organizations can achieve high operational efficiency, strict data accountability, and data-driven governance without incurring heavy subscription fees.

---

# REFERENCES

1. Alter, S. (2002). *Information Systems: Foundation of E-Business* (4th ed.). Pearson Education.
2. Awad, E. M. (2007). *System Analysis and Design* (2nd ed.). Pearson Prentice Hall.
3. Brown, C. V., DeHayes, D. W., Hoffer, J. A., Martin, E. W., & Perkins, W. C. (2012). *Managing Information Technology* (7th ed.). Pearson Education.
4. Django Software Foundation. (2024). *Django Documentation (Version 5.x)*. Retrieved from https://docs.djangoproject.com/
5. Django REST Framework. (2024). *Django REST Framework Documentation*. Retrieved from https://www.django-rest-framework.org/
6. Google LLC. (2024). *Gemini API Documentation: generative-ai Python SDK*. Retrieved from https://ai.google.dev/docs
7. Hoffer, J. A., Ramesh, V., & Topi, H. (2013). *Modern Database Management* (11th ed.). Pearson Education.
8. Laudon, K. C., & Laudon, J. P. (2020). *Management Information Systems: Managing the Digital Firm* (16th ed.). Pearson Education.
9. Pressman, R. S., & Maxim, B. R. (2015). *Software Engineering: A Practitioner's Approach* (8th ed.). McGraw-Hill Education.
10. Ministry of ICT and Innovation — Rwanda. (2022). *Smart Rwanda Master Plan 2021–2025*. Government of Rwanda.
11. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson Education.

---

# APPENDICES

### Appendix A: Data Collection Letter
A formal request letter signed by the AUCA Department of Information Technology Head, authorizing the student to collect historical reports, interview staff, and observe workflow dynamics at Scripture Union Rwanda.

### Appendix B: Interview Guide
- **SU President/Director:** Questions on governance, national consolidation timelines, and strategic analytics needs.
- **Regional Coordinator:** Questions on report approval delays, verification pain points, and support request tracking.
- **Field Officer:** Questions on form filing difficulties, mobile access habits, and prayer request sharing.

### Appendix C: Observation Checklist
Used to document manual workflows:
- Time taken to write/compile reports.
- Presence of transcription errors in paper forms.
- Communication delays when tracking support requests via WhatsApp.

### Appendix D: System User Guide
Step-by-step instructions for:
- Registering a new account and logging in.
- Creating, editing, and submitting an activity report.
- Checking priority recommendations using the local AI tool.
- Pledging prayer commitments on the Prayer Wall.

### Appendix E: System Administrator Guide
Technical setup guidelines:
- Installing Docker and Docker Compose.
- Configuring database connection settings in `.env`.
- Setting up the local Ollama container and pulling `qwen2.5vl:3b`.
- Managing user authorization statuses and auditing logs.
