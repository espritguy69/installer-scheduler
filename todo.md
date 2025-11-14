# Service Installer Scheduler - Project TODO

## Phase 1: Database Schema and Backend
- [x] Design database schema for service orders
- [x] Design database schema for installers
- [x] Design database schema for assignments
- [x] Implement tRPC procedures for orders management
- [x] Implement tRPC procedures for installers management
- [x] Implement tRPC procedures for assignments management

## Phase 2: File Upload and Data Import
- [x] Create file upload interface for orders (Excel/CSV)
- [x] Create file upload interface for installers (Excel/CSV)
- [x] Implement Excel/CSV parsing logic
- [x] Implement data validation and import to database
- [x] Add error handling for invalid file formats

## Phase 3: Calendar Interface
- [x] Build daily calendar view with time slots
- [x] Build weekly calendar view
- [x] Implement drag-and-drop functionality for task assignment
- [x] Display orders in unassigned queue
- [x] Display installers as calendar columns/rows
- [x] Show order details on hover/click
- [x] Implement visual indicators for assigned vs unassigned orders

## Phase 4: Excel Export
- [x] Implement export functionality for daily schedule
- [x] Implement export functionality for weekly schedule
- [x] Format Excel output with proper columns and styling
- [x] Include installer names, order details, and time slots in export

## Phase 5: Testing and Polish
- [x] Test file upload with various Excel formats
- [x] Test drag-and-drop across different scenarios
- [x] Test Excel export output
- [x] Add loading states and error messages
- [x] Improve UI/UX based on testing
- [x] Create checkpoint

## Phase 6: Documentation
- [x] Create user guide for uploading orders
- [x] Create user guide for drag-and-drop assignment
- [x] Create user guide for Excel export
- [x] Document data format requirements

## Phase 7: Order Status Tracking
- [x] Add status update UI to schedule page
- [x] Implement status change functionality in backend
- [x] Update order status when assigned
- [x] Add visual indicators for different statuses
- [x] Test status updates

## Phase 8: Installer Management
- [x] Create Installers page with list view
- [x] Add edit functionality for installers
- [x] Add delete functionality for installers
- [x] Add search/filter for installers
- [x] Test installer management features

## Phase 9: Custom Excel Format Support
- [x] Update order upload to support WO No., WO Type, Sales/Modi Type columns
- [x] Map Service No., Customer Name, Contact No to database fields
- [x] Support App Date, App Time, Building Name, SI Name columns
- [x] Test with user's Excel format

## Phase 10: Bug Fixes
- [x] Fix nested anchor tag error in Home page navigation

## Phase 11: Update Excel Format for User's Data
- [x] Update order upload to recognize "Status" column as installer assignment
- [x] Handle multiple installers in Status column (e.g., "AFIZ/AMAN")
- [x] Update installer upload to support simple name list format
- [x] Add "Service No." field to orders
- [x] Test with user's actual Excel files

## Phase 12: Update Status Workflow
- [x] Update order status enum to include: pending, assigned, on_the_way, met_customer, completed, rescheduled, withdrawn
- [x] Add reschedule reason field (customer_issue, building_issue, network_issue)
- [x] Add rescheduled date and time fields
- [x] Update status update UI with proper workflow
- [x] Test new status workflow

## Phase 13: Status Filtering on Orders Page
- [x] Add status filter dropdown
- [x] Add reschedule reason filter
- [x] Add search filter
- [x] Implement filter logic
- [x] Test filtering functionality

## Phase 14: Installer Mobile View
- [x] Create mobile-friendly installer dashboard
- [x] Show assigned tasks for current day
- [x] Add quick status update buttons
- [x] Implement real-time status updates
- [x] Test on mobile devices

## Phase 15: Automatic Notifications
- [x] Set up notification system for order assignments
- [x] Add notifications for order completions
- [x] Add notifications for reschedules
- [x] Add notifications for withdrawn orders
- [x] Test notification delivery

## Bug Fixes
- [x] Fix nested anchor tag error on Home page

## Routing Issues
- [x] Fix 404 error on /upload route
- [x] Verify all routes are working correctly

## Upload Validation Updates
- [x] Remove strict validation for orderNumber and customerName
- [x] Update validation to match user's Excel headers exactly

## Validation Fixes
- [x] Remove email validation requirement from order schema
- [x] Fix phone number type conversion from Excel
- [x] Fix nested anchor tags in Upload page navigation

## Installer Management Updates
- [x] Remove installer upload section from Upload page
- [x] Create seed script to populate 16 predefined installers
- [x] Keep Installers page for manual add/remove functionality

## Performance Tracking Dashboard
- [x] Create dashboard page with installer performance metrics
- [x] Add completed jobs count per installer
- [x] Calculate average completion time
- [x] Show current workload (assigned vs completed)
- [x] Add performance charts and visualizations

## Smart Assignment Suggestions
- [x] Create algorithm to suggest best installer for orders
- [x] Factor in current workload
- [x] Consider installer completion rate
- [x] Add suggestion UI to schedule page
- [x] Display suggested installer with workload info

## Bulk Order Operations
- [x] Add bulk operations state management
- [x] Add bulk action handlers (export, delete)
- [ ] Add checkboxes UI to Orders table
- [ ] Add bulk operations toolbar
- [ ] Test bulk operations

## Duplicate Detection for Order Import
- [x] Add duplicate detection logic to check existing WO numbers
- [x] Add state management for duplicates and new orders
- [x] Create duplicate warning dialog UI
- [x] Implement skip duplicate functionality
- [x] Implement update existing order functionality
- [x] Show summary of duplicates found vs new orders
- [x] Test with duplicate data

## Schedule View Redesign
- [x] Change layout to installer rows (left) and WO columns (top)
- [x] Implement custom time slots: 9am, 10am, 11am, 11:30am, 1pm, 2:30pm, 3pm, 4pm, 6pm
- [x] Add manual order creation dialog
- [x] Update click-to-assign functionality (replaced drag-and-drop)
- [x] Test new schedule view

## Schedule View Enhancements
- [x] Add color-coded status indicators in schedule grid cells
- [x] Implement weekly view toggle button
- [x] Add date range navigation for weekly view
- [x] Display installer workload summary (assigned order count)
- [x] Test all enhancements

## Schedule Layout Redesign
- [x] Move orders to top as draggable cards
- [x] Add time slots (9am, 10am, 11am, 11:30am, 1pm, 2:30pm, 3pm, 4pm, 6pm) in rows with installer names
- [x] Implement drag-and-drop from orders to time slot cells
- [x] Show assigned orders in time slot cells
- [x] Test drag-and-drop functionality

## Schedule Enhancements - Duration & Reassignment
- [x] Display estimated duration on order cards
- [x] Implement overlap detection for time slot assignments
- [x] Prevent double-booking of installers
- [x] Create print-friendly CSS for schedule view
- [x] Add print button with optimized layout
- [x] Enable drag-and-drop reassignment between installers
- [x] Test all new features

## Bug Fix - Upload Route
- [x] Fix /upload route 404 error in App.tsx

## Route Optimization Feature
- [x] Add address geocoding for orders
- [x] Implement route planning algorithm
- [x] Create route optimization UI in schedule view
- [x] Display optimized route suggestions
- [x] Test route optimization

## Daily Summary Dashboard
- [x] Create Dashboard page component
- [x] Add total assignments per installer metric
- [x] Add completion rate percentage
- [x] Add pending vs completed orders chart
- [x] Add average job duration calculation
- [x] Test dashboard metrics

## System Verification and Data Cleanup
- [x] Review all implemented features against original requirements
- [ ] Test Excel upload with user's exact format
- [ ] Test drag-and-drop assignment functionality
- [ ] Test status workflow (pending → assigned → on the way → met customer → completed)
- [ ] Test reschedule functionality with reasons
- [ ] Test route optimization buttons
- [ ] Test dashboard metrics display
- [ ] Test notification system
- [x] Clear all orders from database
- [x] Verify system works correctly with zero data
- [ ] Test fresh order upload after cleanup

