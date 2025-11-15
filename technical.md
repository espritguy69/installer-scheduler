# Technical Documentation
## Service Installer Scheduler

**Version:** 1.0  
**Last Updated:** November 15, 2025

---

## Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **State Management:** TanStack Query (React Query)
- **Routing:** Wouter
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Drag & Drop:** @dnd-kit
- **Excel Processing:** xlsx (SheetJS)

### Backend
- **Runtime:** Node.js 22.13.0
- **Framework:** Express 4
- **API:** tRPC 11 (type-safe RPC)
- **Database ORM:** Drizzle ORM
- **Database:** MySQL 8.0 / TiDB Cloud
- **Authentication:** Manus OAuth 2.0
- **File Storage:** AWS S3 (via Manus)
- **Session:** JWT with HTTP-only cookies

### Development Tools
- **Package Manager:** pnpm
- **Build Tool:** Vite
- **TypeScript:** v5.x
- **Linting:** ESLint
- **Formatting:** Prettier

---

## Architecture Overview

### Application Structure

```
┌─────────────────────────────────────────┐
│           Browser (Client)              │
│  ┌───────────────────────────────────┐  │
│  │  React 19 + TypeScript            │  │
│  │  - Pages (Orders, Schedule, etc.) │  │
│  │  - Components (UI, Forms)         │  │
│  │  - tRPC Client                    │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTPS (tRPC over HTTP)
               ↓
┌─────────────────────────────────────────┐
│         Express Server (Backend)        │
│  ┌───────────────────────────────────┐  │
│  │  tRPC Router                      │  │
│  │  - orders.*                       │  │
│  │  - installers.*                   │  │
│  │  - assignments.*                  │  │
│  │  - auth.*                         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Database Layer (Drizzle ORM)    │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
┌─────────────┐  ┌─────────────┐
│   MySQL/    │  │   AWS S3    │
│   TiDB      │  │  (Dockets)  │
└─────────────┘  └─────────────┘
```

### Request Flow

1. **User Action** → React component
2. **tRPC Hook** → `trpc.orders.list.useQuery()`
3. **HTTP Request** → `/api/trpc/orders.list`
4. **tRPC Router** → `server/routers.ts`
5. **Database Query** → `server/db.ts` (Drizzle ORM)
6. **MySQL Query** → Database
7. **Response** → JSON with type safety
8. **React Update** → UI re-renders

---

## Key Implementation Details

### 1. Date Filter Auto-Reset

**Problem:** Date filter was stuck on old dates (e.g., November 14, 2025)

**Solution:** Added `useEffect` to reset date to today on component mount and tab visibility change

**File:** `client/src/pages/Orders.tsx`

```typescript
useEffect(() => {
  const updateToToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setDateFilter(todayStr);
  };
  
  // Update on mount
  updateToToday();
  
  // Update when page becomes visible (tab switch)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      updateToToday();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

### 2. Date Range Filtering

**Implementation:** Dual-mode filter (single date vs. date range)

**State Management:**
```typescript
const [dateFilterMode, setDateFilterMode] = useState<'single' | 'range'>('single');
const [dateFilter, setDateFilter] = useState<string>(''); // Single date
const [startDate, setStartDate] = useState<string>('');   // Range start
const [endDate, setEndDate] = useState<string>('');       // Range end
```

**Filter Logic:**
```typescript
if (dateFilterMode === 'single' && dateFilter) {
  // Single date: exact match
  const filterDate = new Date(dateFilter);
  if (orderDate.toDateString() !== filterDate.toDateString()) return false;
} else if (dateFilterMode === 'range' && (startDate || endDate)) {
  // Date range: inclusive between start and end
  const orderTime = orderDate.getTime();
  
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Start of day
    if (orderTime < start.getTime()) return false;
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    if (orderTime > end.getTime()) return false;
  }
}
```

### 3. Sorting Implementation

**Sortable Columns:** Ticket No., Service No., Status, Installer, Assignment

**State:**
```typescript
const [sortColumn, setSortColumn] = useState<string | null>(null);
const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
```

**Sort Logic:**
```typescript
const orders = [...filteredOrders].sort((a, b) => {
  if (!sortColumn) return 0;
  
  let aValue: any;
  let bValue: any;
  
  switch (sortColumn) {
    case "ticketNumber":
      aValue = (a.ticketNumber || "").toLowerCase();
      bValue = (b.ticketNumber || "").toLowerCase();
      break;
    case "installer":
      // Get installer name from assignment
      const assignmentA = assignments.find(asn => asn.orderId === a.id);
      const assignmentB = assignments.find(asn => asn.orderId === b.id);
      const installerA = assignmentA ? installers.find(inst => inst.id === assignmentA.installerId) : null;
      const installerB = assignmentB ? installers.find(inst => inst.id === assignmentB.installerId) : null;
      aValue = (installerA?.name || "Unassigned").toLowerCase();
      bValue = (installerB?.name || "Unassigned").toLowerCase();
      break;
    // ... other cases
  }
  
  if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
  if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
  return 0;
});
```

**Critical Fix:** Data loading order matters!
```typescript
// ✅ Correct: Load data before sorting
const { data: allOrders = [] } = trpc.orders.list.useQuery();
const { data: assignments = [] } = trpc.assignments.list.useQuery();
const { data: installers = [] } = trpc.installers.list.useQuery();

