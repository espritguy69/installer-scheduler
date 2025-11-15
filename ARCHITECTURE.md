# System Architecture
## Service Installer Scheduler

**Version:** 1.0  
**Last Updated:** November 15, 2025

---

## Overview

The Service Installer Scheduler is a full-stack web application built with modern technologies, following a client-server architecture with type-safe API communication via tRPC.

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React 19 Application (TypeScript)                 │     │
│  │  - UI Components (shadcn/ui)                       │     │
│  │  - State Management (TanStack Query)               │     │
│  │  - Routing (Wouter)                                │     │
│  │  - tRPC Client                                     │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS/WebSocket
                       │ tRPC over HTTP
                       ↓
┌──────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Express 4 Server (Node.js 22)                     │     │
│  │  - tRPC Router                                     │     │
│  │  - Authentication Middleware                       │     │
│  │  - Session Management                              │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Business Logic Layer                              │     │
│  │  - Order Management                                │     │
│  │  - Installer Management                            │     │
│  │  - Assignment Logic                                │     │
│  │  - File Processing                                 │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Data Access Layer (Drizzle ORM)                   │     │
│  │  - Type-safe queries                               │     │
│  │  - Schema management                               │     │
│  │  - Migrations                                      │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
┌──────────────────┐          ┌──────────────────┐
│  Database Layer  │          │  Storage Layer   │
│  MySQL / TiDB    │          │  AWS S3          │
│  - Orders        │          │  - Dockets       │
│  - Installers    │          │  - Excel files   │
│  - Assignments   │          │  - Images        │
│  - Users         │          │                  │
└──────────────────┘          └──────────────────┘
```

---

## Technology Stack

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 19.x | UI library |
| Language | TypeScript | 5.x | Type safety |
| Build Tool | Vite | 7.x | Fast dev server & bundler |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Pre-built components |
| State Management | TanStack Query | 5.x | Server state management |
| API Client | tRPC Client | 11.x | Type-safe RPC |
| Routing | Wouter | 3.x | Lightweight routing |
| Forms | React Hook Form | 7.x | Form validation |
| Validation | Zod | 3.x | Schema validation |
| Date Handling | date-fns | 4.x | Date utilities |
| Excel Processing | xlsx | 0.18.x | Excel file parsing |
| Drag & Drop | @dnd-kit | 6.x | Drag and drop |
| Icons | Lucide React | Latest | Icon library |

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 22.13.0 | JavaScript runtime |
| Framework | Express | 4.x | Web framework |
| API | tRPC | 11.x | Type-safe RPC |
| Language | TypeScript | 5.x | Type safety |
| ORM | Drizzle ORM | Latest | Database ORM |
| Database | MySQL / TiDB | 8.0+ | Relational database |
| Authentication | Manus OAuth | 2.0 | User authentication |
| Session | JWT | Latest | Session tokens |
| File Storage | AWS S3 | Latest | Object storage |
| Validation | Zod | 3.x | Schema validation |

### Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager |
| ESLint | Code linting |
| Prettier | Code formatting |
| TypeScript Compiler | Type checking |
| Vitest | Unit testing |

---

## Data Flow

### 1. User Action → UI Update

```
User clicks button
       ↓
React component handler
       ↓
tRPC mutation/query hook
       ↓
HTTP request to /api/trpc
       ↓
tRPC router (server)
       ↓
Business logic function
       ↓
Drizzle ORM query
       ↓
MySQL database
       ↓
Response (JSON)
       ↓
tRPC client receives data
       ↓
TanStack Query updates cache
       ↓
React re-renders UI
```

### 2. File Upload Flow

```
User selects file
       ↓
Frontend reads file (FileReader API)
       ↓
Convert to Buffer/ArrayBuffer
       ↓
tRPC mutation with file data
       ↓
Backend receives file
       ↓
Upload to S3 (storagePut)
       ↓
S3 returns public URL
       ↓
Save URL in database
       ↓
Response with URL
       ↓
Frontend displays file
```

### 3. Authentication Flow

```
User clicks Login
       ↓
Redirect to Manus OAuth portal
       ↓
User authenticates
       ↓
Redirect to /api/oauth/callback
       ↓
Exchange code for user info
       ↓
Create/update user in database
       ↓
Generate JWT token
       ↓
Set HTTP-only cookie
       ↓
Redirect to application
       ↓
