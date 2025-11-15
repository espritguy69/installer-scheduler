# Changelog

All notable changes to the Service Installer Scheduler project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- CHANGELOG.md to track all project changes

---

## [1.5.0] - 2025-11-15

### Added
- Quick date shortcuts (Yesterday, Today, Tomorrow) above date picker in Orders page
- Custom date range filter with start and end date selectors
- Quick range presets: This Week, Last 7 Days, This Month
- Mode toggle between Single Date and Date Range filtering
- All 6 missing statuses to quick status dropdown in Orders table

### Changed
- Updated Orders table sorting to only 5 sortable columns (Ticket No., Service No., Status, Installer, Assignment)
- Removed sorting from WO No., Customer, WO Type, Priority, and Docket columns
- Sort icons now only appear on sortable columns for clearer UI

### Fixed
- **CRITICAL:** Date filter stuck on November 14, 2025 - now auto-resets to today's date on page load
- **CRITICAL:** "Cannot access 'br' before initialization" error when clicking Installer column sort
- Missing 6 statuses in Orders page quick status dropdown (order_completed, ready_to_invoice, invoiced, customer_issue, building_issue, network_issue)
- Date filter now updates when switching browser tabs (visibility change event)
- Moved assignments and installers data loading before sorting logic to prevent runtime errors

---

## [1.4.0] - 2025-11-14

### Added
- Comprehensive documentation suite:
  - prd.md (Product Requirements Document)
  - setup.md (Installation & Setup Guide)
  - howto.md (User Guide)
  - technical.md (Technical Implementation)
  - spec.md (Feature Specifications)
  - wire.md (UI Wireframes & Design)
  - ARCHITECTURE.md (System Architecture)

### Changed
- Updated all documentation to reflect latest features and changes

---

## [1.3.0] - 2025-11-13

### Added
- Status consistency verification between Orders and Schedule pages
- All 15 status options now available in all dropdowns
- Status badge colors standardized across the application

### Fixed
- Status dropdown consistency - all pages now show identical 15 statuses
- Color coding matches between Orders and Schedule pages

---

## [1.2.0] - 2025-11-12

### Added
- Docket Received and Docket Uploaded statuses to order workflow
- File upload functionality for dockets (PDF, images)
- Docket management in order details
- S3 storage integration for docket files

### Changed
- Extended status enum to include docket-related statuses
- Updated status filter dropdowns to include new statuses

---

## [1.1.0] - 2025-11-11

### Added
- Notes/Remarks system with dedicated Notes page
- Note types: reschedule, follow-up, incident, complaint
- Excel export functionality for notes
- Date range filtering for notes
- Note templates for common scenarios
- Recent notes display on Dashboard (last 7 days)
- Service number search and linking in notes

### Changed
- Notes persist independently from orders (survive order deletion)
- Dashboard now shows open incidents and pending follow-ups

---

## [1.0.0] - 2025-11-10

### Added
- Core order management system
  - Create, read, update, delete orders
  - Excel/CSV import for bulk order creation
  - Duplicate detection during import
  - Order search and filtering
  - Status management (15 distinct statuses)
  
- Installer management
  - Installer CRUD operations
  - 16 predefined installers seeded
  - Installer assignment to orders
  
- Schedule management
  - Daily calendar view with time slots
  - Drag-and-drop order assignment
  - Visual status indicators
  - Installer workload display
  - Print-friendly schedule view
  
- Assignment system
  - Assign installers to orders
  - Appointment date and time selection
  - Reassignment capability
  - Assignment history tracking
  
- Dashboard and analytics
  - Performance metrics per installer
  - Completion rates
  - Average job duration
  - Pending vs completed orders chart
  - Daily summary statistics
  
- User authentication
  - Manus OAuth integration
  - Role-based access control (admin/user)
  - Session management with JWT
  
- File operations
  - Excel import for orders and installers
  - Excel export for schedules and notes
  - File validation and error reporting

### Changed
- Schedule layout redesigned with installer rows and time slot columns
- Order cards display Service No., App Time, Building Name
- Custom time slots: 9am, 10am, 11am, 11:30am, 1pm, 2:30pm, 3pm, 4pm, 6pm

### Fixed
- Nested anchor tag errors in navigation components
- 404 error on /upload route
- Excel time format conversion (decimal to readable time)
- Phone number type conversion from Excel
- Validation issues with email and phone fields

---

## [0.9.0] - 2025-11-09 (Beta)

### Added
- Initial project scaffolding
- Database schema design (orders, installers, assignments, users)
- tRPC API setup
- React frontend with Tailwind CSS
- Basic CRUD operations for orders and installers

### Changed
- Migrated from REST API to tRPC for type-safe API calls

---

## Bug Fixes Summary

