# API Documentation

This document provides comprehensive documentation for the Service Installer Scheduler API. The API is built using [tRPC](https://trpc.io/), which provides end-to-end type safety between the client and server.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Order Management](#order-management)
- [Assignment & Scheduling](#assignment--scheduling)
- [Installer Management](#installer-management)
- [Time Slot Management](#time-slot-management)
- [Notes Management](#notes-management)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Overview

### Base URL

All API requests are made to `/api/trpc` with the procedure name appended.

### Request Format

tRPC uses a special request format. When using the tRPC client, requests are automatically formatted. Direct HTTP requests should follow this pattern:

```
POST /api/trpc/[router].[procedure]
Content-Type: application/json

{
  "input": { /* procedure input */ }
}
```

### Response Format

```json
{
  "result": {
    "data": { /* procedure output */ }
  }
}
```

## Authentication

All API endpoints (except `auth.me` and `auth.logout`) require authentication via session cookies.

### Get Current User

Get the currently authenticated user's information.

**Endpoint:** `auth.me`

**Type:** Query

**Authentication:** Not required (returns null if not authenticated)

**Response:**

```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  lastSignedIn: Date;
}
```

**Example:**

```typescript
const user = await trpc.auth.me.useQuery();
```

### Logout

End the current user session.

**Endpoint:** `auth.logout`

**Type:** Mutation

**Authentication:** Not required

**Response:**

```typescript
{
  success: true
}
```

**Example:**

```typescript
const logout = trpc.auth.logout.useMutation();
await logout.mutateAsync();
```

---

## Order Management

### List All Orders

Retrieve all service orders in the system.

**Endpoint:** `orders.list`

**Type:** Query

**Authentication:** Required

**Response:** Array of Order objects

```typescript
{
  id: number;
  orderNumber: string;
  ticketNumber: string | null;
  serviceNumber: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string | null;
  salesModiType: string | null;
  address: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  buildingName: string | null;
  estimatedDuration: number;
  priority: "low" | "medium" | "high";
  status: "pending" | "assigned" | "on_the_way" | "met_customer" | "completed" | "docket_received" | "docket_uploaded" | "rescheduled" | "withdrawn";
  rescheduleReason: "customer_issue" | "building_issue" | "network_issue" | null;
  rescheduledDate: Date | null;
  rescheduledTime: string | null;
  notes: string | null;
  docketFileUrl: string | null;
  docketFileName: string | null;
  createdAt: Date;
  updatedAt: Date;
}[]
```

**Example:**

```typescript
const { data: orders } = trpc.orders.list.useQuery();
```

### Get Order by ID

Retrieve a specific order by its ID.

**Endpoint:** `orders.getById`

**Type:** Query

**Authentication:** Required

**Input:**

```typescript
{
  id: number;
}
```

**Response:** Order object (same structure as list)

**Example:**

```typescript
const { data: order } = trpc.orders.getById.useQuery({ id: 123 });
```

### Get Order History

Retrieve the change history for a specific order.

**Endpoint:** `orders.getHistory`

**Type:** Query

**Authentication:** Required

**Input:**

```typescript
{
  orderId: number;
}
```

**Response:**

```typescript
{
  id: number;
  orderId: number;
  action: string;
  userId: number | null;
  userName: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
}[]
```

**Example:**

```typescript
const { data: history } = trpc.orders.getHistory.useQuery({ orderId: 123 });
```

### Create Order

Create a new service order.

**Endpoint:** `orders.create`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  orderNumber: string;                    // Required
  ticketNumber?: string;
  serviceNumber?: string;
  customerName: string;                   // Required
  customerPhone?: string;
  customerEmail?: string;
  serviceType?: string;
  salesModiType?: string;
  address?: string;
  appointmentDate?: string;               // Format: YYYY-MM-DD
  appointmentTime?: string;               // Format: "9:00 AM"
  buildingName?: string;
  estimatedDuration?: number;             // Default: 60 (minutes)
  priority?: "low" | "medium" | "high";   // Default: "medium"
  notes?: string;
}
```

**Response:**

```typescript
{
  insertId: number;
}
```

**Example:**

```typescript
const createOrder = trpc.orders.create.useMutation();

await createOrder.mutateAsync({
  orderNumber: "AWO437076",
  ticketNumber: "TTKT202511108600382",
  serviceNumber: "TBBN560139G",
  customerName: "John Doe",
  customerPhone: "0123456789",
  appointmentDate: "2025-11-15",
  appointmentTime: "10:00 AM",
  buildingName: "Tower A",
  priority: "high"
});
```

### Update Order

Update an existing order's information.

**Endpoint:** `orders.update`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  id: number;                             // Required
  orderNumber?: string;
  ticketNumber?: string;
  serviceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceType?: string;
  salesModiType?: string;
  address?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  buildingName?: string;
  estimatedDuration?: number;
  priority?: "low" | "medium" | "high";
  status?: "pending" | "assigned" | "on_the_way" | "met_customer" | "completed" | "docket_received" | "docket_uploaded" | "rescheduled" | "withdrawn";
  rescheduleReason?: "customer_issue" | "building_issue" | "network_issue";
  rescheduledDate?: Date;
  rescheduledTime?: string;
  notes?: string;
  docketFileUrl?: string;
  docketFileName?: string;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const updateOrder = trpc.orders.update.useMutation();

await updateOrder.mutateAsync({
  id: 123,
  status: "completed",
  notes: "Installation completed successfully"
});
```

### Delete Order

Delete an order from the system.

**Endpoint:** `orders.delete`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  id: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const deleteOrder = trpc.orders.delete.useMutation();
await deleteOrder.mutateAsync({ id: 123 });
```

### Bulk Create Orders

Create multiple orders at once (useful for Excel/CSV imports).

**Endpoint:** `orders.bulkCreate`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  orders: Array<{
    orderNumber: string;
    ticketNumber?: string;
    serviceNumber?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    serviceType?: string;
    salesModiType?: string;
    address?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    buildingName?: string;
    estimatedDuration?: number;
    priority?: "low" | "medium" | "high";
    notes?: string;
  }>;
}
```

**Response:**

```typescript
{
  success: true;
  count: number;
}
```

**Example:**

```typescript
const bulkCreate = trpc.orders.bulkCreate.useMutation();

await bulkCreate.mutateAsync({
  orders: [
    {
      orderNumber: "AWO437076",
      customerName: "John Doe",
      appointmentDate: "2025-11-15",
      appointmentTime: "9:00 AM"
    },
    {
      orderNumber: "AWO437077",
      customerName: "Jane Smith",
      appointmentDate: "2025-11-15",
      appointmentTime: "10:00 AM"
    }
  ]
});
```

---

## Assignment & Scheduling

### List All Assignments

Retrieve all installer-order assignments.

**Endpoint:** `assignments.list`

**Type:** Query

**Authentication:** Required

**Response:**

```typescript
{
  id: number;
  orderId: number;
  installerId: number;
  assignedAt: Date;
  assignedBy: number | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  // Joined data
  order: Order;
  installer: Installer;
}[]
```

**Example:**

```typescript
const { data: assignments } = trpc.assignments.list.useQuery();
```

### Get Assignments by Date

Retrieve assignments for a specific date.

**Endpoint:** `assignments.getByDate`

**Type:** Query

**Authentication:** Required

**Input:**

```typescript
{
  date: string;  // Format: YYYY-MM-DD
}
```

**Response:** Array of Assignment objects

**Example:**

```typescript
const { data: assignments } = trpc.assignments.getByDate.useQuery({
  date: "2025-11-15"
});
```

### Get Assignments by Installer

Retrieve all assignments for a specific installer.

**Endpoint:** `assignments.getByInstaller`

**Type:** Query

**Authentication:** Required

**Input:**

```typescript
{
  installerId: number;
}
```

**Response:** Array of Assignment objects

**Example:**

```typescript
const { data: assignments } = trpc.assignments.getByInstaller.useQuery({
  installerId: 5
});
```

### Assign Order to Installer

Assign an order to an installer.

**Endpoint:** `assignments.assign`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  orderId: number;
  installerId: number;
  notes?: string;
}
```

**Response:**

```typescript
{
  success: true;
  assignmentId: number;
}
```

**Side Effects:**
- Order status automatically updated to "assigned"
- Notification sent to owner about the assignment

**Example:**

```typescript
const assignOrder = trpc.assignments.assign.useMutation();

await assignOrder.mutateAsync({
  orderId: 123,
  installerId: 5,
  notes: "Preferred installer for this location"
});
```

### Unassign Order

Remove an installer assignment from an order.

**Endpoint:** `assignments.unassign`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  orderId: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Side Effects:**
- Order status reverted to "pending"
- Assignment record deleted

**Example:**

```typescript
const unassignOrder = trpc.assignments.unassign.useMutation();
await unassignOrder.mutateAsync({ orderId: 123 });
```

### Reassign Order

Change the installer assigned to an order.

**Endpoint:** `assignments.reassign`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  orderId: number;
  newInstallerId: number;
  notes?: string;
}
```

**Response:**

```typescript
{
  success: true;
  assignmentId: number;
}
```

**Side Effects:**
- Previous assignment deleted
- New assignment created
- Order history updated

**Example:**

```typescript
const reassignOrder = trpc.assignments.reassign.useMutation();

await reassignOrder.mutateAsync({
  orderId: 123,
  newInstallerId: 7,
  notes: "Reassigned due to schedule conflict"
});
```

### Bulk Assign Orders

Assign multiple orders to installers at once.

**Endpoint:** `assignments.bulkAssign`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  assignments: Array<{
    orderId: number;
    installerId: number;
    notes?: string;
  }>;
}
```

**Response:**

```typescript
{
  success: true;
  count: number;
}
```

**Example:**

```typescript
const bulkAssign = trpc.assignments.bulkAssign.useMutation();

await bulkAssign.mutateAsync({
  assignments: [
    { orderId: 123, installerId: 5 },
    { orderId: 124, installerId: 5 },
    { orderId: 125, installerId: 7 }
  ]
});
```

---

## Installer Management

### List All Installers

Retrieve all installer profiles.

**Endpoint:** `installers.list`

**Type:** Query

**Authentication:** Required

**Response:**

```typescript
{
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  isActive: number;  // 1 = active, 0 = inactive
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
}[]
```

**Example:**

```typescript
const { data: installers } = trpc.installers.list.useQuery();
```

### Get Installer by ID

Retrieve a specific installer's information.

**Endpoint:** `installers.getById`

**Type:** Query

**Authentication:** Required

**Input:**

```typescript
{
  id: number;
}
```

**Response:** Installer object

**Example:**

```typescript
const { data: installer } = trpc.installers.getById.useQuery({ id: 5 });
```

### Create Installer

Add a new installer to the system.

**Endpoint:** `installers.create`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  name: string;         // Required
  email?: string;
  phone?: string;
  skills?: string;
  isActive?: number;    // Default: 1
}
```

**Response:**

```typescript
{
  insertId: number;
}
```

**Example:**

```typescript
const createInstaller = trpc.installers.create.useMutation();

await createInstaller.mutateAsync({
  name: "John Installer",
  email: "john@example.com",
  phone: "0123456789",
  skills: "Fiber optic, Router configuration"
});
```

### Update Installer

Update an installer's information.

**Endpoint:** `installers.update`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  id: number;           // Required
  name?: string;
  email?: string;
  phone?: string;
  skills?: string;
  isActive?: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const updateInstaller = trpc.installers.update.useMutation();

await updateInstaller.mutateAsync({
  id: 5,
  phone: "0198765432",
  skills: "Fiber optic, Router configuration, Troubleshooting"
});
```

### Delete Installer

Remove an installer from the system.

**Endpoint:** `installers.delete`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  id: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const deleteInstaller = trpc.installers.delete.useMutation();
await deleteInstaller.mutateAsync({ id: 5 });
```

### Link User to Installer

Associate a user account with an installer profile.

**Endpoint:** `installers.linkUser`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  installerId: number;
  userId: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const linkUser = trpc.installers.linkUser.useMutation();

await linkUser.mutateAsync({
  installerId: 5,
  userId: 42
});
```

### Unlink User from Installer

Remove the user account association from an installer profile.

**Endpoint:** `installers.unlinkUser`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  installerId: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const unlinkUser = trpc.installers.unlinkUser.useMutation();
await unlinkUser.mutateAsync({ installerId: 5 });
```

---

## Time Slot Management

### List All Time Slots

Retrieve all configured time slots.

**Endpoint:** `timeSlots.list`

**Type:** Query

**Authentication:** Required

**Response:**

```typescript
{
  id: number;
  time: string;         // e.g., "9:00 AM"
  sortOrder: number;
  isActive: number;     // 1 = active, 0 = inactive
  createdAt: Date;
  updatedAt: Date;
}[]
```

**Example:**

```typescript
const { data: timeSlots } = trpc.timeSlots.list.useQuery();
```

### Create Time Slot

Add a new time slot.

**Endpoint:** `timeSlots.create`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  time: string;         // Required, e.g., "9:00 AM"
  sortOrder: number;    // Required
  isActive: number;     // Default: 1
}
```

**Response:**

```typescript
{
  insertId: number;
}
```

**Example:**

```typescript
const createTimeSlot = trpc.timeSlots.create.useMutation();

await createTimeSlot.mutateAsync({
  time: "8:00 AM",
  sortOrder: 0,
  isActive: 1
});
```

### Update Time Slot

Modify a time slot's properties.

**Endpoint:** `timeSlots.update`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  id: number;           // Required
  time?: string;
  sortOrder?: number;
  isActive?: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const updateTimeSlot = trpc.timeSlots.update.useMutation();

await updateTimeSlot.mutateAsync({
  id: 3,
  isActive: 0  // Disable time slot
});
```

### Delete Time Slot

Remove a time slot from the system.

**Endpoint:** `timeSlots.delete`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  id: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const deleteTimeSlot = trpc.timeSlots.delete.useMutation();
await deleteTimeSlot.mutateAsync({ id: 3 });
```

### Reorder Time Slots

Update the sort order of multiple time slots at once.

**Endpoint:** `timeSlots.reorder`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:**

```typescript
{
  timeSlotIds: number[];  // Array of time slot IDs in desired order
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const reorderTimeSlots = trpc.timeSlots.reorder.useMutation();

// Reorder time slots: IDs 1, 3, 2, 4
await reorderTimeSlots.mutateAsync({
  timeSlotIds: [1, 3, 2, 4]
});
```

### Seed Default Time Slots

Create default time slots if none exist.

**Endpoint:** `timeSlots.seedDefaults`

**Type:** Mutation

**Authentication:** Required (Admin only)

**Input:** None

**Response:**

```typescript
{
  success: true;
  count: number;
}
```

**Example:**

```typescript
const seedDefaults = trpc.timeSlots.seedDefaults.useMutation();
await seedDefaults.mutateAsync();
```

---

## Notes Management

### List All Notes

Retrieve all notes across all orders.

**Endpoint:** `notes.list`

**Type:** Query

**Authentication:** Required

**Response:**

```typescript
{
  id: number;
  orderId: number;
  userId: number | null;
  userName: string | null;
  content: string;
  createdAt: Date;
}[]
```

**Example:**

```typescript
const { data: notes } = trpc.notes.list.useQuery();
```

### Get Notes by Order

Retrieve all notes for a specific order.

**Endpoint:** `notes.getByOrder`

**Type:** Query

**Authentication:** Required

**Input:**

```typescript
{
  orderId: number;
}
```

**Response:** Array of Note objects

**Example:**

```typescript
const { data: notes } = trpc.notes.getByOrder.useQuery({ orderId: 123 });
```

### Create Note

Add a note to an order.

**Endpoint:** `notes.create`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  orderId: number;      // Required
  content: string;      // Required
}
```

**Response:**

```typescript
{
  insertId: number;
}
```

**Example:**

```typescript
const createNote = trpc.notes.create.useMutation();

await createNote.mutateAsync({
  orderId: 123,
  content: "Customer requested morning appointment"
});
```

### Delete Note

Remove a note from an order.

**Endpoint:** `notes.delete`

**Type:** Mutation

**Authentication:** Required

**Input:**

```typescript
{
  id: number;
}
```

**Response:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const deleteNote = trpc.notes.delete.useMutation();
await deleteNote.mutateAsync({ id: 456 });
```

---

## Error Handling

### Error Response Format

When an error occurs, tRPC returns an error object:

```typescript
{
  error: {
    message: string;
    code: string;
    data: {
      code: string;
      httpStatus: number;
      path: string;
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks required permissions
- `BAD_REQUEST` - Invalid input data
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

### Error Handling Example

```typescript
const updateOrder = trpc.orders.update.useMutation({
  onError: (error) => {
    if (error.data?.code === 'UNAUTHORIZED') {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.data?.code === 'BAD_REQUEST') {
      // Show validation error
      toast.error(error.message);
    } else {
      // Generic error
      toast.error('An unexpected error occurred');
    }
  }
});
```

---

## Type Definitions

### Order Status Values

```typescript
type OrderStatus = 
  | "pending"           // Order created, not assigned
  | "assigned"          // Assigned to installer
  | "on_the_way"        // Installer en route
  | "met_customer"      // Installer arrived
  | "completed"         // Work completed
  | "docket_received"   // Paperwork received
  | "docket_uploaded"   // Paperwork uploaded
  | "rescheduled"       // Appointment rescheduled
  | "withdrawn";        // Order cancelled
```

### Priority Levels

```typescript
type Priority = "low" | "medium" | "high";
```

### Reschedule Reasons

```typescript
type RescheduleReason = 
  | "customer_issue"    // Customer unavailable
  | "building_issue"    // Building access problem
  | "network_issue";    // Technical/network problem
```

### User Roles

```typescript
type UserRole = "user" | "admin";
```

---

## Usage Examples

### Complete Order Workflow

```typescript
// 1. Create an order
const createOrder = trpc.orders.create.useMutation();
const newOrder = await createOrder.mutateAsync({
  orderNumber: "AWO437076",
  customerName: "John Doe",
  appointmentDate: "2025-11-15",
  appointmentTime: "10:00 AM"
});

// 2. Assign to installer
const assignOrder = trpc.assignments.assign.useMutation();
await assignOrder.mutateAsync({
  orderId: newOrder.insertId,
  installerId: 5
});

// 3. Add a note
const createNote = trpc.notes.create.useMutation();
await createNote.mutateAsync({
  orderId: newOrder.insertId,
  content: "Customer prefers morning appointments"
});

// 4. Update status as work progresses
const updateOrder = trpc.orders.update.useMutation();
await updateOrder.mutateAsync({
  id: newOrder.insertId,
  status: "on_the_way"
});

// 5. Complete the order
await updateOrder.mutateAsync({
  id: newOrder.insertId,
  status: "completed"
});
```

### Optimistic Updates Pattern

```typescript
const utils = trpc.useUtils();

const updateOrder = trpc.orders.update.useMutation({
  onMutate: async (newOrder) => {
    // Cancel outgoing refetches
    await utils.orders.list.cancel();
    
    // Snapshot previous value
    const previousOrders = utils.orders.list.getData();
    
    // Optimistically update
    utils.orders.list.setData(undefined, (old) => 
      old?.map(order => 
        order.id === newOrder.id 
          ? { ...order, ...newOrder }
          : order
      )
    );
    
    return { previousOrders };
  },
  onError: (err, newOrder, context) => {
    // Rollback on error
    utils.orders.list.setData(undefined, context?.previousOrders);
  },
  onSettled: () => {
    // Refetch after mutation
    utils.orders.list.invalidate();
  }
});
```

---

## Rate Limiting

Currently, there are no rate limits enforced. However, best practices recommend:

- Batch operations when possible (use bulk endpoints)
- Implement debouncing for user-triggered actions
- Cache query results appropriately
- Use optimistic updates to reduce perceived latency

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Order management endpoints
- Assignment and scheduling endpoints
- Installer management endpoints
- Time slot configuration endpoints
- Notes management endpoints
- Complete type safety with tRPC

---

For questions or issues with the API, please open an issue on GitHub.
