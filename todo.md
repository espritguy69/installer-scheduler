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
