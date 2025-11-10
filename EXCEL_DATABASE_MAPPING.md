# Excel to Database Column Mapping

This document shows how Excel columns are mapped to database fields when uploading orders.

---

## Complete Column Mapping Table

| Excel Column | Database Field | Data Type | Required | Notes |
|--------------|----------------|-----------|----------|-------|
| **WO No.** | `orderNumber` | varchar(100) | ✅ Yes | Work order number (e.g., A1775621, M1786442) |
| **WO Type** | `serviceType` | varchar(100) | ❌ No | Type of work order (e.g., Installation, Repair) |
| **Sales/Modi Type** | `salesModiType` | varchar(100) | ❌ No | Sales or modification type |
| **Service No.** | `serviceNumber` | varchar(100) | ❌ No | Service number (e.g., SVC-12345) - **Displays in order card Row 2** |
| **Customer Name** | `customerName` | varchar(255) | ✅ Yes | Customer full name - **Displays in order card Row 1** |
| **Contact No** | `customerPhone` | varchar(50) | ❌ No | Customer phone number |
| **App Date** | `appointmentDate` | varchar(50) | ❌ No | Appointment date (e.g., 2025-11-10) |
| **App Time** | `appointmentTime` | varchar(50) | ❌ No | Appointment time (e.g., 10:00 AM) - **Displays in order card Row 2** |
| **Building Name** | `buildingName` | varchar(255) | ❌ No | Building/location name - **Displays in order card Row 2** |
| **Status** | `status` | enum | ❌ No | Order status (defaults to 'pending') |

---

## Database Schema (orders table)

```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderNumber VARCHAR(100) NOT NULL,
  serviceNumber VARCHAR(100),
  customerName VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(50),
  customerEmail VARCHAR(320),
  serviceType VARCHAR(100),
  salesModiType VARCHAR(100),
  address TEXT,
  appointmentDate VARCHAR(50),
  appointmentTime VARCHAR(50),
  buildingName VARCHAR(255),
  estimatedDuration INT DEFAULT 60 NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium' NOT NULL,
  status ENUM('pending', 'assigned', 'on_the_way', 'met_customer', 'completed', 'rescheduled', 'withdrawn') DEFAULT 'pending' NOT NULL,
  rescheduleReason ENUM('customer_issue', 'building_issue', 'network_issue'),
  rescheduledDate TIMESTAMP,
  rescheduledTime VARCHAR(10),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
```

---

## Upload Process Flow

1. **Excel File Upload** → User uploads Excel file via Upload page
2. **Column Detection** → System reads first row as headers
3. **Data Mapping** → Each Excel column is mapped to corresponding database field
4. **Validation** → Required fields (WO No., Customer Name) are checked
5. **Database Insert** → Orders are inserted into the `orders` table
6. **Display** → Orders appear in Orders page and Schedule page

---

## Order Card Display Logic

The unassigned order cards on the Schedule page display fields conditionally:

### Row 1 (Always shown)
- **Order Number** (from `orderNumber`)
- **Customer Name** (from `customerName`)

### Row 2 (Shown only if fields exist)
- **Service No:** (from `serviceNumber`) - Only shows if not NULL
- **Time:** (from `appointmentTime`) - Only shows if not NULL
- **Building:** (from `buildingName`) - Only shows if not NULL

### Row 3 (Always shown)
- **Status** (from `status`)
- **Duration** (from `estimatedDuration`)

---

## Example Excel Format

```
WO No.      | WO Type      | Sales/Modi Type | Service No. | Customer Name | Contact No    | App Date   | App Time | Building Name      | Status
------------|--------------|-----------------|-------------|---------------|---------------|------------|----------|-------------------|--------
A1775621    | Installation | New             | SVC-10001   | John Doe      | 012-3456789   | 2025-11-10 | 10:00 AM | Menara ABC Tower  | pending
M1786442    | Repair       | Modification    | SVC-10002   | Jane Smith    | 013-9876543   | 2025-11-10 | 2:00 PM  | Plaza XYZ         | pending
```

---

## Important Notes

1. **Column Order** - Excel columns can be in any order; system matches by header name
2. **Case Sensitivity** - Column headers are case-insensitive (e.g., "WO No." = "wo no." = "WO NO.")
3. **Missing Columns** - If a column is missing, that field will be NULL in database
4. **Order Card Display** - Only orders with `serviceNumber`, `appointmentTime`, and `buildingName` populated will show Row 2 in order cards
5. **Re-upload** - To update existing orders with missing fields, re-upload the Excel file with all columns

---

## Upload Code Reference

The upload logic is located in:
- **Frontend:** `client/src/pages/Upload.tsx`
- **Backend:** `server/routers.ts` (orders.upload procedure)
- **Database:** `server/db.ts` (createOrder function)

The key mapping code in Upload.tsx:

```typescript
const newOrder = {
  orderNumber: row["WO No."] || "",
  serviceType: row["WO Type"] || "",
  salesModiType: row["Sales/Modi Type"] || "",
  serviceNumber: row["Service No."] || "",
  customerName: row["Customer Name"] || "",
  customerPhone: row["Contact No"] || "",
  appointmentDate: row["App Date"] || "",
  appointmentTime: row["App Time"] || "",
  buildingName: row["Building Name"] || "",
  status: "pending",
  priority: "medium",
  estimatedDuration: 120,
};
```

---

## Troubleshooting

**Q: Why aren't Service No., App Time, and Building Name showing in order cards?**  
A: These fields are NULL in the database. Re-upload your Excel file to populate them.

**Q: Can I add custom columns to Excel?**  
A: Yes, but they won't be imported unless you modify the upload code to map them.

**Q: What happens if required fields are missing?**  
A: Upload will fail with an error message indicating which fields are required.

**Q: Can I update existing orders?**  
A: Currently, upload creates new orders. To update, delete old orders first or use the Orders page to edit individually.
