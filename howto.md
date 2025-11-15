# User Guide - How To Use Service Installer Scheduler

**Version:** 1.0  
**Last Updated:** November 15, 2025

---

## Quick Start

### Accessing the System

1. Navigate to: `https://servicesched-c3kvsobm.manus.space`
2. Click **Login** button
3. Authenticate with your Manus account
4. You'll be redirected to the Dashboard

---

## Core Workflows

### 1. Importing Orders from Excel

**Step-by-Step:**

1. Go to **Orders** page
2. Click **Upload Excel** button (top-right)
3. Select your Excel file (.xlsx format)
4. Review the import preview
5. Click **Confirm Import**
6. Check for any validation errors
7. Successfully imported orders appear in the table

**Excel Format Requirements:**
- Required columns: WO No., Ticket No., Service No., Customer Name, Phone, Address
- Optional columns: WO Type, Priority, Notes
- Date format: DD/MM/YYYY
- Time format: HH:MM AM/PM

**Tips:**
- Maximum 500 orders per import
- Fix validation errors before re-importing
- Use the template file for correct format

### 2. Filtering and Searching Orders

**Date Filtering:**

**Single Date Mode:**
- Click **Yesterday**, **Today**, or **Tomorrow** for quick access
- Or use the date picker for any specific date
- Date automatically resets to today when you open the page

**Date Range Mode:**
- Click **Date Range** toggle
- Use quick presets: **This Week**, **Last 7 Days**, **This Month**
- Or select custom **Start Date** and **End Date**
- Click **Clear Date Range** to reset

**Other Filters:**
- **Status:** Select from dropdown (15 status options)
- **Reschedule Reason:** Filter rescheduled orders by reason
- **Search:** Type WO No., Ticket No., Service No., Customer Name, or Phone

**Combining Filters:**
- All filters work together
- Example: Show "Assigned" orders for "Today" with customer name "John"

### 3. Updating Order Status

**Quick Update (from table):**
1. Find the order in the Orders table
2. Click the **Status badge** (colored pill)
3. Select new status from dropdown
4. Status updates immediately

**Bulk Update:**
1. Check boxes next to multiple orders
2. Click **Bulk Actions** button
3. Select **Update Status**
4. Choose new status
5. Click **Apply**

**Available Statuses:**
1. Pending
2. Assigned
3. On the Way
4. Met Customer
5. Order Completed
6. Docket Received
7. Docket Uploaded
8. Ready to Invoice
9. Invoiced
10. Completed
11. Customer Issue
12. Building Issue
13. Network Issue
14. Rescheduled
15. Withdrawn

### 4. Assigning Orders to Installers

**Method 1: From Orders Page**
1. Click **Actions** menu (three dots) on order row
2. Select **Assign Installer**
3. Choose installer from dropdown
4. Select appointment date
5. Select time slot (30-minute intervals)
6. Click **Assign**

**Method 2: From Schedule Page**
1. Go to **Schedule** page
2. Select date from calendar
3. Drag order from unassigned list to installer's schedule
4. Adjust time if needed
5. Assignment saves automatically

**Reassigning:**
- Follow same steps as above
- Previous assignment is saved in history
- Installer receives notification (if enabled)

### 5. Managing the Schedule

**Viewing Schedule:**
- **Schedule** page shows daily calendar view
- Each installer has their own column
- Orders are color-coded by status
- Time slots are 30 minutes each (8:00 AM - 8:00 PM)

**Rescheduling Orders:**
1. Find order in schedule
2. Drag to new date/time slot
3. Or click order and select **Reschedule**
4. Choose reschedule reason
5. Select new date and time
6. Click **Save**

**Filtering Schedule:**
- **By Installer:** Click installer name to show only their assignments
- **By Date:** Use date picker to navigate
- **By Status:** Filter to show specific statuses

### 6. Uploading Dockets

**Single Upload:**
1. Go to order details (click order row)
2. Scroll to **Docket** section
3. Click **Upload Docket**
4. Select file (PDF, JPG, PNG up to 5MB)
5. Wait for upload to complete
6. Status automatically updates to "Docket Uploaded"

**Bulk Upload:**
1. Select multiple orders (checkbox)
2. Click **Bulk Actions** → **Upload Dockets**
3. Upload files (one per order)
4. Match files to orders
5. Click **Upload All**

**Viewing Dockets:**
- Click **View** button in Docket column
- Opens in new tab
- Download option available

### 7. Adding Notes to Orders

1. Click order row to open details
2. Scroll to **Notes** section
3. Type your note (max 1000 characters)
4. Click **Add Note**
5. Note appears with timestamp and your name