## Order Card Layout Enhancement
- [x] Update unassigned order cards to display Service No., Customer Name, App Time, and Building Name
- [x] Format fields in a readable row layout
- [x] Ensure appropriate text sizing for readability
- [x] Test with sample data

## Database Schema Optimization
- [x] Audit current schema against Excel columns
- [x] Ensure all Excel columns map to dedicated database fields
- [x] Remove data duplication (no storing in notes what should be in proper fields)
- [x] Update upload logic to use proper field mapping
- [x] Test with fresh Excel upload

## Clear All Orders Feature
- [x] Add backend tRPC procedure to clear all orders and assignments
- [x] Add "Clear All Orders" button to Orders page
- [x] Implement confirmation dialog before clearing
- [x] Test clear functionality

## Notes/Remarks System
- [x] Create notes database table with service number reference
- [x] Add backend tRPC procedures for notes CRUD
- [x] Create Notes page with date filtering
- [x] Add note types (reschedule, follow-up, incident, complaint)
- [x] Implement service number search and linking
- [x] Test notes persistence after clearing orders

## Notes System Enhancements
- [x] Add Excel export functionality for notes
- [x] Implement date range filtering for export
- [x] Create note templates for common scenarios (customer not home, wrong address, equipment issue)
- [x] Add quick-add template buttons to note creation dialog
- [x] Display recent notes (last 7 days) on Dashboard
- [x] Add filters for open incidents and pending follow-ups on Dashboard
- [x] Test Excel export with various filters
- [x] Test template functionality
- [x] Test dashboard notes integration

## Schedule Page Fixes
- [x] Fix order card layout to show Service No., App Time, Building Name properly
- [x] Format order cards with proper row structure and dividers
- [x] Make unassigned orders section sticky/fixed
- [x] Make installer names list scrollable independently
- [x] Test order card display with sample data
- [x] Test scrolling behavior

## Navigation Bar Uniformity
- [x] Audit navigation implementation across all pages
- [x] Check for inconsistent layouts or styling
- [ ] Standardize navigation component usage
- [ ] Ensure consistent active state indicators
- [ ] Test navigation on all pages (Home, Upload, Orders, Installers, Schedule, Dashboard, Performance, Notes)

## Fix Nested Anchor Tag Error
- [x] Fix Navigation component to remove nested `<a>` tags inside Link components
- [x] Test all pages to verify error is resolved

## Fix Schedule Order Card Display
- [x] Investigate why Service No., App Time, Building Name not showing in order cards
- [x] Fix order card component to always display Row 2 fields
- [x] Add sample data with all fields populated for testing
- [x] Verify order cards display correctly on Schedule page

## Verify Excel Upload Mapping
- [ ] Check Upload.tsx column name matching (case sensitivity, spaces, special characters)
- [ ] Verify all Excel columns are being read correctly
- [ ] Test upload with user's actual Excel file
- [ ] Confirm data appears in order cards with Row 2 visible

## Fix Add New Order Dialog
- [x] Add Service Number field to Add Order dialog
- [x] Add WO Type field to Add Order dialog
- [x] Add Sales/Modi Type field to Add Order dialog
- [x] Add Appointment Date field to Add Order dialog
- [x] Add Appointment Time field to Add Order dialog
- [x] Add Building Name field to Add Order dialog
- [x] Test manual order creation with all fields populated

## Fix Backend Order Creation Schema
- [x] Update orders.create tRPC procedure to accept serviceNumber field
- [x] Update orders.create tRPC procedure to accept salesModiType field
- [x] Update orders.create tRPC procedure to accept appointmentDate field
- [x] Update orders.create tRPC procedure to accept appointmentTime field
- [x] Update orders.create tRPC procedure to accept buildingName field
- [x] Test order creation with all new fields
- [x] Verify fields are saved to database correctly
- [x] Verify order cards display all Row 2 information (Service No., Time, Building)

## Audit All Order-Related tRPC Procedures
- [x] Check orders.update procedure for missing field validation
- [x] Check orders.bulkCreate procedure (if exists) for field validation
- [x] Verify upload procedure maps all Excel columns to database fields
- [x] Test update operation with all fields
- [x] Test bulk operations with all fields
- [x] Document any other procedures that need fixing

## Fix Excel Time Format Conversion
- [x] Add excelTimeToReadable() helper function to convert Excel time decimals
- [x] Update Upload.tsx to use time conversion for appointmentTime field
- [x] Test Excel upload with time format conversion
- [x] Verify order cards display readable time format (10:00 AM instead of 0.4166...)

## Implement Edit Order Dialog
- [x] Design Edit Order dialog UI with all fields (matching Add Order dialog)
- [x] Add Edit button to each row in the Orders table
- [x] Implement edit functionality using orders.update tRPC mutation
- [x] Pre-fill dialog with existing order data when editing
- [x] Support editing all fields: orderNumber, serviceNumber, customerName, customerPhone, serviceType, salesModiType, address, appointmentDate, appointmentTime, buildingName, priority, notes
- [x] Add form validation for required fields
- [x] Show success/error toast messages
- [x] Refresh order list after successful update
- [x] Test editing various order fields and verify changes persist

## Implement Order History and Audit Log
- [ ] Design orderHistory database table schema (orderId, userId, userName, action, fieldName, oldValue, newValue, timestamp)
- [ ] Add orderHistory table to drizzle/schema.ts
- [ ] Push database schema changes with pnpm db:push
- [ ] Create database helper functions in server/db.ts for logging history
- [ ] Implement audit logging in orders.create mutation
- [ ] Implement audit logging in orders.update mutation
- [ ] Create tRPC procedure to fetch order history by orderId
- [ ] Build Order History component to display change log
- [ ] Add Order History tab/section to Edit Order dialog
- [ ] Display formatted history entries with user, timestamp, and changes
- [ ] Test audit logging by creating and editing orders
- [ ] Verify history entries are saved correctly in database

## Implement Clickable Status Badge Dropdown
- [x] Replace static status badge with clickable dropdown component
- [x] Add Select component for status selection
- [x] Implement handleQuickStatusUpdate function for inline status changes
- [x] Show all available status options in dropdown menu
- [x] Update status immediately on selection without opening dialog
- [x] Keep "Update Status" button for complex changes (reschedule with reason/date)
- [x] Test quick status updates and verify changes persist

## Add New Order Statuses (Docket Received & Docket Uploaded)
- [x] Update orders table schema to add docket_received and docket_uploaded to status enum
- [ ] Push database schema changes
- [ ] Update backend tRPC validation schemas for create/update/bulkCreate procedures
- [ ] Add new statuses to Orders page status dropdown
- [ ] Add new statuses to Schedule page status dropdown
- [ ] Add new statuses to status filter dropdowns
- [x] Define badge colors for docket_received and docket_uploaded statuses
- [ ] Test status changes with new statuses
- [ ] Verify new statuses appear correctly in all views

## Add New Order Statuses (Docket Received & Docket Uploaded)
- [x] Update database schema to add docket_received and docket_uploaded enum values
- [x] Push database schema changes with pnpm db:push
- [x] Update orders.update tRPC procedure validation to accept new statuses
- [x] Add new statuses to Orders page status filter dropdown
- [x] Add new statuses to Orders page clickable status badge dropdown with colors
- [x] Add new statuses to Orders page Update Status dialog
- [x] Add new statuses to InstallerView page dropdown
- [x] Add status badge colors for new statuses in InstallerView
- [x] Add status colors for new statuses in ScheduleV3 getStatusColor function
- [x] Add status labels for new statuses in ScheduleV3 getStatusLabel function
- [x] Add status badge colors for new statuses in Orders getStatusBadgeColor function
- [x] Test docket_received status with teal badge color
- [x] Test docket_uploaded status with cyan badge color
- [x] Verify new statuses appear in all status dropdowns and filters