// Now sorting can safely access assignments and installers
const orders = [...filteredOrders].sort(...);

// ❌ Wrong: Sorting before data is loaded
const orders = [...filteredOrders].sort(...); // Uses assignments/installers
const { data: assignments = [] } = trpc.assignments.list.useQuery(); // Too late!
```

### 4. Excel Import

**File Processing:**
```typescript
const handleFileUpload = async (file: File) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Validate and transform data
    const orders = jsonData.map(row => ({
      orderNumber: row['WO No.'],
      ticketNumber: row['Ticket No.'],
      serviceNumber: row['Service No.'],
      customerName: row['Customer Name'],
      // ... map other fields
    }));
    
    // Send to backend
    await createOrders.mutateAsync(orders);
  };
  
  reader.readAsArrayBuffer(file);
};
```

### 5. tRPC Procedures

**Example: List Orders**

**File:** `server/routers.ts`
```typescript
export const appRouter = router({
  orders: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(orders);
    }),
    
    create: protectedProcedure
      .input(z.object({
        orderNumber: z.string(),
        ticketNumber: z.string(),
        serviceNumber: z.string(),
        customerName: z.string(),
        // ... other fields
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [order] = await db.insert(orders).values(input);
        return order;
      }),
  }),
});
```

**Client Usage:**
```typescript
// Query (read)
const { data: orders = [], isLoading } = trpc.orders.list.useQuery();

// Mutation (write)
const createOrder = trpc.orders.create.useMutation({
  onSuccess: () => {
    // Invalidate cache to refetch
    trpc.useUtils().orders.list.invalidate();
  },
});

// Call mutation
await createOrder.mutateAsync({
  orderNumber: "WO-001",
  ticketNumber: "TKT-001",
  // ...
});
```

### 6. Authentication Flow

**OAuth Callback:** `server/_core/oauth.ts`

1. User clicks Login → Redirected to Manus OAuth portal
2. User authenticates → Redirected back to `/api/oauth/callback`
3. Backend exchanges code for user info
4. Creates/updates user in database
5. Issues JWT session cookie
6. Redirects to app

**Protected Routes:**
```typescript
// Backend: protectedProcedure requires authentication
const updateOrder = protectedProcedure
  .input(...)
  .mutation(async ({ input, ctx }) => {
    // ctx.user is available (type-safe)
    console.log(ctx.user.id, ctx.user.name);
  });

// Frontend: useAuth hook
const { user, isAuthenticated, loading } = useAuth();

if (!isAuthenticated) {
  return <Navigate to={getLoginUrl()} />;
}
```

### 7. File Upload (Dockets)

**Flow:**
1. User selects file in browser
2. Frontend uploads to backend endpoint
3. Backend calls `storagePut()` to upload to S3
4. S3 returns public URL
5. Backend saves URL in database
6. Frontend displays uploaded file

**Implementation:**
```typescript
// Server: Upload docket
uploadDocketFile: protectedProcedure
  .input(z.object({
    orderId: z.number(),
    file: z.instanceof(Buffer),
    filename: z.string(),
  }))
  .mutation(async ({ input }) => {
    // Upload to S3
    const fileKey = `dockets/${input.orderId}/${Date.now()}-${input.filename}`;
    const { url } = await storagePut(fileKey, input.file, 'application/pdf');
    
    // Save URL in database
    const db = await getDb();
    await db.update(orders)
      .set({ docketUrl: url, docketUploadedAt: new Date() })
      .where(eq(orders.id, input.orderId));
    
    return { url };
  }),