### Critical Bugs Fixed
1. **Date Filter Stuck (v1.5.0)** - Orders page date filter was stuck on November 14, 2025 instead of showing today's date
2. **Installer Sort Error (v1.5.0)** - Runtime error "Cannot access 'br' before initialization" when clicking Installer column sort
3. **Missing Statuses (v1.5.0)** - 6 statuses missing from quick status dropdown in Orders table

### Major Bugs Fixed
1. **Nested Anchor Tags (v1.0.0)** - React error due to `<a>` tags nested inside Link components
2. **Upload Route 404 (v1.0.0)** - /upload route not registered in App.tsx router
3. **Excel Time Format (v1.0.0)** - Excel time decimals (0.4166) not converting to readable format (10:00 AM)

### Minor Bugs Fixed
1. **Phone Number Conversion (v1.0.0)** - Phone numbers from Excel not converting to proper string format
2. **Email Validation (v1.0.0)** - Overly strict email validation preventing valid imports
3. **Order Card Display (v1.0.0)** - Service No., App Time, Building Name not showing in order cards

---

## Feature Requests Implemented

### User-Requested Features
- ✅ Quick date shortcuts (Yesterday, Today, Tomorrow)
- ✅ Custom date range filter with presets
- ✅ Limited sorting to specific columns only
- ✅ All 15 statuses in quick dropdown
- ✅ Comprehensive documentation suite
- ✅ CHANGELOG.md for tracking changes

### Planned Features (Not Yet Implemented)
- ⏳ Status workflow validation (prevent invalid transitions)
- ⏳ Status change history timeline
- ⏳ Bulk status updates
- ⏳ Order count badges on date shortcuts
- ⏳ Week view for orders
- ⏳ Multi-column sorting (Shift+Click)
- ⏳ Sort preference persistence

---

## Known Issues

### Current Limitations
1. **Dev Server File Watchers** - Sandbox environment occasionally hits file watcher limits (EMFILE error)
   - Workaround: Restart dev server or increase `fs.inotify.max_user_watches`
   - Does not affect production deployment

2. **Mobile Drag-and-Drop** - Touch support for drag-and-drop is limited on mobile devices
   - Workaround: Use assignment dialog instead of drag-and-drop on mobile

3. **Browser Caching** - After publishing, users may need hard refresh (Ctrl+Shift+R) to see changes
   - Workaround: Clear browser cache or use incognito mode

### Performance Considerations
1. Large datasets (1000+ orders) may experience slower filtering/sorting
   - Recommendation: Implement pagination or virtual scrolling in future versions

2. Excel import with 500+ rows may take 10-15 seconds
   - Recommendation: Show progress indicator during import

---

## Migration Guide

### Upgrading from v1.4.0 to v1.5.0

**Database Changes:**
- No database schema changes required

**Code Changes:**
- Orders.tsx updated with new date filtering logic
- No breaking changes to API

**Action Required:**
- Clear browser cache after deployment
- Test date filter functionality
- Verify all 15 statuses appear in dropdowns

### Upgrading from v1.0.0 to v1.1.0

**Database Changes:**
- New `notes` table added
- Run `pnpm db:push` to apply schema changes

**Code Changes:**
- New Notes page added to navigation
- New tRPC procedures for notes management

**Action Required:**
- Update database schema
- Test notes creation and Excel export

---

## Development Notes

### Recent Checkpoints
- **ef174398** (2025-11-15) - Added missing 6 statuses to quick dropdown
- **6ba4dceb** (2025-11-15) - Fixed installer sorting error
- **7eb24e9f** (2025-11-15) - Updated sorting columns
- **142e10f1** (2025-11-15) - Implemented custom date range filter
- **ae86c9ca** (2025-11-15) - Added quick date shortcuts
- **852a0062** (2025-11-15) - Fixed date filter auto-reset

### Git Commits
- **9686c19** - docs: Create comprehensive documentation
- **8517dfe** - fix: Add missing statuses to Orders page quick dropdown
- **205ac34** - docs: Add comprehensive architecture documentation

---

## Contributors

- **espritguy69** - Project Owner
- **Manus AI** - Development Assistant

---

## Links

- **GitHub Repository:** https://github.com/espritguy69/installer-scheduler
- **Live Site:** https://servicesched-c3kvsobm.manus.space/
- **Documentation:** See prd.md, setup.md, howto.md, technical.md, spec.md, wire.md, ARCHITECTURE.md

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.5.0 | 2025-11-15 | Date filtering enhancements, sorting updates, missing statuses fix |
| 1.4.0 | 2025-11-14 | Comprehensive documentation suite |
| 1.3.0 | 2025-11-13 | Status consistency improvements |
| 1.2.0 | 2025-11-12 | Docket management features |
| 1.1.0 | 2025-11-11 | Notes/Remarks system |
| 1.0.0 | 2025-11-10 | Initial stable release |
| 0.9.0 | 2025-11-09 | Beta release |

---

**Last Updated:** November 15, 2025
