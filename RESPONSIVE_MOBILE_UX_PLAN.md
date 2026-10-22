# 📱 SU Connect — Premium Mobile UI/UX Redesign Plan (20-Year Front-End Expert Standard)

## 1. Overview & Problem Definition

The desktop and iPad viewports (≥ 768px) have been verified and confirmed solid. However, on handheld mobile phones (320px–480px, including iPhone 13/14/15/16 at 390px, budget Androids at 360px, and compact phones at 320px), four critical pages require an expert-level redesign:

1. **Activity Reports (`ReportList.jsx`):**
   - **Anti-Pattern:** Tables mechanically morphed into vertical key-value cards via CSS pseudo-elements (`td::before { content: attr(data-label) }`), generating 9 repetitive stacked text rows per report with excessive whitespace and clunky dividers.
   - **Filter Bloat:** 4 select dropdowns, 2 date pickers, and 3 giant export buttons stack vertically, pushing actual content 350px down the screen.
2. **Request Support (`SupportRequests.jsx`):**
   - **Anti-Pattern:** Desktop Kanban view crushes 4 columns into unreadable vertical slivers; List view expands inline comments causing immense layout shift; filter bars wrap awkwardly.
3. **Document Repository (`DocumentRepository.jsx`):**
   - **Anti-Pattern:** An 11-item vertical folder sidebar occupies the top half of the mobile screen before any files appear; large desktop grid cards consume entire screen heights for a single document.
4. **Settings (`Settings.jsx`):**
   - **Anti-Pattern:** Long un-segmented desktop forms with tiny form controls; desktop 2-column grids breaking into cramped rows; MFA and sessions table clipping horizontally.

---

## 2. Design System & Ergonomics Standards for Mobile

| Mobile Dimension | Design Standard | Implementation Rule |
| :--- | :--- | :--- |
| **Touch Targets** | Apple Human Interface & Android Material: **≥ 44px × 44px** | `--min-touch: 44px` on all buttons, chips, and tap rows. |
| **Input Fields** | **Font-size: 16px** strictly enforced on mobile | Prevents iOS Safari auto-zoom on input focus. |
| **Thumb Zone** | Crucial actions reachable in bottom 60% of viewport | Bottom action bars, sheet drawers, floating actions. |
| **Visual Hierarchy**| Primary title (15px/700) → Category tag → Stat badge → Action row | Maximum 4 visual levels per card, no redundant labels. |
| **Safe Areas** | Modern notch / Dynamic Island & Home indicator | `env(safe-area-inset-top)` & `env(safe-area-inset-bottom)`. |
| **Dark Mode** | High-contrast OLED dark palette (`#0f172a` surface, `#1e293b` cards) | Full token parity across light/dark themes. |

---

## 3. Detailed Page-by-Page Redesign Plan

### 3.1. Activity Reports (`ReportList.jsx`)

#### 🔄 Architecture Upgrade:
- **Dedicated Dual-View Rendering:**
  - `≥ 768px` (iPad & Desktop): Keep the clean, full-width data table intact.
  - `< 768px` (Mobile): Render dedicated `<div className="mobile-reports-container">` with modern mobile cards (`.mobile-report-card`).
- **Mobile Filter Drawer / Bottom Sheet:**
  - Replace the 350px tall stacked filter form with a compact top bar:
    - Search input + "Filter" button (with active count badge, e.g., `Filters (2)`) + "Export" icon button.
    - Tapping "Filter" opens an animated, glassmorphic collapsible bottom sheet with Status, Type, Region, and Date Range controls.
- **Card Anatomy:**
  ```
  ┌────────────────────────────────────────────────────────┐
  │ [Activity Type Tag]                   [Status Badge]   │
  │ Report Title (15px bold, max 2 lines)                  │
  │ 📅 2026-03-05   ·   📍 Kigali City   ·   📎 2 files    │
  │ ────────────────────────────────────────────────────── │
  │ 👥 45 Participants           [Avatar] Submitter Name   │
  │ ────────────────────────────────────────────────────── │
  │ [👁️ View Details]         [✏️ Edit]        [🗑️ Delete] │
  └────────────────────────────────────────────────────────┘
  ```

---

### 3.2. Request Support (`SupportRequests.jsx`)

#### 🔄 Architecture Upgrade:
- **Mobile Action Toolbar:**
  - Segmented pill switch: `[ List | Kanban ]` (touch-friendly with active slide indicator).
  - "Run AI Analysis" and "New Request" placed in compact top button row.
- **Sleek Mobile Support Cards (`.mobile-support-card`):**
  - Left priority accent stripe (Urgent = `#ef4444`, High = `#f59e0b`, Medium = `#3b82f6`, Low = `#6b7280`).
  - Top row: Type icon (Package, DollarSign, Users, etc.) + Title (15px semi-bold) + Priority badge + Status badge.
  - Middle row: Requester name + Region + Deadline countdown.
  - Bottom row: Expandable "Details & Comments" toggle with chevron rotation.
- **Mobile Kanban View:**
  - Instead of squeezing 4 vertical columns onto a 390px phone, implement a swipeable column carousel with active tab pills (`Submitted (3)`, `Under Review (1)`, `Approved (2)`, `Fulfilled (4)`).
  - Selecting a tab smoothly focuses that column, maintaining 100% card legibility.

---

### 3.3. Document Repository (`DocumentRepository.jsx`)

#### 🔄 Architecture Upgrade:
- **Horizontal Folder Carousel (`.mobile-folder-carousel`):**
  - On `< 768px`, replace the 11-row vertical sidebar with a native horizontal pill bar.
  - Users swipe left/right across folders with folder icons and document count pills (`All (24)`, `Activity Reports (8)`, `Policies (3)`, etc.).
- **Mobile Document Cards (`.mobile-doc-card`):**
  - Left: 48px × 48px rounded file-type icon badge with dynamic color (PDF red, Word blue, Excel green, ZIP purple) and extension text.
  - Center: Document name (bold, truncated), category pill, file size, uploader avatar + name, upload date.
  - Right: Quick-action button group with 44px tap targets for Direct Download, Preview, and Options menu.
- **Compact Search & Filter:**
  - Single search bar with filter chip toggle for Region and File Type.

---

### 3.4. Settings (`Settings.jsx`)

#### 🔄 Architecture Upgrade:
- **Segmented Native App Tabs (`.settings-mobile-tabs`):**
  - Horizontal scrollable pill tab bar with icons: `👤 Profile`, `🔒 Password`, `🛡️ MFA`, `⏱️ Sessions`, `🌓 Appearance`.
- **Grouped iOS / Material Style Form Sections (`.mobile-settings-group`):**
  - Profile header card with avatar preview, edit badge, role pill, and user email.
  - Form inputs styled as connected grouped cells with clear labels and touch-friendly paddings.
  - 2FA QR code centered with copyable secret and large touch verification button.
  - Active sessions displayed as native card list with device icon, location, IP address, and single-tap "Revoke" button.

---

## 4. Verification & Testing Plan

1. **Viewport Matrix Testing:**
   - **iPhone 14 / 15 (390px × 844px)**
   - **Standard Android (360px × 800px)**
   - **Compact Mobile (320px × 640px)**
2. **Interactive Flow Testing:**
   - Tap through Report List cards, filters, and actions.
   - Switch between List and Kanban in Support Requests.
   - Swipe folder pills and tap download/preview in Document Repository.
   - Switch tabs and verify input fields in Settings.
3. **Regression Check:**
   - Verify iPad (820px) and Desktop (1280px) to guarantee zero visual regression.