```

---

## Database Schema

### Tables

**users**
- `id` (INT, PK, AUTO_INCREMENT)
- `openId` (VARCHAR(64), UNIQUE) - OAuth identifier
- `name` (TEXT)
- `email` (VARCHAR(320))
- `role` (ENUM: 'user', 'admin')
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)
- `lastSignedIn` (TIMESTAMP)

**orders**
- `id` (INT, PK, AUTO_INCREMENT)
- `orderNumber` (VARCHAR(100))
- `ticketNumber` (VARCHAR(100))
- `serviceNumber` (VARCHAR(100))
- `customerName` (TEXT)
- `customerPhone` (VARCHAR(20))
- `customerAddress` (TEXT)
- `serviceType` (VARCHAR(100))
- `priority` (ENUM: 'low', 'medium', 'high')
- `status` (VARCHAR(50))
- `notes` (TEXT)
- `docketUrl` (TEXT)
- `docketUploadedAt` (TIMESTAMP)
- `appointmentDate` (DATETIME)
- `appointmentTime` (VARCHAR(20))
- `rescheduleReason` (TEXT)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

**installers**
- `id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR(255))
- `phone` (VARCHAR(20))
- `email` (VARCHAR(320))
- `skills` (TEXT) - JSON array
- `isActive` (BOOLEAN)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

**assignments**
- `id` (INT, PK, AUTO_INCREMENT)
- `orderId` (INT, FK → orders.id)
- `installerId` (INT, FK → installers.id)
- `assignedAt` (TIMESTAMP)
- `assignedBy` (INT, FK → users.id)
- `notes` (TEXT)

### Indexes

```sql
-- Performance optimization
CREATE INDEX idx_orders_appointment_date ON orders(appointmentDate);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_assignments_installer_id ON assignments(installerId);
CREATE INDEX idx_assignments_order_id ON assignments(orderId);
```

---

## Performance Considerations

### Frontend Optimization

**1. Query Caching:**
```typescript
const { data } = trpc.orders.list.useQuery(undefined, {
  staleTime: 60000, // 1 minute - data considered fresh
  cacheTime: 300000, // 5 minutes - cache retention
  refetchOnWindowFocus: true,
});
```

**2. Optimistic Updates:**
```typescript
const updateStatus = trpc.orders.updateStatus.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await utils.orders.list.cancel();
    
    // Snapshot previous value
    const previous = utils.orders.list.getData();
    
    // Optimistically update
    utils.orders.list.setData(undefined, (old) =>
      old?.map(order =>
        order.id === newData.id ? { ...order, status: newData.status } : order
      )
    );
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    utils.orders.list.setData(undefined, context?.previous);
  },
});
```

### Backend Optimization

**1. Database Connection Pooling:**
- Configured in Drizzle ORM
- Max 100 connections
- Connection timeout: 10s

**2. Query Optimization:**
- Use indexes on frequently queried columns
- Avoid N+1 queries (use joins)
- Limit result sets

**3. Caching Strategy:**
- Static assets cached for 1 year
- API responses cached per-user
- Invalidate on mutations

---

## Security

### Authentication
- OAuth 2.0 via Manus platform
- JWT tokens in HTTP-only cookies
- CSRF protection enabled

### Authorization
- Role-based access control (RBAC)
- Admin vs. User roles
- Protected procedures check `ctx.user.role`

### Data Protection
- TLS 1.3 for data in transit
- S3 bucket with access controls
- SQL injection prevention (parameterized queries via Drizzle)
- XSS prevention (React auto-escapes)

### File Upload Security
- File type validation
- Size limits (5MB for dockets, 10MB for Excel)
- Virus scanning (optional, via S3 integration)

---

## Deployment

### Build Process
```bash
# 1. Install dependencies
pnpm install

# 2. Build frontend
cd client && pnpm build

# 3. Compile TypeScript (backend)
pnpm tsc

# 4. Output
# - client/dist/ (static files)
# - server/ (compiled JS)
```

### Environment Variables
- Managed via Manus platform dashboard
- No `.env` files in repository
- Secrets injected at runtime

### Monitoring
- Error tracking: Built-in Manus monitoring
- Performance: Web Vitals
- Uptime: Pingdom/UptimeRobot

---

## Testing

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

### E2E Tests
```bash
pnpm test:e2e
```

---

## API Reference

See `docs/API.md` for complete tRPC procedure documentation.

**Quick Reference:**
- `trpc.orders.*` - Order management
- `trpc.installers.*` - Installer management
- `trpc.assignments.*` - Assignment operations
- `trpc.auth.*` - Authentication
- `trpc.system.*` - System utilities

---

**For more details:**
- User Guide: `howto.md`
- Feature Specs: `spec.md`
- Architecture: `ARCHITECTURE.md`
