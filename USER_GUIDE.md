# Service Installer Scheduler - User Guide

## Overview

The Service Installer Scheduler is a web application designed to help you efficiently manage and assign service installation orders to your team of installers. The application provides an intuitive drag-and-drop interface for scheduling, file upload capabilities for bulk data import, and Excel export functionality for easy distribution of schedules.

## Getting Started

### Accessing the Application

1. Navigate to the application URL in your web browser
2. Click "Sign In to Continue" to authenticate
3. Once logged in, you'll see the home page with three main features

## Features

### 1. Upload Data

The Upload page allows you to import service orders and installer information from Excel or CSV files.

#### Uploading Orders

**Required Excel Columns:**
- `orderNumber` (required) - Unique identifier for the order
- `customerName` (required) - Name of the customer

**Optional Excel Columns:**
- `customerPhone` - Customer phone number
- `customerEmail` - Customer email address
- `serviceType` - Type of service to be performed
- `address` - Service location address
- `estimatedDuration` - Duration in minutes (default: 60)
- `priority` - Priority level: low, medium, or high (default: medium)
- `notes` - Additional notes or instructions

**Steps to Upload Orders:**
1. Navigate to the "Upload" page from the top navigation menu
2. Under "Upload Orders", click "Choose File" or "Select File"
3. Select your Excel file (.xlsx, .xls, or .csv)
4. Click "Upload Orders" button
5. The system will validate the data and import all valid orders
6. You'll see a success message showing how many orders were imported

**Example Excel Format:**

| orderNumber | customerName | customerPhone | serviceType | estimatedDuration | priority |
|-------------|--------------|---------------|-------------|-------------------|----------|
| ORD-001 | John Smith | 555-1234 | Installation | 90 | high |
| ORD-002 | Jane Doe | 555-5678 | Repair | 60 | medium |

#### Uploading Installers

**Required Excel Columns:**
- `name` (required) - Name of the installer

**Optional Excel Columns:**
- `email` - Installer email address
- `phone` - Installer phone number
- `skills` - Comma-separated list of skills or specializations
- `isActive` - 1 for active, 0 for inactive (default: 1)

**Steps to Upload Installers:**
1. Navigate to the "Upload" page
2. Under "Upload Installers", click "Choose File" or "Select File"
3. Select your Excel file (.xlsx, .xls, or .csv)
4. Click "Upload Installers" button
5. The system will validate the data and import all valid installers
6. You'll see a success message showing how many installers were imported

**Example Excel Format:**

| name | email | phone | skills | isActive |
|------|-------|-------|--------|----------|
| Mike Johnson | mike@example.com | 555-1111 | Electrical, Plumbing | 1 |
| Sarah Williams | sarah@example.com | 555-2222 | HVAC, General | 1 |

### 2. Schedule Tasks

The Schedule page provides a visual calendar interface where you can assign orders to installers using drag-and-drop functionality.

#### Understanding the Interface

**View Modes:**
- **Daily View** - Shows one day with installers as columns and time slots as rows
- **Weekly View** - Shows seven days with dates as columns and time slots as rows

**Components:**
- **Unassigned Orders Panel** (left side) - Lists all pending orders that haven't been assigned
- **Calendar Grid** (right side) - Shows the schedule with time slots from 8:00 AM to 6:00 PM
- **Date Navigation** - Use the left/right arrows to navigate between days or weeks

#### Assigning Orders

**Steps to Assign an Order:**
1. Navigate to the "Schedule" page
2. Choose your view mode (Daily or Weekly)
3. Navigate to the desired date using the arrow buttons
4. In the "Unassigned Orders" panel, find the order you want to assign
5. Click and hold on the order card
6. Drag the order to the desired time slot for a specific installer
7. Release the mouse button to drop the order
8. The order will be automatically assigned and removed from the unassigned list

**Tips:**
- The system automatically calculates the end time based on the order's estimated duration
- Orders are color-coded for easy identification
- Hover over assigned orders to see details
- Each order card shows: order number, customer name, duration, and priority

#### Removing Assignments

**Steps to Remove an Assignment:**
1. In Daily View, hover over an assigned order in the calendar
2. Click the "×" button that appears in the top-right corner of the order card
3. The order will be removed from the schedule and returned to the unassigned list

### 3. Export Schedule

The Export feature allows you to download your schedule as an Excel file for distribution to installers or for record-keeping.

#### Exporting Schedules

