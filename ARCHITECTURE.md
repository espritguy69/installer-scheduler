# Service Installer Scheduler - Architecture Documentation

## Overview
This document provides a comprehensive view of the application architecture, data relationships, and component interactions.

---

## 1. Database Schema & Relationships

```mermaid
erDiagram
    users ||--o{ orders : "owns/manages"
    orders ||--o| assignments : "has"
    installers ||--o{ assignments : "assigned_to"
    
    users {
        int id PK
        varchar openId UK
        text name
        varchar email
        varchar loginMethod
        enum role
        timestamp createdAt
        timestamp updatedAt
        timestamp lastSignedIn
    }
    
    orders {
        int id PK
        varchar orderNumber "WO No. (optional)"
        varchar serviceNumber "Service No. (required, unique with orderNumber)"
        varchar customerName
        varchar customerPhone
        varchar address
        varchar buildingName
        varchar siName
        varchar appointmentDate "DD/MM/YYYY or YYYY-MM-DD"
        varchar appointmentTime "HH:MM (24-hour)"
        enum status "pending|assigned|in_progress|completed|rescheduled|cancelled"
        enum serviceType
        enum priority
        text notes
        varchar rescheduleReason
        timestamp rescheduledDate
        varchar rescheduledTime
        varchar docketPath
        timestamp createdAt
        timestamp updatedAt
    }
    
    installers {
        int id PK
        varchar name
        varchar phone
        varchar email
        enum status "active|inactive"
        text notes
        timestamp createdAt
        timestamp updatedAt
    }
    
    assignments {
        int id PK
        int orderId FK
        int installerId FK
        varchar scheduledDate "YYYY-MM-DD"
        varchar scheduledStartTime "HH:MM"
        varchar scheduledEndTime "HH:MM"
        enum status "scheduled|in_progress|completed|cancelled"
        text notes
        timestamp createdAt
        timestamp updatedAt
    }
```

**Key Relationships:**
- **One Order → Zero or One Assignment** (order can be unassigned)
- **One Installer → Many Assignments** (installer can have multiple jobs)
- **Unique Constraint**: `(serviceNumber, orderNumber)` prevents duplicates

---

## 2. Application Navigation & Page Flow

```mermaid
graph TB
    Home[Home Page]
    Upload[Upload Page]
    Orders[Orders Page]
    Schedule[Schedule Page]
    Dashboard[Dashboard Page]
    Performance[Performance Page]
    Notes[Notes Page]
    History[History Page]
    Settings[Settings Page]
    
    Home -->|Go to Upload| Upload
    Home -->|Go to Schedule| Schedule
    Home -->|View Schedule| Schedule
    Home -->|Open Installer Dashboard| Dashboard
    
    Upload -->|Import Success| Orders
    Upload -->|Preview Orders| Upload
    
    Orders -->|View All Orders| Orders
    Orders -->|Add Order| Orders
    Orders -->|Edit Order| Orders
    Orders -->|Delete Order| Orders
    Orders -->|Export Excel| Orders
    
    Schedule -->|Assign Orders| Schedule
    Schedule -->|Reschedule| Schedule
    Schedule -->|Change Status| Schedule
    Schedule -->|Bulk Assign| Schedule
    Schedule -->|Navigate Dates| Schedule
    
    style Home fill:#e3f2fd
    style Upload fill:#fff3e0
    style Orders fill:#f3e5f5
    style Schedule fill:#e8f5e9
```

---

## 3. Schedule Page - Component Architecture

```mermaid
graph TB
    SchedulePage[Schedule Page Component]
    
    subgraph "Data Layer"
        OrdersQuery[trpc.orders.list]
        InstallersQuery[trpc.installers.list]
        AssignmentsQuery[trpc.assignments.list]
    end
    
    subgraph "State Management"
        SelectedDate[Selected Date State]
        BulkMode[Bulk Assign Mode]
        SelectedOrders[Selected Orders Set]
        DialogStates[Dialog States]
    end
    
    subgraph "UI Components"
        DateNav[Date Navigation]
        UnassignedCol[Unassigned Column]
        InstallerCols[Installer Columns]
        OrderCards[Order Cards]
    end
    
    subgraph "Interactions"
        DragDrop[Drag & Drop Assignment]
        StatusChange[Status Change]
        RescheduleDialog[Reschedule Dialog]
        BulkAssign[Bulk Assignment]
    end
    
    SchedulePage --> OrdersQuery
    SchedulePage --> InstallersQuery
    SchedulePage --> AssignmentsQuery
    
    OrdersQuery --> SelectedDate
    SelectedDate --> DateNav
    
    OrdersQuery --> UnassignedCol
    OrdersQuery --> InstallerCols
    
    UnassignedCol --> OrderCards
    InstallerCols --> OrderCards
    
    OrderCards --> DragDrop
    OrderCards --> StatusChange
    OrderCards --> BulkMode
    
    DragDrop --> AssignmentsQuery
    StatusChange --> RescheduleDialog
    BulkMode --> BulkAssign
    
    style SchedulePage fill:#4caf50,color:#fff
    style OrdersQuery fill:#2196f3,color:#fff
    style InstallersQuery fill:#2196f3,color:#fff
    style AssignmentsQuery fill:#2196f3,color:#fff
```

