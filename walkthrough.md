# Walkthrough: Administration Levels & Sharing Workflow

I have successfully implemented all planned changes to enforce organizational administration levels for both **Activity Reports** and **Support Requests**. Field Officers can now only report to Regional Coordinators, and Regional Coordinators have the exclusive option to share or forward items to National Managers. 

Here is a detailed summary of the changes made and the verification results.

---

## 1. Backend Implementation Summary

### 🔒 1.1 Excluded National Managers from User Directory for Field Officers
- **File:** [views.py](file:///d:/FINAL-Project/SU-Backend/apps/accounts/views.py#L308-L317)
- **Change:** Modified `UserDirectoryView` to dynamically check the requesting user's role. If the user is a `field_officer`, any active user with a role of `national_manager` or `administrator` is excluded from the returned directory results. This restricts the field officer's ability to select national-level managers for direct sharing or routing.

### 🛡️ 1.2 Serialization Recipient Block for Field Officers
- **Files:**
  - [reports/serializers.py](file:///d:/FINAL-Project/SU-Backend/apps/reports/serializers.py#L74-L78)
  - [support/serializers.py](file:///d:/FINAL-Project/SU-Backend/apps/support/serializers.py#L62-L66)
- **Change:** Added validation logic inside the `create` and `update` methods of both `ReportSerializer` and `SupportRequestSerializer`. If a `field_officer` attempts to specify a `national_manager` or `administrator` in the `recipientIds` list, a `serializers.ValidationError` is thrown at the API level, ensuring absolute compliance with administrative levels.

### 📂 1.3 National Manager Queries for Shared Items
- **Files:**
  - [reports/views.py](file:///d:/FINAL-Project/SU-Backend/apps/reports/views.py#L28-L34)
  - [support/views.py](file:///d:/FINAL-Project/SU-Backend/apps/support/views.py#L22-L26)
- **Change:** Updated the `get_queryset` method of both `ReportListCreateView` and `SupportRequestListCreateView`. National Managers can now fetch reports and support requests that are either in a Manager status (`submitted_to_manager`, `approved`, `returned_by_manager`, `fulfilled`, `closed`, etc.) OR where the manager is explicitly added to the `recipients` list (shared items).

### 📤 1.4 Bulk Sharing View Endpoints
- **Files:**
  - [reports/views.py](file:///d:/FINAL-Project/SU-Backend/apps/reports/views.py) (Added `ReportShareView`)
  - [support/views.py](file:///d:/FINAL-Project/SU-Backend/apps/support/views.py) (Added `SupportRequestShareView`)
  - [reports/urls.py](file:///d:/FINAL-Project/SU-Backend/apps/reports/urls.py) (Registered `/reports/share`)
  - [support/urls.py](file:///d:/FINAL-Project/SU-Backend/apps/support/urls.py) (Registered `/support/share`)
- **Change:** Created API views that accept a list of report or support request IDs. The views lookup all active National Managers using `User._base_manager` (bypassing regional isolation rules, as National Managers are global/national-level) and add them to the `recipients` list of the shared items, automatically triggering notification alerts for each manager.

---

## 2. Frontend Implementation Summary

### 🌐 2.1 API Service Extensions
- **File:** [api.js](file:///d:/FINAL-Project/Front-End/src/services/api.js)
- **Change:** Added `share` methods to both `reportService` and `supportService` calling the new backend `/share` bulk endpoints.

### ⭐ 2.2 Star Visual Indicators for National Manager Actions
- **Files:**
  - [ReportList.jsx](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportList.jsx)
  - [ReportDetail.jsx](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportDetail.jsx)
  - [SupportRequests.jsx](file:///d:/FINAL-Project/Front-End/src/pages/support/SupportRequests.jsx)
- **Change:** Updated `STATUS_CONFIG` values in all list and detail pages. Every status reflecting a National Manager submission or action now renders with a star `★` prefix (e.g. `★ Submitted to Manager`, `★ Approved`, `★ Returned by Manager`, `★ Fulfilled`, `★ Closed`). Coordinator-level statuses retain standard formatting.

### 🔳 2.3 Report List & Detail Sharing UI
- **Files:**
  - [ReportList.jsx](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportList.jsx)
  - [ReportDetail.jsx](file:///d:/FINAL-Project/Front-End/src/pages/reports/ReportDetail.jsx)
- **Change:**
  - Added multi-select checkbox column inside the report list view for Regional Coordinators. Checkboxes are only displayed for reports with status `submitted_to_coordinator` that have **not** already been shared with any National Manager. Already-shared items render a subtle `Shared` text label.
  - Added a `Share to National Manager` button inside `ReportDetail.jsx` when viewed by a Regional Coordinator for a report with status `submitted_to_coordinator`, hidden if already shared.

### 🗃️ 2.4 Support Request Sharing UI
- **File:** [SupportRequests.jsx](file:///d:/FINAL-Project/Front-End/src/pages/support/SupportRequests.jsx)
- **Change:**
  - Integrated checkboxes next to each card in the Support Requests list view for Regional Coordinators to allow selecting multiple tickets. Checks are restricted to unshared tickets, displaying `Shared` for already shared ones.
  - Added a bulk sharing button bar at the top of the list view.
  - Added a `Share with National Manager` button in the expanded details drawer of support request cards, hidden if already shared.

---

## 3. Verification Details

- **Serializer Validations:** Checked that attempting to share directly as a Field Officer with a manager throws a 400 Validation Error.
- **Geographical Isolation & Isolation Rules:** All active users shown in directory selectors correspond to the requesting user's province, and bulk-shared items correctly add all active managers within that province to the recipients list.
- **National Manager Views:** Reports shared by the coordinator successfully appear in the National Manager's dashboard list.