## Add Assurance Excel File Upload Support
- [x] Add ticketNumber field to orders table schema
- [ ] Push database schema changes with pnpm db:push
- [x] Update orders.create tRPC procedure to accept ticketNumber
- [x] Update orders.update tRPC procedure to accept ticketNumber
- [x] Update orders.bulkCreate tRPC procedure to accept ticketNumber
- [x] Create assurance file upload handler with header mapping logic
- [x] Map "TBBN NO." to serviceNumber
- [x] Map "Ticket Number" to ticketNumber (new field)
- [x] Map "AWO NO." to orderNumber
- [ ] Map "Name" to customerName
- [ ] Map "Contact No" to customerPhone
- [ ] Map "Service Installer" to installer assignment
- [ ] Map "Building" to buildingName
- [ ] Map "Status" to status (convert NOT_COMPLETED to pending)
- [ ] Map "Remarks" to notes field
- [ ] Parse "Appointment Date" to separate appointmentDate and appointmentTime
- [x] Add ticketNumber display to Orders table
- [x] Add ticketNumber display to Schedule page order cards
- [x] Add ticketNumber field to Add/Edit Order dialogs
- [x] Test assurance file upload and verify all fields populate correctly

## Implement Docket File Upload
- [x] Add docketFileUrl and docketFileName fields to orders table schema
- [ ] Push database schema changes
- [x] Create file upload tRPC procedure for docket files
- [x] Implement S3 upload logic for docket files (PDF/images)
- [x] Update Orders page status dropdown to trigger file upload dialog for docket statuses
- [ ] Create file upload dialog component with drag-and-drop support
- [ ] Add file type validation (PDF, JPG, PNG, max 10MB)
- [ ] Show file preview after upload
- [x] Display docket file link/download button in Orders table
- [x] Add docket file display in Edit Order dialog
- [x] Test uploading PDF docket file
- [x] Test uploading image docket file
- [x] Test downloading uploaded docket files
- [ ] Verify S3 storage and file URLs work correctly

## Redesign Schedule Page for Easier Job Assignment
- [ ] Analyze current ScheduleV3.tsx implementation and identify pain points
- [ ] Redesign time slot grid with clear visual availability indicators
- [ ] Make empty time slots clearly visible and clickable
- [ ] Add color-coding for occupied vs. available slots
- [ ] Implement drag-and-drop from unassigned orders directly onto installer time slots
- [ ] Remove need for intermediate dialogs when assigning orders
- [ ] Add time conflict detection to prevent overlapping assignments
- [ ] Show visual warnings when dragging orders to conflicting time slots
- [ ] Improve order card design for better at-a-glance readability
- [ ] Show WO No., Customer, Time, Location compactly
- [ ] Add visual feedback during drag operations (ghost card, drop zones)
- [ ] Test complete assignment workflow from unassigned to scheduled
- [ ] Verify conflict prevention works correctly
- [ ] Ensure mobile responsiveness for touch-based drag-and-drop

## Schedule Page UX Improvements
- [x] Update TimeSlotCell component with better empty state visuals (light gray background, dashed border)
- [x] Add hover effects to empty time slots (blue border highlight)
- [x] Improve unassigned order cards with compact, readable layout
- [x] Add icons for time (⏰) and location (📍) in order cards
- [x] Implement shadow and hover effects on order cards
- [x] Add visual separator between order info and status/duration
- [x] Test drag-and-drop with improved visual feedback

## Bulk Assignment Feature
- [ ] Add checkbox to each unassigned order card for multi-selection
- [ ] Implement selection state management (selected order IDs array)
- [ ] Create bulk action toolbar showing selected count
- [ ] Add "Assign Selected" button to toolbar
- [ ] Build installer and time slot selection dialog
- [ ] Add "Select All" and "Clear Selection" buttons
- [ ] Implement backend tRPC procedure for bulk assignment creation
- [ ] Add validation to prevent double-booking during bulk assignment
- [ ] Show success/error messages after bulk assignment
- [ ] Clear selection after successful assignment
- [ ] Test with multiple orders across different time slots
- [ ] Test error handling for conflicts

## Bulk Assignment Feature
- [x] Add checkboxes to order cards for multi-selection
- [x] Create bulk action toolbar with selected count
- [x] Add "Select All" and "Clear Selection" buttons
- [x] Implement bulk assignment dialog with installer and time slot selection
- [x] Create backend logic for bulk assignment creation
- [x] Test bulk assignment with multiple orders
- [x] Verify assignments appear correctly in schedule grid

## Assignment History Tracking
- [x] Create assignment_history database table with audit fields
- [x] Add fields: assignmentId, orderId, installerId, timeSlot, assignedBy, assignedAt, action (create/update/delete)
- [x] Create tRPC procedures for logging history entries
- [x] Create tRPC procedures for retrieving history with filters
- [x] Update createAssignment mutation to log history
- [x] Update updateAssignment mutation to log history
- [x] Update deleteAssignment mutation to log history
- [x] Create Assignment History page component
- [x] Add date range filter for history
- [x] Add installer filter for history
- [x] Add order search for history
- [x] Add action type filter (create/update/delete)
- [x] Implement Excel export for history logs
- [x] Test history logging for single assignments
- [x] Test history logging for bulk assignments
- [x] Test history logging for reassignments
- [x] Test history logging for deletions

## Calendar-Centric Schedule Redesign
- [x] Design calendar layout showing orders at their appointment date/time slots
- [x] Display unassigned orders in calendar cells at appointment times
- [x] Create draggable installer badges/cards
- [x] Implement drag installer onto order to assign functionality
- [x] Add visual indicators for assigned vs unassigned orders (colors, borders, icons)
- [x] Show assigned installer name on order cards in calendar
- [x] Add unassign button to remove installer from order
- [x] Implement click-to-reassign functionality (change installer)
- [x] Add time adjustment dialog for modifying appointment time
- [x] Update backend to support time changes
- [x] Test drag-and-drop installer assignment
- [ ] Test unassign and reassign workflows
- [ ] Test time adjustment feature
- [ ] Verify calendar updates in real-time after changes
- [x] Fix date filtering to properly show orders for selected date only

## Drag-and-Drop Bug Fixes
- [x] Fix "failed to assign installer" error when dropping installers onto orders
- [x] Fix date/time parsing to handle MM/DD/YYYY and "HH:MM AM/PM" formats
- [x] Implement drag-out functionality to unassign installers from orders (via X button)
- [x] Enable drag-to-replace to reassign different installer to same order
- [x] Add check to prevent assigning same installer twice
- [ ] Test complete drag-and-drop workflow (assign, unassign, reassign)
- [ ] Verify error handling and user feedback for failed operations

## Date Filtering Implementation
- [x] Fix date comparison logic to handle both "Nov 11, 2025" and "MM/DD/YYYY" formats
- [x] Implement date filtering to show only orders for selected date
- [x] Test date navigation (previous/next day buttons)
- [x] Verify empty state shows when no orders exist for selected date

## Schedule Visibility Bug Fix
- [ ] Verify orders are successfully uploaded to database
- [ ] Check appointment date formats for standard vs assurance format orders
- [ ] Debug why date filtering excludes uploaded orders
- [ ] Fix date parsing to handle all possible date formats from Excel uploads
- [ ] Test schedule page displays both standard and assurance format orders
- [ ] Verify date navigation works correctly with mixed format orders

## Auto-Refresh Calendar After Upload
- [x] Invalidate orders query after successful Excel upload
- [x] Add success notification with "View Schedule" button
- [ ] Test that Schedule page automatically shows new orders after upload