---

## 4. Data Flow - Order Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant Upload
    participant Orders
    participant Schedule
    participant Database
    
    User->>Upload: Upload Excel File
    Upload->>Upload: Parse & Validate
    Upload->>Upload: Check Duplicates
    Upload->>Database: bulkCreateOrders / bulkUpsertOrders
    Database-->>Orders: New Orders Created
    
    User->>Schedule: Navigate to Date
    Schedule->>Database: Fetch Orders (filtered by date)
    Database-->>Schedule: Return Orders
    Schedule->>Schedule: Display in Unassigned Column
    
    User->>Schedule: Drag Order to Installer
    Schedule->>Database: createAssignment
    Database-->>Schedule: Assignment Created
    Schedule->>Database: Update Order Status → "assigned"
    
    User->>Schedule: Change Status → "rescheduled"
    Schedule->>Schedule: Show Reschedule Dialog
    User->>Schedule: Enter New Date/Time
    Schedule->>Database: Update Order (appointmentDate, rescheduledDate, etc.)
    Database-->>Schedule: Order Updated
    
    User->>Orders: View Orders Page
    Orders->>Database: Fetch All Orders + Assignments + Installers
    Database-->>Orders: Return Data
    Orders->>Orders: Display Table with Installer Names
```

---

## 5. Schedule Card - Detailed View

```mermaid
graph TB
    OrderCard[Order Card Component]
    
    subgraph "Card Header"
        ServiceNo[Service Number - Bold]
        WONo[WO Number - Gray Optional]
        Checkbox[Bulk Select Checkbox]
    end
    
    subgraph "Card Body"
        Customer[Customer Name]
        Time[Appointment Time]
        Building[Building Name]
        Status[Status Badge]
    end
    
    subgraph "Card Actions"
        StatusDropdown[Status Dropdown]
        HistoryBtn[History Button]
        DragHandle[Drag Handle]
    end
    
    subgraph "Card States"
        Unassigned[Gray - Unassigned]
        Assigned[Blue - Assigned]
        InProgress[Yellow - In Progress]
        Completed[Green - Completed]
        Rescheduled[Orange - Rescheduled]
        Cancelled[Red - Cancelled]
    end
    
    OrderCard --> ServiceNo
    OrderCard --> WONo
    OrderCard --> Checkbox
    OrderCard --> Customer
    OrderCard --> Time
    OrderCard --> Building
    OrderCard --> Status
    OrderCard --> StatusDropdown
    OrderCard --> HistoryBtn
    OrderCard --> DragHandle
    
    Status --> Unassigned
    Status --> Assigned
    Status --> InProgress
    Status --> Completed
    Status --> Rescheduled
    Status --> Cancelled
    
    style OrderCard fill:#fff,stroke:#333,stroke-width:2px
    style ServiceNo fill:#2196f3,color:#fff
    style Completed fill:#4caf50,color:#fff
    style Rescheduled fill:#ff9800,color:#fff
    style Cancelled fill:#f44336,color:#fff
