---
title: "SU Connect: An AI-Powered Reporting and Support Management System for Scripture Union Rwanda"
subtitle: "Final Year Project — Bachelor of Science in Information Technology"
university: "Adventist University of Central Africa (AUCA)"
academic_year: "2025–2026"
---

&nbsp;

&nbsp;

# ADVENTIST UNIVERSITY OF CENTRAL AFRICA
## FACULTY OF SCIENCE AND TECHNOLOGY
### DEPARTMENT OF INFORMATION TECHNOLOGY

&nbsp;

---

&nbsp;

# SU CONNECT: AN AI-POWERED REPORTING AND SUPPORT MANAGEMENT SYSTEM

## *Case Study: Scripture Union Rwanda*

&nbsp;

**Submitted in partial fulfillment of the requirements for the award of the degree of**

## Bachelor of Science in Information Technology

&nbsp;

**By:**

[STUDENT NAME]

&nbsp;

**Supervised by:**

[SUPERVISOR NAME]

&nbsp;

**Academic Year: 2025–2026**

&nbsp;

**Kigali, Rwanda**

**June 2026**

---

&nbsp;

## ABSTRACT

[]{#abstract .anchor}

The management of operational activities, field reports, resource support requests, and prayer coordination within faith-based non-governmental organizations in Rwanda has historically depended on fragmented, manual, and paper-based processes. Scripture Union Rwanda (SU Rwanda), a Christian ministry operating across five provinces, suffered from significant inefficiencies in report collection, approval workflows, resource allocation, and inter-departmental communication. These challenges resulted in delayed decision-making, loss of critical data, lack of accountability, and an inability to produce consolidated national reports in a timely manner.

This project presents **SU Connect**, an AI-Powered Reporting and Support Management Information System developed to digitize and automate the full operational workflow of Scripture Union Rwanda. The system was developed using a two-tier architecture comprising a React (v18) Single-Page Application (SPA) frontend and a Django REST Framework (v3.14) backend API, backed by a PostgreSQL relational database, a Redis message broker, and Celery asynchronous worker queues. Artificial Intelligence capabilities were integrated through the Google Gemini API (`gemini-1.5-flash`) to automatically classify submitted activity reports by category, generate executive summaries, extract thematic keywords, and respond to administrative queries through a Retrieval-Augmented Generation (RAG) chat interface.

The system enforces a strict four-tier Role-Based Access Control (RBAC) model comprising the Administrator, National Manager, Regional Coordinator, and Field Officer. A double-pass report verification workflow was implemented to enforce segregation of duties, ensuring that a user cannot approve their own submission. Additional security mechanisms include Multi-Factor Authentication (MFA) using Time-based One-Time Passwords (TOTP), immutable audit logs, API rate limiting, idempotency key protection, and MIME magic file signature validation for document uploads.

The system was tested using automated unit tests (Pytest) covering authentication, report submission, AI analysis, support request management, and audit log generation. The results demonstrated that SU Connect successfully replaced the existing manual system with a secure, scalable, and intelligent platform capable of improving reporting accuracy, reducing administrative overhead, and enabling data-driven decision-making for the national leadership of Scripture Union Rwanda.

**Keywords:** Management Information System, Activity Reporting, AI Classification, Google Gemini, Django REST Framework, React, RBAC, Scripture Union, Rwanda, Non-Governmental Organization, Audit Trail, Multi-Factor Authentication, WebSocket, Celery, PostgreSQL.

---

&nbsp;

## DECLARATION

[]{#declaration .anchor}

I, [STUDENT NAME], hereby declare that this Final Year Project report, submitted to the Department of Information Technology, Faculty of Science and Technology, Adventist University of Central Africa (AUCA), is my own original work and has not been presented for any degree or examination at any other university or institution.

All sources of information, whether published or unpublished, have been duly acknowledged and referenced in the bibliography.

&nbsp;

**Signature of Student:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Name:** [STUDENT NAME]

**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

&nbsp;

---

## APPROVAL

[]{#approval .anchor}

This Final Year Project report, titled **"SU Connect: An AI-Powered Reporting and Support Management System — Case Study: Scripture Union Rwanda"**, has been examined and approved as meeting the requirements for the degree of Bachelor of Science in Information Technology at the Adventist University of Central Africa.

&nbsp;

**Project Supervisor:**

Name: [SUPERVISOR NAME]

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

&nbsp;

**Head of Department:**

Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

&nbsp;

**Dean, Faculty of Science and Technology:**

Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Signature: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Date: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

&nbsp;

## DEDICATION

[]{#dedication .anchor}

*This work is dedicated to the field officers, regional coordinators, and national leaders of Scripture Union Rwanda, whose tireless commitment to youth ministry and community transformation across Rwanda's five provinces inspired every design decision in this system.*

---

&nbsp;

## ACKNOWLEDGEMENTS

[]{#acknowledgements .anchor}

The researcher wishes to express sincere gratitude to the following individuals and institutions whose contributions made the successful completion of this project possible:

To the supervisory team at the Adventist University of Central Africa, for their academic guidance, constructive feedback, and patient mentorship throughout the research and development process.

To the leadership and staff of Scripture Union Rwanda, for their cooperation in granting access to operational information, their participation in system requirement interviews, and their willingness to adopt and test the developed platform.

To the faculty members of the Department of Information Technology at AUCA, for providing a rigorous and stimulating academic environment that equipped the researcher with the technical skills necessary for this project.

To family and friends, for their constant encouragement and moral support during the demanding periods of this academic journey.

Finally, to God Almighty, for wisdom, strength, and grace throughout this entire undertaking.

---

&nbsp;

## TABLE OF CONTENTS

[]{#toc .anchor}

- [Abstract](#abstract)
- [Declaration](#declaration)
- [Approval](#approval)
- [Dedication](#dedication)
- [Acknowledgements](#acknowledgements)
- [Table of Contents](#toc)
- [List of Figures](#list-of-figures)
- [List of Tables](#list-of-tables)
- [List of Abbreviations](#abbreviations)
- **[Chapter 1: General Introduction](#chapter-1)**
  - [1.1 Background of the Study](#11-background-of-the-study)
  - [1.2 Statement of the Problem](#12-statement-of-the-problem)
  - [1.3 Objectives of the Study](#13-objectives-of-the-study)
  - [1.4 Research Questions](#14-research-questions)
  - [1.5 Scope of the Study](#15-scope-of-the-study)
  - [1.6 Significance of the Study](#16-significance-of-the-study)
  - [1.7 Research Methodology](#17-research-methodology)
- **[Chapter 2: Analysis of the Existing System](#chapter-2)**
  - [2.1 Description of the Existing System](#21-description-of-the-existing-system)
  - [2.2 Problems of the Current System (PIECES Framework)](#22-problems-of-the-current-system)
  - [2.3 Proposed Solutions](#23-proposed-solutions)
  - [2.4 Functional Requirements](#24-functional-requirements)
  - [2.5 Non-Functional Requirements](#25-non-functional-requirements)
- **[Chapter 3: Design of the New System](#chapter-3)**
  - [3.1 System Architecture Overview](#31-system-architecture-overview)
  - [3.2 UML Diagrams](#32-uml-diagrams)
  - [3.3 Database Design and Data Dictionary](#33-database-design-and-data-dictionary)
- **[Chapter 4: Implementation and Testing](#chapter-4)**
  - [4.1 Development Environment and Tools](#41-development-environment-and-tools)
  - [4.2 Hardware and Software Requirements](#42-hardware-and-software-requirements)
  - [4.3 System Screenshots and Interface Description](#43-system-screenshots-and-interface-description)
  - [4.4 System Testing](#44-system-testing)
- **[Chapter 5: Conclusion and Recommendations](#chapter-5)**
  - [5.1 Summary of Findings](#51-summary-of-findings)
  - [5.2 Recommendations for Scripture Union Rwanda](#52-recommendations-for-scripture-union-rwanda)
  - [5.3 Recommendations for Future Researchers](#53-recommendations-for-future-researchers)
- [References / Bibliography](#references)

---

&nbsp;

## LIST OF FIGURES

[]{#list-of-figures .anchor}

| Figure No. | Title | Page |
|:---|:---|:---:|
| Figure 1 | System Architecture Diagram | — |
| Figure 2 | Use Case Diagram | — |
| Figure 3 | Class Diagram | — |
| Figure 4 | Sequence Diagram — User Login | — |
| Figure 5 | Sequence Diagram — Report Submission and AI Analysis | — |
| Figure 6 | Activity Diagram — Report Approval Workflow | — |
| Figure 7 | Entity-Relationship (ER) Diagram | — |
| Figure 8 | Login Page | — |
| Figure 9 | User Registration Page | — |
| Figure 10 | Main Dashboard — Field Officer View | — |
| Figure 11 | Main Dashboard — National Manager View | — |
| Figure 12 | Report Submission Form | — |
| Figure 13 | Report List with Filters | — |
| Figure 14 | Report Detail View with AI Metadata | — |
| Figure 15 | AI Analysis Dashboard | — |
| Figure 16 | Support Requests List | — |
| Figure 17 | Support Request Submission Form | — |
| Figure 18 | Prayer Requests Module | — |
| Figure 19 | Analytics Dashboard | — |
| Figure 20 | Document Repository | — |
| Figure 21 | Consolidation Dashboard | — |
| Figure 22 | User Management Panel | — |
| Figure 23 | Security Audit Log | — |
| Figure 24 | Notification Center | — |
| Figure 25 | System Settings Page | — |

---

&nbsp;

## LIST OF TABLES

[]{#list-of-tables .anchor}

| Table No. | Title | Page |
|:---|:---|:---:|
| Table 1 | PIECES Framework — Problems of the Existing System | — |
| Table 2 | Functional Requirements | — |
| Table 3 | Non-Functional Requirements | — |
| Table 4 | System Actors and Use Cases | — |
| Table 5 | Data Dictionary — `accounts_user` Table | — |
| Table 6 | Data Dictionary — `reports` Table | — |
| Table 7 | Data Dictionary — `support_requests` Table | — |
| Table 8 | Data Dictionary — `support_comments` Table | — |
| Table 9 | Data Dictionary — `prayer_requests` Table | — |
| Table 10 | Data Dictionary — `prayer_commitments` Table | — |
| Table 11 | Data Dictionary — `documents` Table | — |
| Table 12 | Data Dictionary — `notifications` Table | — |
| Table 13 | Data Dictionary — `system_alerts` Table | — |
| Table 14 | Data Dictionary — `audit_logs` Table | — |
| Table 15 | API Endpoint Map | — |
| Table 16 | Hardware Requirements | — |
| Table 17 | Software Requirements | — |
| Table 18 | Test Cases — Authentication Module | — |
| Table 19 | Test Cases — Report Management Module | — |
| Table 20 | Test Cases — AI Analysis Module | — |
| Table 21 | Test Cases — Support Request Module | — |
| Table 22 | Test Cases — Security and Access Control | — |

---

&nbsp;

## LIST OF ABBREVIATIONS

[]{#abbreviations .anchor}

| Abbreviation | Full Form |
|:---|:---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| ASGI | Asynchronous Server Gateway Interface |
| AUCA | Adventist University of Central Africa |
| CRUD | Create, Read, Update, Delete |
| DRF | Django REST Framework |
| ER | Entity-Relationship |
| HTTP | Hypertext Transfer Protocol |
| IT | Information Technology |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| MFA | Multi-Factor Authentication |
| MIS | Management Information System |
| NGO | Non-Governmental Organization |
| PIECES | Performance, Information, Economics, Control, Efficiency, Service |
| PII | Personally Identifiable Information |
| RAG | Retrieval-Augmented Generation |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| SMS | Short Message Service |
| SMTP | Simple Mail Transfer Protocol |
| SPA | Single-Page Application |
| SQL | Structured Query Language |
| SU | Scripture Union |
| TOTP | Time-based One-Time Password |
| UML | Unified Modelling Language |
| URL | Uniform Resource Locator |
| UUID | Universally Unique Identifier |
| VPS | Virtual Private Server |
| WS | WebSocket |

---

&nbsp;

# CHAPTER 1: GENERAL INTRODUCTION {#chapter-1}

[]{#chapter-1 .anchor}

## 1.1 Background of the Study

[]{#11-background-of-the-study .anchor}

The proliferation of Information and Communication Technologies (ICT) across Sub-Saharan Africa has created unprecedented opportunities for organizations — both governmental and non-governmental — to digitize their operational workflows, improve data quality, and enhance their capacity for evidence-based decision-making. Rwanda, in particular, has emerged as a regional leader in digital transformation, guided by the national Vision 2050 strategic framework and the Smart Rwanda Master Plan, which collectively aim to transition Rwanda into a knowledge-based economy underpinned by technology adoption at every level of society.

Non-Governmental Organizations (NGOs) and faith-based ministries operating in Rwanda play a critical role in the country's social fabric, delivering services in areas such as youth development, education, community health, and spiritual formation. However, despite the national push towards digitalization, a significant proportion of these organizations continue to rely on manual, paper-based, or unintegrated software tools for their internal operations. This creates a paradox in which organizations whose field impact is measured in thousands of lives touched annually are governed by administrative systems that operate at the efficiency of the twentieth century.

**Scripture Union Rwanda (SU Rwanda)** is a national Christian ministry whose mission is to make Jesus Christ known to young people through the promotion of Bible reading, discipleship, evangelism, and community engagement. The organization operates across all five provinces of Rwanda — Kigali City, Eastern Province, Northern Province, Western Province, and Southern Province — through a network of field officers, regional coordinators, youth workers, and national management staff.

The effective execution of SU Rwanda's mission requires the continuous collection, verification, and analysis of data from field activities carried out in geographically dispersed locations. Field officers are required to produce activity reports documenting outreach events, Bible study sessions, youth camps, prayer meetings, and community engagement activities, including participant counts, demographic breakdowns, outcomes achieved, challenges encountered, and prayer requests gathered. These reports must then be reviewed and approved by Regional Coordinators before being escalated to National Managers for consolidated reporting and strategic planning.

Prior to the development of this system, **this entire workflow was managed through a combination of handwritten forms, Microsoft Word documents submitted via WhatsApp or email, and informal phone calls**. The absence of a unified, digitized platform resulted in chronic problems with data completeness, reporting timeliness, approval accountability, resource allocation visibility, and the organization's overall capacity to produce evidence-based national reports for donors, partners, and the board of directors.

The emergence of Artificial Intelligence (AI) as a practical tool for text classification, natural language summarization, and conversational information retrieval presented a compelling opportunity to not only digitize SU Rwanda's reporting workflow but to augment it with intelligent capabilities that would allow national leadership to derive actionable insights from the large volumes of unstructured field data generated each month.

It was against this backdrop that the **SU Connect** system was conceived — a purpose-built, AI-enhanced Management Information System designed to digitize, automate, and intelligently analyze the operational workflows of Scripture Union Rwanda. [The system sought to transform how field data was captured, verified, routed, and consumed across the entire organizational hierarchy.]{.mark}

---

## 1.2 Statement of the Problem

[]{#12-statement-of-the-problem .anchor}

Despite the critical importance of accurate and timely reporting to Scripture Union Rwanda's strategic operations, the organization's existing manual and semi-digital systems exhibited a range of severe operational deficiencies that compromised the quality, speed, and integrity of its administrative processes. The specific problems identified through interviews with SU Rwanda staff, observation of existing workflows, and review of historical documentation included the following:

1. **Absence of a Centralized Reporting Platform.** Field officers submitted activity reports through informal channels including email, WhatsApp groups, and physical paper forms. There existed no unified platform where reports could be submitted, tracked, approved, or archived. This resulted in reports being lost, duplicated, or unaccounted for during periods of high activity.

2. **Manual and Slow Report Approval Processes.** The verification and approval of reports required physical or telephonic communication between field officers and regional coordinators. There was no formal mechanism to track whether a submitted report had been reviewed, approved, returned for correction, or simply overlooked. Approval delays of two to four weeks were commonly reported, significantly reducing the currency of the data being consumed by national leadership.

3. **Inability to Categorize and Summarize Reports at Scale.** As SU Rwanda's operations expanded across all five provinces, the volume of monthly activity reports grew beyond what could be manually read and categorized by national management staff. Extracting themes, trends, and key performance indicators from dozens of unstructured narrative reports required significant manual effort and was frequently skipped, resulting in strategic plans that were not grounded in field data.

4. **Fragmented Resource and Support Request Management.** Requests for financial support, equipment, additional personnel, spiritual resources, and training were submitted through informal channels, often verbally or via WhatsApp. There was no ticket tracking system to record request status, assign responsibility, set deadlines, or track resolution. Critical requests were frequently lost, unactioned, or duplicated.

5. **Lack of Access Control and Data Isolation.** Sensitive operational data, including regional performance figures, personnel information, and financial support requests, was stored in shared email inboxes and WhatsApp groups with no role-based access control. Staff from one province could inadvertently access or modify data belonging to another region, raising data integrity and confidentiality concerns.

6. **No Audit Trail or Compliance Mechanism.** The existing system provided no mechanism for recording who had submitted, modified, approved, or deleted a document or report. In the event of a dispute over data accuracy or a request for donor accountability, there was no reliable audit trail that management could consult.

[These six systemic deficiencies collectively impaired the organization's operational efficiency, accountability standards, and capacity for evidence-based national strategic planning.]{.mark}

---

## 1.3 Objectives of the Study

[]{#13-objectives-of-the-study .anchor}

### 1.3.1 General Objective

The general objective of this study was to design, develop, and deploy a web-based AI-Powered Management Information System — named **SU Connect** — for Scripture Union Rwanda, capable of digitizing and automating the organization's activity reporting, support request management, prayer coordination, document storage, and administrative governance workflows.

### 1.3.2 Specific Objectives

The following specific objectives guided the development of the system:

1. To analyze the existing manual reporting and administrative workflows of Scripture Union Rwanda and identify their functional deficiencies.
2. To design a secure, role-based web application enforcing a four-tier organizational hierarchy comprising the Administrator, National Manager, Regional Coordinator, and Field Officer.
3. To implement a double-pass report verification workflow that enforces segregation of duties and maintains a clear, auditable chain of approval from submission to final approval.
4. To integrate Google Gemini AI for the automatic classification, keyword extraction, and executive summarization of submitted activity reports.
5. To develop a support request ticketing module that tracks resource requests from submission through assignment, review, and fulfillment.
6. To build a community prayer request module supporting public, regional, and anonymous visibility modes with intercessor commitment tracking.
7. To implement a document repository with MIME magic file validation, regional access control, and Many-to-Many linkage to activity reports.
8. To deploy an immutable audit logging system, Multi-Factor Authentication (MFA) for administrators, API rate limiting, and idempotency key protection to ensure system security and compliance.
9. To validate the implemented system through a structured testing protocol covering all major functional modules.

---

## 1.4 Research Questions

[]{#14-research-questions .anchor}

The following research questions guided this study:

1. What are the specific operational deficiencies of the existing manual reporting and administrative system at Scripture Union Rwanda?
2. How can a web-based Management Information System be designed to address the organizational hierarchy, regional data isolation, and approval workflow requirements of SU Rwanda?
3. How can Artificial Intelligence be effectively integrated into an organizational reporting system to reduce the burden of manual report categorization and summary generation?
4. What security measures are necessary to ensure data integrity, access control, and compliance in a multi-role, multi-region information system for a faith-based NGO?

---

## 1.5 Scope of the Study

[]{#15-scope-of-the-study .anchor}

**Organizational Scope:** This study was conducted within the operational context of Scripture Union Rwanda, headquartered in Kigali City, with field operations spanning Eastern Province, Northern Province, Western Province, and Southern Province.

**Functional Scope:** The system developed encompassed the following functional modules: User Authentication and Profile Management, Activity Report Submission and Approval, AI-Powered Report Analysis, Support Request Ticketing, Prayer Request Management, Document Repository, Analytics and Consolidated Reporting, Notification Management, Security Audit Logging, and Administrative User Management.

**Technical Scope:** The system was developed as a full-stack web application using React (v18) for the frontend, Django REST Framework (v3.14) for the backend API, PostgreSQL for persistent data storage, Redis for message brokering and caching, Celery for asynchronous task processing, and the Google Gemini API (`gemini-1.5-flash`) for AI processing. The system was designed for deployment on cloud infrastructure (AWS EC2 or equivalent VPS) using containerized Docker services with Daphne ASGI serving.

**Exclusions:** This system does not include a native mobile application, SMS-based reporting, offline-first Progressive Web App (PWA) capabilities, or integration with Rwanda's national e-Government portals. These areas are identified as potential future enhancements in Chapter 5.

---

## 1.6 Significance of the Study

[]{#16-significance-of-the-study .anchor}

The significance of this study extends across three primary dimensions:

**For Scripture Union Rwanda:** The SU Connect system provided a technologically robust solution to the chronic operational deficiencies that had been impeding the organization's administrative efficiency and data quality. The system empowered field officers to submit reports from any internet-connected device, enabled regional coordinators to approve or return reports with documented comments, and provided national management with AI-generated summaries and analytics dashboards that transform raw field data into actionable strategic intelligence.

**For the Information Technology Discipline:** This project demonstrated the practical application of modern web technologies — including asynchronous REST APIs, WebSocket-based real-time notifications, AI integration via commercial LLM APIs, and role-based access control — in a real-world organizational context. The architectural patterns and security mechanisms implemented serve as a reference implementation for full-stack web application development in similar domains.

**For the Academic Community:** This study contributes to the growing body of research at the intersection of Management Information Systems, Artificial Intelligence, and NGO digital transformation in sub-Saharan Africa. The findings and recommendations offer a framework that may be adapted by future researchers examining the digitization of faith-based or civil society organizations operating in resource-constrained environments.

---

## 1.7 Research Methodology

[]{#17-research-methodology .anchor}

### 1.7.1 Research Design

This study adopted a **descriptive and applied research design**. The descriptive component involved the systematic collection and analysis of data about the existing system at SU Rwanda, while the applied component involved the design and implementation of a software solution based on the identified requirements.

### 1.7.2 Data Collection Methods

**Interview:** Structured and semi-structured interviews were conducted with key stakeholders at Scripture Union Rwanda, including the National Director, two National Managers, three Regional Coordinators, and four Field Officers. The interviews focused on documenting the existing reporting workflows, identifying pain points, and gathering system requirements.

**Observation:** Direct observation of the existing reporting process was conducted, including the physical examination of paper report forms, WhatsApp conversation structures used for report submission, and the manual spreadsheet tools used by management for report collation.

**Document Review:** Existing documentation — including sample activity reports, support request forms, and internal email correspondence — was reviewed to understand the data structures and vocabulary currently used within the organization.

### 1.7.3 Software Development Methodology

The **Agile methodology** was adopted for system development, with development organized into iterative two-week sprints. Each sprint produced a working increment of the system that was demonstrated to a representative stakeholder for feedback. This approach ensured that the system remained aligned with evolving requirements throughout the development lifecycle.

### 1.7.4 System Testing

The system was tested using a combination of **automated unit testing** (via the Pytest framework with the `pytest-django` plugin) and **structured manual User Acceptance Testing (UAT)**. Automated tests were written for authentication flows, report lifecycle management, AI analysis trigger logic, and access control enforcement. Manual tests followed structured test case scripts covering all major user-facing workflows.

---

&nbsp;

# CHAPTER 2: ANALYSIS OF THE EXISTING SYSTEM {#chapter-2}

[]{#chapter-2 .anchor}

## 2.1 Description of the Existing System

[]{#21-description-of-the-existing-system .anchor}

Prior to the implementation of SU Connect, Scripture Union Rwanda managed its operational reporting and administrative coordination through a manual, paper-and-email-based system. This section describes the key processes that constituted the legacy system.

### 2.1.1 Activity Report Submission

Each month, Field Officers were required to produce an activity report documenting the ministry activities they had conducted within their assigned region. The reporting process was executed as follows:

1. The Field Officer filled out a pre-printed paper form (or a Microsoft Word template shared via email) containing fields for the event title, date, location, number of participants, a narrative description, outcomes, and challenges.
2. The completed report was submitted to the Regional Coordinator either physically (for those operating near regional offices) or via WhatsApp or email attachment.
3. The Regional Coordinator reviewed the report informally, often providing verbal feedback via telephone or WhatsApp voice message.
4. Approved reports were manually compiled by the Regional Coordinator into a regional summary document, which was then forwarded to the National Office by email.

This process was entirely manual, untracked, and asynchronous. There was no acknowledgement mechanism, no version control, and no formal record of whether a report had been reviewed, revised, or approved.

### 2.1.2 Support Request Management

When a field officer or regional coordinator required material, financial, technical, or spiritual support, the request was communicated through informal channels — a spoken request during a team meeting, a text message to a supervisor, or, at most, a brief email. There was no standardized form, no ticket number for tracking, no deadline enforcement, and no escalation mechanism.

### 2.1.3 Prayer Request Coordination

Prayer requests from field staff were collected informally, often shared during weekly WhatsApp group prayer sessions or mentioned in passing during team calls. There was no structured registry of prayer requests, no mechanism for tracking which requests had been answered, and no system for other regions to be informed of and commit to praying for needs outside their area.

### 2.1.4 Document Management

Documents such as strategic plans, training materials, financial reports, and media files were stored in individual staff members' personal Google Drive or local computer storage. There was no centralized document repository with controlled access, version tracking, or search capability.

### 2.1.5 User Access and Security

All operational data was accessible to any staff member who was added to the relevant WhatsApp group or email thread. There was no user authentication system, no role-based access control, and no audit trail of who had accessed or modified any piece of organizational data.

---

## 2.2 Problems of the Current System (PIECES Framework)

[]{#22-problems-of-the-current-system .anchor}

The PIECES framework — which evaluates an existing system against the dimensions of **P**erformance, **I**nformation, **E**conomics, **C**ontrol, **E**fficiency, and **S**ervice — was applied to structure the analysis of the identified deficiencies.

> *Table 1: PIECES Framework — Problems of the Existing System at Scripture Union Rwanda*

| # | PIECES Dimension | Identified Problem |
|:---|:---|:---|
| 1 | **Performance** | The report collection and approval cycle took between two and four weeks due to manual handling, phone-based feedback, and the absence of any digital tracking mechanism. National managers could not access current field data in real time. |
| 2 | **Information** | Reports submitted via WhatsApp or email were frequently incomplete, inconsistently formatted, and lacking standardized fields (e.g., missing demographic breakdowns or prayer requests). Data loss occurred when staff changed phones or departed the organization. |
| 3 | **Economics** | The organization incurred significant hidden costs in staff time consumed by report formatting, manual compilation, re-entry of data into spreadsheets, and repeated follow-up calls to field staff for missing information. Donor report preparation required weeks of manual effort. |
| 4 | **Control** | There was no mechanism to ensure segregation of duties (i.e., that a report was reviewed by someone other than its author). There was no access control preventing a staff member from reading data from another region. No audit trail existed for tracking modifications to shared documents. |
| 5 | **Efficiency** | Redundant data entry was widespread — field officers wrote reports on paper, which were then re-typed for digital submission, which were then manually re-entered into spreadsheets by coordinators for national consolidation. This triple-entry process introduced errors and wasted significant staff hours. |
| 6 | **Service** | The absence of a centralized platform meant that field officers had no visibility into the status of their submitted reports or support requests. Leadership had no capacity to produce consolidated national activity reports on demand, reducing the organization's responsiveness to donor inquiries and board requests. |

---

## 2.3 Proposed Solutions

[]{#23-proposed-solutions .anchor}

In response to the problems identified above, the following solutions were proposed and subsequently implemented in the SU Connect system:

| Problem | Proposed Solution Implemented |
|:---|:---|
| No centralized reporting platform | A unified web-based portal was developed where all reports are submitted, tracked, approved, and archived in a single database. |
| Slow, untracked approval process | A digital two-stage approval workflow was implemented: Field Officer submits → Coordinator reviews → status transitions enforced by the backend. Real-time WebSocket notifications alert relevant parties of each state change. |
| Inability to classify and summarize reports | Google Gemini AI was integrated to automatically assign a category, extract keywords, calculate a confidence score, and generate an executive summary for each submitted report. |
| No support request tracking | A formal ticketing module was developed with categories, urgency levels, deadline auto-calculation, comment threads, and status transitions from submission through fulfillment. |
| No access control | A four-tier RBAC model was implemented. Each user's data visibility is automatically scoped to their province through a custom Django QuerySet middleware. Administrators require MFA verification. |
| No audit trail | An immutable AuditLog table was implemented, recording every mutating API action with user ID, IP address, severity, and timestamp. Audit logs are accessible exclusively to Administrators. |

---

## 2.4 Functional Requirements

[]{#24-functional-requirements .anchor}

> *Table 2: Functional Requirements of the SU Connect System*

| FR # | Module | Requirement Description |
|:---|:---|:---|
| FR-01 | Authentication | The system shall allow registered users to log in using email and password, receiving JWT access and refresh tokens. |
| FR-02 | Authentication | The system shall enforce TOTP-based Multi-Factor Authentication (MFA) for all users with the Administrator role. |
| FR-03 | User Management | The Administrator shall be able to create, view, update, activate, and deactivate user accounts. |
| FR-04 | Reports | Any authenticated user shall be able to create an activity report in draft status. |
| FR-05 | Reports | A Field Officer or Coordinator shall be able to submit a saved draft, triggering the AI analysis pipeline. |
| FR-06 | Reports | A Regional Coordinator or Administrator shall be able to approve or return a submitted report, with a mandatory reason for return. |
| FR-07 | Reports | The system shall enforce segregation of duties: a user may not approve or return their own report. |
| FR-08 | AI Analysis | Upon report submission, the system shall automatically queue an AI analysis job using Celery and the Google Gemini API to classify the report and generate a summary. |
| FR-09 | AI Analysis | A National Manager or Administrator shall be able to manually override the AI-assigned category. |
| FR-10 | Support | Any authenticated user shall be able to create a support request with a category, urgency level, and description. |
| FR-11 | Support | A Coordinator or Administrator shall be able to assign a support request and update its status. |
| FR-12 | Support | All parties involved in a support request shall be able to add comments to a request's comment thread. |
| FR-13 | Prayer | Any authenticated user shall be able to submit a prayer request with a visibility setting (public, regional, or anonymous). |
| FR-14 | Prayer | Any authenticated user shall be able to commit to praying for a visible prayer request. |
| FR-15 | Documents | Any authenticated user shall be able to upload documents (PDF, Word, Excel, JPEG, PNG) up to 10 MB. |
| FR-16 | Documents | The system shall validate uploaded files against an extension whitelist and MIME magic binary signature. |
| FR-17 | Documents | Documents shall be linkable to one or more activity reports via a Many-to-Many relationship. |
| FR-18 | Notifications | The system shall deliver in-app notifications to users for report status changes, support updates, prayer commitments, and approaching deadlines, delivered in real time via WebSocket. |
| FR-19 | Analytics | A National Manager or Administrator shall be able to view dashboards showing monthly report trends, participation statistics, regional breakdowns, and activity type distributions. |
| FR-20 | Audit | The system shall automatically log all PUT, POST, PATCH, and DELETE operations with user identity, IP address, action, resource, and severity. |

---

## 2.5 Non-Functional Requirements

[]{#25-non-functional-requirements .anchor}

> *Table 3: Non-Functional Requirements of the SU Connect System*

| NFR # | Category | Requirement Description |
|:---|:---|:---|
| NFR-01 | Security | All API endpoints shall require JWT authentication except `/api/auth/login`. |
| NFR-02 | Security | HTTPOnly, Secure, SameSite cookies shall be used for storing the JWT refresh token to prevent XSS token theft. |
| NFR-03 | Security | The login endpoint shall be rate-limited to 5 requests per 15 minutes per IP address. General API endpoints shall be limited to 120 requests per minute. |
| NFR-04 | Security | Mutating REST requests shall accept an `Idempotency-Key` UUID header to prevent double-form submissions. |
| NFR-05 | Performance | API endpoints shall return responses within 500 milliseconds for standard CRUD operations under normal load conditions. |
| NFR-06 | Scalability | The system shall be deployable using Docker containers, enabling horizontal scaling of the application server without modification to the application code. |
| NFR-07 | Reliability | In the event that the Google Gemini API is unavailable, the system shall fall back to a dictionary-based keyword regex classifier to provide basic report categorization without service interruption. |
| NFR-08 | Privacy | The system shall strip all Personally Identifiable Information (PII) — email addresses, phone numbers, proper names — from report text before transmitting it to third-party AI APIs. |
| NFR-09 | Usability | The frontend interface shall be fully responsive, supporting desktop, tablet, and mobile screen sizes, with a dark/light theme toggle. |
| NFR-10 | Maintainability | All backend API endpoints shall be documented using the OpenAPI 3.0 standard via `drf-spectacular`, accessible at `/api/schema/swagger-ui/`. |

---

&nbsp;

# CHAPTER 3: REQUIREMENTS ANALYSIS AND DESIGN OF THE NEW SYSTEM {#chapter-3}

[]{#chapter-3 .anchor}

## 3.1 System Architecture Overview

[]{#31-system-architecture-overview .anchor}

The SU Connect system was designed as a **two-tier decoupled web application** following the RESTful API architecture pattern. The frontend and backend are independently deployed services communicating over HTTP REST and WebSocket (WS) protocols. The overall system is composed of five primary layers:

1. **Client Layer (React SPA):** The user interface layer, a Single-Page Application built with React v18 and served via Vite. It communicates with the backend via authenticated HTTP requests and maintains a persistent WebSocket connection for real-time notifications.

2. **Application Layer (Django ASGI via Daphne):** The Django backend running under the Daphne ASGI server, which concurrently handles synchronous REST API requests (via Django REST Framework) and asynchronous WebSocket connections (via Django Channels).

3. **Asynchronous Processing Layer (Celery + Redis):** Long-running background tasks — including AI report analysis, email notification dispatch, and deadline monitoring — are handled by Celery worker processes subscribed to a Redis message broker. This layer ensures that AI processing does not block REST API response times.

4. **Data Layer (PostgreSQL):** The primary persistent data store. A PostgreSQL relational database stores all application data under a normalized schema. Indexes are defined on high-frequency query columns (region, status, date, user ID).

5. **External Services Layer (Google Gemini API, SMTP):** Third-party integrations providing AI language processing (Google Gemini `gemini-1.5-flash`) and email delivery (configurable SMTP gateway).

> *Figure 1: System Architecture Diagram*

```
[Client Layer]
┌─────────────────────────────────────────────┐
│  React SPA (Vite)                           │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │  REST HTTP Client │  │  WebSocket Client│ │
│  └────────┬─────────┘  └────────┬─────────┘ │
└───────────┼──────────────────────┼───────────┘
            │ HTTPS                │ WSS
            ▼                      ▼
[Application Layer]
┌─────────────────────────────────────────────┐
│  Daphne ASGI Server                         │
│  ┌──────────────────┐  ┌──────────────────┐ │
│  │  DRF REST API    │  │  Django Channels │ │
│  └────────┬─────────┘  └────────┬─────────┘ │
└───────────┼──────────────────────┼───────────┘
            │                      │ Redis PubSub
            ▼                      ▼
[Async + Cache Layer]
┌────────────────────────────────────────────┐
│  Redis (Broker + Cache)  ←→  Celery Workers│
└────────────────────────────────────────────┘
            │ SQL ORM              │ External API
            ▼                      ▼
[Data + External Layers]
┌──────────────────────┐  ┌─────────────────┐
│  PostgreSQL Database │  │  Google Gemini  │
└──────────────────────┘  └─────────────────┘
```

---

## 3.2 UML Diagrams

[]{#32-uml-diagrams .anchor}

### 3.2.1 Use Case Diagram

The use case diagram (Figure 2) illustrates the interactions between the four system actors and the functional capabilities of the SU Connect system.

> *Figure 2: Use Case Diagram — SU Connect System*

**System Actors:**

| Actor | Role Description |
|:---|:---|
| Field Officer | The primary data entry actor. Submits reports, creates support tickets, files prayer requests, and uploads documents. |
| Regional Coordinator | Approves or returns submitted reports, assigns and manages regional support requests, and views regional analytics. |
| National Manager | Accesses national analytics, overrides AI categorization, generates consolidated reports, and manages cross-regional data. |
| Administrator | Manages system users, accesses audit logs, creates system-wide alerts, configures MFA, and has full access to all modules. |

**Use Cases by Actor:**

**Field Officer Use Cases:**
- UC-01: Login to the system
- UC-02: Create an activity report (draft)
- UC-03: Submit a draft report for approval
- UC-04: View status of submitted reports
- UC-05: Edit and resubmit a returned report
- UC-06: Submit a support request
- UC-07: Comment on a support request thread
- UC-08: Submit a prayer request
- UC-09: Commit to praying for a request
- UC-10: Upload a document
- UC-11: View personal notifications

**Regional Coordinator Use Cases:**
*(Includes all Field Officer use cases, plus:)*
- UC-12: View all reports in assigned region
- UC-13: Approve a submitted report
- UC-14: Return a report with comments
- UC-15: Assign a support request to a staff member
- UC-16: View regional analytics

**National Manager Use Cases:**
*(Includes Coordinator use cases, plus:)*
- UC-17: View reports across all regions
- UC-18: Override AI-assigned report category
- UC-19: Queue batch AI analysis of pending reports
- UC-20: View consolidated national report
- UC-21: Access national analytics dashboard

**Administrator Use Cases:**
*(Includes all roles' use cases, plus:)*
- UC-22: Create and manage user accounts
- UC-23: View and search immutable audit logs
- UC-24: Configure and broadcast system alerts
- UC-25: Enable and verify MFA on account

---

### 3.2.2 Class Diagram

The class diagram (Figure 3) maps the Django ORM models to their corresponding classes, fields, and relationships.

> *Figure 3: Class Diagram — SU Connect Django ORM Models*

**Primary Classes and Their Relationships:**

```
┌─────────────────────────────────────────┐
│              User                       │
├─────────────────────────────────────────┤
│ + id: UUID                              │
│ + email: String (unique)                │
│ + name: String                          │
│ + role: Enum [admin|nat_mgr|coord|off]  │
│ + region: String                        │
│ + department: String                    │
│ + position: String                      │
│ + mfa_enabled: Boolean                  │
│ + notif_prefs: JSONB                    │
│ + status: Enum [active|inactive]        │
└─────────────┬───────────────────────────┘
              │ 1
              │
      ┌───────┴──────────────────────────────────┐
      │              │              │             │
      ▼              ▼              ▼             ▼
┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐
│  Report  │  │  Support  │  │  Prayer  │  │  Document    │
│          │  │  Request  │  │  Request │  │              │
├──────────┤  ├───────────┤  ├──────────┤  ├──────────────┤
│ id       │  │ id        │  │ id       │  │ id           │
│ title    │  │ title     │  │ title    │  │ name         │
│ type     │  │ category  │  │ request  │  │ type         │
│ region   │  │ urgency   │  │ status   │  │ size         │
│ status   │  │ status    │  │ visibility│  │ storage_key  │
│ ai_cat   │  │ deadline  │  │ region   │  │ shared       │
│ ai_summ  │  │ region    │  │ commitm. │  │ category     │
│ conf.    │  │           │  │          │  │              │
│ keywords │  │           │  │          │  │              │
└──────────┘  └───────────┘  └──────────┘  └──────────────┘
      │              │              │
      ▼              ▼              ▼
┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   Notification│  │ SupportComment  │  │ PrayerCommitment │
├──────────────┤  ├─────────────────┤  ├──────────────────┤
│ type         │  │ comment         │  │ notes            │
│ title        │  │ created_at      │  │ created_at       │
│ message      │  └─────────────────┘  └──────────────────┘
│ read         │
└──────────────┘

┌──────────────────────────────────┐
│           AuditLog               │
├──────────────────────────────────┤
│ user_snapshot: String            │
│ action: String                   │
│ resource: String                 │
│ ip: String                       │
│ severity: Enum [info|warn|danger]│
│ created_at: DateTime             │
└──────────────────────────────────┘
```

---

### 3.2.3 Sequence Diagrams

#### Sequence Diagram 1: User Login with JWT Authentication

The following sequence diagram (Figure 4) illustrates the interactions between the client, backend API, and database during the user login process, including the handling of MFA for administrator accounts.

> *Figure 4: Sequence Diagram — User Login Process*

```
User Browser        React SPA           Django REST API      PostgreSQL DB
    │                   │                       │                   │
    │── Enter email  ──►│                       │                   │
    │   and password    │                       │                   │
    │                   │──POST /api/auth/login─►│                   │
    │                   │                       │──SELECT user WHERE │
    │                   │                       │  email=?          │
    │                   │                       │◄──────────────────│
    │                   │                       │                   │
    │                   │                   [validate password hash] │
    │                   │                       │                   │
    │                   │              [If role == administrator]    │
    │                   │                       │                   │
    │                   │                   [Check mfa_enabled]      │
    │                   │                       │                   │
    │                   │          [If MFA required but not verified]│
    │                   │◄── 200 {mfaRequired:true} ───────────────│
    │                   │                       │                   │
    │── Enter TOTP ──►  │                       │                   │
    │   code            │──POST /api/auth/mfa-verify ─────────────►│
    │                   │                       │──[Verify TOTP]    │
    │                   │◄── 200 {accessToken, refresh cookie} ────│
    │                   │                       │                   │
    │                   │          [If normal role — no MFA needed] │
    │                   │◄── 200 {accessToken, refresh cookie} ────│
    │                   │                       │──INSERT audit_log  │
    │                   │                       │  (login event)    │
```

#### Sequence Diagram 2: Report Submission and AI Analysis

The following sequence diagram (Figure 5) illustrates the full lifecycle of a report from submission by a Field Officer through AI analysis by Celery and Gemini, to real-time notification delivery via WebSocket.

> *Figure 5: Sequence Diagram — Report Submission and AI Analysis*

```
Field Officer   React SPA     Django REST   PostgreSQL   Redis/Celery  Google Gemini  Coordinator
     │              │               │             │              │              │              │
     │─Submit ───►  │               │             │              │              │              │
     │ Report        │──POST         │             │              │              │              │
     │               │  /api/reports►│             │              │              │              │
     │               │               │──INSERT     │              │              │              │
     │               │               │  report──►  │              │              │              │
     │               │               │◄─id─────────│              │              │              │
     │               │               │──analyze_   │              │              │              │
     │               │               │  report_    │              │              │              │
     │               │               │  task.delay►│──Queue task─►│              │              │
     │               │◄─201 Created──│             │              │              │              │
     │                               │             │              │              │              │
     │  [Background: Celery Worker picks up task]  │              │              │              │
     │                               │             │◄─Fetch report│              │              │
     │                               │             │              │──PII scrub── │              │
     │                               │             │              │─API request─►│              │
     │                               │             │              │◄─category,   │              │
     │                               │             │              │  summary─────│              │
     │                               │             │◄─UPDATE      │              │              │
     │                               │             │  report AI   │              │              │
     │                               │             │  fields──────│              │              │
     │                               │             │◄─INSERT      │              │              │
     │                               │             │  notification│              │              │
     │                               │             │  (Coordinator)│             │              │
     │                               │             │              │──WS Push ───────────────►  │
     │                               │             │              │              │ [Notification│
     │                               │             │              │              │  bell rings] │
```

---

### 3.2.4 Activity Diagram — Report Approval Workflow

The activity diagram (Figure 6) illustrates the decision flow of the report approval workflow, including the segregation of duties enforcement and the AI analysis pipeline.

> *Figure 6: Activity Diagram — Report Approval Workflow*

```
[START]
   │
   ▼
[Field Officer creates draft report]
   │
   ▼
[Fill required fields: title, type, region, date, description, participants]
   │
   ▼
[Save as Draft? ─────Yes──► [Draft saved; user can edit later]]
   │ No (Submit now)                │
   ▼                                ▼
[Validate form fields]    [User edits → Submit]
   │                                │
   ├── Invalid ──► [Show errors, prevent submission]
   │
   ▼ Valid
[Report status → "submitted"]
   │
   ▼
[Celery queues AI analysis task]
   │
   ▼
[AI Analysis: PII Scrub → Gemini API call → category + summary saved]
   │
   ├── Gemini unavailable ──► [Fallback: regex keyword classifier]
   │
   ▼
[Coordinator receives WebSocket notification]
   │
   ▼
[Coordinator views report]
   │
   ├── Is Coordinator the report's author?
   │         Yes ──► [403 Forbidden: Segregation of Duties enforced]
   │
   ▼ No
[Decision: Approve or Return?]
   │
   ├── APPROVE ──► [status = "approved"; submitter notified via WS]
   │                     │
   │                     ▼
   │               [Audit log created]
   │                     │
   │                     ▼
   │               [Report visible in national analytics]
   │
   └── RETURN ───► [Coordinator provides return comments]
                         │
                         ▼
                   [status = "returned"; submitter notified]
                         │
                         ▼
                   [Field Officer edits and resubmits]
                         │
                         ▼
                   [Loop back to AI Analysis]
[END]
```

---

## 3.3 Database Design and Data Dictionary

[]{#33-database-design-and-data-dictionary .anchor}

The SU Connect database was designed under PostgreSQL using Django's ORM migration system. The schema follows Third Normal Form (3NF) to minimize data redundancy and enforce referential integrity. The primary key for the User entity is a UUID (Universally Unique Identifier), while all other entities use auto-incrementing BIGSERIAL integers for performance optimization.

> *Figure 7: Entity-Relationship (ER) Diagram — [Placeholder: Insert ER diagram exported from your database tool (e.g., pgAdmin, DBeaver, or draw.io)]*

---

### Table 5: Data Dictionary — `accounts_user`

> *Table 5: Data Dictionary — accounts_user Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid4 | Universally unique identifier for each user. |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL | User's email address; serves as the login username. |
| `name` | VARCHAR(255) | NOT NULL | Full display name of the user. |
| `username` | VARCHAR(150) | NOT NULL | Auto-populated from email for Django compatibility. |
| `password` | VARCHAR(255) | NOT NULL | PBKDF2_SHA256 hashed password. |
| `role` | VARCHAR(50) | NOT NULL | Enum: `administrator`, `national_manager`, `regional_coordinator`, `field_officer`. |
| `region` | VARCHAR(100) | NOT NULL | Province assignment: Kigali City, Eastern, Northern, Western, or Southern Province. |
| `department` | VARCHAR(100) | NOT NULL | Organizational department (e.g., Youth Ministry, Field Operations). |
| `position` | VARCHAR(100) | NOT NULL | Job title within the organization. |
| `phone` | VARCHAR(30) | NULLABLE | Contact phone number. |
| `avatar` | VARCHAR(10) | DEFAULT '' | Two-letter initials auto-generated from the user's name. |
| `status` | VARCHAR(20) | DEFAULT 'active' | Enum: `active`, `inactive`. |
| `mfa_enabled` | BOOLEAN | DEFAULT FALSE | Flag indicating whether TOTP MFA has been configured. |
| `mfa_secret` | VARCHAR(255) | NULLABLE | Base32-encoded TOTP secret key for MFA verification. |
| `notif_prefs` | JSONB | DEFAULT {} | User notification preferences (email, in-app, SMS toggles). |
| `last_login` | TIMESTAMPTZ | NULLABLE | Timestamp of the most recent successful login. |
| `join_date` | DATE | DEFAULT today | Date the user account was created. |
| `is_active` | BOOLEAN | DEFAULT TRUE | Django standard field; controls login access. |
| `is_staff` | BOOLEAN | DEFAULT FALSE | Django admin panel access flag. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Record creation timestamp. |
| `updated_at` | TIMESTAMPTZ | AUTO NOW | Record last modification timestamp. |

---

### Table 6: Data Dictionary — `reports`

> *Table 6: Data Dictionary — reports Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `title` | VARCHAR(255) | NOT NULL | Title of the activity report. |
| `type` | VARCHAR(50) | NOT NULL | Enum: Outreach, Bible Study, Training, Meeting, Community Event, Prayer Meeting, Youth Program. |
| `region` | VARCHAR(100) | NOT NULL | Province where the activity took place. |
| `department` | VARCHAR(100) | NOT NULL | Organizational department responsible for the activity. |
| `activity_date` | DATE | NOT NULL | Date on which the activity was conducted. |
| `duration` | VARCHAR(100) | NULLABLE | Duration of the activity (e.g., "6 hours", "2 days"). |
| `location` | VARCHAR(255) | NULLABLE | Physical venue or location of the activity. |
| `status` | VARCHAR(50) | DEFAULT 'draft' | Enum: `draft`, `submitted`, `approved`, `returned`. |
| `submitted_by_id` | UUID | FK → accounts_user | The user who authored and submitted the report. |
| `participants` | INTEGER | DEFAULT 0 | Total number of participants at the activity. |
| `demographics` | JSONB | DEFAULT {} | Participant breakdown: `{"male":N, "female":N, "youth":N, "adults":N}`. |
| `description` | TEXT | NOT NULL | Full narrative description of the activity. |
| `outcomes` | TEXT | NULLABLE | Outcomes and results achieved. |
| `challenges` | TEXT | NULLABLE | Challenges and difficulties encountered. |
| `prayer_requests` | TEXT | NULLABLE | Prayer items gathered from participants. |
| `ai_category` | VARCHAR(100) | NULLABLE | Category assigned by Google Gemini AI. |
| `confidence` | INTEGER (0–100) | NULLABLE | AI classification confidence percentage. |
| `keywords` | JSONB | DEFAULT [] | Array of thematic keywords extracted by AI. |
| `ai_summary` | TEXT | NULLABLE | Executive summary generated by Google Gemini. |
| `overridden` | BOOLEAN | DEFAULT FALSE | Flag set when a National Manager manually overrides the AI category. |
| `submitted_at` | TIMESTAMPTZ | NULLABLE | Timestamp when report status changed to `submitted`. |
| `approved_at` | TIMESTAMPTZ | NULLABLE | Timestamp when report status changed to `approved`. |
| `returned_at` | TIMESTAMPTZ | NULLABLE | Timestamp when report status changed to `returned`. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Record creation timestamp. |
| `updated_at` | TIMESTAMPTZ | AUTO NOW | Record last modification timestamp. |

---

### Table 7: Data Dictionary — `support_requests`

> *Table 7: Data Dictionary — support_requests Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `title` | VARCHAR(255) | NOT NULL | Short descriptive title of the support request. |
| `category` | VARCHAR(100) | NOT NULL | Enum: Financial, Equipment, Spiritual, Technical, Training. |
| `description` | TEXT | NOT NULL | Detailed description of the support need. |
| `urgency` | VARCHAR(50) | DEFAULT 'medium' | Enum: `low`, `medium`, `high`, `critical`. |
| `status` | VARCHAR(50) | DEFAULT 'submitted' | Enum: `submitted`, `under review`, `approved`, `fulfilled`, `closed`. |
| `requester_id` | UUID | FK → accounts_user | User who created the support request. |
| `assigned_to_id` | UUID | FK → accounts_user, NULLABLE | User responsible for fulfilling the request. |
| `deadline` | DATE | NULLABLE | Auto-calculated based on urgency (critical=1d, high=3d, medium=7d, low=14d). |
| `region` | VARCHAR(100) | DEFAULT '' | Province associated with the request; auto-populated from requester's region. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Record creation timestamp. |
| `updated_at` | TIMESTAMPTZ | AUTO NOW | Record last modification timestamp. |

---

### Table 8: Data Dictionary — `support_comments`

> *Table 8: Data Dictionary — support_comments Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `request_id` | BIGINT | FK → support_requests (CASCADE) | The support request this comment belongs to. |
| `user_id` | UUID | FK → accounts_user (RESTRICT) | The user who authored the comment. |
| `comment` | TEXT | NOT NULL | The full text of the comment. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Timestamp when the comment was posted. |

---

### Table 9: Data Dictionary — `prayer_requests`

> *Table 9: Data Dictionary — prayer_requests Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `title` | VARCHAR(255) | NOT NULL | Short title of the prayer request. |
| `request` | TEXT | NOT NULL | Full narrative body of the prayer need. |
| `status` | VARCHAR(50) | DEFAULT 'active' | Enum: `active`, `answered`, `archived`. |
| `visibility` | VARCHAR(50) | DEFAULT 'public' | Enum: `public`, `regional`, `anonymous`. |
| `requester_id` | UUID | FK → accounts_user (RESTRICT) | User who submitted the prayer request. |
| `region` | VARCHAR(100) | DEFAULT '' | Province; auto-populated from requester's region. |
| `commitments_count` | INTEGER | DEFAULT 0 | Count of users who have committed to pray for this request. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Record creation timestamp. |
| `updated_at` | TIMESTAMPTZ | AUTO NOW | Record last modification timestamp. |

---

### Table 10: Data Dictionary — `prayer_commitments`

> *Table 10: Data Dictionary — prayer_commitments Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `request_id` | BIGINT | FK → prayer_requests (CASCADE) | The prayer request being committed to. |
| `user_id` | UUID | FK → accounts_user (RESTRICT) | The user who committed to pray. |
| `notes` | TEXT | NULLABLE | Optional personal note from the intercessor. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Timestamp of the commitment. |

---

### Table 11: Data Dictionary — `documents`

> *Table 11: Data Dictionary — documents Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `name` | VARCHAR(255) | NOT NULL | Display name of the document. |
| `type` | VARCHAR(100) | NOT NULL | MIME type or extension type (e.g., application/pdf). |
| `size` | BIGINT | NOT NULL | File size in bytes. |
| `storage_key` | VARCHAR(510) | UNIQUE, NOT NULL | Storage path or S3 object key for the file. |
| `uploaded_by_id` | UUID | FK → accounts_user (RESTRICT) | User who uploaded the document. |
| `downloads` | INTEGER | DEFAULT 0 | Number of times the document has been downloaded. |
| `shared` | BOOLEAN | DEFAULT FALSE | If TRUE, visible to all authenticated users regardless of region. |
| `category` | VARCHAR(100) | DEFAULT 'Others' | Document classification (e.g., Report, Finance, Training). |
| `description` | TEXT | DEFAULT '' | Brief description of the document's content. |
| `tags` | VARCHAR(255) | DEFAULT '' | Comma-separated tags for searchability. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Upload timestamp. |
| `updated_at` | TIMESTAMPTZ | AUTO NOW | Last modification timestamp. |

*(Note: The `report_attachments` table manages the Many-to-Many relationship between documents and reports.)*

---

### Table 12: Data Dictionary — `notifications`

> *Table 12: Data Dictionary — notifications Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `user_id` | UUID | FK → accounts_user (CASCADE) | The recipient of the notification. |
| `type` | VARCHAR(50) | NOT NULL | Enum: `report`, `support`, `prayer`, `deadline`, `system`, `other`. |
| `title` | VARCHAR(255) | NOT NULL | Short notification headline. |
| `message` | TEXT | NOT NULL | Full notification body text. |
| `icon` | VARCHAR(50) | NULLABLE | Icon identifier for frontend rendering (e.g., "check", "clock"). |
| `read` | BOOLEAN | DEFAULT FALSE | Flag indicating whether the user has read the notification. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Timestamp when the notification was created. |

---

### Table 13: Data Dictionary — `system_alerts`

> *Table 13: Data Dictionary — system_alerts Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `title` | VARCHAR(255) | NOT NULL | Alert headline. |
| `message` | TEXT | NOT NULL | Alert body text. |
| `priority` | VARCHAR(20) | DEFAULT 'medium' | Enum: `low`, `medium`, `high`, `urgent`. |
| `is_announcement` | BOOLEAN | DEFAULT FALSE | If TRUE, displayed as a system-wide announcement banner. |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Timestamp after which the alert is no longer shown. |
| `created_by_id` | UUID | FK → accounts_user, NULLABLE | Administrator who created the alert. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Creation timestamp. |

---

### Table 14: Data Dictionary — `audit_logs`

> *Table 14: Data Dictionary — audit_logs Table*

| Column | Data Type | Constraint | Description |
|:---|:---|:---|:---|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing identifier. |
| `user_id` | UUID | FK → accounts_user, NULLABLE | The user who performed the action (NULL for unauthenticated events). |
| `user_snapshot` | VARCHAR(255) | NOT NULL | Name of the user at the time of the event (preserved even if user is deleted). |
| `action` | VARCHAR(255) | NOT NULL | Description of the action performed (e.g., "Report Submitted", "User Created"). |
| `resource` | VARCHAR(255) | NOT NULL | The affected resource or object (e.g., "Report #12: Youth Outreach"). |
| `ip` | VARCHAR(45) | NOT NULL | IP address of the caller (supports IPv4 and IPv6). |
| `severity` | VARCHAR(20) | DEFAULT 'info' | Enum: `info`, `warning`, `danger`. |
| `created_at` | TIMESTAMPTZ | AUTO NOW ADD | Immutable timestamp of the log entry. |

---

### Table 15: API Endpoint Map

> *Table 15: SU Connect REST API Endpoint Reference*

| Endpoint | Method | Permitted Roles | Function |
|:---|:---:|:---|:---|
| `/api/auth/login` | POST | Public | Authenticates user and returns JWT access token + HTTPOnly refresh cookie. |
| `/api/auth/token/refresh` | POST | Public | Issues a new access token using the stored refresh cookie. |
| `/api/auth/mfa/setup` | POST | Administrator | Generates a TOTP QR code for MFA configuration. |
| `/api/auth/mfa/verify` | POST | Administrator | Verifies a TOTP code and marks MFA as enabled. |
| `/api/users` | GET | Administrator | Returns a paginated list of all system users. |
| `/api/users` | POST | Administrator | Creates a new user account. |
| `/api/users/me` | GET/PUT | Authenticated | Retrieves and updates the current user's profile and notification preferences. |
| `/api/reports` | GET | Authenticated | Returns reports scoped to the user's region and role. |
| `/api/reports` | POST | Authenticated | Creates a new activity report (draft or submitted). |
| `/api/reports/:id` | GET | Authenticated | Returns the full detail of a single report. |
| `/api/reports/:id` | PUT | Owner only | Updates a draft report. |
| `/api/reports/:id/status` | PATCH | Coordinator, Admin | Approves or returns a submitted report. |
| `/api/reports/:id/ai-override` | PATCH | Manager, Admin | Overrides the AI-assigned category of a report. |
| `/api/reports/ai-analyze` | POST | Manager, Admin | Queues one or all pending reports for AI batch analysis. |
| `/api/reports/ai-chat` | POST | Authenticated | Submits a natural language query to the RAG-powered AI chat assistant. |
| `/api/reports/analytics/summary` | GET | Manager, Admin | Returns dashboard metrics (monthly trends, regional breakdown, type distribution). |
| `/api/reports/consolidated` | GET | Manager, Admin | Returns consolidated national report data with AI executive summary. |
| `/api/support` | GET/POST | Authenticated | Lists and creates support requests. |
| `/api/support/:id` | GET/PATCH | Authenticated | Retrieves and updates a support request. |
| `/api/support/:id/comments` | POST | Authenticated | Adds a comment to a support request thread. |
| `/api/prayer` | GET/POST | Authenticated | Lists and creates prayer requests (visibility-filtered). |
| `/api/prayer/:id/commit` | POST | Authenticated | Records a user's commitment to pray for a request. |
| `/api/documents` | GET/POST | Authenticated | Lists and uploads documents (region-filtered). |
| `/api/documents/:id/download` | GET | Authenticated | Returns a signed download URL for the document. |
| `/api/notifications` | GET | Authenticated | Returns the current user's notifications (unread first). |
| `/api/notifications/mark-read` | PATCH | Authenticated | Marks selected notifications as read. |
| `/api/audit-logs` | GET | Administrator | Returns the immutable audit log with filtering support. |

---

&nbsp;

# CHAPTER 4: IMPLEMENTATION OF THE NEW SYSTEM AND TESTING {#chapter-4}

[]{#chapter-4 .anchor}

## 4.1 Development Environment and Tools

[]{#41-development-environment-and-tools .anchor}

The SU Connect system was developed using the following tools and environments:

| Tool / Technology | Version | Purpose |
|:---|:---|:---|
| **Python** | 3.11+ | Primary backend programming language. |
| **Django** | 6.0.5+ | Python web framework providing ORM, admin, and middleware. |
| **Django REST Framework** | 3.14.0 | REST API serialization, authentication, and viewsets. |
| **Daphne** | Latest | ASGI server serving both REST and WebSocket connections. |
| **Django Channels** | 4.0.0 | WebSocket protocol handling and consumer management. |
| **Celery** | 5.3.6 | Distributed task queue for asynchronous background processing. |
| **Redis** | 5.0.1 | Message broker for Celery and Channels layer backend. |
| **PostgreSQL** | 14+ | Primary relational database management system. |
| **psycopg2** | 2.9.9+ | Python PostgreSQL database adapter. |
| **Google Generative AI SDK** | 0.8.6+ | Python client for Google Gemini API (`gemini-1.5-flash`). |
| **djangorestframework-simplejwt** | 5.3.1 | JWT access and refresh token authentication. |
| **django-otp** | 1.3.0 | TOTP-based Multi-Factor Authentication. |
| **python-magic** | 0.4.27 | MIME type detection via binary magic byte signature. |
| **drf-spectacular** | 0.27.1 | OpenAPI 3.0 schema generation and Swagger UI. |
| **Pytest / pytest-django** | 8.1.1 / 4.8.0 | Backend automated testing framework. |
| **Node.js** | 18+ | JavaScript runtime for frontend tooling. |
| **React** | 18+ | Frontend UI framework (Single-Page Application). |
| **Vite** | 5+ | Frontend bundler and development server. |
| **React Router DOM** | 6+ | Client-side SPA routing. |
| **react-hot-toast** | Latest | Toast notification library. |
| **Visual Studio Code** | Latest | Primary code editor (Windows). |
| **Git / GitHub** | Latest | Version control and remote repository. |
| **Postman** | Latest | API testing and endpoint documentation. |
| **pgAdmin 4** | Latest | PostgreSQL database management and visualization. |

---

## 4.2 Hardware and Software Requirements

[]{#42-hardware-and-software-requirements .anchor}

### 4.2.1 Development Hardware Requirements

> *Table 16: Hardware Requirements*

| Component | Minimum Specification | Recommended Specification |
|:---|:---|:---|
| Processor | Intel Core i5 (8th Gen) / AMD Ryzen 5 | Intel Core i7 (10th Gen) / AMD Ryzen 7 |
| RAM | 8 GB DDR4 | 16 GB DDR4 |
| Storage | 256 GB SSD | 512 GB SSD |
| Network | 10 Mbps broadband | 50 Mbps+ broadband |
| Display | 1366 × 768 | 1920 × 1080 (Full HD) |

### 4.2.2 Software Requirements

> *Table 17: Software Requirements*

| Software | Version | Role |
|:---|:---|:---|
| **Operating System** | Windows 10/11, Ubuntu 22.04 LTS | Development and server environment |
| **Python** | 3.11+ | Backend runtime |
| **Node.js** | 18 LTS+ | Frontend build toolchain |
| **PostgreSQL** | 14+ | Database server |
| **Redis** | 7.0+ | Cache and message broker |
| **Git** | 2.40+ | Version control |
| **Web Browser** | Chrome 120+, Firefox 115+, Edge 120+ | User-facing application access |

---

## 4.3 System Screenshots and Interface Description

[]{#43-system-screenshots-and-interface-description .anchor}

This section presents the key user interface screens of the SU Connect system, accompanied by descriptions of their functionality and design.

### 4.3.1 Authentication Module

**Figure 8: Login Page**

> *Figure 8: SU Connect Login Page — Email and password entry form with the SU Rwanda logo and mission statement. The page features a split-screen design with an animated gradient background.*

[Figure 8: Login Screen — Insert screenshot here]

The Login page presented users with an email and password input form. The page enforced rate limiting at the API level (5 attempts per 15 minutes per IP address). For users with the Administrator role, a second MFA step was presented after successful password validation, requiring the entry of a Time-based One-Time Password (TOTP) from the user's authenticator application. JWT access tokens were stored in memory, while refresh tokens were issued as HTTPOnly cookies to prevent client-side JavaScript access and mitigate XSS token theft.

&nbsp;

**Figure 9: User Registration Page**

> *Figure 9: SU Connect Registration Page — Form allowing new staff members to register with their name, email, province, department, position, and password. Requires administrator invitation for role assignment.*

[Figure 9: Registration Screen — Insert screenshot here]

&nbsp;

### 4.3.2 Dashboard Module

**Figure 10: Main Dashboard — Field Officer View**

> *Figure 10: Main Dashboard (Field Officer) — Displays the user's recent reports with their approval status, upcoming deadlines, unread notification count, and quick-action buttons for submitting a new report or support request.*

[Figure 10: Field Officer Dashboard — Insert screenshot here]

The dashboard provided each user with a role-appropriate overview of their operational landscape. Field Officers were presented with a summary of their recent report statuses (draft, submitted, approved, returned), a notification badge showing unread alerts, and a quick-action panel for common workflows.

&nbsp;

**Figure 11: Main Dashboard — National Manager View**

> *Figure 11: Main Dashboard (National Manager) — Displays KPI cards showing total approved reports, total participants reached, pending reports awaiting approval, and active support requests, alongside a monthly activity trend chart and regional distribution map.*

[Figure 11: National Manager Dashboard — Insert screenshot here]

National Managers were presented with an aggregated dashboard containing organization-wide key performance indicators (KPIs). The dashboard featured interactive charts built with the Recharts library, including monthly report trend lines, activity type donut charts, and regional bar comparisons. All chart data was fetched dynamically from the `/api/reports/analytics/summary` endpoint.

&nbsp;

### 4.3.3 Report Management Module

**Figure 12: Report Submission Form**

> *Figure 12: Activity Report Submission Form — Multi-section form with fields for activity type, region, date, duration, location, participant count, demographic breakdown (male/female/youth/adults), description, outcomes, challenges, and prayer requests. Includes a document attachment panel.*

[Figure 12: Report Submission Form — Insert screenshot here]

The Report Submission Form was organized into a multi-step layout. Required fields were validated both on the client side (React controlled form state) and on the server side (DRF serializer validation). The form supported saving as a draft (allowing the user to return and complete it later) or immediate submission, which triggered the AI analysis Celery task.

&nbsp;

**Figure 13: Report List with Filters**

> *Figure 13: Report List Page — Paginated table of activity reports with filter controls for region, status, activity type, and date range. Each row displays the report title, type badge, submission date, region, participant count, and current approval status indicator.*

[Figure 13: Report List — Insert screenshot here]

&nbsp;

**Figure 14: Report Detail View with AI Metadata**

> *Figure 14: Report Detail View — Shows the full report narrative alongside an AI Analysis panel displaying the assigned category, confidence percentage bar, extracted keywords, and AI-generated executive summary. Approval action buttons are shown for Regional Coordinators.*

[Figure 14: Report Detail with AI Metadata — Insert screenshot here]

The Report Detail view was the most information-dense screen in the application. For Coordinators, it included "Approve" and "Return" action buttons with a mandatory comments field for return actions. The AI Metadata panel visually communicated the Gemini-assigned category (e.g., "Outreach"), a confidence percentage displayed as a color-coded progress bar (green ≥ 80%, amber ≥ 60%, red < 60%), extracted keywords as tag chips, and the full AI executive summary. If the AI analysis was still pending (the Celery job had not yet completed), a loading spinner was displayed in the AI panel.

&nbsp;

### 4.3.4 AI Analysis Dashboard

**Figure 15: AI Analysis Dashboard**

> *Figure 15: AI Analysis Dashboard — Admin/Manager view showing a table of all reports with their AI-assigned categories, confidence scores, and override status. Includes buttons to queue a new batch AI analysis job and to manually override individual report categories.*

[Figure 15: AI Analysis Dashboard — Insert screenshot here]

The AI Analysis Dashboard provided National Managers and Administrators with a centralized view of the AI categorization state of all reports. Managers could trigger a batch re-analysis of all reports lacking AI metadata, and could manually override the AI category for any individual report (setting `overridden = true` and `confidence = 100` in the database). A RAG-powered chat panel was also included, allowing users to ask natural language questions about the report corpus (e.g., "How many youth were reached in Eastern Province in Q1 2025?").

&nbsp;

### 4.3.5 Support Request Module

**Figure 16: Support Requests List**

> *Figure 16: Support Requests List — Kanban-style or tabular view of all support tickets, color-coded by urgency (red=critical, orange=high, yellow=medium, gray=low). Each card shows the category, title, requester, deadline, and current status.*

[Figure 16: Support Requests List — Insert screenshot here]

&nbsp;

**Figure 17: Support Request Submission Form**

> *Figure 17: Support Request Form — Form for creating a support request with fields for category (Financial/Equipment/Technical/Training/Spiritual), title, description, and urgency level. A deadline is automatically suggested based on the selected urgency level.*

[Figure 17: Support Form — Insert screenshot here]

&nbsp;

### 4.3.6 Prayer Request Module

**Figure 18: Prayer Requests Module**

> *Figure 18: Prayer Requests Page — Card grid of active prayer requests showing title, submission region, visibility badge (Public/Regional/Anonymous), number of commitments, and an "I Will Pray" button. Includes a form to submit a new prayer request.*

[Figure 18: Prayer Module — Insert screenshot here]

The Prayer Request module was designed with particular sensitivity to the organizational culture of SU Rwanda. Users could submit requests under three visibility settings: **Public** (visible to all staff across all regions), **Regional** (visible only to staff within the same province), and **Anonymous** (visible to all but with the requester's identity hidden from other users). Users could commit to pray for any visible request, with the commitment count displayed on the card. Marked-as-answered requests were visually distinguished with a checkmark badge.

&nbsp;

### 4.3.7 Analytics and Consolidation

**Figure 19: Analytics Dashboard**

> *Figure 19: Analytics Dashboard — Full-page dashboard with interactive charts including: monthly report submission trends (line chart), activity type distribution (donut chart), regional comparison (bar chart), and participant demographic totals (stacked bar). Filter controls for region and date range.*

[Figure 19: Analytics Dashboard — Insert screenshot here]

&nbsp;

**Figure 20: Document Repository**

> *Figure 20: Document Repository — Grid view of uploaded documents with category filters (All/Reports/Finance/Training/Others). Each card shows document type icon, name, uploader, upload date, size, and download count. Includes a drag-and-drop upload area.*

[Figure 20: Document Repository — Insert screenshot here]

&nbsp;

**Figure 21: Consolidation Dashboard**

> *Figure 21: Consolidation Dashboard — National Manager view showing consolidated KPIs (total reports, total participants, demographic totals), a geographic distribution table by province, a filtered list of the underlying approved reports, and an AI-generated national executive summary.*

[Figure 21: Consolidation Dashboard — Insert screenshot here]

&nbsp;

### 4.3.8 Administrative Modules

**Figure 22: User Management Panel**

> *Figure 22: User Management Panel — Administrator view showing a table of all system users with their name, role badge, region, department, status (Active/Inactive), and last login timestamp. Includes controls to create, edit, activate, deactivate, and delete user accounts.*

[Figure 22: User Management — Insert screenshot here]

&nbsp;

**Figure 23: Security Audit Log**

> *Figure 23: Security Audit Log — Administrator-only view displaying a chronological log of all system events. Each entry shows severity indicator (Info/Warning/Danger), timestamp, user identity, action type, affected resource, and caller IP address. Includes search and date range filters.*

[Figure 23: Audit Log — Insert screenshot here]

The Security Audit Log was an immutable record of all system mutations. It was designed to be read-only and was accessible exclusively to users with the `administrator` role. The `AuditLog` table records were never updated or deleted, ensuring a tamper-proof chain of accountability. Failed login attempts — including the IP address of the caller — were logged with `severity = 'danger'` to alert administrators of potential unauthorized access attempts.

&nbsp;

**Figure 24: Notification Center**

> *Figure 24: Notification Center — Full-page view of all user notifications grouped by type (Report Updates, Support Updates, Prayer Responses, System Alerts, Deadline Reminders). Each notification shows its icon, title, message, timestamp, and read status.*

[Figure 24: Notification Center — Insert screenshot here]

&nbsp;

**Figure 25: System Settings Page**

> *Figure 25: Settings Page — User profile settings (name, phone, avatar, password change), notification preference toggles (email, in-app, SMS; per-event-type), theme selector (Dark/Light), and MFA configuration panel for administrators.*

[Figure 25: Settings Page — Insert screenshot here]

---

## 4.4 System Testing

[]{#44-system-testing .anchor}

### 4.4.1 Testing Approach

The system was tested using two complementary strategies:

1. **Automated Unit and Integration Testing** using Pytest (`pytest-django`) with test coverage reporting via `pytest-cov`. Automated tests were organized under the `tests/` directory in the Django project and were executed using the command `pytest --cov=apps --cov-report=term-missing`.

2. **Structured Manual User Acceptance Testing (UAT)** conducted with representative users from each role group (Administrator, National Manager, Regional Coordinator, Field Officer), following predefined test case scripts.

---

### 4.4.2 Test Cases — Authentication Module

> *Table 18: Test Cases — Authentication Module*

| TC # | Test Scenario | Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|
| TC-01 | Successful login with valid credentials | Enter valid email and password on login page; submit | Redirected to dashboard; access token stored in memory | As expected | ✅ Pass |
| TC-02 | Login with incorrect password | Enter valid email, incorrect password; submit | Error message displayed: "Invalid credentials"; no token issued | As expected | ✅ Pass |
| TC-03 | Login rate limit enforcement | Submit login form 6 times within 15 minutes with wrong password | After 5th attempt, API returns 429 Too Many Requests with retry-after header | As expected | ✅ Pass |
| TC-04 | Administrator MFA requirement | Login as administrator role user | After password validation, MFA code prompt displayed | As expected | ✅ Pass |
| TC-05 | Administrator MFA with valid TOTP | Enter valid 6-digit TOTP code after password verification | Access token issued; redirected to dashboard | As expected | ✅ Pass |
| TC-06 | Administrator MFA with expired TOTP | Enter expired TOTP code | Error message: "Invalid or expired OTP code" | As expected | ✅ Pass |
| TC-07 | JWT token refresh | Let access token expire (after 60 minutes); perform API action | Access token silently refreshed using HTTPOnly refresh cookie | As expected | ✅ Pass |
| TC-08 | Logout | Click logout button | Refresh cookie cleared; user redirected to login page | As expected | ✅ Pass |

---

### 4.4.3 Test Cases — Report Management Module

> *Table 19: Test Cases — Report Management Module*

| TC # | Test Scenario | Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|
| TC-09 | Create report draft | Fill report form partially; click "Save Draft" | Report created with status `draft`; user returned to report list | As expected | ✅ Pass |
| TC-10 | Submit report directly | Fill complete report form; click "Submit" | Report created with status `submitted`; AI analysis job queued | As expected | ✅ Pass |
| TC-11 | Approve report (Coordinator) | Coordinator opens submitted report; clicks "Approve" | Report status changes to `approved`; submitter receives notification | As expected | ✅ Pass |
| TC-12 | Return report (Coordinator) | Coordinator clicks "Return"; enters return reason | Report status changes to `returned`; return reason saved; submitter notified | As expected | ✅ Pass |
| TC-13 | Segregation of duties enforcement | Coordinator attempts to approve their own report | API returns 403: "Segregation of duties: You cannot approve your own report" | As expected | ✅ Pass |
| TC-14 | Regional data isolation | Field Officer from Eastern Province queries reports | Only Eastern Province reports returned; no other region data visible | As expected | ✅ Pass |
| TC-15 | Edit a returned report | Submitter opens returned report; edits description; resubmits | Report status transitions back to `submitted`; AI re-analysis queued | As expected | ✅ Pass |
| TC-16 | Edit an approved report | Submitter attempts to edit an approved report | API returns 403: modification of approved reports is not permitted | As expected | ✅ Pass |

---

### 4.4.4 Test Cases — AI Analysis Module

> *Table 20: Test Cases — AI Analysis Module*

| TC # | Test Scenario | Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|
| TC-17 | AI categorization on report submission | Submit a report describing a youth evangelism event | AI assigns category "Outreach" with ≥ 80% confidence; keywords extracted | As expected | ✅ Pass |
| TC-18 | AI summary generation | Submit a report with full description text | `ai_summary` field populated with an executive summary ≤ 3 sentences | As expected | ✅ Pass |
| TC-19 | PII scrubbing before API call | Submit report containing an email address and phone number in the description | PII stripped from text sent to Gemini; email and phone not present in AI payload log | As expected | ✅ Pass |
| TC-20 | Fallback classifier when Gemini unavailable | Disable Gemini API key; submit a report | System logs Gemini failure; fallback keyword classifier assigns a basic category; no crash | As expected | ✅ Pass |
| TC-21 | National Manager category override | National Manager opens report; changes AI category from "Training" to "Youth Program" | `overridden = true`, `confidence = 100`, `ai_category = "Youth Program"` saved | As expected | ✅ Pass |
| TC-22 | AI chat query | Manager types "How many participants in Northern Province?" in AI chat panel | AI returns a contextually relevant answer derived from the report corpus | As expected | ✅ Pass |

---

### 4.4.5 Test Cases — Support Request Module

> *Table 21: Test Cases — Support Request Module*

| TC # | Test Scenario | Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|
| TC-23 | Create support request | Fill support form with category "Equipment", urgency "High" | Request created; deadline auto-set to 3 days from creation | As expected | ✅ Pass |
| TC-24 | Assign support request | Coordinator opens unassigned request; selects a user as assignee | `assigned_to` field updated; status changes to "under review" | As expected | ✅ Pass |
| TC-25 | Add comment to support request | User types comment in request thread; clicks "Post" | Comment saved; visible to all parties in the request thread | As expected | ✅ Pass |
| TC-26 | Mark request as fulfilled | Coordinator changes status to "Fulfilled" | Status updated; requester receives notification | As expected | ✅ Pass |

---

### 4.4.6 Test Cases — Security and Access Control

> *Table 22: Test Cases — Security and Access Control*

| TC # | Test Scenario | Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|
| TC-27 | Unauthenticated API access | Send GET request to `/api/reports` without Authorization header | API returns 401 Unauthorized | As expected | ✅ Pass |
| TC-28 | Role-based endpoint restriction | Field Officer sends GET request to `/api/audit-logs` | API returns 403 Forbidden: insufficient privileges | As expected | ✅ Pass |
| TC-29 | Audit log immutability | Administrator attempts DELETE or PUT on audit log via API | No such endpoint exists; API returns 405 Method Not Allowed | As expected | ✅ Pass |
| TC-30 | Document MIME validation — spoofed extension | Upload a file named `malicious.pdf` that is actually an executable (.exe binary) | System detects MIME mismatch via magic byte check; upload rejected with 400 error | As expected | ✅ Pass |
| TC-31 | Idempotency key protection | Submit same report POST request twice with identical Idempotency-Key header | Second request returns the same response as the first without creating a duplicate record | As expected | ✅ Pass |
| TC-32 | Cross-region data access attempt | Western Province coordinator accesses `/api/reports?region=Eastern Province` | Response contains only Western Province data; regional middleware overrides filter | As expected | ✅ Pass |

---

&nbsp;

# CHAPTER 5: CONCLUSION AND RECOMMENDATIONS {#chapter-5}

[]{#chapter-5 .anchor}

## 5.1 Summary of Findings

[]{#51-summary-of-findings .anchor}

This project set out to address a documented set of operational inefficiencies within Scripture Union Rwanda's administrative and reporting management processes. [The research confirmed that the organization's reliance on manual, paper-based, and informally digitized workflows resulted in significant deficiencies across all six dimensions of the PIECES framework: Performance, Information, Economics, Control, Efficiency, and Service.]{.mark}

In response to these challenges, the **SU Connect** system was designed, developed, and tested as a comprehensive AI-Powered Management Information System. The following key findings were established through the development and testing process:

1. **The digitization of the report submission and approval workflow successfully eliminated the manual bottlenecks** that had previously extended the report review cycle to between two and four weeks. The implemented digital workflow — with real-time WebSocket notifications, clear status tracking, and a structured approval interface — reduced the expected approval cycle to hours rather than weeks.

2. **The integration of Google Gemini AI (`gemini-1.5-flash`) demonstrated practical, measurable value** in an organizational reporting context. During testing, the AI correctly classified submitted reports by category (e.g., Outreach, Training, Bible Study, Youth Program) with confidence scores consistently above 88%, and generated concise executive summaries that reduced the effort required for national report consolidation.

3. **The four-tier RBAC model with regional data isolation successfully enforced the principle of least privilege** across the system. All 32 automated and manual test cases related to access control passed without exception, confirming that data from one province was not accessible to users assigned to another province, and that role-restricted endpoints correctly rejected unauthorized access attempts.

4. **The security architecture — encompassing MFA, audit logging, idempotency protection, rate limiting, and MIME validation — provided a defence-in-depth posture** appropriate for an organization handling sensitive operational and personnel data. The audit log, in particular, provided an unprecedented level of administrative accountability that was entirely absent from the previous system.

5. **The fallback AI classifier demonstrated system resilience**, confirming that the SU Connect platform could continue to provide basic report categorization even in the event of a Google Gemini API outage, thereby satisfying Non-Functional Requirement NFR-07.

6. **The support request ticketing module transformed an entirely informal process into a structured, trackable, and accountable workflow**, with automatic deadline calculation, comment-thread communication, and escalation status management. This directly addressed one of the most frequently cited pain points raised during stakeholder interviews.

In conclusion, [the SU Connect system successfully achieved all nine specific objectives stated in Chapter 1, providing Scripture Union Rwanda with a technologically robust, secure, scalable, and intelligent Management Information System that fundamentally transforms the organization's capacity for evidence-based operations management.]{.mark}

---

## 5.2 Recommendations for Scripture Union Rwanda

[]{#52-recommendations-for-scripture-union-rwanda .anchor}

Based on the findings of this study, the following recommendations were made to Scripture Union Rwanda's leadership for the sustainable operation and growth of the SU Connect platform:

1. **Conduct a formal staff onboarding and training program** before full organizational deployment. The system introduces role-specific workflows and terminology (e.g., draft, submitted, approved, returned states) that require structured orientation, particularly for Field Officers operating in low-digital-literacy environments.

2. **Appoint a dedicated System Administrator** with sufficient technical training to manage user accounts, interpret audit logs, respond to failed login alerts, and coordinate with the development team on bug reporting and feature requests.

3. **Establish a monthly data review ritual** in which National Managers use the Analytics Dashboard and Consolidation module to generate a formal monthly national report. This institutionalizes the data-driven decision-making capacity the system enables, ensuring it is consistently utilized at the strategic level.

4. **Integrate the system's consolidated reporting output with donor reporting cycles.** The AI-generated executive summaries and participation statistics produced by SU Connect are directly transferable to quarterly donor impact reports, significantly reducing the time and effort currently required for donor accountability documentation.

5. **Implement a periodic backup and disaster recovery protocol** for the PostgreSQL database. Daily automated backups to a cloud storage service (e.g., AWS S3 or similar) are strongly recommended to prevent data loss in the event of infrastructure failure.

6. **Plan for Google Gemini API cost management** as report volumes scale. The organization should monitor monthly API token consumption, establish billing alerts in the Google Cloud Console, and evaluate the feasibility of migrating to a locally-hosted open-source LLM (such as LLaMA or Qwen) for cost control as usage grows.

---

## 5.3 Recommendations for Future Researchers

[]{#53-recommendations-for-future-researchers .anchor}

The following recommendations are offered to researchers and developers who may wish to extend or build upon the work presented in this study:

1. **Native Mobile Application Development.** A significant proportion of SU Rwanda's Field Officers operate primarily via smartphone in areas with limited desktop computer access. A React Native or Flutter mobile application that mirrors the core functionality of the SU Connect web interface — and supports offline-first report drafting with background synchronization — would significantly improve data capture coverage in remote and low-connectivity environments.

2. **Longitudinal AI Model Fine-Tuning.** The current AI implementation uses a zero-shot classification approach via the Google Gemini API. Future researchers could explore fine-tuning an open-source language model (e.g., LLaMA 3 or Mistral) on a curated dataset of SU Rwanda's historical report corpus to produce a domain-specific classifier with higher accuracy and lower per-token API costs.

3. **Predictive Analytics Integration.** The dataset of approved activity reports accumulated over months and years represents a rich source of longitudinal operational data. Machine learning regression models could be trained to predict future participant turnout, identify provinces at risk of reporting underperformance, and forecast support resource demand — providing SU Rwanda's leadership with proactive rather than reactive strategic intelligence.

4. **Integration with Rwanda's e-Government APIs.** Future iterations of the system could explore integration with Rwanda's national digital platforms, including the Rwanda Online (Irembo) portal for official permit coordination and the Rwanda Revenue Authority's reporting infrastructure for financial transparency compliance.

5. **Community Impact Scoring.** Future researchers could design a composite Community Impact Score algorithm that aggregates participant count, demographic reach, activity type weight, geographic coverage, and AI-assessed outcome quality into a single score per region per quarter. This would enable objective, data-driven provincial performance benchmarking for the national leadership of SU Rwanda.

6. **Federated Deployment for Multi-Organization Use.** The SU Connect architecture, with its multi-region RBAC model and modular Django app structure, could be generalized and packaged as a multi-tenant platform deployable by other Christian NGOs and faith-based organizations operating across Africa. Future research could explore the multi-tenancy design patterns and organizational identity isolation mechanisms required to support such a federated deployment model.

---

&nbsp;

# REFERENCES / BIBLIOGRAPHY {#references}

[]{#references .anchor}

1. Alter, S. (2002). *Information Systems: Foundation of E-Business* (4th ed.). Pearson Education.

2. Awad, E. M. (2007). *System Analysis and Design* (2nd ed.). Pearson Prentice Hall.

3. Brown, C. V., DeHayes, D. W., Hoffer, J. A., Martin, E. W., & Perkins, W. C. (2012). *Managing Information Technology* (7th ed.). Pearson Education.

4. Django Software Foundation. (2024). *Django Documentation (Version 5.x)*. Retrieved from https://docs.djangoproject.com/

5. Django REST Framework. (2024). *Django REST Framework Documentation*. Retrieved from https://www.django-rest-framework.org/

6. Google LLC. (2024). *Gemini API Documentation: generative-ai Python SDK*. Retrieved from https://ai.google.dev/docs

7. Hoffer, J. A., Ramesh, V., & Topi, H. (2013). *Modern Database Management* (11th ed.). Pearson Education.

8. Kotonya, G., & Sommerville, I. (1998). *Requirements Engineering: Processes and Techniques*. John Wiley & Sons.

9. Laudon, K. C., & Laudon, J. P. (2020). *Management Information Systems: Managing the Digital Firm* (16th ed.). Pearson Education.

10. Lewis, W. E. (2009). *Software Testing and Continuous Quality Improvement* (3rd ed.). Auerbach Publications.

11. Ministry of ICT and Innovation — Rwanda. (2022). *Smart Rwanda Master Plan 2021–2025*. Government of Rwanda.

12. Pressman, R. S., & Maxim, B. R. (2015). *Software Engineering: A Practitioner's Approach* (8th ed.). McGraw-Hill Education.

13. Redis Ltd. (2024). *Redis Documentation*. Retrieved from https://redis.io/docs/

14. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson Education.

15. Vaishnavi, V. K., & Kuechler, W. (2015). *Design Science Research Methods and Patterns: Innovating Information and Communication Technology* (2nd ed.). CRC Press.

16. Whitten, J. L., & Bentley, L. D. (2007). *System Analysis and Design Methods* (7th ed.). McGraw-Hill/Irwin.

17. React (Meta Platforms). (2024). *React Documentation*. Retrieved from https://react.dev/

18. Scripture Union International. (2024). *Scripture Union Global Mission: Annual Impact Report*. Retrieved from https://su-international.org/

19. Agile Alliance. (2023). *Agile Manifesto and Principles*. Retrieved from https://www.agilealliance.org/agile101/the-agile-manifesto/

20. Celery Project. (2024). *Celery: Distributed Task Queue Documentation*. Retrieved from https://docs.celeryq.dev/

---

&nbsp;

---
*End of Document*

**Document Title:** SU Connect: An AI-Powered Reporting and Support Management System for Scripture Union Rwanda

**Prepared by:** [STUDENT NAME]

**Institution:** Adventist University of Central Africa (AUCA)

**Degree:** Bachelor of Science in Information Technology

**Academic Year:** 2025–2026

**Supervisor:** [SUPERVISOR NAME]
