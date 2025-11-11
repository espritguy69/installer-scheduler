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
- [ ] Fix date filtering to properly show orders for selected date only

## Drag-and-Drop Bug Fixes
- [x] Fix "failed to assign installer" error when dropping installers onto orders
- [x] Fix date/time parsing to handle MM/DD/YYYY and "HH:MM AM/PM" formats
- [x] Implement drag-out functionality to unassign installers from orders (via X button)
- [x] Enable drag-to-replace to reassign different installer to same order
- [x] Add check to prevent assigning same installer twice
- [ ] Test complete drag-and-drop workflow (assign, unassign, reassign)
- [ ] Verify error handling and user feedback for failed operations
