# Excel File Verification Checklist
## Service Installer Scheduler - Data Upload Troubleshooting Guide

**Author**: Manus AI  
**Date**: November 11, 2025  
**Purpose**: Diagnose and fix Excel file structure issues preventing successful order uploads

---

## Overview

This checklist helps you verify that your Excel file is properly structured for upload to the Service Installer Scheduler. The system expects specific data types and formats, particularly for the **App Date** column and **sheet names**. Follow each section carefully to identify and resolve common issues.

---

## Section 1: Sheet Name Verification

The system reads **all sheets** in your workbook and uses sheet names as a fallback when the App Date column is missing or contains invalid data.

### Expected Sheet Name Format

Sheet names should follow the pattern: **`D NOV`** or **`DD NOV`** where:
- **D** or **DD** = Day of the month (1-31)
- **NOV** = Three-letter month abbreviation (JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC)

### Verification Steps

| Step | Action | Expected Result | Issue if Failed |
|------|--------|----------------|-----------------|
| 1 | Open your Excel file | File opens successfully | File may be corrupted |
| 2 | Look at the sheet tabs at the bottom | See multiple sheets with date-based names | Only one sheet exists |
| 3 | Check first sheet name | Should match pattern like "1 NOV" or "11 NOV" | Sheet named "Sheet1" or other generic name |
| 4 | Count total sheets | Should see 10+ sheets for multi-day schedules | Only 1-2 sheets present |
| 5 | Verify month abbreviation | All sheets use uppercase 3-letter month (NOV, DEC, etc.) | Month spelled out fully or lowercase |

### Common Sheet Name Issues

**❌ Incorrect Formats:**
- `November 11` (month spelled out)
- `11-Nov` (hyphen separator)
- `11nov` (lowercase month)
- `Sheet1`, `Sheet2` (generic names)

**✅ Correct Formats:**
- `11 NOV`
- `1 NOV`
- `3 NOV`

---

## Section 2: App Date Column Verification

The **App Date** column contains the appointment date for each service order. Excel stores dates as serial numbers internally, which must be properly formatted.

### Expected Data Type

The App Date column should contain:
- **Excel Date Serial Numbers** (e.g., 45962, 45974) that Excel displays as formatted dates
- **OR** text strings in format **"MMM DD, YYYY"** (e.g., "Nov 11, 2025")

### Verification Steps

| Step | Action | How to Check | What to Look For |
|------|--------|--------------|------------------|
| 1 | Click on the **App Date** column header | Column highlights | Column exists and is labeled correctly |
| 2 | Right-click any cell in App Date column | Context menu appears | - |
| 3 | Select **Format Cells** | Dialog box opens | - |
| 4 | Check the **Category** | Look at left panel | Should be "Date" or "Number" (not "Text") |
| 5 | If Category is "Number", check the value | Look at the cell value | Should be a 5-digit number like 45962 |
| 6 | If Category is "Date", check the format | Look at "Type" list | Should show date format like "MM/DD/YYYY" |

### Testing the Serial Number

To verify the serial number is correct:

1. **Select any cell** in the App Date column
2. **Change format to Number** (Format Cells → Number → 0 decimal places)
3. **Check the value**:
   - Nov 1, 2025 should show **45962**
   - Nov 11, 2025 should show **45972**
   - Nov 30, 2025 should show **45991**

4. **Calculate expected value** using this formula:
   ```
   Expected Serial = (Year - 1900) × 365 + Days for leap years + Day of year
   ```

### Common App Date Issues

| Issue | Symptom | How to Detect | How to Fix |
|-------|---------|---------------|------------|
| **Stored as Text** | Dates look correct but don't sort properly | Format Cells shows "Text" category | Select column → Data → Text to Columns → Finish |
| **Wrong Serial Number** | Dates off by 2-4 days | Serial number doesn't match expected value | Re-enter dates or use Excel DATE() function |
| **Empty Column** | No dates visible | All cells blank | System will use sheet name as fallback |
| **Mixed Formats** | Some dates work, others don't | Some cells are numbers, others are text | Standardize all cells to same format |
| **Formula Errors** | Shows #VALUE! or #REF! | Error codes visible | Fix or remove formulas, paste values only |

---

## Section 3: App Time Column Verification

The **App Time** column contains the appointment time for each service order.

### Expected Data Type

