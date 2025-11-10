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
