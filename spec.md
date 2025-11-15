# Feature Specifications
## Service Installer Scheduler

**Version:** 1.0  
**Last Updated:** November 15, 2025

---

## 1. Date Filtering System

### 1.1 Auto-Reset to Today

**Feature ID:** `FEAT-001`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Date filter automatically resets to the current date when the Orders page loads or when the user switches back to the browser tab.

**Behavior:**
- On page load: Date filter set to today's date
- On tab visibility change: Date filter updates to current date
- Prevents stale date filters from previous sessions

**Implementation:**
- Uses `useEffect` with empty dependency array for mount
- Listens to `visibilitychange` event for tab switches
- Date format: YYYY-MM-DD (ISO 8601)

**Acceptance Criteria:**
- ✅ Date filter shows today's date on initial page load
- ✅ Date filter updates when switching back to tab
- ✅ Works across different timezones
- ✅ No performance impact (< 10ms execution time)

---

### 1.2 Quick Date Shortcuts

**Feature ID:** `FEAT-002`  
**Priority:** P1 (High)  
**Status:** ✅ Implemented

**Description:**  
Three quick-access buttons (Yesterday, Today, Tomorrow) allow instant navigation to adjacent dates without using the date picker.

**UI Components:**
- **Yesterday Button:** Sets date to current date - 1 day
- **Today Button:** Sets date to current date
- **Tomorrow Button:** Sets date to current date + 1 day

**Visual Feedback:**
- Active button highlighted in blue
- Inactive buttons in neutral gray
- Smooth transition on click

**Acceptance Criteria:**
- ✅ Buttons appear above date picker
- ✅ Active button visually distinct
- ✅ Click updates date filter immediately
- ✅ Works with date range mode (switches to single mode)

---

### 1.3 Date Range Filter

**Feature ID:** `FEAT-003`  
**Priority:** P1 (High)  
**Status:** ✅ Implemented

**Description:**  
Dual-mode date filtering supporting both single date and date range selections with quick presets.

**Modes:**

**Single Date Mode:**
- Default mode
- Shows quick shortcuts (Yesterday, Today, Tomorrow)
- Single date picker
- Matches orders with exact appointment date

**Date Range Mode:**
- Toggle to switch from single mode
- Start date and end date inputs
- Quick presets: This Week, Last 7 Days, This Month
- Matches orders with appointment date between start and end (inclusive)

**Quick Presets:**
| Preset | Start Date | End Date |
|--------|------------|----------|
| This Week | Monday of current week | Sunday of current week |
| Last 7 Days | Today - 7 days | Today |
| This Month | 1st of current month | Last day of current month |

**Acceptance Criteria:**
- ✅ Mode toggle switches between single and range
- ✅ Date range includes both start and end dates
- ✅ Quick presets calculate dates correctly
- ✅ Clear button resets range
- ✅ Invalid ranges (end before start) show error

---

## 2. Sorting System

### 2.1 Column Sorting

**Feature ID:** `FEAT-004`  
**Priority:** P1 (High)  
**Status:** ✅ Implemented

**Description:**  
Sortable columns in Orders table with ascending/descending toggle.

**Sortable Columns:**
1. **Ticket No.** - Alphanumeric sort
2. **Service No.** - Alphanumeric sort
3. **Status** - Alphabetical sort by status name
4. **Installer** - Alphabetical sort by installer name
5. **Assignment** - Chronological sort by appointment date/time

**Non-Sortable Columns:**
- WO No., Customer, WO Type, Priority, Docket

**Sort Behavior:**
- First click: Ascending (A→Z, 0→9, oldest→newest)
- Second click: Descending (Z→A, 9→0, newest→oldest)
- Third click: Remove sort (return to default order)

**Visual Indicators:**
- Up arrow (↑): Ascending sort
- Down arrow (↓): Descending sort
- No arrow: Column not sortable or no sort applied

**Acceptance Criteria:**
- ✅ Sort icons only on sortable columns
- ✅ Clicking header toggles sort direction
- ✅ Installer sort uses name (not ID)
- ✅ Sort persists during filtering
- ✅ Only one column sorted at a time

---

## 3. Order Status Management

### 3.1 Status Values

**Feature ID:** `FEAT-005`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
15 distinct status values representing the complete order lifecycle.

**Status List:**

