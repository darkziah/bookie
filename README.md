
# 📚 Bookie - Modern School Library Management System

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Convex](https://img.shields.io/badge/Backend-Convex-orange)
![Tauri](https://img.shields.io/badge/Kiosk-Tauri-ffc131)
![Bun](https://img.shields.io/badge/Package_Manager-Bun-f9f1e1)

**A state-of-the-art, full-featured library management system designed for modern educational institutions**

[Features](#-key-features) • [Tech Stack](#️-tech-stack) • [Getting Started](#-getting-started) • [Deployment](#-deployment) • [Documentation](#-project-structure)

</div>

---

## 🎯 Overview

**Bookie** is a comprehensive, production-ready library management system specifically designed for schools and educational institutions. Built with cutting-edge web technologies, Bookie simplifies complex library operations including cataloging, circulation management, member tracking, and inventory control into an elegant, intuitive interface.

The system consists of two main applications:
- **Admin Dashboard**: A powerful web-based interface for librarians and administrators
- **Self-Checkout Kiosk**: A standalone desktop application for student self-service

With real-time synchronization, role-based access control, and seamless barcode scanning integration, Bookie provides a modern solution that scales from small school libraries to large institutional collections.

---

## ✨ Key Features

### 🏢 Admin Dashboard
The centralized command center for librarians and administrators, accessible from any modern web browser.

#### 📊 Dashboard & Analytics
- **Real-time Statistics**: Live overview of checkout stats, overdue items, and recent activity
- **Visual Analytics**: Interactive charts and graphs powered by Recharts
- **Activity Timeline**: Chronological view of all library transactions
- **Quick Actions**: One-click access to frequent tasks

#### 📖 Smart Cataloging System
- **Rich Metadata Management**: Comprehensive book information including title, author, ISBN, genre, publisher, year, and category
- **Automatic ISBN Lookup**: Fetch book details automatically from external databases using ISBN
- **Cover Image Management**: Upload and display book covers for visual identification
- **Barcode Integration**: Scan book ISBNs directly using device cameras or USB barcode scanners
- **Bulk Operations**: Import/export book catalog via CSV files
- **Advanced Search & Filtering**: Find books quickly with powerful search capabilities

#### 🔄 Circulation Management
- **Streamlined Check-in/Check-out**: Quick and intuitive borrowing process
- **Barcode Scanning**: Scan student IDs and book barcodes for instant transaction processing
- **Due Date Tracking**: Automatic due date calculation and tracking
- **Fine Calculation**: Configurable late fee calculation and management
- **Renewal System**: Allow students to extend borrowing periods
- **Hold/Reservation System**: Queue management for popular books

#### 👥 Member Management
- **Student Database**: Comprehensive student information and library card management
- **Staff/Librarian Accounts**: Manage library staff with appropriate permissions
- **Batch Import/Update**: CSV import for bulk student data updates
- **Digital Library Cards**: Generate and manage digital student library cards
- **Borrowing History**: Complete transaction history for each member
- **Student ID Scanner**: Use camera or barcode scanner to identify students instantly

#### 📈 Advanced Reporting
- **Circulation Reports**: Detailed insights into borrowing patterns and trends
- **Inventory Status**: Real-time stock levels and availability
- **Financial Reports**: Fine collection and revenue tracking
- **Popular Books**: Analytics on most borrowed titles
- **Member Activity**: Individual and aggregate usage statistics
- **Export Capabilities**: Download reports in various formats for administrative use

#### 📦 Inventory Control
- **Bulk Inventory Scanning**: Reconcile physical stock with database records
- **Automatic Discrepancy Detection**: Identify missing or unaccounted items
- **Stock Alerts**: Notifications for low-stock or damaged items
- **Weeding Tools**: Identify and manage outdated or unused materials

### 🖥️ Self-Checkout Kiosk
A standalone desktop application designed for unattended student self-service.

#### 🎨 User Experience
- **Touch-Optimized Interface**: Large, accessible UI elements designed for touchscreens
- **Intuitive Workflow**: Simplified step-by-step checkout process
- **Multi-language Support**: Internationalization ready
- **Accessibility Features**: Screen reader compatible and keyboard navigable

#### 🔐 Security & Control
- **Kiosk Mode**: Locked-down environment preventing unauthorized access
- **Restricted System Access**: No access to underlying OS or system settings
- **Session Timeout**: Automatic logout after inactivity
- **Secure Authentication**: Integration with school authentication systems

#### 🔌 Hardware Integration
- **Barcode Scanner Support**: Compatible with USB and Bluetooth scanners
- **Camera Scanning**: Alternative scanning using device camera
- **Receipt Printer Support**: (Planned) Print transaction receipts
- **Offline Capability**: (Planned) Queue transactions when network is unavailable

### 🔒 Security & Backend

#### 🛡️ Authentication & Authorization
- **Role-Based Access Control (RBAC)**: Granular permissions for Admin, Librarian, and Student roles
- **Secure Authentication**: Industry-standard auth powered by @convex-dev/auth
- **Session Management**: Secure token-based sessions with automatic expiration
- **Multi-factor Authentication**: (Planned) Additional security layer for admin accounts

#### ⚡ Real-time Synchronization
- **Instant Updates**: Changes propagate across all connected devices in real-time
- **Optimistic Updates**: Immediate UI feedback with automatic rollback on errors
- **Conflict Resolution**: Automatic handling of concurrent edits
- **Live Presence**: See who else is currently using the system

#### 🗄️ Data Management
- **Convex Backend**: Serverless backend with built-in database and file storage
- **Type-Safe Queries**: End-to-end type safety from database to UI
- **Automatic Backups**: Regular backups via Convex infrastructure
- **Data Validation**: Schema validation at both client and server levels

---

## 🏗️ Architecture

Bookie is built as a modern monorepo using **Turborepo** for efficient build orchestration and **Bun** as the package manager for blazing-fast installations and script execution.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├──────────────────────────┬──────────────────────────────────┤
│   Admin Dashboard (Web)  │   Self-Checkout Kiosk (Desktop)  │
│   - React 19             │   - Tauri v2                     │
│   - TanStack Router      │   - React 19                     │
│   - TailwindCSS 4        │   - TailwindCSS 4                │
└──────────────┬───────────┴──────────────┬───────────────────┘
               │                          │
               │    Real-time Sync        │
               └──────────┬───────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │   Convex Backend     │
               ├──────────────────────┤
               │ - Real-time Database │
               │ - Serverless Functions│
               │ - File Storage       │
               │ - Authentication     │
               └──────────────────────┘
```

### Monorepo Structure

```
bookie/
├── apps/
│   ├── client/              # Admin Dashboard (React/Vite)
│   │   ├── src/
│   │   │   ├── routes/      # TanStack Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Utilities and helpers
│   │   └── package.json
│   │
│   └── kiosk/               # Self-Checkout Kiosk (Tauri/React)
│       ├── src/             # React frontend
│       ├── src-tauri/       # Rust backend
│       └── package.json
│
├── convex/                  # Backend Functions & Schema
│   ├── schema.ts            # Database schema definitions
│   ├── auth.config.ts       # Authentication configuration
│   ├── books.ts             # Book-related functions
│   ├── students.ts          # Student-related functions
│   ├── transactions.ts      # Circulation functions
│   └── http.ts              # HTTP API endpoints
│
├── packages/                # Shared internal packages
│   ├── ui/                  # Shared UI components library
│   │   ├── components/      # Reusable React components
│   │   └── lib/             # UI utilities (cn, etc.)
│   │
│   └── shared/              # Shared types and utilities
│       ├── types/           # TypeScript type definitions
│       └── utils/           # Common utility functions
│
├── scripts/                 # Build and deployment scripts
│   └── deploy.sh            # Automated deployment script
│
├── .env.*                   # Environment configurations
├── turbo.json               # Turborepo configuration
├── biome.json               # Biome linter/formatter config
├── firebase.json            # Firebase hosting configuration
├── generateKeys.mjs         # JWT key generation script
└── package.json             # Root package configuration
```

---

## 🛠️ Tech Stack

### Frontend Technologies

#### Core Framework & Tooling
- **[React 19](https://react.dev/)** - Latest version with concurrent features
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Type-safe development
- **[Vite 6](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[Bun](https://bun.sh/)** - Fast all-in-one JavaScript runtime and package manager

#### UI & Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
  - Avatar, Checkbox, Dialog, Dropdown Menu, Label, Progress, Select, Separator, Slot, Tabs, Toggle, Toggle Group, Tooltip
- **[Lucide React](https://lucide.dev/)** & **[Tabler Icons](https://tabler.io/icons)** - Beautiful icon sets
- **[Class Variance Authority](https://cva.style/)** - Type-safe component variants
- **[clsx](https://github.com/lukeed/clsx)** & **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Utility class management
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support
- **[Vaul](https://vaul.emilkowal.ski/)** - Drawer component for mobile

#### State Management & Data Fetching
- **[Convex](https://convex.dev/)** - Real-time backend with reactive queries
- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization
- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing with code splitting
- **[TanStack Table](https://tanstack.com/table)** - Headless table utilities

#### Forms & Validation
- **[TanStack Form](https://tanstack.com/form)** - Headless form management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[@tanstack/zod-form-adapter](https://tanstack.com/form)** - Integration between TanStack Form and Zod

#### Advanced Features
- **[@dnd-kit](https://dndkit.com/)** - Drag-and-drop functionality
  - Core, Sortable, Modifiers, Utilities
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[html5-qrcode](https://github.com/mebjas/html5-qrcode)** - Barcode/QR code scanning
- **[react-barcode-scanner](https://www.npmjs.com/package/react-barcode-scanner)** - Additional barcode scanning support
- **[date-fns](https://date-fns.org/)** - Modern date utility library
- **[Sonner](https://sonner.emilkowal.ski/)** - Beautiful toast notifications

### Desktop Application (Kiosk)
- **[Tauri v2](https://tauri.app/)** - Build smaller, faster, and more secure desktop applications
- **[Rust](https://www.rust-lang.org/)** - Tauri backend for native OS integration
- **[@tauri-apps/api](https://tauri.app/v2/reference/api/)** - JavaScript API for Tauri
- **[@tauri-apps/plugin-shell](https://tauri.app/v2/guides/shell/)** - Shell plugin for Tauri

### Backend & Infrastructure
- **[Convex](https://convex.dev/)** - Serverless backend platform
  - Real-time reactive database
  - Serverless functions
  - File storage
  - Built-in authentication
- **[@convex-dev/auth](https://labs.convex.dev/auth)** - Authentication for Convex
- **[@auth/core](https://authjs.dev/)** - Core authentication utilities
- **[Firebase Hosting](https://firebase.google.com/)** - Fast and secure web hosting

### Development Tools
- **[Turborepo](https://turbo.build/)** - High-performance monorepo build system
- **[Biome](https://biomejs.dev/)** - Fast linter and formatter (alternative to ESLint + Prettier)
- **[Concurrently](https://www.npmjs.com/package/concurrently)** - Run multiple commands simultaneously
- **[jose](https://github.com/panva/jose)** - JavaScript module for JWT operations
- **[tw-animate-css](https://www.npmjs.com/package/tw-animate-css)** - Animation utilities for Tailwind

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **[Bun](https://bun.sh/)** (v1.2.4 or higher)
   ```bash
   # Install Bun (macOS/Linux)
   curl -fsSL https://bun.sh/install | bash
   
   # Verify installation
   bun --version
   ```

2. **[Node.js](https://nodejs.org/)** (v18 or higher) - Required for some dependencies
   ```bash
   # Check version
   node --version
   ```

3. **[Rust](https://rustup.rs/)** - Required for building the Tauri Kiosk
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Verify installation
   rustc --version
   cargo --version
   ```

4. **[Convex Account](https://convex.dev/)** - Create a free account at convex.dev
   - The Convex CLI will be installed automatically with project dependencies

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/bookie.git
   cd bookie
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```
   This will install all dependencies for the monorepo, including the admin client, kiosk, and shared packages.

3. **Set up Convex Backend**
   
   a. Create a new Convex project (if you haven't already):
   ```bash
   npx convex dev --once
   ```
   This will prompt you to log in and create a new project.

   b. Note your Convex deployment URL (shown in the terminal or available in your Convex dashboard)

4. **Environment Setup**
   
   Create your environment files for local development:
   
   ```bash
   # Copy the example environment file
   cp .env.preview.example .env.local
   ```
   
   Edit `.env.local` and update the following variables:
   ```env
   # Convex Configuration
   CONVEX_DEPLOYMENT=your-deployment-name  # e.g., 'happy-animal-123'
   VITE_CONVEX_URL=https://your-deployment-name.convex.cloud
   
   # Optional: Additional configuration
   # VITE_APP_NAME=Bookie
   # VITE_API_URL=http://localhost:5173
   ```

5. **Generate Authentication Keys** (Required for production)
   ```bash
   bun run generateKeys.mjs
   ```
   This generates JWT signing keys needed for authentication.

6. **Start Development Servers**
   
   Start all services (Convex backend + Admin Client + Kiosk):
   ```bash
   bun run dev
   ```

   This will:
   - Start the Convex development server (watching for backend changes)
   - Start the Admin Client at **http://localhost:5173**
   - Start the Kiosk application in a desktop window

   **Alternative: Start services individually**
   ```bash
   # Start only the Admin Client
   bun run dev:client

   # Start only the Kiosk
   bun run dev:kiosk

   # Start only the Convex backend
   bun run dev:convex
   ```

7. **Initialize Database Schema**
   
   On first run, Convex will automatically push your schema to the database. You can verify this in the Convex dashboard.

8. **Create Admin Account**
   
   Open the Admin Client at http://localhost:5173 and create your first admin account through the authentication flow.

### Development Workflow

1. **Making Changes**
   - Frontend changes (admin/kiosk): Hot reload is enabled, changes reflect immediately
   - Backend changes (convex/): Convex dev server automatically redeploys functions
   - Shared packages: Turborepo handles incremental builds

2. **Code Quality**
   ```bash
   # Run linter
   bun run lint

   # Auto-fix linting issues
   bun run format

   # Type checking
   bun run type-check
   ```

3. **Testing**
   ```bash
   # Build all apps to check for errors
   bun run build
   ```

---

## 🔧 Scripts & Commands

### Development Commands

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start all applications and backend in development mode |
| `bun run dev:client` | Start only the Admin Dashboard |
| `bun run dev:kiosk` | Start only the Self-Checkout Kiosk |
| `bun run dev:convex` | Start only the Convex backend |

### Build Commands

| Command | Description |
| :--- | :--- |
| `bun run build` | Build all applications for production |
| `bun run build:client` | Build only the Admin Dashboard |

### Code Quality

| Command | Description |
| :--- | :--- |
| `bun run lint` | Run Biome linter on all code |
| `bun run format` | Format all code with Biome |
| `bun run type-check` | Run TypeScript type checking |

### Deployment Commands

| Command | Description |
| :--- | :--- |
| `bun run deploy` | Deploy to default environment |
| `bun run deploy:preview` | Deploy to preview/staging |
| `bun run deploy:production` | Deploy to production |
| `bun run deploy:convex:preview` | Deploy only Convex functions (preview) |
| `bun run deploy:convex:production` | Deploy only Convex functions (production) |
| `bun run deploy:client:preview` | Deploy only client app (preview) |
| `bun run deploy:client:production` | Deploy only client app (production) |

### Kiosk-Specific Commands

| Command | Description |
| :--- | :--- |
| `cd apps/kiosk && bun run tauri dev` | Run Kiosk in development mode |
| `cd apps/kiosk && bun run tauri build` | Build Kiosk installers for distribution |

---

## 📦 Deployment

### Prerequisites for Deployment

1. **Convex Production Deployment**: Create a production deployment in your Convex dashboard
2. **Firebase Project**: Set up a Firebase project for hosting (if using Firebase Hosting)
3. **Environment Variables**: Ensure all required environment variables are configured

### Backend (Convex) & Admin Client Deployment

The project includes an automated deployment script that handles both Convex backend and client deployment.

#### Step 1: Generate Authentication Keys

If you haven't already, generate JWT signing keys:

```bash
bun run generateKeys.mjs
```

This creates a `keys/` directory with public and private keys needed for authentication.

#### Step 2: Configure Production Environment

Create and configure your production environment file:

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your production values
# Required variables:
# - CONVEX_DEPLOYMENT (your production deployment name)
# - VITE_CONVEX_URL (your production Convex URL)
# - JWT_PRIVATE_KEY_PATH (path to your private key)
# - FIREBASE_PROJECT_ID (if using Firebase Hosting)
```

Example `.env.production`:
```env
CONVEX_DEPLOYMENT=your-prod-deployment
VITE_CONVEX_URL=https://your-prod-deployment.convex.cloud
JWT_PRIVATE_KEY_PATH=./keys/private_key.pem
FIREBASE_PROJECT_ID=your-firebase-project
```

#### Step 3: Deploy

**Deploy to Preview/Staging:**
```bash
bun run deploy:preview
```

**Deploy to Production:**
```bash
bun run deploy:production
```

The deployment script automatically:
1. Loads the appropriate environment variables
2. Builds the admin client with production optimizations
3. Deploys Convex functions and schema
4. Uploads client assets to Firebase Hosting
5. Runs database migrations if needed

**Partial Deployments:**

Deploy only backend:
```bash
bun run deploy:convex:production
```

Deploy only frontend:
```bash
bun run deploy:client:production
```

### Self-Checkout Kiosk Deployment

The kiosk application is built as a standalone desktop app that can be distributed to kiosk machines.

#### Build Kiosk Installers

```bash
cd apps/kiosk
bun install
bun run tauri build
```

This generates platform-specific installers:

**macOS:**
- `apps/kiosk/src-tauri/target/release/bundle/dmg/Bookie Kiosk_1.0.0_x64.dmg`
- `apps/kiosk/src-tauri/target/release/bundle/macos/Bookie Kiosk.app`

**Windows:**
- `apps/kiosk/src-tauri/target/release/bundle/msi/Bookie Kiosk_1.0.0_x64_en-US.msi`
- `apps/kiosk/src-tauri/target/release/bundle/nsis/Bookie Kiosk_1.0.0_x64-setup.exe`

**Linux:**
- `apps/kiosk/src-tauri/target/release/bundle/deb/bookie-kiosk_1.0.0_amd64.deb`
- `apps/kiosk/src-tauri/target/release/bundle/appimage/bookie-kiosk_1.0.0_amd64.AppImage`

#### Kiosk Configuration

Before building, configure the kiosk in `apps/kiosk/src-tauri/tauri.conf.json`:

```json
{
  "productName": "Bookie Kiosk",
  "version": "1.0.0",
  "identifier": "com.yourschool.bookie.kiosk",
  "build": {
    "beforeBuildCommand": "bun run build",
    "beforeDevCommand": "bun run dev",
    "devUrl": "http://localhost:5174"
  }
}
```

Update the production Convex URL in the kiosk environment configuration.

#### Distribution

1. Test the installer on a clean machine
2. Distribute installers via:
   - Network share
   - USB drives
   - Mobile Device Management (MDM) systems
   - Internal download portal

### Post-Deployment

1. **Verify Deployment**
   - Test all major features in production
   - Check authentication flows
   - Verify real-time synchronization
   - Test barcode scanning functionality

2. **Monitor**
   - Check Convex dashboard for errors
   - Monitor Firebase Hosting analytics
   - Review application logs

3. **Database Seeding** (if needed)
   - Import initial book catalog via CSV
   - Import student records
   - Configure system settings

---

## 📚 Usage Guide

### Admin Dashboard

#### Initial Setup

1. **Login**: Access the dashboard at your deployed URL
2. **Configure Settings**: Navigate to Settings → System Configuration
3. **Set Library Rules**:
   - Loan period (days)
   - Maximum books per student
   - Fine calculation rules
   - Overdue grace period

#### Managing Books

1. **Add Single Book**:
   - Navigate to Catalog → Add Book
   - Enter ISBN (or scan barcode)
   - System auto-fills metadata
   - Upload cover image
   - Set quantity and location
   - Save

2. **Bulk Import**:
   - Prepare CSV file with columns: ISBN, Title, Author, etc.
   - Navigate to Catalog → Import
   - Upload CSV file
   - Review and confirm import

3. **Edit/Remove Books**:
   - Find book in catalog
   - Click Edit or Delete
   - Modify details or confirm deletion

#### Managing Students

1. **Add Student**:
   - Navigate to Members → Students → Add Student
   - Enter student details
   - Scan or enter student ID
   - Save

2. **Bulk Import Students**:
   - Prepare CSV with student data
   - Navigate to Members → Import
   - Upload and verify

#### Processing Transactions

**Check Out:**
1. Scan student ID (or search manually)
2. Scan book barcode(s)
3. Confirm due date
4. Complete checkout

**Check In:**
1. Scan book barcode
2. System auto-calculates fines if overdue
3. Collect fine if applicable
4. Complete check-in

#### Generating Reports

1. Navigate to Reports
2. Select report type:
   - Circulation statistics
   - Overdue items
   - Popular books
   - Financial summary
3. Set date range
4. Export as CSV/PDF

### Self-Checkout Kiosk

The kiosk is designed for student self-service:

1. **Student scans their ID card**
2. **Student scans book barcode(s)**
3. **System displays due date**
4. **Student confirms checkout**
5. **Receipt displayed (and optionally printed)**

**Admin Override:**
- Press hidden admin button (configurable)
- Enter admin credentials
- Access settings or exit kiosk mode

---

## 🧪 Testing

### Manual Testing Checklist

**Admin Dashboard:**
- [ ] User authentication (login/logout)
- [ ] Add/edit/delete books
- [ ] ISBN lookup and barcode scanning
- [ ] Check out books to students
- [ ] Check in books
- [ ] Fine calculation for overdue books
- [ ] Generate and export reports
- [ ] CSV import for books and students
- [ ] Dark mode toggle
- [ ] Responsive design (mobile/tablet)

**Kiosk:**
- [ ] Student ID scanning
- [ ] Book barcode scanning
- [ ] Self-checkout flow
- [ ] Session timeout
- [ ] Kiosk mode restrictions
- [ ] Admin override access

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Convex connection failed**
- Verify `VITE_CONVEX_URL` in your `.env.local` file
- Ensure Convex dev server is running (`bun run dev:convex`)
- Check Convex dashboard for deployment status

**Issue: Barcode scanner not working**
- Grant camera permissions in browser/OS
- Ensure HTTPS connection (required for camera access)
- Try a different browser (Chrome/Edge recommended)
- Check camera device selection

**Issue: Build errors in Kiosk**
- Ensure Rust toolchain is installed (`rustc --version`)
- Update Rust: `rustup update`
- Clear build cache: `cd apps/kiosk/src-tauri && cargo clean`

**Issue: Hot reload not working**
- Restart dev server
- Clear browser cache
- Check for file watcher limits (Linux: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`)

**Issue: TypeScript errors after dependency update**
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall: `bun install`
- Rebuild: `bun run build`

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or suggestions, your input is valued.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/bookie.git
   cd bookie
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add/update tests if applicable
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "Add: amazing new feature"
   ```
   
   Use conventional commit messages:
   - `Add:` new features
   - `Fix:` bug fixes
   - `Update:` updates to existing features
   - `Docs:` documentation changes
   - `Refactor:` code refactoring
   - `Style:` formatting changes
   - `Test:` test additions/changes

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes

### Development Guidelines

- **Code Style**: Run `bun run format` before committing
- **Linting**: Ensure `bun run lint` passes
- **Type Safety**: Maintain TypeScript type safety
- **Testing**: Add tests for new features
- **Documentation**: Update README and inline comments

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🌐 Internationalization (i18n)
- ♿ Accessibility enhancements
- 🎨 UI/UX improvements
- 🧪 Test coverage
- 🔧 Performance optimizations

---

## 🙏 Acknowledgments

This project would not have been possible without the incredible work of open-source maintainers and the amazing developer community. We extend our deepest gratitude to the following projects and teams:

### Core Technologies

#### Frontend Framework & Build Tools
- **[React](https://react.dev/)** - The foundational UI library by Meta (Facebook) that powers our entire frontend
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling created by Evan You
- **[TypeScript](https://www.typescriptlang.org/)** - Microsoft's typed superset of JavaScript
- **[Bun](https://bun.sh/)** - Jarred Sumner's incredibly fast JavaScript runtime and toolkit

#### Backend & Database
- **[Convex](https://convex.dev/)** - Revolutionary real-time backend platform that makes backend development delightful
- **[@convex-dev/auth](https://labs.convex.dev/auth)** - Authentication library for Convex
- **[@auth/core](https://authjs.dev/)** - Core authentication utilities from the Auth.js team

#### Desktop Application
- **[Tauri](https://tauri.app/)** - Build smaller, faster, and more secure desktop applications with Rust
- **[Rust](https://www.rust-lang.org/)** - Systems programming language by Mozilla Research

### UI & Styling

#### CSS & Design System
- **[Tailwind CSS](https://tailwindcss.com/)** - Adam Wathan's utility-first CSS framework
- **[@tailwindcss/vite](https://tailwindcss.com/)** - Official Vite plugin for Tailwind CSS
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives by WorkOS
- **[Shadcn UI](https://ui.shadcn.com/)** - Re-usable components built with Radix UI and Tailwind (inspiration for our components)

#### Component Libraries & Utilities
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon toolkit
- **[Tabler Icons](https://tabler.io/icons)** - Over 5000 pixel-perfect icons
- **[Class Variance Authority (CVA)](https://cva.style/)** - Type-safe component variants by Joe Bell
- **[clsx](https://github.com/lukeed/clsx)** - Tiny utility for constructing className strings by Luke Edwards
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind CSS classes without style conflicts
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Perfect dark mode by Paco Coursey
- **[Vaul](https://vaul.emilkowal.ski/)** - Unstyled drawer component by Emil Kowalski
- **[Sonner](https://sonner.emilkowal.ski/)** - Opinionated toast component by Emil Kowalski

### State Management & Data

#### TanStack Ecosystem
Special thanks to **[Tanner Linsley](https://github.com/tannerlinsley)** and the TanStack team for their incredible suite of tools:
- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing with built-in code splitting
- **[TanStack Query](https://tanstack.com/query)** - Powerful asynchronous state management
- **[TanStack Form](https://tanstack.com/form)** - Headless, framework-agnostic form utilities
- **[TanStack Table](https://tanstack.com/table)** - Headless UI for building powerful tables
- **[@tanstack/zod-form-adapter](https://tanstack.com/form)** - Zod integration for TanStack Form
- **[@tanstack/router-plugin](https://tanstack.com/router)** - Vite plugin for TanStack Router
- **[@tanstack/react-router-devtools](https://tanstack.com/router)** - Developer tools for debugging routes

#### Form & Validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation by Colin McDonnell

### Advanced Features & Integrations

#### Drag & Drop
The **[dnd kit](https://dndkit.com/)** family by Claudéric Demers:
- **[@dnd-kit/core](https://docs.dndkit.com/)** - Lightweight, modular drag and drop toolkit
- **[@dnd-kit/sortable](https://docs.dndkit.com/presets/sortable)** - Sortable preset
- **[@dnd-kit/modifiers](https://docs.dndkit.com/api-documentation/modifiers)** - Modify drag behavior
- **[@dnd-kit/utilities](https://docs.dndkit.com/api-documentation/utilities)** - Common utilities

#### Data Visualization
- **[Recharts](https://recharts.org/)** - Composable charting library built on React components

#### Barcode & QR Code Scanning
- **[html5-qrcode](https://github.com/mebjas/html5-qrcode)** - Lightweight QR/barcode scanner by Minhaz
- **[react-barcode-scanner](https://www.npmjs.com/package/react-barcode-scanner)** - React wrapper for barcode scanning

#### Date & Time
- **[date-fns](https://date-fns.org/)** - Modern JavaScript date utility library

### Development Tools

#### Monorepo & Build
- **[Turborepo](https://turbo.build/)** - High-performance build system by Vercel
- **[Concurrently](https://github.com/open-cli-tools/concurrently)** - Run multiple commands concurrently

#### Code Quality
- **[Biome](https://biomejs.dev/)** - Fast formatter and linter (alternative to ESLint + Prettier)
- **[@biomejs/biome](https://biomejs.dev/)** - The core Biome toolchain

#### Security & Cryptography
- **[jose](https://github.com/panva/jose)** - Universal JavaScript module for JWT by Filip Skokan

### Hosting & Deployment
- **[Firebase Hosting](https://firebase.google.com/)** - Fast and secure web hosting by Google
- **[Vercel](https://vercel.com/)** - Platform for deploying modern web applications (alternative hosting option)

### Design & Animation
- **[tw-animate-css](https://www.npmjs.com/package/tw-animate-css)** - Beautiful CSS animations for Tailwind

### Community & Ecosystem

We're also grateful to:
- **The entire React community** for countless tutorials, blog posts, and open-source contributions
- **TypeScript community** for advancing type-safe JavaScript development
- **Vite contributors** for revolutionizing frontend build tooling
- **Convex team** for making real-time backends accessible and delightful
- **Tauri contributors** for enabling truly cross-platform desktop apps with web technologies
- **Radix UI team** for championing accessibility in component design
- **All open-source maintainers** who dedicate their time to making the web better

### Special Mentions

- **Bun team** for creating the fastest JavaScript all-in-one toolkit
- **Vercel team** for Turborepo and continuous innovation in developer tooling
- **The Rust Foundation** for supporting the Rust programming language
- **Mozilla** for their contributions to web standards and Rust

### Educational Resources

Thanks to the creators of tutorials, documentation, and courses that helped shape this project:
- Official documentation sites (React, Convex, Tauri, etc.)
- YouTube educators and technical bloggers
- Stack Overflow community
- Dev.to writers
- GitHub Discussions participants

---

**This project stands on the shoulders of giants.** 🙌

If we've missed acknowledging anyone, please let us know via an issue or pull request!

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### MIT License Summary

```
MIT License

Copyright (c) 2026 Bookie Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support

### Getting Help

- **Documentation**: Check this README and inline code documentation
- **Issues**: [GitHub Issues](https://github.com/yourusername/bookie/issues) for bug reports and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bookie/discussions) for questions and community support

### Reporting Bugs

When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable)
5. Environment details (OS, browser, versions)

---

## 🗺️ Roadmap

### Planned Features

- [ ] **Multi-language Support (i18n)**: Interface in multiple languages
- [ ] **Advanced Analytics Dashboard**: More detailed insights and visualizations
- [ ] **Mobile Apps**: Native iOS and Android applications for librarians
- [ ] **Offline-First Kiosk**: Queue transactions when network is unavailable
- [ ] **Receipt Printing**: Hardware integration for transaction receipts
- [ ] **Email Notifications**: Automated reminders for due dates and overdues
- [ ] **Book Recommendations**: AI-powered reading suggestions
- [ ] **Digital Reading Integration**: Link to e-books and audiobooks
- [ ] **Parent Portal**: Allow parents to view student borrowing history
- [ ] **Fine Payment Integration**: Accept online fine payments
- [ ] **Multi-library Support**: Manage multiple library branches
- [ ] **Advanced Reporting**: Customizable report builder
- [ ] **API Documentation**: Public API for third-party integrations

---

## 💖 Support the Project

If you find Bookie useful, please consider:
- ⭐ **Starring the repository** on GitHub
- 🐛 **Reporting bugs** to help improve the project
- 💡 **Suggesting features** to make it even better
- 📖 **Improving documentation** for other users
- 🤝 **Contributing code** to add new capabilities
- 📣 **Sharing the project** with others who might benefit

---

<div align="center">

**Made with ❤️ for schools and libraries everywhere**

[⬆ Back to Top](#-bookie---modern-school-library-management-system)

</div>
