# API Usage Examples

This directory contains example React components demonstrating how to use the Service Installer Scheduler API endpoints documented in [`docs/API.md`](../API.md).

## Table of Contents

- [OrdersListExample.tsx](#orderslistexampletsx) - Complete orders list with filtering, sorting, and export
- [InstallerScheduleViewExample.tsx](#installerscheduleviewexampletsx) - Drag-and-drop scheduling interface
- [OrderDetailExample.tsx](#orderdetailexampletsx) - View and edit single order with validation
- [TimeSlotSettingsExample.tsx](#timeslotsettingsexampletsx) - Admin interface for time slot management

## OrdersListExample.tsx

A comprehensive example component demonstrating best practices for using the `orders.list` API endpoint.

### Features Demonstrated

#### 1. **tRPC Query Usage**

```typescript
const { data: orders, isLoading, error, refetch } = trpc.orders.list.useQuery();
```

The component shows how to:
- Fetch data using tRPC's `useQuery` hook
- Handle loading states with `isLoading`
- Handle errors with `error`
- Manually refetch data with `refetch()`

#### 2. **Optimistic Updates**

```typescript
const updateOrderMutation = trpc.orders.update.useMutation({
  onMutate: async (updatedOrder) => {
    await utils.orders.list.cancel();
    const previousOrders = utils.orders.list.getData();
    utils.orders.list.setData(undefined, (old) =>
      old?.map((order) =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      )
    );
    return { previousOrders };
  },
  onError: (err, updatedOrder, context) => {
    utils.orders.list.setData(undefined, context?.previousOrders);
  },
  onSettled: () => {
    utils.orders.list.invalidate();
  },
});
```

This pattern provides instant UI feedback by:
- Updating the UI immediately before the server responds
- Rolling back changes if the mutation fails
- Revalidating data after the mutation completes

#### 3. **Client-Side Filtering**

The component implements multiple filter types:

**Search Filter:**
```typescript
const query = searchQuery.toLowerCase();
filtered = filtered.filter(
  (order) =>
    order.orderNumber.toLowerCase().includes(query) ||
    order.customerName.toLowerCase().includes(query) ||
    order.ticketNumber?.toLowerCase().includes(query) ||
    order.buildingName?.toLowerCase().includes(query)
);
```

**Status Filter:**
```typescript
if (statusFilter !== "all") {
  filtered = filtered.filter((order) => order.status === statusFilter);
}
```

#### 4. **Table Sorting**

Implements sortable columns with direction toggle:

```typescript
const handleSort = (field: keyof Order) => {
  if (sortField === field) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};
```

#### 5. **Excel Export**

Exports filtered and sorted data to Excel:

```typescript
const exportData = filteredAndSortedOrders.map((order) => ({
  "Order Number": order.orderNumber,
  "Customer Name": order.customerName,
  // ... more fields
}));

const ws = XLSX.utils.json_to_sheet(exportData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Orders");
XLSX.writeFile(wb, `Orders_Export_${timestamp}.xlsx`);
```

#### 6. **Status Badge Rendering**

Visual status indicators with color coding:

```typescript
const statusColors: Record<OrderStatus, string> = {
  pending: "bg-gray-500",
  assigned: "bg-blue-500",
  completed: "bg-green-500",
  // ... more statuses
};
```

#### 7. **Responsive UI Components**

Uses shadcn/ui components for a polished interface:
- `Card` - Container layout
- `Table` - Data display
- `Badge` - Status indicators
- `Select` - Dropdown filters
- `Input` - Search field
- `Button` - Actions

### Dependencies

The example requires these packages (already included in the project):

```json
{
  "@tanstack/react-query": "^5.x",
  "@trpc/client": "^11.x",
  "@trpc/react-query": "^11.x",
  "xlsx": "^0.18.x",
  "sonner": "^1.x",
  "lucide-react": "^0.x"
}
```

### Usage

To use this component in your application:

1. **Copy the component** to your `client/src/pages/` directory:
   ```bash
   cp docs/examples/OrdersListExample.tsx client/src/pages/OrdersList.tsx
   ```

2. **Add the route** in `client/src/App.tsx`:
   ```typescript
   import OrdersList from "./pages/OrdersList";
   
   // In your Router component:
   <Route path="/orders" component={OrdersList} />
   ```

3. **Add navigation link** in `client/src/components/Navigation.tsx`:
   ```typescript
   { href: "/orders", label: "Orders", icon: FileText }
   ```

### Customization

#### Adding More Filters

To add a priority filter:

```typescript
const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");

// In the filter logic:
if (priorityFilter !== "all") {
  filtered = filtered.filter((order) => order.priority === priorityFilter);
}

// Add the Select component:
<Select value={priorityFilter} onValueChange={setPriorityFilter}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Filter by priority" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Priorities</SelectItem>
    <SelectItem value="low">Low</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="high">High</SelectItem>
  </SelectContent>
</Select>
```

#### Adding Date Range Filter

```typescript
const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
  from: null,
  to: null,
});

// In the filter logic:
if (dateRange.from && dateRange.to) {
  filtered = filtered.filter((order) => {
    const orderDate = new Date(order.appointmentDate || "");
    return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
  });
}
```

#### Adding Pagination

```typescript
const [page, setPage] = useState(1);
const pageSize = 20;

const paginatedOrders = useMemo(() => {
  const start = (page - 1) * pageSize;
  return filteredAndSortedOrders.slice(start, start + pageSize);
}, [filteredAndSortedOrders, page]);

// Add pagination controls:
<div className="flex justify-between items-center mt-4">
  <Button
    variant="outline"
    onClick={() => setPage(p => Math.max(1, p - 1))}
    disabled={page === 1}
  >
    Previous
  </Button>
  <span>Page {page} of {Math.ceil(filteredAndSortedOrders.length / pageSize)}</span>
  <Button
    variant="outline"
    onClick={() => setPage(p => p + 1)}
    disabled={page >= Math.ceil(filteredAndSortedOrders.length / pageSize)}
  >
    Next
  </Button>
</div>
```

### Performance Considerations

1. **useMemo for Expensive Computations**
   - Filtering and sorting are wrapped in `useMemo` to prevent unnecessary recalculations
   - Only recomputes when dependencies change

2. **Optimistic Updates**
   - Provides instant feedback without waiting for server response
   - Improves perceived performance

3. **Debounced Search** (Optional Enhancement)
   ```typescript
   import { useDebouncedValue } from "@/hooks/useDebounce";
   
   const debouncedSearch = useDebouncedValue(searchQuery, 300);
   // Use debouncedSearch in filter logic instead of searchQuery
   ```

4. **Virtual Scrolling** (For Large Datasets)
   - Consider using `@tanstack/react-virtual` for lists with 1000+ items
   - Renders only visible rows for better performance

### Testing

Example test cases for this component:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { trpc } from "@/lib/trpc";
import OrdersListExample from "./OrdersListExample";

// Mock tRPC
jest.mock("@/lib/trpc");

describe("OrdersListExample", () => {
  it("renders loading state", () => {
    trpc.orders.list.useQuery.mockReturnValue({ isLoading: true });
    render(<OrdersListExample />);
    expect(screen.getByText("Loading orders...")).toBeInTheDocument();
  });

  it("renders orders table", () => {
    const mockOrders = [
      { id: 1, orderNumber: "AWO123", customerName: "John Doe", /* ... */ }
    ];
    trpc.orders.list.useQuery.mockReturnValue({ data: mockOrders });
    render(<OrdersListExample />);
    expect(screen.getByText("AWO123")).toBeInTheDocument();
  });

  it("filters orders by search query", () => {
    const mockOrders = [
      { id: 1, orderNumber: "AWO123", customerName: "John Doe" },
      { id: 2, orderNumber: "AWO456", customerName: "Jane Smith" }
    ];
    trpc.orders.list.useQuery.mockReturnValue({ data: mockOrders });
    render(<OrdersListExample />);
    
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: "John" } });
    
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });
});
```

### Common Patterns

#### Loading Skeleton

Replace the loading spinner with a skeleton for better UX:

```typescript
if (isLoading) {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Empty State

Enhance the empty state with a call-to-action:

```typescript
{filteredAndSortedOrders.length === 0 && (
  <TableRow>
    <TableCell colSpan={7} className="text-center py-12">
      <div className="flex flex-col items-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-lg">No orders found</h3>
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by creating your first order"}
          </p>
        </div>
        {!searchQuery && statusFilter === "all" && (
          <Button onClick={() => navigate("/orders/new")}>
            Create Order
          </Button>
        )}
      </div>
    </TableCell>
  </TableRow>
)}
```

### Related Examples

- **InstallerScheduleViewExample.tsx** - Drag-and-drop scheduling interface
- **OrderDetailExample.tsx** - View and edit single order with validation
- **TimeSlotSettingsExample.tsx** - Admin interface for time slot management

### Additional Resources

- [tRPC Documentation](https://trpc.io/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [XLSX Library Documentation](https://docs.sheetjs.com/)

---

## InstallerScheduleViewExample.tsx

A comprehensive drag-and-drop scheduling interface for assigning orders to installers.

### Features Demonstrated

- **Multiple tRPC Queries** - Fetching orders, installers, assignments, and time slots
- **Drag-and-Drop** - Native HTML5 drag-and-drop for installer assignment
- **Date Navigation** - Calendar picker and prev/next day buttons
- **Time Slot Organization** - Orders grouped by appointment time
- **Color-Coded Cards** - Visual differentiation for AWO, no-WO, and regular orders
- **Installer Availability** - Real-time order count per installer
- **Assignment Management** - Assign and unassign with optimistic updates

### Key Patterns

**Drag-and-Drop Assignment:**
```typescript
const handleDragStart = (installer: Installer) => {
  setDraggedInstaller(installer);
};

const handleDrop = (orderId: number) => {
  if (!draggedInstaller) return;
  assignMutation.mutate({
    orderId,
    installerId: draggedInstaller.id,
  });
};
```

**Grouping Orders by Time Slot:**
```typescript
const ordersByTimeSlot = useMemo(() => {
  const grouped: Record<string, Order[]> = {};
  activeTimeSlots.forEach((slot) => {
    grouped[slot.time] = ordersForDate.filter((order) =>
      order.appointmentTime?.startsWith(slot.time)
    );
  });
  return grouped;
}, [ordersForDate, activeTimeSlots]);
```

### Usage

```bash
cp docs/examples/InstallerScheduleViewExample.tsx client/src/pages/Schedule.tsx
```

---

## OrderDetailExample.tsx

A comprehensive form for viewing and editing individual order details with validation and history tracking.

### Features Demonstrated

- **Dynamic Routing** - Using wouter for parameterized routes
- **Form State Management** - Controlled inputs with change tracking
- **Input Validation** - Client-side validation before submission
- **Tabbed Interface** - Separate tabs for details and history
- **Conditional Fields** - Show reschedule fields only when status is "rescheduled"
- **History Timeline** - Visual timeline of order changes
- **Optimistic Updates** - Instant feedback on form submission

### Key Patterns

**Form Change Tracking:**
```typescript
const [formData, setFormData] = useState<Partial<Order>>({});
const [hasChanges, setHasChanges] = useState(false);

const handleFieldChange = (field: keyof Order, value: any) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
  setHasChanges(true);
};
```

**Conditional Field Rendering:**
```typescript
{formData.status === "rescheduled" && (
  <>
    <div className="space-y-2">
      <Label htmlFor="rescheduleReason">Reschedule Reason</Label>
      <Select
        value={formData.rescheduleReason || undefined}
        onValueChange={(value) =>
          handleFieldChange("rescheduleReason", value)
        }
      >
        {/* ... */}
      </Select>
    </div>
  </>
)}
```

### Usage

```bash
cp docs/examples/OrderDetailExample.tsx client/src/pages/OrderDetail.tsx

# Add route in App.tsx:
<Route path="/orders/:id" component={OrderDetail} />
```

---

## TimeSlotSettingsExample.tsx

An admin interface for managing appointment time slots with drag-and-drop reordering.

### Features Demonstrated

- **Drag-and-Drop Reordering** - Using @dnd-kit for sortable lists
- **CRUD Operations** - Create, update, delete time slots
- **Toggle Controls** - Enable/disable time slots without deleting
- **Input Validation** - Time format validation and duplicate checking
- **Confirmation Dialogs** - AlertDialog for destructive actions
- **Seed Defaults** - Populate default time slots with one click

### Key Patterns

**Drag-and-Drop with @dnd-kit:**
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = timeSlots.findIndex((slot) => slot.id === active.id);
  const newIndex = timeSlots.findIndex((slot) => slot.id === over.id);
  
  const reorderedSlots = arrayMove(timeSlots, oldIndex, newIndex);
  const timeSlotIds = reorderedSlots.map((slot) => slot.id);
  reorderMutation.mutate({ timeSlotIds });
};
```

**Sortable Item Component:**
```typescript
function SortableTimeSlotItem({ timeSlot, onToggle, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: timeSlot.id });

  return (
    <div ref={setNodeRef} style={{ transform, transition }}>
      <div {...attributes} {...listeners}>
        <GripVertical /> {/* Drag handle */}
      </div>
      {/* ... */}
    </div>
  );
}
```

### Dependencies

Requires @dnd-kit packages:
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Usage

```bash
cp docs/examples/TimeSlotSettingsExample.tsx client/src/pages/TimeSlotSettings.tsx
```

---

### Support

For questions or issues with these examples:
1. Check the [API Documentation](../API.md)
2. Review the [main README](../../README.md)
3. Open an issue on GitHub
