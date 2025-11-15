# Setup Guide
## Service Installer Scheduler

**Version:** 1.0  
**Last Updated:** November 15, 2025

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation](#2-installation)
3. [Configuration](#3-configuration)
4. [Database Setup](#4-database-setup)
5. [Deployment](#5-deployment)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. System Requirements

### 1.1 Development Environment

**Required Software:**
- **Node.js:** v22.13.0 or higher
- **pnpm:** v9.0.0 or higher
- **Git:** v2.30 or higher
- **MySQL/TiDB:** v8.0 or higher

**Recommended Hardware:**
- **CPU:** 4 cores minimum
- **RAM:** 8GB minimum (16GB recommended)
- **Storage:** 10GB free space
- **Network:** Stable internet connection

**Supported Operating Systems:**
- macOS 11+ (Big Sur or later)
- Ubuntu 20.04 LTS or later
- Windows 10/11 with WSL2

### 1.2 Production Environment

**Server Requirements:**
- **CPU:** 2 cores minimum (4 cores recommended)
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 20GB SSD
- **Network:** 100 Mbps bandwidth
- **SSL Certificate:** Required for HTTPS

**Database Requirements:**
- **MySQL 8.0+** or **TiDB Cloud**
- **Storage:** 10GB minimum
- **Connections:** 100 concurrent connections
- **Backup:** Daily automated backups

---

## 2. Installation

### 2.1 Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/espritguy69/installer-scheduler.git
cd installer-scheduler

# Or if using SSH
git clone git@github.com:espritguy69/installer-scheduler.git
cd installer-scheduler
```

### 2.2 Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install

# This will install:
# - React 19 + TypeScript
# - Express 4 + tRPC 11
# - Drizzle ORM
# - Tailwind CSS 4
# - shadcn/ui components
# - And all other dependencies
```

**Installation Time:** Approximately 2-5 minutes depending on internet speed.

### 2.3 Verify Installation

```bash
# Check Node.js version
node --version
# Expected: v22.13.0 or higher

# Check pnpm version
pnpm --version
# Expected: v9.0.0 or higher

# List installed packages
pnpm list --depth=0
```

---

## 3. Configuration

### 3.1 Environment Variables

The application uses environment variables for configuration. These are automatically injected by the Manus platform in production.

**System Environment Variables (Auto-injected):**

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Application
VITE_APP_ID=your-app-id
VITE_APP_TITLE="Service Installer Scheduler"
VITE_APP_LOGO=/logo.svg

# Owner Information
OWNER_OPEN_ID=owner-open-id
OWNER_NAME=Owner Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

**Note:** Do not create a `.env` file manually. All environment variables are managed through the Manus platform dashboard.

### 3.2 Application Configuration

**File:** `client/src/const.ts`

```typescript
// Application branding
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "Service Installer Scheduler";
export const APP_LOGO = import.meta.env.VITE_APP_LOGO || "/logo.svg";

// OAuth configuration
export const OAUTH_PORTAL_URL = import.meta.env.VITE_OAUTH_PORTAL_URL;
export const APP_ID = import.meta.env.VITE_APP_ID;

// Helper function to get login URL
export function getLoginUrl(redirectTo?: string) {
  const redirect = redirectTo || window.location.pathname;
  return `${OAUTH_PORTAL_URL}?app_id=${APP_ID}&redirect_uri=${encodeURIComponent(
    window.location.origin + redirect
  )}`;
}
```

**Customization:**
- To change the app logo, update `APP_LOGO` constant to point to your logo file in `client/public/`
- To update the favicon, use the Management UI Settings panel (not in code)

---

## 4. Database Setup

### 4.1 Database Schema

The application uses Drizzle ORM for database management. The schema is defined in `drizzle/schema.ts`.

**Core Tables:**
- `users` - User accounts and authentication
- `orders` - Service installation orders
- `installers` - Installer profiles
- `assignments` - Order-installer assignments
- `notes` - Order notes and comments

### 4.2 Run Migrations

```bash
# Generate migration files from schema
pnpm db:generate

# Push schema changes to database
pnpm db:push

# This command:
# 1. Generates SQL migration files
# 2. Applies changes to the database
# 3. Updates the database schema
```

**Migration Files:** Located in `drizzle/migrations/`

### 4.3 Seed Data (Optional)

For development and testing, you can seed the database with sample data:

```bash
# Create a seed script (if not exists)
node scripts/seed.mjs

# Or use the database UI in Management Dashboard
# Navigate to: Management UI → Database → Import Data
```

### 4.4 Database Backup

**Automated Backups:**
- Configured through Manus platform
- Daily backups at 2:00 AM UTC
- Retention: 7 days

**Manual Backup:**

```bash
# Export database
mysqldump -h [host] -u [user] -p [database] > backup.sql

# Import database
mysql -h [host] -u [user] -p [database] < backup.sql
```

---

## 5. Deployment

### 5.1 Development Server

```bash
# Start development server
pnpm dev

# Server will start on:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3000/api
# - tRPC endpoint: http://localhost:3000/api/trpc
```

**Hot Reload:** Enabled for both frontend and backend code changes.

### 5.2 Production Build

```bash
# Build for production
pnpm build

# This will:
# 1. Compile TypeScript
# 2. Bundle frontend assets
# 3. Optimize for production
# 4. Generate source maps

# Output:
# - Frontend: client/dist/
# - Backend: server/ (TypeScript compiled to JavaScript)
```

### 5.3 Production Deployment (Manus Platform)

**Step 1: Save Checkpoint**

```bash
# Ensure all changes are committed
git add -A
git commit -m "Prepare for deployment"

# Create checkpoint through webdev tools
# This is done automatically when you save a checkpoint in the UI
```

**Step 2: Publish**

1. Open Management UI
2. Click **Publish** button (top-right)
3. Wait for deployment to complete (2-3 minutes)
4. Verify deployment at your custom domain

**Deployment URL:**
- Development: `https://3000-[session-id].manusvm.computer`
- Production: `https://servicesched-c3kvsobm.manus.space` (or custom domain)

### 5.4 Custom Domain Setup

1. Navigate to: **Management UI → Settings → Domains**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `scheduler.yourcompany.com`)
4. Add DNS records as instructed:
   ```
   Type: CNAME
   Name: scheduler
   Value: servicesched-c3kvsobm.manus.space
   ```
5. Wait for DNS propagation (5-30 minutes)
6. SSL certificate will be automatically provisioned

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Issue: "Module not found" errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install
```

#### Issue: Database connection errors

**Solution:**
1. Verify `DATABASE_URL` in environment variables
2. Check database server is running
3. Verify network connectivity
4. Check firewall rules

```bash
# Test database connection
mysql -h [host] -u [user] -p

# Or use the Database panel in Management UI
```

#### Issue: Dev server not starting

**Solution:**
```bash
# Kill any processes using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

#### Issue: "Too many open files" error

**Solution:**
```bash
# Increase file watcher limit (Linux/macOS)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart the dev server
pnpm dev
```

#### Issue: Build failures

**Solution:**
```bash
# Clear build cache
rm -rf client/dist
rm -rf .vite

# Rebuild
pnpm build
```

### 6.2 Logs and Debugging

**View Logs:**

```bash
# Development server logs
# Displayed in terminal where `pnpm dev` is running

# Production logs
# Available in Management UI → Dashboard → Logs
```

**Enable Debug Mode:**

```typescript
// In client/src/lib/trpc.ts
const trpc = createTRPCReact<AppRouter>();

// Add logging
const client = trpc.createClient({
  links: [
    loggerLink(), // Add this for request/response logging
    httpBatchLink({
      url: '/api/trpc',
    }),
  ],
});
```

### 6.3 Performance Optimization

**Frontend Optimization:**

```bash
# Analyze bundle size
pnpm build --analyze

# Check for unused dependencies
pnpm dlx depcheck
```

**Database Optimization:**

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_orders_appointment_date ON orders(appointmentDate);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_assignments_installer_id ON assignments(installerId);
CREATE INDEX idx_assignments_order_id ON assignments(orderId);
```

**Caching:**

```typescript
// In tRPC queries, adjust staleTime and cacheTime
const { data } = trpc.orders.list.useQuery(undefined, {
  staleTime: 60000, // 1 minute
  cacheTime: 300000, // 5 minutes
});
```

### 6.4 Security Best Practices

1. **Never commit sensitive data:**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   *.pem
   *.key
   ```

2. **Keep dependencies updated:**
   ```bash
   # Check for updates
   pnpm outdated

   # Update dependencies
   pnpm update
   ```

3. **Enable HTTPS in production:**
   - Automatically handled by Manus platform
   - For custom deployments, use Let's Encrypt

4. **Implement rate limiting:**
   - Already configured in `server/_core/index.ts`
   - Adjust limits as needed

### 6.5 Getting Help

**Resources:**
- **Documentation:** See `howto.md`, `technical.md`, `spec.md`
- **GitHub Issues:** https://github.com/espritguy69/installer-scheduler/issues
- **Manus Support:** https://help.manus.im

**Reporting Bugs:**

When reporting issues, include:
1. Error message (full stack trace)
2. Steps to reproduce
3. Expected vs actual behavior
4. Environment details (OS, Node version, browser)
5. Screenshots (if applicable)

---

## Appendix A: Useful Commands

```bash
# Development
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm preview              # Preview production build locally

# Database
pnpm db:generate          # Generate migrations
pnpm db:push              # Push schema to database
pnpm db:studio            # Open Drizzle Studio (database GUI)

# Code Quality
pnpm lint                 # Run ESLint
pnpm format               # Format code with Prettier
pnpm typecheck            # Check TypeScript types

# Testing
pnpm test                 # Run tests
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Generate coverage report

# Utilities
pnpm clean                # Clean build artifacts
pnpm reset                # Reset node_modules and reinstall
```

## Appendix B: Project Structure

```
service-scheduler/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and tRPC client
│   │   ├── hooks/         # Custom React hooks
│   │   └── contexts/      # React contexts
│   └── index.html         # HTML entry point
├── server/                # Backend Express + tRPC
│   ├── _core/             # Core framework files
│   ├── db.ts              # Database queries
│   └── routers.ts         # tRPC routes
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # Database schema
│   └── migrations/        # Migration files
├── shared/                # Shared types and constants
├── storage/               # S3 storage helpers
├── docs/                  # Additional documentation
├── prd.md                 # Product Requirements Document
├── setup.md               # This file
├── howto.md               # User guide
├── technical.md           # Technical documentation
├── spec.md                # Feature specifications
├── wire.md                # Wireframes and UI docs
├── ARCHITECTURE.md        # System architecture
├── package.json           # Dependencies and scripts
└── README.md              # Project overview
```

---

**Next Steps:**
1. Complete installation following Section 2
2. Configure environment variables (Section 3)
3. Set up database (Section 4)
4. Start development server (Section 5.1)
5. Read `howto.md` for usage instructions