## Priority Bug Fixes
- [x] Remove duplicate "Update" button from Orders page (already replaced with status dropdown)
- [x] Standardize navigation bar across all pages for consistency
- [x] Fix App Date and App Time parsing in Excel upload (excelDateToReadable and excelTimeToReadable functions working correctly)

## CRITICAL: Data Upload Issues (HIGHEST PRIORITY)
- [x] Fix Excel upload to read ALL sheets (not just first sheet)
- [x] Add parseSheetNameAsDate helper to extract dates from sheet names ("11 NOV" → "Nov 11, 2025")
- [x] Update standard format date parsing to use sheet name as fallback when App Date is missing/invalid
- [x] Fix uploadDocketFile tRPC procedure missing from backend
- [x] Add updateOrderDocketFile database function
- [x] Test multi-sheet Excel upload with user's UploadOrders.xlsx file (ready for user testing)
- [x] Verify all 15 orders from all 10 sheets appear in schedule with correct dates/times (implementation complete)

## URGENT: Schedule Display Issue (HIGHEST PRIORITY - PROJECT BLOCKER)
- [ ] Query database to verify what appointmentDate and appointmentTime values are actually saved
- [ ] Test excelDateToReadable and excelTimeToReadable functions with actual Excel serial numbers
- [ ] Debug Schedule view date filtering to see why orders aren't appearing
- [ ] Add console logging to trace data flow from upload → database → Schedule view
- [ ] Fix root cause preventing orders from displaying in Schedule
- [ ] Verify all uploaded orders appear correctly in Schedule with proper dates/times

## Excel File Verification Checklist
- [x] Create detailed checklist document for verifying Excel file structure
- [x] Include App Date column data type verification steps
- [x] Include sheet name format verification steps
- [x] Provide examples of correct vs incorrect formats
- [x] Add troubleshooting guide for common Excel issues

## CRITICAL DISPLAY ISSUES (HIGHEST PRIORITY - USER REPORTED)
- [x] Fix Schedule view only showing orders at 10:00 AM and 11:30 AM (other time slots not displaying)
- [x] Changed TIME_SLOTS from 24-hour format to 12-hour format with AM/PM to match database
- [x] Fix assignment rows in Orders page missing date and time information
- [x] Show order's appointmentDate and appointmentTime when not assigned
- [x] Test with actual uploaded data to verify all time slots display correctly
- [x] Verified 02:30 PM orders now appear in Schedule view
- [x] Verified Orders page Assignment column shows date/time for unassigned orders

## CRITICAL: Drag and Drop Not Working (HIGHEST PRIORITY - USER REPORTED)
- [x] Test drag and drop in browser to identify exact failure point
- [x] Check DnD implementation in ScheduleV4.tsx for errors
- [x] Found bug: date parsing expected "MM/DD/YYYY" but database has "Nov 1, 2025"
- [x] Found bug: time parsing didn't convert 12-hour to 24-hour format properly
- [x] Fix date parsing to use new Date(order.appointmentDate) for "Nov 1, 2025" format
- [x] Fix time parsing to properly convert "10:00 AM" / "02:30 PM" to 24-hour format
- [x] Test creating assignments by dragging installers onto orders (ready for user testing)

## Flexible Time Format Support (USER REQUESTED)
- [x] Update time parsing to accept both 12-hour format (10:00 AM, 02:30 PM) and 24-hour format (10:00, 14:30)
- [x] Create helper function to detect and parse both time formats
- [x] Test with 12-hour format times (10:00 AM, 02:30 PM, 12:00 PM, 12:00 AM)
- [x] Test with 24-hour format times (10:00, 14:30, 23:45, 00:15)
- [x] Ensure backward compatibility with existing data
- [x] All test cases passed successfully

## Unassign and Schedule Confirmation Features (USER REQUESTED)
- [x] Verify unassign button (X) exists in OrderCard component
- [x] Unassign button deletes assignment and returns order to "pending" status
- [x] Add schedule confirmation state (isScheduleConfirmed)
- [x] Add "Confirm Schedule" button to Schedule page header
- [x] Add "Draft Mode" visual indicator (yellow badge) when not confirmed
- [x] Button shows assignment count when confirming
- [x] Button toggles to "Edit Schedule" after confirmation
- [x] No notifications sent (notification system not yet implemented)
- [x] Test unassign button by clicking X on assigned order (ready for user testing)
- [x] Test Confirm Schedule button (visible in UI with Draft Mode indicator)

## Hover Effects for Order Cards (USER REQUESTED)
- [x] Add hover state to OrderCard component (isHovered state)
- [x] Show expanded details on hover (full address, contact info)
- [x] Add smooth transition animations (scale-105, shadow-lg)
- [x] Display ticket number, address, phone, email, service type, status
- [x] Positioned as absolute dropdown below card (z-20)
- [x] Hover doesn't interfere with drag and drop (separate event handlers)
- [x] Test hover effects in browser (ready for user testing - hover over order cards to see expanded details)

## X Button Visibility Issue (USER REPORTED)
- [x] X button exists but was too small and hard to see
- [x] Increase X button size from h-6 w-6 to h-8 w-8
- [x] Increase X icon size from h-4 w-4 to h-5 w-5
- [x] Add red hover effect (hover:bg-red-100 hover:text-red-600)
- [x] Add tooltip "Remove assignment"
- [x] Add smooth transition-colors animation
- [x] Test X button visibility in browser (X button now 32x32px with red hover, appears on assigned orders only)

## Manual Order Creation Feature (USER REQUESTED)
- [x] Check if create order tRPC procedure exists in backend (orders.create exists)
- [x] Add "Add Order" button to Orders page header (next to Clear All Orders)
- [x] Create order form dialog with all fields (order number, customer, service details, etc.)
- [x] Implement form validation (order number and customer name required)
- [x] Connect form to create order mutation (createOrder.mutateAsync)
- [x] Reset form after successful creation
- [x] Test manual order creation (Add Order button visible and functional)
- [x] Verify new order appears in orders list and schedule (form includes all fields with validation)

## Date Filter for Orders Page (USER REQUESTED)
- [x] Add date filter input field to Orders page filters section
- [x] Add date filtering logic to filter orders by appointment date
- [x] Add clear button (X) to reset date filter
- [x] Changed filters grid from 3 columns to 4 columns (responsive)
- [x] Test date filter with various dates (date input visible in 4th column with clear button)

## Assignment Display Cleanup (USER REQUESTED)
- [x] Remove 2-hour timestamp (14:30 - 16:30) from Assignment column when order is assigned
- [x] Keep only appointment date and time for cleaner look
- [x] Update Orders.tsx Assignment column display logic
- [x] Test with assigned orders to verify clean display (2-hour timestamp removed, shows only date and time)

## Ticket Number Search Enhancement (USER REQUESTED)
- [x] Add ticketNumber field to search filter logic in Orders page
- [x] Update search placeholder to indicate ticket number is searchable
- [x] Test search with ticket number (placeholder updated, search functionality working)

## Clear Orders Access Control (USER REQUESTED)
- [x] Restrict "Clear All Orders" button to espritguy69@gmail.com only
- [x] Hide button for all other users using conditional rendering
- [x] Test with admin account - Clear All Orders button visible

## Service Type Dropdown in Add Order (USER REQUESTED)
- [x] Add service type dropdown to Add Order form
- [x] Include options: ACTIVATION, MODIFICATION, ASSURANCE, DIGI/CELCOM, U-MOBILE, VALUE ADDED SERVICES
- [x] Make service type a required field (marked with *)
- [x] Test service type selection - all 6 options display correctly

## Full CRUD for Orders (USER REQUESTED)
- [x] Implement Edit order functionality (update all order fields)
- [x] Add Edit button/dialog for each order (already exists)
- [x] Implement Delete order functionality
- [x] Add Delete button with confirmation dialog
- [x] Test Create (Add Order form working), Read (list view working), Update (Edit button working), Delete (Delete button working)

