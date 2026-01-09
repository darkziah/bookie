# Bookie - School Library Management System

A modern, full-featured library management system built with React, Convex, and Tauri.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (package manager)
- [Rust](https://rustup.rs/) (for Tauri kiosk)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for deployment)
- Convex account

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd bookie

# Install dependencies
bun install

# Start local development
bun run dev
```

### Running Locally

```bash
# This starts Convex dev server and both Client & Kiosk in dev mode
bun run dev
```

Admin Dashboard: [http://localhost:5173](http://localhost:5173)

## Deployment

We use **Convex** for the backend and **Firebase Hosting** for the admin dashboard.

### 1. Prerequisites
Ensure you have the following ready:
- Convex Project (Production or Staging)
- Firebase Project
- Deploy Keys (see below)

### 2. Configure Environment
Create `.env.preview` or `.env.production` in the root directory based on the examples provided:

```bash
cp .env.preview.example .env.preview
# or
cp .env.production.example .env.production
```

Fill in the required keys. You can generate the JWT keys using:
```bash
bun generateKeys.mjs
```

### 3. Deploy
Run the deployment script:

```bash
# Deploy to Preview/Staging
bun run deploy:preview

# Deploy to Production
bun run deploy:production
```

The script will automatically build the client and deploy both the backend (Convex) and frontend (Firebase Hosting).

## Kiosk Application (Tauri)

The kiosk is a standalone desktop application for student self-checkout.

```bash
# Development
bun run dev:kiosk

# Build installers
cd apps/kiosk
bun run tauri build
```

Installers will be generated in `apps/kiosk/src-tauri/target/release/bundle/`.

## Features

- **Dashboard**: Overview stats, recent activity
- **Circulation**: Checkout/check-in books with barcode scanning
- **Catalog**: Book management with ISBN lookup and cover upload
- **Students**: Student registration and management
- **Reports**: Circulation, collection, overdue, and financial reports
- **Inventory**: Bulk inventory scanning with discrepancy reports
- **Import**: CSV bulk import for books and students

## Support

For issues, contact your system administrator.
