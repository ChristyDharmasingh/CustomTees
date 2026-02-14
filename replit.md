# Customer Order Management System

## Overview
Production-ready internal tool for managing customers, orders, products (with variant support), and analytics. Built with a full-stack architecture using Express + React with PostgreSQL database.

## Recent Changes
- **Feb 14, 2026**: Added User Management page (admin-only)
  - API endpoints: GET/POST /api/users, DELETE /api/users/:id (admin-only)
  - User Management page under Settings > User Management (/settings/users)
  - Admin-only nav items hidden from employee users
  - Auto-seed admin user on server startup when database is empty
- **Feb 14, 2026**: Full-stack implementation complete
  - PostgreSQL database with Drizzle ORM
  - JWT authentication with role-based access (admin/employee)
  - Complete REST API for all resources
  - Sidebar navigation with grouped sections (Operations, Inventory, Analytics, Settings)
  - All pages connected to real API data via TanStack Query
  - Analytics pages: Sales Overview, Product Performance, Monthly Revenue, Monthly Purchases
  - Inventory pages: Stock Levels, Low Stock Alerts
  - CRUD pages: New Order, Add Customer, Add Product
  - Settings page with dark mode toggle and user info

## User Preferences
- "Glass + grain" aesthetic using Space Grotesk (headings) and Plus Jakarta Sans (UI)
- Sidebar layout with grouped navigation sections
- Product variants with size/color support
- Tailwind CSS v4 with CSS variables in H S% L% format

## Project Architecture

### Tech Stack
- **Frontend**: React 19, TanStack Query, wouter, Tailwind CSS v4, shadcn/ui, Recharts
- **Backend**: Express.js, JWT auth (jsonwebtoken + bcrypt)
- **Database**: PostgreSQL with Drizzle ORM (node-postgres driver)
- **Build**: Vite, TypeScript, tsx

### File Structure
```
client/src/
  pages/           - All page components (dashboard, orders, customers, products, analytics, settings, etc.)
  components/      - Shared components (app-shell.tsx, ui/ shadcn components)
  lib/             - Auth context, API client, format utils, query client
server/
  routes.ts        - Express API routes
  storage.ts       - Database storage interface (Drizzle queries)
  auth.ts          - JWT auth middleware (requireAuth, requireAdmin)
  seed.ts          - Database seeder
  index.ts         - Server entry point
shared/
  schema.ts        - Drizzle schema (users, customers, products, variants, orders, orderItems, purchases)
```

### Key Technical Details
- Default admin: admin@company.com / admin123
- JWT tokens stored in localStorage, user data stored separately
- API returns numeric IDs, string amounts (parse with parseFloat), lowercase status values
- Stock health badges use product's lowStockThreshold
- Order creation auto-deducts stock from products/variants
- Analytics endpoints: /api/analytics/overview, /api/analytics/revenue/monthly, /api/analytics/purchases/monthly, /api/analytics/products/best-selling

### Navigation Structure
- Dashboard
- Operations: Orders, New Order, Customers, Add Customer
- Inventory: All Products, Add Product, Stock Levels, Low Stock Alerts
- Analytics: Sales Overview, Product Performance, Monthly Revenue, Monthly Purchases
- Settings: Preferences, User Management (admin-only)