| # | Status | Color | Description |
|---|--------|-------|-------------|
| 1 | Pending | Gray | Order created, awaiting assignment |
| 2 | Assigned | Blue | Installer assigned, not yet started |
| 3 | On the Way | Cyan | Installer traveling to location |
| 4 | Met Customer | Teal | Installer arrived, meeting customer |
| 5 | Order Completed | Lime | Installation work finished |
| 6 | Docket Received | Green | Paperwork received from installer |
| 7 | Docket Uploaded | Emerald | Docket uploaded to system |
| 8 | Ready to Invoice | Indigo | Ready for billing process |
| 9 | Invoiced | Violet | Invoice generated and sent |
| 10 | Completed | Green | Order fully closed |
| 11 | Customer Issue | Orange | Problem with customer/site |
| 12 | Building Issue | Yellow | Building access/infrastructure problem |
| 13 | Network Issue | Pink | Network/technical problem |
| 14 | Rescheduled | Purple | Appointment rescheduled |
| 15 | Withdrawn | Red | Order cancelled/withdrawn |

**Acceptance Criteria:**
- ✅ All 15 statuses available in all dropdowns
- ✅ Status colors consistent across UI
- ✅ Status badges readable and accessible
- ✅ Status updates reflect immediately

---

### 3.2 Quick Status Update

**Feature ID:** `FEAT-006`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Update order status directly from the Orders table without opening a dialog.

**UI:**
- Status displayed as colored badge in table
- Click badge to open dropdown
- Select new status
- Status updates immediately

**Behavior:**
- Dropdown shows all 15 statuses
- Current status highlighted
- Optimistic UI update (instant feedback)
- Rollback on error

**Acceptance Criteria:**
- ✅ Dropdown opens on badge click
- ✅ All 15 statuses listed
- ✅ Update completes in < 500ms
- ✅ Error handling with user notification

---

## 4. Excel Import

### 4.1 File Upload

**Feature ID:** `FEAT-007`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Import orders from Excel (.xlsx) files with validation and error reporting.

**Supported Format:**
- File extension: `.xlsx`
- Max file size: 10MB
- Max rows: 1000 per import

**Required Columns:**
- WO No.
- Ticket No.
- Service No.
- Customer Name
- Phone
- Address

**Optional Columns:**
- WO Type
- Priority
- Notes
- Appointment Date
- Appointment Time

**Validation Rules:**
- Required fields must not be empty
- Phone numbers: 10-15 digits
- Dates: DD/MM/YYYY format
- Times: HH:MM AM/PM format

**Error Handling:**
- Display row number for each error
- Allow partial import (skip invalid rows)
- Export error report

**Acceptance Criteria:**
- ✅ Accepts .xlsx files up to 10MB
- ✅ Validates all required fields
- ✅ Shows clear error messages with row numbers
- ✅ Import completes within 30 seconds for 100 orders
- ✅ Successfully imported orders appear immediately

---

## 5. Installer Assignment

### 5.1 Assignment Dialog

**Feature ID:** `FEAT-008`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Assign installer to order with appointment date and time selection.

**UI Components:**
- Installer dropdown (searchable)
- Date picker
- Time slot selector (30-minute intervals)
- Notes field (optional)

**Time Slots:**
- Start: 8:00 AM
- End: 8:00 PM
- Interval: 30 minutes
- Format: 12-hour (8:00 AM, 8:30 AM, etc.)

**Behavior:**
- Shows installer availability (optional)
- Warns about conflicts (optional)
- Saves assignment to database
- Updates order status to "Assigned"

**Acceptance Criteria:**
- ✅ Installer dropdown populated from database
- ✅ Date picker defaults to today
- ✅ Time slots in 30-minute intervals
- ✅ Assignment saves successfully
- ✅ Order appears in Schedule page

---

## 6. Schedule Management

### 6.1 Calendar View

**Feature ID:** `FEAT-009`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Daily calendar view showing all assignments organized by installer and time.

**Layout:**
- Vertical timeline (8:00 AM - 8:00 PM)
- Horizontal columns per installer
- Color-coded cards by status
- Drag-and-drop support

**Features:**
- Click card to view order details
- Drag card to reschedule
- Filter by installer
- Navigate dates with arrows or picker

**Acceptance Criteria:**
- ✅ Shows all assignments for selected date
- ✅ Color coding matches status colors
- ✅ Drag-and-drop updates appointment time
- ✅ Real-time updates (refetch on focus)