Subsequent requests include cookie
       ↓
Middleware validates JWT
       ↓
ctx.user available in procedures
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ openId      │◄─────────┐
│ name        │          │
│ email       │          │
│ role        │          │
└─────────────┘          │
                         │
                    ┌────┴──────────┐
                    │  assignments  │
                    │───────────────│
                    │ id (PK)       │
                    │ orderId (FK)  │───┐
                    │ installerId   │   │
                    │ assignedBy    │───┘
                    │ assignedAt    │
                    └────┬──────────┘
                         │
          ┌──────────────┴──────────────┐
          ↓                             ↓
┌─────────────────┐          ┌──────────────┐
│     orders      │          │  installers  │
│─────────────────│          │──────────────│
│ id (PK)         │          │ id (PK)      │
│ orderNumber     │          │ name         │
│ ticketNumber    │          │ phone        │
│ serviceNumber   │          │ email        │
│ customerName    │          │ skills       │
│ customerPhone   │          │ isActive     │
│ customerAddress │          └──────────────┘
│ status          │
│ appointmentDate │
│ appointmentTime │
│ docketUrl       │
│ notes           │
└─────────────────┘
```

### Table Definitions

**users**
- Primary key: `id` (auto-increment)
- Unique: `openId` (OAuth identifier)
- Indexes: `openId`

**orders**
- Primary key: `id` (auto-increment)
- Indexes: `appointmentDate`, `status`, `ticketNumber`
- Foreign keys: None (denormalized for performance)

**installers**
- Primary key: `id` (auto-increment)
- Indexes: `name`, `isActive`

**assignments**
- Primary key: `id` (auto-increment)
- Foreign keys: `orderId` → orders.id, `installerId` → installers.id, `assignedBy` → users.id
- Indexes: `orderId`, `installerId`, `assignedAt`

---

## API Architecture (tRPC)

### Router Structure

```
appRouter
├── auth
│   ├── me (query) - Get current user
│   └── logout (mutation) - Logout user
├── orders
│   ├── list (query) - List all orders
│   ├── get (query) - Get single order
│   ├── create (mutation) - Create order
│   ├── update (mutation) - Update order
│   ├── delete (mutation) - Delete order
│   ├── bulkCreate (mutation) - Import from Excel
│   ├── uploadDocketFile (mutation) - Upload docket
│   └── clearAll (mutation) - Delete all orders
├── installers
│   ├── list (query) - List all installers
│   ├── get (query) - Get single installer
│   ├── create (mutation) - Create installer
│   ├── update (mutation) - Update installer
│   └── delete (mutation) - Delete installer
├── assignments
│   ├── list (query) - List all assignments
│   ├── create (mutation) - Assign installer
│   ├── update (mutation) - Update assignment
│   └── delete (mutation) - Remove assignment
└── system
    └── notifyOwner (mutation) - Send notification
```

### Type Safety Flow

```typescript
// Server: Define procedure
const getOrder = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return await db.select()
      .from(orders)
      .where(eq(orders.id, input.id));
  });

// Client: Auto-generated types
const { data } = trpc.orders.get.useQuery({ id: 1 });
//    ^? data: Order | undefined (fully typed!)
```

---

## Security Architecture

### Authentication & Authorization

**OAuth 2.0 Flow:**
1. User initiates login
2. Redirect to Manus OAuth server
3. User authenticates
4. OAuth server returns authorization code
5. Backend exchanges code for access token
6. Backend retrieves user info
7. Backend creates/updates user in database
8. Backend issues JWT session token
9. JWT stored in HTTP-only cookie

**Session Management:**
- JWT tokens with 7-day expiration
- HTTP-only cookies (XSS protection)
- Secure flag (HTTPS only)
- SameSite=Lax (CSRF protection)

**Authorization:**
- Role-based access control (RBAC)
- Roles: `admin`, `user`
- Protected procedures check `ctx.user.role`
- Admin-only operations gated by middleware

### Data Security

**In Transit:**
- TLS 1.3 encryption
- HTTPS enforced
- Secure WebSocket (WSS) for real-time

**At Rest:**
- Database encryption (managed by provider)
- S3 server-side encryption
- Sensitive data hashed (passwords, if stored)

**Input Validation:**
- Zod schemas on all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)
- File type validation
- File size limits

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
- Route-based lazy loading
- Dynamic imports for heavy components
- Separate vendor bundles

**Caching Strategy:**
```typescript
// TanStack Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