**Steps to Export:**
1. Navigate to the "Schedule" page
2. Select your view mode (Daily or Weekly)
3. Navigate to the date range you want to export
4. Click the "Export" button in the top-right corner
5. An Excel file will be automatically downloaded to your computer

**Export File Contents:**

The exported Excel file includes the following columns:
- **Date** - The scheduled date
- **Start Time** - When the job starts
- **End Time** - When the job ends
- **Installer** - Name of the assigned installer
- **Order Number** - Unique order identifier
- **Customer** - Customer name
- **Service Type** - Type of service
- **Address** - Service location
- **Priority** - Order priority level
- **Status** - Current assignment status

**File Naming:**
- Daily export: `schedule-YYYY-MM-DD.xlsx`
- Weekly export: `schedule-week-YYYY-MM-DD.xlsx` (starting date of the week)

## Data Format Requirements

### Excel File Compatibility

The application supports the following file formats:
- `.xlsx` (Excel 2007 and later)
- `.xls` (Excel 97-2003)
- `.csv` (Comma-Separated Values)

### Column Name Flexibility

The system recognizes multiple column name formats:
- Case-insensitive (e.g., `orderNumber`, `OrderNumber`, `ordernumber` all work)
- Underscore format (e.g., `order_number`, `customer_name`)
- Mixed format (e.g., `customerName`, `customer_name`, `CustomerName`)

### Data Validation

**Orders:**
- Order number and customer name are mandatory
- Email addresses must be valid format
- Priority must be: low, medium, or high
- Estimated duration must be a number (in minutes)

**Installers:**
- Name is mandatory
- Email addresses must be valid format
- isActive must be 0 or 1

**Error Handling:**
- Invalid rows will be reported with the count of errors
- Valid rows will still be imported even if some rows have errors
- Detailed error messages help you identify and fix issues

## Best Practices

### Planning Your Workflow

1. **Start with Data Import**
   - Upload all installers first
   - Then upload all service orders
   - Verify the data in the Schedule page

2. **Organize Your Schedule**
   - Use Daily View for detailed day-to-day planning
   - Use Weekly View for overview and long-term planning
   - Consider installer skills when assigning orders

3. **Regular Exports**
   - Export schedules at the end of each planning session
   - Distribute schedules to installers via email or shared folders
   - Keep exported files for record-keeping and auditing

### Tips for Efficient Scheduling

- **Batch Similar Orders** - Group orders by location or service type
- **Consider Travel Time** - Leave gaps between appointments for travel
- **Respect Priorities** - Schedule high-priority orders first
- **Balance Workload** - Distribute orders evenly among installers
- **Plan Ahead** - Use Weekly View to plan the entire week at once

### Managing Changes

- **Rescheduling** - Remove the assignment and drag to a new time slot
- **Adding New Orders** - Upload additional orders anytime; they appear in the unassigned list
- **Installer Availability** - Upload installer data with isActive=0 to temporarily disable them

## Troubleshooting

### Common Issues

**Problem: File upload fails**
- Solution: Check that your file has the required columns (orderNumber and customerName for orders, name for installers)
- Solution: Ensure the file format is .xlsx, .xls, or .csv
- Solution: Verify that email addresses are in valid format

**Problem: Drag and drop doesn't work**
- Solution: Make sure you're clicking and holding on the order card
- Solution: Ensure you're dropping on a valid time slot in the calendar
- Solution: Try refreshing the page if the issue persists

**Problem: Orders not showing in unassigned list**
- Solution: Check if the order status is "pending" (only pending orders appear)
- Solution: Verify the order wasn't already assigned (check the calendar)
- Solution: Refresh the page to reload data

**Problem: Export file is empty**
- Solution: Ensure you have assigned orders for the selected date range
- Solution: Check that you're viewing the correct date in the calendar
- Solution: Try exporting a different date range

### Getting Help

If you encounter issues not covered in this guide:
1. Check that you're using a modern web browser (Chrome, Firefox, Safari, or Edge)
2. Clear your browser cache and refresh the page
3. Verify your internet connection is stable
4. Contact your system administrator for technical support

## Security and Privacy

- All data is stored securely in the database
- Access requires authentication
- Only authorized users can view and modify schedules
- Exported files should be handled according to your organization's data protection policies

## Updates and Maintenance

The application is regularly updated with new features and improvements. Check with your administrator for:
- Scheduled maintenance windows
- New feature announcements
- Training sessions for advanced features

---

**Version:** 1.0  
**Last Updated:** November 2025