**Note Tips:**
- Use notes for important updates
- Include contact information if relevant
- Notes are visible to all users

### 8. Sorting Orders

**Sortable Columns:**
- **Ticket No.** - Click header to sort alphabetically
- **Service No.** - Click header to sort alphabetically
- **Status** - Click header to sort by status
- **Installer** - Click header to sort by installer name
- **Assignment** - Click header to sort by appointment date

**How to Sort:**
1. Click column header once for ascending (A→Z, 0→9, oldest→newest)
2. Click again for descending (Z→A, 9→0, newest→oldest)
3. Arrow icon shows current sort direction

**Non-Sortable Columns:**
- WO No., Customer, WO Type, Priority, Docket (plain headers, no sorting)

### 9. Exporting Data

**Export to Excel:**
1. Apply desired filters (date, status, search)
2. Click **Export** button (top-right)
3. Select **Export to Excel**
4. File downloads automatically
5. Open in Excel/Google Sheets

**Export includes:**
- All visible columns
- Only filtered/searched orders
- Current sort order

### 10. Managing Installers

**Adding Installer:**
1. Go to **Installers** page
2. Click **Add Installer**
3. Enter name, phone, email
4. Select skills/specializations
5. Click **Save**

**Editing Installer:**
1. Find installer in list
2. Click **Edit** icon
3. Update information
4. Click **Save**

**Viewing Installer Performance:**
1. Go to **Performance** page
2. Select installer from dropdown
3. View metrics:
   - Total assignments
   - Completion rate
   - Average time per order
   - Customer feedback (if available)

---

## Tips & Best Practices

### Daily Workflow

**Morning Routine:**
1. Check **Today's** orders (Orders page)
2. Review **Schedule** for any conflicts
3. Assign any unassigned orders
4. Communicate with installers

**Throughout the Day:**
1. Monitor status updates from installers
2. Handle rescheduling requests
3. Upload dockets as they come in
4. Respond to customer issues

**End of Day:**
1. Verify all completed orders have dockets
2. Update any pending statuses
3. Prepare assignments for tomorrow
4. Export daily report

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + F` - Find in page
- `Esc` - Close dialogs
- `Enter` - Confirm actions

### Mobile Usage

**Supported Features:**
- View orders and schedule
- Update order status
- Add notes
- View dockets

**Limited Features:**
- Excel upload (use desktop)
- Bulk operations (use desktop)
- Drag-and-drop scheduling (use desktop)

---

## Troubleshooting

### Common Issues

**Q: Why don't I see today's orders?**
- A: Check date filter - it should show today's date
- Try clicking the **Today** button to reset

**Q: Upload failed - what to do?**
- A: Check file size (max 5MB for dockets, 10MB for Excel)
- Verify file format (Excel: .xlsx, Dockets: PDF/JPG/PNG)
- Check internet connection

**Q: Can't assign installer - dropdown is empty**
- A: Go to Installers page and add installers first
- Refresh the page if installers were just added

**Q: Order disappeared after filtering**
- A: Clear all filters to see all orders
- Check if order matches current filter criteria

**Q: Status update didn't save**
- A: Check internet connection
- Refresh page and try again
- Contact support if issue persists

### Getting Help

**In-App Help:**
- Hover over (?) icons for tooltips
- Click **Help** in top navigation

**Contact Support:**
- Email: support@yourcompany.com
- Response time: Within 24 hours

**Report Bugs:**
- Use **Feedback** button in app
- Or create GitHub issue: https://github.com/espritguy69/installer-scheduler/issues

---

## Appendix: Status Workflow

**Typical Order Lifecycle:**

```
1. Pending (order created)
   ↓
2. Assigned (installer assigned)
   ↓
3. On the Way (installer traveling)
   ↓
4. Met Customer (installer on-site)
   ↓
5. Order Completed (work finished)
   ↓
6. Docket Received (paperwork received)
   ↓
7. Docket Uploaded (uploaded to system)
   ↓
8. Ready to Invoice (ready for billing)
   ↓
9. Invoiced (invoice sent)
   ↓
10. Completed (fully closed)
```

**Alternative Paths:**
- **Customer Issue** → Reschedule or resolve → Resume workflow
- **Building Issue** → Escalate → Resume when resolved
- **Network Issue** → Technical support → Resume workflow
- **Rescheduled** → Return to Assigned with new date
- **Withdrawn** → Order cancelled (terminal state)

---

**Need more help?** See `technical.md` for advanced features and `spec.md` for detailed specifications.