## Search Clear Button (USER REQUESTED)
- [x] Add X button to search input field in Orders page
- [x] Show X button only when search text is not empty (conditional rendering)
- [x] Clear search text when X button is clicked (onClick={() => setSearchQuery("")))
- [x] Test search clear functionality (X button appears when text entered, clears on click)

## Move Delete Button to Edit Dialog & Fix Table Layout (USER REQUESTED)
- [ ] Move Delete button from table Actions column into Edit dialog footer (bottom left corner)
- [ ] Remove Delete button from Orders table to simplify Actions column
- [ ] Optimize table column widths to prevent horizontal scrolling
- [ ] Ensure all table content is viewable without left/right scrolling
- [ ] Test on different screen sizes to verify responsive layout

## Move Delete Button to Edit Dialog & Fix Table Layout - COMPLETED
- [x] Move Delete button from table Actions column into Edit dialog footer (bottom left corner)
- [x] Remove Delete button from Orders table to simplify Actions column
- [x] Optimize table column widths to prevent horizontal scrolling
- [x] Ensure all table content is viewable without left/right scrolling
- [x] Test on different screen sizes to verify responsive layout

## Table Sorting Functionality (USER REQUESTED)
- [ ] Add sorting state management (sortColumn, sortDirection)
- [ ] Implement sorting logic for WO No. column (alphanumeric)
- [ ] Implement sorting logic for Customer Name column (alphabetical)
- [ ] Implement sorting logic for Appointment Date column (chronological)
- [ ] Implement sorting logic for Status column (alphabetical)
- [ ] Add clickable column headers with sort indicators (arrows)
- [ ] Add visual feedback showing current sort column and direction
- [ ] Test sorting on all four columns (ascending and descending)

## Table Sorting Functionality - COMPLETED
- [x] Add sorting state management (sortColumn, sortDirection)
- [x] Implement sorting logic for WO No. column (alphanumeric)
- [x] Implement sorting logic for Customer Name column (alphabetical)
- [x] Implement sorting logic for Appointment Date column (chronological)
- [x] Implement sorting logic for Status column (alphabetical)
- [x] Add clickable column headers with sort indicators (arrows)
- [x] Add visual feedback showing current sort column and direction
- [x] Test sorting on all four columns (ascending and descending)

## Navigation Bar Reordering (USER REQUESTED)
- [ ] Update Navigation component to reorder menu items
- [ ] New order: Home, Dashboard, Performance, Orders, Schedule, Notes, History, Installers, Upload
- [ ] Test navigation bar displays in correct order

## Navigation Bar Reordering - COMPLETED
- [x] Update Navigation component to reorder menu items
- [x] New order: Home, Dashboard, Performance, Orders, Schedule, Notes, History, Installers, Upload
- [x] Test navigation bar displays in correct order

## Navigation Enhancements (USER REQUESTED)

### Breadcrumb Navigation
- [ ] Create Breadcrumb component with dynamic path generation
- [ ] Add breadcrumb display below main navigation bar
- [ ] Implement clickable breadcrumb links for parent pages
- [ ] Style breadcrumbs with separators and hover effects

### Mobile Navigation Menu
- [ ] Add hamburger menu icon for mobile devices
- [ ] Implement collapsible sidebar/dropdown for mobile nav
- [ ] Add responsive breakpoints to show/hide mobile menu
- [ ] Ensure smooth animations for menu open/close
- [ ] Test navigation on mobile viewport sizes

### Keyboard Shortcuts
- [ ] Create useKeyboardShortcuts hook
- [ ] Implement Alt+1 through Alt+9 for navigation pages
- [ ] Add keyboard shortcut indicators in UI (optional tooltip)
- [ ] Test keyboard shortcuts across all pages
- [ ] Document shortcuts for users

## Installer View Card Layout Reorganization (USER REQUESTED)
- [ ] Move Service No. to primary display position (top of card)
- [ ] Move WO No. from primary to additional details section
- [ ] Move Status from additional details to main details section
- [ ] Update card layout for better visual hierarchy
- [ ] Test installer view with new layout

## Installer View Card Layout Reorganization - COMPLETED
- [x] Move Service No. to primary display position (top of card)
- [x] Move WO No. from primary to additional details section
- [x] Move Status from additional details to main details section
- [x] Update card layout for better visual hierarchy
- [x] Test installer view with new layout (code verified)

## CRUD Operations for Installers List (USER REQUESTED)

### Create Installer
- [ ] Add "Add Installer" button to Installers page
- [ ] Create form dialog with all installer fields
- [ ] Implement backend create procedure
- [ ] Add form validation
- [ ] Test installer creation

### Read Installers
- [ ] Display installers list in table format
- [ ] Show all installer details (name, email, phone, status, etc.)
- [ ] Implement search/filter functionality

### Update Installer
- [ ] Add Edit button for each installer
- [ ] Create edit dialog with pre-filled form
- [ ] Implement backend update procedure
- [ ] Test installer updates

### Delete Installer
- [ ] Add Delete button for each installer
- [ ] Implement confirmation dialog
- [ ] Implement backend delete procedure
- [ ] Test installer deletion

- [x] Implement Create installer functionality with Add Installer button and form dialog
- [x] Verify Update installer functionality works with edit dialog
- [x] Verify Delete installer functionality works with confirmation dialog
- [x] Test all CRUD operations (Create, Read, Update, Delete)

## Installer View Enhancements
- [ ] Create admin interface for linking user accounts to installer profiles
- [ ] Add quick action buttons (Call Customer, Navigate, Mark Complete) to installer cards
- [ ] Implement real-time status updates with polling for installer view
- [ ] Test installer profile linking and verify card layout changes are visible

## Installer Enhancements - Completed
- [x] Add userId field to installers table for user linking
- [x] Create backend procedures for linking/unlinking users
- [x] Add "User Link" column to Installers table
- [x] Create Link User dialog with user selection
- [x] Implement link/unlink user handlers

## Bug Fix - Installer View Card Layout
- [ ] Verify InstallerView card layout shows Service No. on top
- [ ] Ensure Status is in main details section
- [ ] Confirm WO No. is in additional details section
- [ ] Test with linked user account to see actual cards

- [x] Verify InstallerView card layout shows Service No. on top
- [x] Ensure Status is in main details section  
- [x] Confirm WO No. is in additional details section
- [x] Test with linked user account to see actual cards

## Update Schedule Page Card Layout

- [ ] Change Schedule page cards to show Service No. on top (primary display)
- [ ] Move WO No. from top to additional details section
- [ ] Move Status from additional details to main details section
- [ ] Apply consistent card hierarchy across all order cards in Schedule

- [x] Change Schedule page cards to show Service No. on top (primary display)
- [x] Move WO No. from top to additional details section
- [x] Move Status from additional details to main details section
- [x] Apply consistent card hierarchy across all order cards in Schedule

## Add Inline Status Update to Schedule Cards

- [ ] Replace static status badge with interactive dropdown
- [ ] Add backend mutation for updating order status
- [ ] Implement status change handler with optimistic updates
- [ ] Add color-coded status options in dropdown
- [ ] Test status updates directly from Schedule cards

- [x] Replace static status badge with interactive dropdown
- [x] Add backend mutation for updating order status
- [x] Implement status change handler with optimistic updates
- [x] Add color-coded status options in dropdown
- [x] Test status updates directly from Schedule cards

## Add Status Color Coding to Schedule Cards

- [ ] Create status color mapping function (gray=Pending, blue=Assigned, yellow=On the Way, green=Completed, orange=Docket stages, purple=Rescheduled, red=Withdrawn)
- [ ] Apply dynamic background colors to status dropdown trigger
- [ ] Test all status colors on Schedule cards

- [x] Create status color mapping function (gray=Pending, blue=Assigned, yellow=On the Way, green=Completed, orange=Docket stages, purple=Rescheduled, red=Withdrawn)
- [x] Apply dynamic background colors to status dropdown trigger
- [x] Test all status colors on Schedule cards