**Asset Optimization:**
- Image compression
- SVG icons (small file size)
- CSS purging (Tailwind)
- Minification and tree-shaking

### Backend Optimization

**Database Optimization:**
- Indexes on frequently queried columns
- Connection pooling (max 100 connections)
- Query optimization (avoid N+1)
- Pagination for large datasets

**API Optimization:**
- HTTP/2 for multiplexing
- Response compression (gzip)
- Batch requests (tRPC batching)
- Caching headers

---

## Deployment Architecture

### Development Environment

```
Developer Machine
├── Node.js 22.13.0
├── pnpm
├── Local MySQL (optional)
└── Dev Server (Vite + Express)
    ├── Frontend: localhost:3000
    └── Backend: localhost:3000/api
```

### Production Environment (Manus Platform)

```
┌─────────────────────────────────────────┐
│           CDN (Static Assets)           │
│  - HTML, CSS, JS                        │
│  - Images, Fonts                        │
│  - Cache: 1 year                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Load Balancer (HTTPS)            │
│  - SSL Termination                      │
│  - Health Checks                        │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    ↓                     ↓
┌─────────┐          ┌─────────┐
│ Server 1│          │ Server 2│
│ Node.js │          │ Node.js │
│ Express │          │ Express │
└────┬────┘          └────┬────┘
     │                    │
     └──────────┬─────────┘
                ↓
      ┌──────────────────┐
      │  Database Cluster │
      │  MySQL / TiDB     │
      │  - Primary        │
      │  - Replicas       │
      └──────────────────┘
```

### Scaling Strategy

**Horizontal Scaling:**
- Stateless servers (session in JWT)
- Load balancer distributes traffic
- Auto-scaling based on CPU/memory

**Database Scaling:**
- Read replicas for queries
- Write to primary only
- Connection pooling

**Caching:**
- CDN for static assets
- Browser caching (Cache-Control headers)
- Application-level caching (TanStack Query)

---

## Monitoring & Observability

### Metrics

**Application Metrics:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users

**Infrastructure Metrics:**
- CPU usage (%)
- Memory usage (%)
- Disk I/O
- Network bandwidth

### Logging

**Log Levels:**
- ERROR: Application errors
- WARN: Warnings and deprecations
- INFO: Important events
- DEBUG: Detailed debugging info

**Log Aggregation:**
- Centralized logging (Manus platform)
- Structured logs (JSON format)
- Log retention: 30 days

### Alerting

**Alert Conditions:**
- Error rate > 5%
- Response time > 2s (p95)
- CPU usage > 80%
- Database connections > 90

**Notification Channels:**
- Email
- Slack (optional)
- PagerDuty (optional)

---

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Automated daily backups
- Retention: 7 days
- Point-in-time recovery
- Backup verification

**File Backups:**
- S3 versioning enabled
- Cross-region replication (optional)
- Lifecycle policies

### Recovery Procedures

**Database Recovery:**
1. Identify backup to restore
2. Create new database instance
3. Restore from backup
4. Update connection string
5. Verify data integrity
6. Switch traffic to new instance

**Application Recovery:**
1. Rollback to previous checkpoint
2. Redeploy application
3. Run health checks
4. Monitor for issues

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 24 hours

---

## Future Architecture Considerations

### Microservices (Phase 2)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Order Service│  │Installer Svc │  │ Notif. Svc   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                 ┌───────▼────────┐
                 │  Message Queue │
                 │  (RabbitMQ)    │
                 └────────────────┘
```

### Event-Driven Architecture

```
Order Created Event
       ↓
┌──────────────────┐
│  Event Bus       │
└──────┬───────────┘
       │
   ┌───┴────┬────────┬────────┐
   ↓        ↓        ↓        ↓
Notify   Update   Send    Log
Installer Status  Email  Event
```

### Real-Time Features

```
┌──────────────┐
│  WebSocket   │
│  Server      │
└──────┬───────┘
       │
   ┌───┴────┬────────┬────────┐
   ↓        ↓        ↓        ↓
Status   Order    Chat    Live
Updates  Sync     Support Tracking
```

---

**For implementation details, see `technical.md`**  
**For feature specifications, see `spec.md`**  
**For UI documentation, see `wire.md`**