---

## 7. Docket Management

### 7.1 File Upload

**Feature ID:** `FEAT-010`  
**Priority:** P1 (High)  
**Status:** ✅ Implemented

**Description:**  
Upload docket files (PDF, images) and associate with orders.

**Supported Formats:**
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)
- Max size: 5MB per file

**Storage:**
- AWS S3 via Manus platform
- Public URLs (authenticated access)
- Organized by order ID

**Behavior:**
- Upload from order details page
- Progress indicator during upload
- Auto-update status to "Docket Uploaded"
- Download/view options

**Acceptance Criteria:**
- ✅ Accepts PDF and image files up to 5MB
- ✅ Upload completes within 10 seconds
- ✅ File accessible via download link
- ✅ Status updates automatically

---

## 8. Search and Filtering

### 8.1 Text Search

**Feature ID:** `FEAT-011`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Global search across multiple order fields.

**Searchable Fields:**
- WO No.
- Ticket No.
- Service No.
- Customer Name
- Customer Phone

**Behavior:**
- Case-insensitive
- Partial match supported
- Real-time filtering (as you type)
- Debounced (300ms delay)

**Acceptance Criteria:**
- ✅ Search works across all specified fields
- ✅ Results update in real-time
- ✅ No performance lag with 1000+ orders
- ✅ Clear button to reset search

---

### 8.2 Status Filter

**Feature ID:** `FEAT-012`  
**Priority:** P0 (Critical)  
**Status:** ✅ Implemented

**Description:**  
Filter orders by status value.

**Options:**
- All (default - shows all statuses)
- Individual status values (15 options)

**Behavior:**
- Dropdown selection
- Combines with other filters
- Shows count of matching orders

**Acceptance Criteria:**
- ✅ Dropdown shows all 15 statuses + "All"
- ✅ Filter applies immediately
- ✅ Works with date filter and search
- ✅ Persists during page navigation

---

## 9. Performance Requirements

### 9.1 Page Load Time

**Requirement ID:** `PERF-001`  
**Target:** < 3 seconds  
**Status:** ✅ Met

**Measurements:**
- Time to Interactive (TTI): < 3s
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s

---

### 9.2 API Response Time

**Requirement ID:** `PERF-002`  
**Target:** < 500ms  
**Status:** ✅ Met

**Endpoints:**
- `trpc.orders.list`: < 300ms (100 orders)
- `trpc.orders.create`: < 200ms
- `trpc.orders.update`: < 150ms
- `trpc.assignments.list`: < 200ms

---

### 9.3 Concurrent Users

**Requirement ID:** `PERF-003`  
**Target:** 50+ concurrent users  
**Status:** ✅ Met

**Load Testing:**
- 50 users: Response time < 500ms
- 100 users: Response time < 1s
- Database connections: Max 100

---

## 10. Accessibility

### 10.1 Keyboard Navigation

**Requirement ID:** `A11Y-001`  
**Status:** ✅ Implemented

**Features:**
- Tab navigation through all interactive elements
- Enter to activate buttons
- Escape to close dialogs
- Arrow keys for dropdowns

---

### 10.2 Screen Reader Support

**Requirement ID:** `A11Y-002`  
**Status:** ⚠️ Partial

**Features:**
- ARIA labels on buttons
- Alt text on images
- Form labels properly associated
- Status announcements for updates

**TODO:**
- Add more descriptive ARIA labels
- Test with NVDA and JAWS

---

### 10.3 Color Contrast

**Requirement ID:** `A11Y-003`  
**Target:** WCAG AA (4.5:1)  
**Status:** ✅ Met

**Verified:**
- Text on backgrounds: 4.5:1 minimum
- Status badges: 3:1 minimum (large text)
- Interactive elements: 3:1 minimum

---

## 11. Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Not Supported:**
- ❌ Internet Explorer
- ❌ Opera Mini

---

## 12. Mobile Support

**Status:** ⚠️ Basic Support

**Supported Features:**
- View orders
- Update status
- View schedule
- Add notes

**Limited Features:**
- Excel upload (desktop recommended)
- Drag-and-drop (touch support limited)
- Bulk operations (desktop only)

**Responsive Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

**For implementation details, see `technical.md`**  
**For user instructions, see `howto.md`**