```

---

## 6. tRPC API Routes

```mermaid
graph LR
    subgraph "Frontend (React)"
        OrdersPage[Orders Page]
        SchedulePage[Schedule Page]
        UploadPage[Upload Page]
    end
    
    subgraph "tRPC Client"
        OrdersAPI[trpc.orders.*]
        InstallersAPI[trpc.installers.*]
        AssignmentsAPI[trpc.assignments.*]
        AuthAPI[trpc.auth.*]
    end
    
    subgraph "Backend (Express + tRPC)"
        OrdersRouter[orders router]
        InstallersRouter[installers router]
        AssignmentsRouter[assignments router]
        AuthRouter[auth router]
    end
    
    subgraph "Database Layer"
        DBFunctions[db.ts functions]
        DrizzleORM[Drizzle ORM]
        MySQL[MySQL/TiDB]
    end
    
    OrdersPage --> OrdersAPI
    SchedulePage --> OrdersAPI
    SchedulePage --> InstallersAPI
    SchedulePage --> AssignmentsAPI
    UploadPage --> OrdersAPI
    
    OrdersAPI --> OrdersRouter
    InstallersAPI --> InstallersRouter
    AssignmentsAPI --> AssignmentsRouter
    AuthAPI --> AuthRouter
    
    OrdersRouter --> DBFunctions
    InstallersRouter --> DBFunctions
    AssignmentsRouter --> DBFunctions
    
    DBFunctions --> DrizzleORM
    DrizzleORM --> MySQL
    
    style OrdersAPI fill:#2196f3,color:#fff
    style InstallersAPI fill:#2196f3,color:#fff
    style AssignmentsAPI fill:#2196f3,color:#fff
    style MySQL fill:#ff9800,color:#fff
```

**Key API Endpoints:**

**orders.**
- `list` - Get all orders
- `create` - Create single order
- `bulkCreate` - Import multiple orders (with duplicate detection)
- `update` - Update order details
- `delete` - Delete order (also deletes assignments)
- `updateStatus` - Change order status

**installers.**
- `list` - Get all installers
- `create` - Add new installer
- `bulkCreate` - Import multiple installers
- `update` - Update installer details
- `delete` - Delete installer

**assignments.**
- `list` - Get all assignments
- `create` - Assign order to installer
- `update` - Update assignment details
- `delete` - Remove assignment
- `deleteByOrder` - Remove all assignments for an order

**auth.**
- `me` - Get current user
- `logout` - Sign out

---

## 7. Multi-User Collaboration Features

```mermaid
graph TB
    User1[User 1 Browser]
    User2[User 2 Browser]
    User3[User 3 Browser]
    
    subgraph "Auto-Refresh Triggers"
        TabSwitch[Tab Navigation]
        WindowFocus[Window Focus]
        PageMount[Page Mount]
    end
    
    subgraph "Shared Data Layer"
        OrdersCache[Orders Query Cache]
        AssignmentsCache[Assignments Query Cache]
        InstallersCache[Installers Query Cache]
    end
    
    subgraph "Backend"
        Database[(Database)]
    end
    
    User1 --> TabSwitch
    User2 --> WindowFocus
    User3 --> PageMount
    
    TabSwitch --> OrdersCache
    WindowFocus --> OrdersCache
    PageMount --> OrdersCache
    
    TabSwitch --> AssignmentsCache
    WindowFocus --> AssignmentsCache
    PageMount --> AssignmentsCache
    
    OrdersCache --> Database
    AssignmentsCache --> Database
    InstallersCache --> Database
    
    Database --> OrdersCache
    Database --> AssignmentsCache
    Database --> InstallersCache
    
    OrdersCache --> User1
    OrdersCache --> User2
    OrdersCache --> User3
    
    style Database fill:#ff9800,color:#fff
    style OrdersCache fill:#4caf50,color:#fff
    style AssignmentsCache fill:#4caf50,color:#fff
```

**Collaboration Features:**
- **Auto-refresh on tab switch** - Data refreshes when navigating between pages
- **Auto-refresh on window focus** - Data refreshes when returning to browser tab
- **Default today's filter** - Orders page shows only today's appointments by default
- **Real-time updates** - Multiple users see latest data when they interact with the app

---

## 8. File Upload & Processing Flow

```mermaid
graph TB
    ExcelFile[Excel/CSV File]
    FileInput[File Input]
    Parser[XLSX Parser]
    Validator[Data Validator]
    Preview[Preview Dialog]
    DuplicateCheck[Duplicate Detection]
    
    subgraph "Import Options"
        SkipDuplicates[Skip Duplicates]
        UpdateExisting[Update Existing]
    end
    
    BulkCreate[bulkCreateOrders]
    BulkUpsert[bulkUpsertOrders]
    Database[(Database)]
    Success[Import Success]
    
    ExcelFile --> FileInput
    FileInput --> Parser
    Parser --> Validator
    Validator --> Preview
    Preview --> DuplicateCheck
    
    DuplicateCheck -->|Duplicates Found| SkipDuplicates
    DuplicateCheck -->|Duplicates Found| UpdateExisting
    DuplicateCheck -->|No Duplicates| BulkCreate
    
    SkipDuplicates --> BulkCreate
    UpdateExisting --> BulkUpsert
    
    BulkCreate --> Database
    BulkUpsert --> Database
    
    Database --> Success
    
    style ExcelFile fill:#fff3e0
    style Preview fill:#e3f2fd
    style Database fill:#ff9800,color:#fff
    style Success fill:#4caf50,color:#fff