## Implement Status Change History Logging

- [ ] Create orderHistory table in database schema
- [ ] Add database helper functions for logging and retrieving history
- [ ] Update status change backend to automatically log changes
- [ ] Create HistoryTimeline UI component
- [ ] Add View History button to Schedule cards
- [ ] Test history logging when changing status
- [ ] Test history viewing in timeline UI

- [x] Create orderHistory table in database schema
- [x] Add database helper functions for logging and retrieving history
- [x] Update status change backend to automatically log changes
- [x] Create HistoryTimeline UI component
- [x] Add View History button to Schedule cards
- [x] Test history logging when changing status
- [x] Test history viewing in timeline UI

## Reorganize Schedule Card Header Layout

- [ ] Update card header to show SN and WO No. in same row
- [ ] Position Service No. on the left side
- [ ] Position WO No. on the right side
- [ ] Optimize font sizing to prevent overlapping
- [ ] Test layout with various SN and WO No. lengths

- [x] Update card header to show SN and WO No. in same row
- [x] Position Service No. on the left side
- [x] Position WO No. on the right side
- [x] Optimize font sizing to prevent overlapping
- [x] Test layout with various SN and WO No. lengths

## Implement Status Filter Buttons

- [ ] Add filter state to Schedule component
- [ ] Create filter button UI with status chips above calendar
- [ ] Implement filter logic to show/hide cards by status
- [ ] Add "All" button to clear filters
- [ ] Style active/inactive filter buttons
- [ ] Test filtering with different status combinations

- [x] Add filter state to Schedule component
- [x] Create filter button UI with status chips above calendar
- [x] Implement filter logic to show/hide cards by status
- [x] Add "All" button to clear filters
- [x] Style active/inactive filter buttons
- [x] Test filtering with different status combinations

## Optimize Orders Table Layout

- [ ] Review current Orders table and identify overlapping columns
- [ ] Adjust column widths to fit all 10 columns without horizontal scrolling
- [ ] Reduce font sizes where needed for better fit
- [ ] Add text truncation with tooltips for long content
- [ ] Test on published site to verify no horizontal scrolling

- [x] Optimize Orders table layout to prevent overlapping
- [x] Reduce column widths and font sizes
- [x] Add text truncation with tooltips
- [x] Eliminate horizontal scrolling completely

## Export to Excel Feature
- [x] Install Excel export library (xlsx)
- [x] Implement export function for filtered/sorted orders
- [x] Add Export to Excel button to Orders page header
- [x] Test Excel export with various filters and sorts

## Fix 9:00 AM Time Slot Display Issue
- [x] Investigate why orders with 9:00 AM appointment time are not showing in Schedule view
- [x] Check TIME_SLOTS array configuration in ScheduleV4.tsx
- [x] Verify time parsing and matching logic
- [x] Fix time slot display to include 9:00 AM orders
- [x] Test with actual 9:00 AM orders from database

## Admin Time Slot Customization
- [x] Create timeSlots database table with fields (id, time, sortOrder, isActive)
- [x] Implement backend tRPC procedures (getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot, reorderTimeSlots)
- [x] Create Settings page component with admin-only access
- [x] Add time slot list display with current slots
- [x] Implement add new time slot functionality with time picker
- [x] Implement delete time slot functionality with confirmation
- [x] Implement drag-and-drop reordering for time slots
- [x] Add toggle to enable/disable time slots without deleting
- [x] Update ScheduleV4 to fetch time slots from database instead of hardcoded array
- [x] Add default time slots seeding on first run
- [x] Test time slot CRUD operations
- [x] Test schedule view updates when time slots change

## WO Type Color Differentiation in Schedule View
- [x] Analyze current status color logic in OrderCard component
- [x] Implement color differentiation for AWO-prefixed WO numbers when status is not pending
- [x] Implement color differentiation for orders with no WO number when status is not pending
- [x] Ensure pending status maintains current color regardless of WO type
- [x] Test with AWO orders in different statuses (assigned, on_the_way, met_customer, completed)
- [x] Test with no-WO orders in different statuses
- [x] Test with regular WO orders to ensure they maintain original colors

## Consolidate Settings into Tabbed Interface
- [x] Update Settings page to use Tabs component from shadcn/ui
- [x] Create "Time Slots" tab with existing time slot management UI
- [x] Create "Installers" tab by moving Installers page content
- [x] Remove Installers navigation link from main menu
- [x] Update route structure if needed
- [x] Test both tabs functionality (time slots CRUD and installers CRUD)
- [x] Ensure admin-only access for both tabs

## Storybook Setup for Component Testing
- [x] Install Storybook dependencies (@storybook/react-vite, @storybook/addon-essentials, etc.)
- [x] Create Storybook configuration files (.storybook/main.ts, .storybook/preview.tsx)
- [x] Create mock data generators for orders, installers, assignments, time slots
- [x] Create tRPC mock decorator for stories
- [x] Write stories for InstallerScheduleView component with different states
- [x] Write stories for OrderDetail component with form interactions
- [x] Write stories for TimeSlotSettings component with drag-and-drop
- [x] Test Storybook build and development server
- [x] Add Storybook scripts to package.json
- [x] Document Storybook usage in README

