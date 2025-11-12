# Service Installer Scheduler

Streamline your service installation workflow with an intuitive scheduling tool. Upload orders, assign them to installers, and export schedules with ease.

## Overview

Service Installer Scheduler is a comprehensive web application designed to manage service installation orders and installer assignments. Built with modern web technologies, it provides a powerful yet user-friendly interface for coordinating installation tasks, tracking order status, and managing installer teams.

## Key Features

### 📋 Order Management
- **Bulk Upload**: Import service orders from Excel or CSV files
- **Advanced Filtering**: Filter orders by status, reschedule reason, appointment date, and more
- **Search Functionality**: Quick search across work orders, customers, and locations
- **Status Tracking**: Track orders through multiple states (Pending, Assigned, On the Way, Met Customer, Completed, etc.)
- **Excel Export**: Export filtered and sorted order lists to Excel for reporting

### 📅 Visual Scheduling
- **Drag-and-Drop Interface**: Assign installers to orders by dragging installer badges onto order cards
- **Time Slot Organization**: View orders organized by appointment time slots
- **Color-Coded Orders**: Visual differentiation for AWO orders (cyan), no-WO orders (pink), and regular orders
- **Real-time Updates**: Instant feedback on assignment changes
- **Multi-day View**: Navigate between dates to plan ahead

### 👷 Installer Management
- **Installer Profiles**: Maintain detailed installer information (name, email, phone, skills)
- **User Account Linking**: Connect installer profiles to user accounts for authentication
- **Status Management**: Track active/inactive installer status
- **Search and Filter**: Quickly find installers by name or attributes

### ⚙️ Administrative Settings
- **Customizable Time Slots**: Add, remove, reorder, and enable/disable appointment time slots
- **Drag-and-Drop Reordering**: Organize time slots in your preferred sequence
- **Tabbed Settings Interface**: Consolidated settings for time slots and installers
- **Admin-Only Access**: Secure administrative functions with role-based access control

### 📊 Performance Analytics
- **Dashboard Metrics**: View key performance indicators and statistics
- **Order Status Distribution**: Visualize order completion rates
- **Installer Performance**: Track individual installer metrics
- **Historical Data**: Access order history and past assignments

### 📱 Mobile-Friendly
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Installer Dashboard**: Mobile-optimized view for installers to manage their daily tasks

## Tech Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Wouter** - Lightweight routing
- **tRPC** - End-to-end typesafe APIs
- **TanStack Query** - Data fetching and caching

### Backend
- **Node.js** - Runtime environment
- **Express 4** - Web framework
- **tRPC 11** - API layer with full type safety
- **Drizzle ORM** - Type-safe database queries
- **MySQL/TiDB** - Database

### Development Tools
- **Vite** - Fast build tool
- **pnpm** - Efficient package manager
- **tsx** - TypeScript execution

## Prerequisites

- **Node.js** 22.x or higher
- **pnpm** 9.x or higher
- **MySQL** or **TiDB** database

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/espritguy69/installer-scheduler.git
cd installer-scheduler
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/installer_scheduler

# Authentication
JWT_SECRET=your-secret-key-here
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# Application
VITE_APP_ID=your-app-id
VITE_APP_TITLE=Service Installer Scheduler
VITE_APP_LOGO=/logo.svg

# Owner Information
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name

# Built-in Services (Optional)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
```

### 4. Initialize Database

Push the database schema:

```bash
pnpm db:push
```

This will create all necessary tables including:
- `users` - User accounts and authentication
- `orders` - Service installation orders
- `installers` - Installer profiles
- `timeSlots` - Customizable appointment time slots
- `notes` - Order notes and comments
- `history` - Order history tracking

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Usage

### Initial Setup

1. **Log in** with your Manus OAuth account
2. Navigate to **Settings** → **Installers** tab to add your installer team
3. Navigate to **Settings** → **Time Slots** tab to configure appointment times
4. Go to **Upload** page to import your first batch of orders

### Daily Workflow

1. **Upload Orders**: Import new service orders via Excel/CSV
2. **Review Orders**: Check the Orders page for new assignments
3. **Schedule Tasks**: Use the Schedule page to assign orders to installers
4. **Track Progress**: Monitor order status updates throughout the day
5. **Export Reports**: Download Excel reports for completed work

### Assigning Orders to Installers

1. Navigate to the **Schedule** page
2. Select the appointment date
3. Drag an installer badge from the sidebar
4. Drop it onto an order card to assign
5. The order status automatically updates to "Assigned"

### Managing Time Slots

1. Navigate to **Settings** → **Time Slots**
2. Click **Add Time Slot** to create new appointment times
3. Drag time slots to reorder them
4. Toggle switches to enable/disable time slots
5. Click delete button to remove unused time slots

## Project Structure

```
installer-scheduler/
├── client/                 # Frontend application
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── lib/           # Utilities and tRPC client
│       └── hooks/         # Custom React hooks
├── server/                # Backend application
│   ├── _core/            # Core server infrastructure
│   ├── db.ts             # Database queries
│   └── routers.ts        # tRPC API routes
├── drizzle/              # Database schema and migrations
│   └── schema.ts         # Table definitions
├── shared/               # Shared types and constants
└── storage/              # S3 storage helpers
```

## Database Schema

### Key Tables

- **users**: User authentication and profiles
- **orders**: Service installation orders with full details
- **installers**: Installer profiles and contact information
- **timeSlots**: Configurable appointment time slots
- **notes**: Order-specific notes and comments
- **history**: Audit trail of order changes

## API Endpoints

The application uses tRPC for type-safe API communication. All endpoints are available under `/api/trpc`:

- `auth.*` - Authentication operations
- `orders.*` - Order CRUD operations
- `installers.*` - Installer management
- `timeSlots.*` - Time slot configuration
- `notes.*` - Note management
- `history.*` - History tracking

## Development

### Running Tests

```bash
pnpm test
```

### Database Migrations

Generate migration:
```bash
pnpm drizzle-kit generate
```

Apply migration:
```bash
pnpm drizzle-kit migrate
```

### Building for Production

```bash
pnpm build
```

### Type Checking

```bash
pnpm type-check
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

Built with [Manus](https://manus.im) - AI-powered development platform