```

**Supported Formats:**
- **Standard Format**: orderNumber, customerName, customerPhone, serviceType, address, priority, notes
- **Work Order Format**: WO No., Service No., Customer Name, Contact No., WO Type, Sales/Modi Type, App Date, App Time, Building Name, SI Name

**Duplicate Detection Logic:**
- Checks `(serviceNumber, orderNumber)` combination
- Same Service No. + Same WO No. = Duplicate
- Same Service No. + Different WO No. = NOT Duplicate (allows multiple work orders per service)

---

## 9. Time & Date Format Handling

```mermaid
graph TB
    subgraph "Input Formats"
        DDMMYYYY[DD/MM/YYYY - 13/11/2025]
        MMDDYYYY[MM/DD/YYYY - 11/13/2025]
        ISO[YYYY-MM-DD - 2025-11-13]
        Text[Text - Nov 13, 2025]
    end
    
    subgraph "Parser"
        ParseFunction[parseAppointmentDate]
    end
    
    subgraph "Internal Format"
        DateObject[JavaScript Date Object]
    end
    
    subgraph "Storage Formats"
        DBFormat[Database: DD/MM/YYYY or YYYY-MM-DD]
    end
    
    subgraph "Display Formats"
        ShortDisplay[13/11/2025]
        MediumDisplay[Nov 13, 2025]
        LongDisplay[November 13, 2025]
    end
    
    subgraph "Time Handling"
        Time24[24-hour: 14:30]
        Time12[12-hour: 2:30 PM]
        TimeSlots[30-min intervals: 8:00 AM - 6:00 PM]
    end
    
    DDMMYYYY --> ParseFunction
    MMDDYYYY --> ParseFunction
    ISO --> ParseFunction
    Text --> ParseFunction
    
    ParseFunction --> DateObject
    DateObject --> DBFormat
    DateObject --> ShortDisplay
    DateObject --> MediumDisplay
    DateObject --> LongDisplay
    
    Time24 --> Time12
    TimeSlots --> Time24
    
    style ParseFunction fill:#2196f3,color:#fff
    style DateObject fill:#4caf50,color:#fff
    style TimeSlots fill:#ff9800,color:#fff
```

**Key Utilities:**
- `parseAppointmentDate()` - Handles all date formats
- `generateTimeSlots()` - Creates 30-minute intervals
- `formatTimeSlot()` - Converts 24h to 12h format
- `normalizeTimeFormat()` - Removes leading zeros

---

## 10. Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending: Order Created
    
    pending --> assigned: Installer Assigned
    pending --> cancelled: Order Cancelled
    pending --> rescheduled: Date/Time Changed
    
    assigned --> in_progress: Installer Started
    assigned --> rescheduled: Date/Time Changed
    assigned --> cancelled: Order Cancelled
    
    in_progress --> completed: Job Finished
    in_progress --> rescheduled: Date/Time Changed
    in_progress --> cancelled: Order Cancelled
    
    rescheduled --> pending: Unassigned
    rescheduled --> assigned: Reassigned
    rescheduled --> cancelled: Order Cancelled
    
    completed --> [*]
    cancelled --> [*]
    
    note right of rescheduled
        Reschedule Dialog:
        - New Date
        - New Time
        - Reason
    end note
```

**Status Colors:**
- **Pending** - Gray
- **Assigned** - Blue
- **In Progress** - Yellow
- **Completed** - Green
- **Rescheduled** - Orange
- **Cancelled** - Red

---

## Summary

This Service Installer Scheduler application is built with:

**Frontend:**
- React 19 + Tailwind CSS 4
- tRPC for type-safe API calls
- React DnD for drag-and-drop
- Wouter for routing

**Backend:**
- Express 4 + tRPC 11
- Drizzle ORM
- MySQL/TiDB database
- Manus OAuth authentication

**Key Features:**
- Excel/CSV import with duplicate detection
- Drag-and-drop assignment
- Multi-user collaboration with auto-refresh
- 30-minute time intervals
- Reschedule dialog
- Bulk operations
- Real-time status updates
- Mobile-responsive design

**Data Flow:**
1. Orders uploaded via Excel → Stored in database
2. Orders displayed in Schedule → Filtered by date
3. Drag order to installer → Creates assignment
4. Status changes → Triggers dialogs (reschedule, completion)
5. All changes → Auto-refresh for all users