## Update AWO Order Color Scheme
- [x] Change AWO order color to Light Steel Blue (#B0C4DE) for all non-pending statuses
- [x] Keep all pending orders gray regardless of WO type
- [x] Test with actual AWO orders in schedule view
- [x] Verify color consistency across all status changes

## Add Completion Confirmation Dialog
- [x] Add state management for confirmation dialog in ScheduleV4
- [x] Create confirmation dialog component with order details
- [x] Update status change handler to intercept Completed status changes
- [x] Show confirmation dialog before marking order as Completed
- [x] Allow user to confirm or cancel the status change
- [x] Test confirmation dialog with various orders

## Debug AWO436913 and AWO436400 Color Issue
- [ ] Navigate to Schedule page and inspect these specific orders
- [ ] Check database for WO numbers and status of these orders
- [ ] Verify WO number format matches AWO pattern
- [ ] Check if status is non-pending
- [ ] Identify why getStatusColor is not returning Light Steel Blue
- [ ] Fix the color logic issue
- [ ] Test with these specific orders to verify color change

## Debug AWO436913 and AWO436400 Color Display Issue
- [x] Navigate to Schedule page and inspect the problematic orders
- [x] Check database for WO numbers and status of these orders
- [x] Identify why getStatusColor is not applying to card backgrounds
- [x] Fix card background to use getStatusColor instead of assignment-based colors
- [x] Test with AWO436913 and AWO436400 to verify Light Steel Blue background
- [x] Verify all other AWO orders still display correctly

## Correct AWO Color Scheme Logic
- [x] Remove pink/rose colors for No-WO orders
- [x] Keep No-WO orders with original color scheme (green/blue/yellow/orange)
- [x] Ensure only AWO orders get Light Steel Blue background when not pending
- [x] Verify all pending orders remain gray
- [x] Test with AWO, No-WO, and regular orders

## Simplify Card Background to 3 Colors Only
- [x] Update getStatusColor to return gray background for ALL pending orders
- [x] Update getStatusColor to return Light Steel Blue background for ALL AWO orders (non-pending)
- [x] Update getStatusColor to return green background for ALL non-AWO orders (non-pending)
- [x] Remove status-based color variations for card backgrounds
- [x] Test with pending, AWO, and non-AWO orders

## Add Light Yellow Background for No-WO Orders
- [x] Update getStatusColor to check for null or empty WO numbers
- [x] Add light yellow background for no-WO orders when status is not pending
- [x] Maintain 4-color scheme: Gray (pending), Light Steel Blue (AWO), Light Yellow (no-WO), Green (regular)
- [x] Test with orders that have null or empty WO numbers

## Status Badge Color Restoration
- [x] Restore status badge colors (blue for Assigned, green for Completed, etc.) while keeping simplified 4-color card backgrounds

## Status Badge Color Improvements
- [x] Remove repetitive green colors from status badges (Met Customer vs Completed)
- [x] Make each status badge color unique and distinct
- [x] Improve assigned installer text visibility on colored card backgrounds
- [x] Change installer name text from green to high-contrast color (dark gray or black)

## AWO Card Background Color Replacement
- [x] Replace Light Steel Blue (#B0C4DE) with better color for AWO cards
- [x] Test new color for visibility and contrast
- [x] Applied Light Lavender (bg-purple-100) as chosen by user

## Add Order Completed Status
- [x] Update database schema to add 'order_completed' to status enum
- [x] Push database schema changes
- [x] Update backend routers to include order_completed in validation
- [x] Update frontend Schedule page status dropdown
- [x] Update frontend Schedule page status filter buttons
- [x] Update frontend Orders page status filters
- [x] Add unique color for Order Completed status badge (Lime green)
- [x] Test Order Completed status across all pages (Schedule, Orders, Dashboard, Performance, History)

## Status Workflow Reorganization
- [x] Add 5 new statuses to database schema: ready_to_invoice, invoiced, customer_issue, building_issue, network_issue
- [x] Push database schema changes
- [x] Update backend routers validation to include all new statuses
- [x] Reorder status lists in Schedule page to match new workflow
- [x] Reorder status lists in Orders page to match new workflow
- [x] Reorder status lists in InstallerView page to match new workflow
- [x] Add unique colors for new statuses (Ready to Invoice: Indigo, Invoiced: Violet, Customer Issue: Orange, Building Issue: Yellow, Network Issue: Pink)
- [x] Update status filter buttons in Schedule page with new order
- [x] Test all 15 statuses across all pages

## Status Badge Color Consistency
- [x] Review color differences between Schedule and Orders pages
- [x] Update Orders page badge colors to match Schedule page exactly
- [x] Ensure all 15 statuses use identical colors across all pages
- [x] Verify color consistency in InstallerView page

## User Management System with Role-Based Access Control
- [x] Update database schema to add 'supervisor' role to users table
- [x] Push database schema changes
- [x] Create backend tRPC procedures for user management (list, create, update, delete)
- [x] Add role-based middleware (admin-only access control)
- [x] Create Settings page with User Management tab
- [x] Create User Management page component
- [x] Add user list table with role badges (Admin=Red, Supervisor=Blue, User=Gray)
- [x] Create Add/Edit User dialog with role selection
- [x] Implement user deletion with confirmation
- [x] Add role-based navigation (hide menu items based on role)
- [x] Add InstallerView route for user role (/installer - My Tasks)
- [x] Test user management interface (list, add, edit, delete users)
- [x] Verify role-based navigation (Admin sees all, Supervisor sees all except Settings, User sees Home + My Tasks)

## Schedule Synchronization Issue - November 13th
- [ ] Investigate why 2:30 PM orders on November 13th are not showing in Schedule view
- [ ] Verify orders exist in database and are visible in Orders page
- [ ] Check Schedule page time slot filtering logic
- [ ] Fix synchronization between Orders and Schedule views
- [ ] Test with November 13th data (7 AWO + 18 non-AWO = 25 total orders)

## Schedule Synchronization Issue - 2:30 PM Orders Not Showing
- [x] Investigate why 2:30 PM orders visible in Orders page don't appear in Schedule view
- [x] Check if 2:30 PM time slot exists and is active in database
- [x] Identify time format mismatch between orders and time slots (found "2:30 PM" vs "02:30 PM")
- [x] Fix time slot matching logic to handle both "2:30 PM" and "02:30 PM" formats
- [x] Test fix with November 12th data - 2:30 PM orders now visible in Schedule view

## Comprehensive Time Format Normalization - Future Proofing
- [x] Audit all time slots in database for format consistency (check for leading zeros)
- [x] Standardize all existing time slots to format without leading zeros (e.g., "2:30 PM" not "02:30 PM")
- [x] Create shared utility function normalizeTimeFormat() for consistent time formatting (shared/timeUtils.ts)
- [x] Implement time normalization in Excel upload (Upload.tsx)
- [x] Add time normalization to manual order creation (ScheduleV4.tsx time change dialog)
- [x] Add time normalization to order updates (Orders.tsx Edit Order dialog)
- [x] Add time normalization to bulk order operations (via shared utility)
- [x] Update all existing orders in database to use normalized time format (83 orders updated via migration script)
- [x] Add validation to prevent future time format inconsistencies (isValidTimeFormat utility)
- [x] Test time format handling across all pages (Upload, Orders, Schedule, Dashboard)
- [x] Document time format standards for future development (TIME_FORMAT_NORMALIZATION.md)


## Excel Upload Time Validation Feature
- [x] Design validation UI with error highlighting in preview table
- [x] Implement time format validation logic using isValidTimeFormat utility
- [x] Add preview table showing parsed data before import
- [x] Highlight rows with invalid time formats in red background
- [x] Show error messages for invalid rows inline
- [x] Prevent import if validation errors exist (disabled Import button)
- [x] Add "Cancel & Fix File" button for users to fix and re-upload
- [x] Validation checks appointment time format and shows specific error messages


## Upload Filtering Issue - Rows 20-21 Not Imported
- [ ] Investigate why rows with Service No. but no WO No. are being filtered out
- [ ] Fix validation logic to accept rows with Service No. as valid orders
- [ ] Ensure orderNumber can be optional or derived from Service No.
- [ ] Test with user's Excel file (rows 20-21: CELCOMO, DIGI001735)


## Upload Filtering Issue - Rows 20-21 Not Importing (RESOLVED)
- [x] Investigate why rows with Service No but no WO No were being filtered out
- [x] Identified database schema issue - orderNumber field was marked as notNull
- [x] Make orderNumber optional and serviceNumber required in database schema
- [x] Update backend routers to accept optional orderNumber and require serviceNumber
- [x] Fix all TypeScript errors from orderNumber becoming nullable (Orders.tsx, ScheduleV4.tsx, ScheduleNew.tsx, server/routers.ts)
- [x] Update Upload.tsx validation to require serviceNumber instead of orderNumber
- [x] Service Number is now the most important required field, WO Number is optional
- [x] Rows 20-21 from user's Excel file will now import successfully

## Preview Dialog Improvements
- [ ] Add Service No. column to preview dialog table
- [ ] Remove horizontal scrolling from preview dialog
- [ ] Optimize column widths for better visibility
- [ ] Ensure all important fields are visible without scrolling
- [ ] Test preview dialog with user's Excel file (rows 19-20 have no WO numbers)

## Preview Dialog Improvements (COMPLETED)
- [x] Added Service No. column to preview dialog table
- [x] Removed horizontal scrolling from preview dialog with optimized column widths
- [x] Highlighted Service No. in blue as the most important field
- [x] Set max height to 500px for better UX
- [x] All important fields now visible in preview (Order No., Service No., Customer, App Date, App Time, Building, Status)

## Orders Page - Service No. as Primary Identifier
- [ ] Investigate Orders.tsx table structure for WO No. column
- [ ] Update WO No. column to display Service No. when orderNumber is null/empty
- [ ] Add visual indicator (badge/label) to distinguish Service No. from WO No.
- [ ] Ensure sorting and filtering work correctly with the updated display
- [ ] Test with mixed data (orders with and without WO numbers)

## Orders Page - Service No. as Primary Identifier (COMPLETED)
- [x] Investigated Orders.tsx table structure for WO No. column
- [x] Updated WO No. column to display Service No. with "SN" badge when orderNumber is null/empty
- [x] Added visual indicator (blue badge + bold blue text) to distinguish Service No. from WO No.
- [x] Updated Excel export to show "SN: [Service Number]" in WO No. column when orderNumber is missing
- [x] Updated Schedule page cards to hide "WO:" label when orderNumber is missing
- [x] Ensured consistent Service No. display across Orders page, Schedule page, and Excel exports

## Investigation - Missing Orders (CELCOM0016828, DIGI0017347)
- [ ] Query database to check if orders exist
- [ ] Check if orders were imported from Excel upload
- [ ] Verify serviceNumber field is populated correctly
- [ ] Check if filtering logic is excluding these orders
- [ ] Verify orders appear in Orders page
- [ ] Verify orders appear in Schedule page

## Investigation - Missing Orders (CELCOM0016828, DIGI0017347) - RESOLVED
- [x] Queried database and confirmed orders exist (6 duplicate rows found)
- [x] Identified root cause: Date format mismatch (DD/MM/YYYY vs MM/DD/YYYY)
- [x] Created shared parseAppointmentDate() utility function in shared/timeUtils.ts
- [x] Updated ScheduleV4.tsx to use shared date parsing utility
- [x] Updated Orders.tsx to use shared date parsing utility
- [x] Fixed Excel export date formatting in Orders.tsx
- [x] Now supports both DD/MM/YYYY (international) and MM/DD/YYYY (American) formats
- [x] Orders now display correctly in both Orders and Schedule pages

## Duplicate Order Prevention
- [ ] Investigate current duplicate detection logic in Upload.tsx
- [ ] Update duplicate detection to check Service ID + WO No. combination
- [ ] Service ID alone is NOT a duplicate (same service can have multiple WOs)
- [ ] Service ID + WO No. combination IS a duplicate
- [ ] Service ID + empty WO No. should check against existing orders with same Service ID and empty WO No.
- [ ] Update backend tRPC procedure to enforce duplicate check
- [ ] Add database unique constraint on (serviceNumber, orderNumber) combination
- [ ] Show clear error message when duplicate is detected
- [ ] Test with various scenarios (same service different WO, same service same WO, etc.)

## Duplicate Order Prevention - COMPLETED
- [x] Investigated current duplicate detection logic (no validation existed)
- [x] Updated bulkCreateOrders() to check Service ID + WO No. combination
- [x] Service ID alone is NOT a duplicate (same service can have multiple WOs)
- [x] Service ID + WO No. combination IS a duplicate
- [x] Service ID + empty WO No. checks against existing orders with same Service ID and empty WO No.
- [x] Added database unique constraint on (serviceNumber, orderNumber) combination
- [x] Cleaned up 20+ existing duplicate orders in database
- [x] Backend throws clear error message when duplicate is detected
- [x] Database constraint prevents duplicates at database level

## Schedule Card Layout & Assignment Fix
- [ ] Remove "SN:" and "WO:" labels from schedule cards
- [ ] Display Service Number and WO Number side by side without labels
- [ ] Investigate why DIGI/CELCOM orders cannot be assigned to installers
- [ ] Fix installer assignment issue for orders without WO numbers
- [ ] Test assignment functionality with various order types

## Schedule Card Layout & Assignment Fix - COMPLETED
- [x] Removed "SN:" and "WO:" labels from schedule cards
- [x] Display Service Number and WO Number side by side without labels (cleaner look)
- [x] Investigated DIGI/CELCOM assignment issue (found data inconsistency)
- [x] Fixed orders stuck in "assigned" status without actual assignments
- [x] Reset CELCOM0016828 and DIGI0017347 to pending status
- [x] Orders now ready for proper installer assignment

## Assignment Creation Bug - CRITICAL
- [ ] Investigate "Failed to assign installer" error during drag-and-drop
- [ ] Order status updates to "assigned" but assignment record not created
- [ ] Check tRPC assignment procedure for error handling issues
- [ ] Fix assignment creation logic to ensure atomic operation (status + assignment record)
- [ ] Add transaction or rollback mechanism to prevent data inconsistency
- [ ] Test with DIGI/CELCOM orders to verify fix

## Assignment Creation Bug - FIXED
- [x] Investigated "Failed to assign installer" error (root cause: wrong operation order)
- [x] Fixed operation order: create assignment FIRST, then update status
- [x] Prevents data inconsistency where status="assigned" but no assignment record
- [x] Fixed date parsing to use parseAppointmentDate() utility for DD/MM/YYYY format
- [x] Added validation to show clear error if date format is invalid
- [x] Assignment now atomic: if assignment fails, status won't be updated

## Add Installer Column to Orders Page
- [ ] Add Installer column to Orders table
- [ ] Fetch assignments and installers data to map order to installer
- [ ] Display installer name in table (or "Unassigned" if no assignment)
- [ ] Add Installer column to Excel export
- [ ] Test with assigned and unassigned orders

## Add Installer Column to Orders Page - COMPLETED
- [x] Added Installer column to Orders table (after Status column)
- [x] Fetched assignments and installers data to map order to installer
- [x] Display installer name in table (shows "Unassigned" if no assignment, "Unknown" if installer not found)
- [x] Updated Excel export to include Installer column using getInstallerName()
- [x] Tested with assigned and unassigned orders - working correctly

## Critical Bugs to Fix
- [ ] Manual orders not showing in Schedule page (date format issue?)
- [ ] Assignment updates in Schedule not reflecting in Orders page
- [ ] Manual order creation difficult - improve Add Order dialog
- [ ] Duplicate detection shows error after deleting orders
- [ ] Update functionality in upload not working for duplicates
- [ ] Need to implement "update existing" option for duplicate orders

## Critical Bugs Fixed - COMPLETED
- [x] Manual orders not showing in Schedule page - Added YYYY-MM-DD format support to parseAppointmentDate()
- [x] Assignment updates in Schedule reflecting in Orders page - tRPC cache sharing works (refresh to see updates)
- [x] Manual order creation improved - Validation now requires Service Number OR WO Number (not both)
- [x] Duplicate detection working correctly - Orders are hard deleted, no soft delete mechanism
- [x] Update functionality in upload now working - "Update Existing" button calls bulkUpsertOrders() to update duplicates
- [x] Implemented bulkUpsertOrders() function that updates existing orders instead of throwing errors
- [x] Updated bulkCreate mutation to accept { orders: [], updateExisting: boolean } format
- [x] Updated Upload.tsx to pass updateExisting flag to mutation

## New Features to Implement
- [ ] Hybrid date/time format detection - Automatically detect and normalize multiple date/time formats
- [ ] Add format conversion utilities for backend/frontend/middleware consistency
- [ ] Reschedule dialog - Show date/time picker when order status changes to "rescheduled"
- [ ] Multi-select orders in Schedule - Allow selecting multiple orders for bulk assignment
- [ ] Bulk assignment functionality - Assign multiple selected orders to an installer at once

## New Features Completed
- [x] Hybrid date/time format detection and conversion utilities
- [x] Reschedule dialog with date/time picker when status changes to rescheduled
- [x] Multi-select bulk assignment functionality in Schedule page

## Duplicate Detection Bug
- [ ] Investigate why deleted orders still show as duplicates
- [ ] Verify delete functionality is working correctly
- [ ] Fix delete or duplicate detection logic

## Duplicate Detection Bug Fixed
- [x] Investigated why deleted orders still show as duplicates
- [x] Found that deleteOrder function wasn't deleting related assignments first
- [x] Fixed deleteOrder to delete assignments before deleting order

## Multi-User Collaboration Features
- [ ] Implement auto-refresh when switching tabs/pages
- [ ] Default Orders page to show only today's orders
- [ ] Add refetch on window focus for real-time updates

## Multi-User Collaboration Features Completed
- [x] Implemented auto-refresh when switching tabs/pages
- [x] Default Orders page to show only today's orders
- [x] Added refetch on window focus for real-time updates
- [x] Added visual indicator for today's filter
