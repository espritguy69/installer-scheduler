# Current Database State

## Sample Data from Orders Table

Here's what the current orders look like in the database:

| Order Number | Service Number | Customer Name | Appointment Time | Building Name | Status |
|--------------|----------------|---------------|------------------|---------------|--------|
| A1775621 | NULL | AMIRUL IDDLAN BIN MD ZAINAL | NULL | NULL | pending |
| A1785662 | NULL | Nurul Affiq Afifie Bin Abdul Rahim | NULL | NULL | pending |
| M1786442 | NULL | Hee Wai Hong | NULL | NULL | pending |
| A1786084 | NULL | AMEERA BINTI KHAIRULIZAM | NULL | NULL | pending |
| WO-DEMO-001 | SVC-99999 | Demo Customer | 10:00 AM | Menara Demo Tower | pending |

---

## Why Row 2 is Missing in Order Cards

**Old Orders (22 orders):**
- ❌ `serviceNumber` = NULL
- ❌ `appointmentTime` = NULL  
- ❌ `buildingName` = NULL
- **Result:** Order cards only show Row 1 (Order Number, Customer Name) and Row 3 (Status, Duration)

**Demo Order (WO-DEMO-001):**
- ✅ `serviceNumber` = "SVC-99999"
- ✅ `appointmentTime` = "10:00 AM"
- ✅ `buildingName` = "Menara Demo Tower"
- **Result:** Order card shows all 3 rows including Service No., Time, and Building

---

## Visual Comparison

### Old Order Card (Missing Data)
```
┌─────────────────────────────────┐
│ A1775621 | AMIRUL IDDLAN...    │  ← Row 1: Order # | Customer
├─────────────────────────────────┤
│ Pending                     2h  │  ← Row 3: Status | Duration
└─────────────────────────────────┘
   ⚠️ Row 2 is hidden because serviceNumber, 
      appointmentTime, and buildingName are NULL
```

### New Order Card (Complete Data)
```
┌─────────────────────────────────┐
│ WO-DEMO-001 | Demo Customer    │  ← Row 1: Order # | Customer
├─────────────────────────────────┤
│ Service No: SVC-99999           │  ← Row 2 Line 1
│ Time: 10:00 AM                  │  ← Row 2 Line 2
│ Building: Menara Demo Tower     │  ← Row 2 Line 3
├─────────────────────────────────┤
│ Pending                     2h  │  ← Row 3: Status | Duration
└─────────────────────────────────┘
   ✅ Row 2 is visible because all fields are populated
```

---

## Solution: Re-upload Excel File

Your Excel file should have these columns:

```
WO No. | WO Type | Sales/Modi Type | Service No. | Customer Name | Contact No | App Date | App Time | Building Name | Status
```

When you upload this file:
1. System will read each row
2. Map Excel columns to database fields
3. Insert orders with ALL fields populated
4. Order cards will show complete Row 2 information

---

## Database Schema Fields

```
orders table (21 columns):
├── id (PRIMARY KEY)
├── orderNumber ← Excel: "WO No."
├── serviceNumber ← Excel: "Service No." ⭐ Row 2
├── customerName ← Excel: "Customer Name" ⭐ Row 1
├── customerPhone ← Excel: "Contact No"
├── customerEmail
├── serviceType ← Excel: "WO Type"
├── salesModiType ← Excel: "Sales/Modi Type"
├── address
├── appointmentDate ← Excel: "App Date"
├── appointmentTime ← Excel: "App Time" ⭐ Row 2
├── buildingName ← Excel: "Building Name" ⭐ Row 2
├── estimatedDuration
├── priority
├── status ← Excel: "Status" ⭐ Row 3
├── rescheduleReason
├── rescheduledDate
├── rescheduledTime
├── notes
├── createdAt
└── updatedAt
```

⭐ = Fields displayed in order cards

---

## Next Steps

1. **Go to Upload page** (`/upload`)
2. **Click "Choose File"** and select your Excel file
3. **Click "Upload Orders"**
4. **Check Schedule page** - All order cards will now show Row 2 with Service No., App Time, and Building Name