The App Time column should contain:
- **Excel Time Decimal** (e.g., 0.4166 for 10:00 AM, 0.375 for 9:00 AM)
- **OR** text strings in format **"HH:MM AM/PM"** (e.g., "10:00 AM")

### Verification Steps

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Click any cell in **App Time** column | Cell selected |
| 2 | Format Cells → Check Category | Should be "Time" or "Number" |
| 3 | If "Number", check decimal value | 0.4166 = 10:00 AM, 0.375 = 9:00 AM |
| 4 | If "Time", check display format | Should show "h:MM AM/PM" |

### Time Decimal Reference Table

| Time | Excel Decimal | Calculation |
|------|---------------|-------------|
| 09:00 AM | 0.375 | 9/24 = 0.375 |
| 10:00 AM | 0.4166 | 10/24 ≈ 0.4167 |
| 11:00 AM | 0.4583 | 11/24 ≈ 0.4583 |
| 11:30 AM | 0.4791 | 11.5/24 ≈ 0.4792 |
| 01:00 PM | 0.5416 | 13/24 ≈ 0.5417 |
| 02:30 PM | 0.6041 | 14.5/24 ≈ 0.6042 |
| 03:00 PM | 0.625 | 15/24 = 0.625 |
| 04:00 PM | 0.6666 | 16/24 ≈ 0.6667 |
| 06:00 PM | 0.75 | 18/24 = 0.75 |

---

## Section 4: Required Columns Checklist

Verify all required columns exist and contain valid data.

### Standard Format Columns

| Column Name | Required | Data Type | Example Value |
|-------------|----------|-----------|---------------|
| WO No. | ✅ Yes | Text | "WO-2025-001" |
| Service No. | ⚠️ Recommended | Text | "SVC-12345" |
| Customer Name | ✅ Yes | Text | "John Smith" |
| Contact No | ⚠️ Recommended | Text or Number | "91234567" |
| App Date | ✅ Yes | Date/Number | 45972 or "Nov 11, 2025" |
| App Time | ✅ Yes | Time/Number | 0.4166 or "10:00 AM" |
| Building Name | ⚠️ Recommended | Text | "Block 123" |
| WO Type | ❌ Optional | Text | "Installation" |
| Sales/Modi Type | ❌ Optional | Text | "New" |

### Assurance Format Columns

| Column Name | Required | Data Type | Example Value |
|-------------|----------|-----------|---------------|
| AWO NO. | ✅ Yes | Text | "AWO-2025-001" |
| Ticket Number | ⚠️ Recommended | Text | "TKT-12345" |
| TBBN NO. | ⚠️ Recommended | Text | "TBBN-67890" |
| Name | ✅ Yes | Text | "Jane Doe" |
| Contact No | ⚠️ Recommended | Text or Number | "98765432" |
| Appointment Date | ✅ Yes | Text | "Nov 11, 2025 1:00 PM" |
| Building | ⚠️ Recommended | Text | "Tower A" |
| Remarks | ❌ Optional | Text | "Customer prefers morning" |

---

## Section 5: Common Upload Failures

### Issue 1: "No valid order data found in the file"

**Cause**: All rows are empty or missing required fields.

**Solution**:
1. Verify at least one row has both **WO No.** (or **AWO NO.**) and **Customer Name** (or **Name**)
2. Check that data starts from Row 2 (Row 1 should be headers)
3. Remove completely empty rows

### Issue 2: "Failed to upload orders. Please check the file format."

**Cause**: JavaScript error during parsing or validation.

**Solution**:
1. Open browser console (F12) before uploading
2. Look for error messages in red
3. Check for:
   - Formula errors (#VALUE!, #REF!)
   - Merged cells in data area
   - Special characters in column headers

### Issue 3: Orders upload successfully but don't appear in Schedule

**Cause**: Date/time parsing failed or dates are in the future/past.

**Solution**:
1. Verify App Date values are in November 2025
2. Check that dates match the sheet names
3. Use the Schedule page date navigation to find your orders
4. Check browser console for date parsing warnings

---

## Section 6: Step-by-Step Upload Test

Follow these steps to test your Excel file:

### Pre-Upload Checklist

- [ ] File has multiple sheets with date-based names (e.g., "1 NOV", "11 NOV")
- [ ] Each sheet contains order data with all required columns
- [ ] App Date column is formatted as Date or Number (not Text)
- [ ] App Time column is formatted as Time or Number (not Text)
- [ ] At least one order has WO No. and Customer Name filled
- [ ] No formula errors visible (#VALUE!, #REF!, #DIV/0!)
- [ ] File saved as .xlsx or .xls format

### Upload Process

1. **Open the Service Installer Scheduler** in your browser
2. **Open Browser Console** (Press F12, click "Console" tab)
3. **Navigate to Upload page** (click "Upload" in navigation)
4. **Click "Choose File"** and select your Excel file
5. **Click "Upload Orders"** button
6. **Watch the console output** for debug messages

### Expected Console Output

You should see messages like:
```
Detected format: Standard
First row data: {WO No.: "...", App Date: 45962, ...}
Raw data length: 15
=== UPLOAD DEBUG ===
First mapped order: {...}
Total mapped orders: 15
Sample dates from first 3 orders:
  Order 1: date="Nov 1, 2025" time="10:00 AM"
  Order 2: date="Nov 3, 2025" time="09:00 AM"
  Order 3: date="Nov 4, 2025" time="11:00 AM"
```

### What to Look For

| Console Message | Meaning | Action if Missing |
|-----------------|---------|-------------------|
| `Detected format: Standard` or `Assurance` | File format recognized | Check column headers match expected names |
| `Raw data length: X` | X sheets/rows found | Verify file has data in multiple sheets |
| `Total mapped orders: X` | X orders extracted | Should match number of rows across all sheets |
| `date="Nov X, 2025"` | Dates parsed correctly | Check App Date column format |
| `time="HH:MM AM/PM"` | Times parsed correctly | Check App Time column format |
| `Successfully imported X orders` | Upload succeeded | Orders should appear in Orders page |

---

## Section 7: Quick Fixes

### Fix 1: Convert Text Dates to Excel Dates

If your dates are stored as text:

1. Insert a new column next to App Date
2. Use formula: `=DATEVALUE(A2)` (assuming A2 has the text date)
3. Copy the formula down for all rows
4. Copy the new column → Paste Special → Values
5. Delete the old App Date column
6. Rename the new column to "App Date"

### Fix 2: Standardize Time Format

If times are inconsistent:

1. Select the entire App Time column
2. Format Cells → Time → Select "1:30 PM" format
3. Click OK
4. Verify all times display correctly

### Fix 3: Remove Formula Errors

If you see #VALUE! or #REF! errors:

1. Find all cells with errors (Ctrl+F, search for "#")
2. Either fix the formula or delete it
3. For dates/times, replace formulas with static values (Copy → Paste Special → Values)

---

## Section 8: Validation Script

Use this Excel formula to validate your data before upload:

### Create a Validation Column

Add a new column called "Validation" and use this formula:

```excel
=IF(AND(
  NOT(ISBLANK(A2)),  // WO No. not empty
  NOT(ISBLANK(B2)),  // Customer Name not empty
  ISNUMBER(C2),      // App Date is a number
  ISNUMBER(D2)       // App Time is a number
), "✓ VALID", "✗ CHECK")
```

Adjust column letters (A, B, C, D) to match your actual column positions.

### Expected Result

- **✓ VALID**: Row is ready for upload
- **✗ CHECK**: Row has missing or invalid data

---

## Section 9: Contact Support

If you've completed this checklist and still experience issues:

1. **Take a screenshot** of your Excel file showing:
   - Sheet tabs at the bottom
   - Column headers (Row 1)
   - First 3 data rows (Rows 2-4)
   - Format Cells dialog for App Date column

2. **Copy the browser console output** from the upload attempt

3. **Note which step failed** from this checklist

4. **Share this information** for further troubleshooting

---

## Appendix: Excel Serial Number Calculator

To manually calculate the Excel serial number for any date:

```
Serial Number = Days since December 30, 1899
```

**Example for Nov 11, 2025:**
- Days from Dec 30, 1899 to Nov 11, 2025 = 45,972 days
- Excel Serial Number = **45972**

**Quick Reference:**
- Jan 1, 2025 = 45658
- Nov 1, 2025 = 45962
- Nov 11, 2025 = 45972
- Dec 31, 2025 = 46022

---

**End of Checklist**

*This document is part of the Service Installer Scheduler system. For technical support, refer to the system documentation or contact your administrator.*
