# CustomTees OMS - Deployment Guide
## Replit → GitHub → Google Cloud Platform (Cloud SQL + Cloud Run)

This document describes the complete process followed to migrate the application from Replit to Google Cloud Platform.

---

# Architecture

Development Environment
- Replit (initially)
- Local Mac (GitHub clone)

Source Control
- GitHub

Database
- Google Cloud SQL (PostgreSQL)

ORM
- Drizzle ORM

Deployment Target
- Google Cloud Run

---
* client/ → frontend (probably React + Vite)
* server/ → backend (Node API)
* shared/ → shared types or utilities
* attached_assets/ → uploaded/static files
* drizzle.config.ts → database ORM config
* vite.config.ts → frontend bundler config

So this looks like a monorepo style full-stack app.

----
Understanding Your Structure (High Level)

# Step 1 - Export Project from Replit

1. Open the Replit project.
2. Export/push the project to a GitHub repository.
3. Verify the repository contains:
   - package.json
   - server/
   - client/
   - shared/
   - drizzle.config.ts
   - migrations folder (if available)

---

# Step 2 - Clone Repository Locally

Clone the repository.

```bash
git clone <repository-url>
cd <repository>
```

---

# Step 3 - Create a Google Cloud Project

1. Create a new Google Cloud Project.
2. Enable billing.
3. Enable required APIs:
   - Cloud SQL Admin API
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API

---

# Step 4 - Create Cloud SQL PostgreSQL Instance

Create a PostgreSQL instance.

Choose:
- Region
- PostgreSQL version
- Instance name

Create:

- Database
- Database user
- Password

Save:

- Instance name
- Database name
- Username
- Password

---

# Step 5 - Enable Connectivity

Initially enable Public IP.

Authorize your local machine IP under:

Cloud SQL
→ Connections
→ Authorized Networks

Use:

YourIPAddress/32

This allows running Drizzle migration from the local machine.

---

# Step 6 - Configure DATABASE_URL

Example:

```
postgresql://USERNAME:PASSWORD@PUBLIC_IP:5432/DATABASE_NAME
```

If password contains special characters:

URL encode the password.

Example:

```
!
↓

%21
```

Export:

```bash
export DATABASE_URL="postgresql://..."
```

---

# Step 7 - Verify Drizzle Configuration

Project contains:

```
drizzle.config.ts
```

which references:

```
shared/schema.ts
```

No migration folder existed initially.

---

# Step 8 - Generate Database Migration

Run:

```bash
npx drizzle-kit generate
```

This creates the migration folder.

---

# Step 9 - Apply Database Schema

Run:

```bash
npx drizzle-kit migrate
```

or

```bash
npx drizzle-kit push
```

This creates all database tables in Cloud SQL.

Verify tables from:

Cloud SQL
→ Query Editor

---

# Step 10 - Commit Schema Changes

Commit:

- shared/schema.ts
- drizzle.config.ts
- migration folder

These files should always be version controlled.

---

# Step 11 - Environment Variables

Application requires:

- DATABASE_URL
- JWT_SECRET
- NODE_ENV
- PORT (provided automatically by Cloud Run)

Example:

```
DATABASE_URL=...
JWT_SECRET=...
NODE_ENV=production
```

---

# Step 12 - Verify Application Uses PORT

Server should use:

```ts
const port = process.env.PORT || 5000;
```

Cloud Run injects the PORT automatically.

---

# Step 13 - Prepare Dockerfile

Create:

```
Dockerfile
```

Basic flow:

- Node 20
- npm install
- npm run build
- npm start

---

# Step 14 - Create Cloud Run Service

Cloud Run

→ Create Service

Recommended:

Deploy from Source Repository (GitHub)

Cloud Build automatically:

- Builds container
- Stores image
- Deploys service

---

# Step 15 - Connect GitHub

Authorize GitHub.

Select:

- Repository
- Branch

Cloud Build handles future builds.

---

# Step 16 - Build Configuration

Build Command

```
npm run build
```

Start Command

```
npm start
```

Runtime

Node.js 20

---

# Step 17 - Connect Cloud SQL

During Cloud Run creation:

Connections

↓

Cloud SQL

↓

Select PostgreSQL instance.

---

# Step 18 - Configure Production DATABASE_URL

Use Cloud SQL socket connection.

Example:

```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE
```

Do NOT use Public IP inside Cloud Run.

---

# Step 19 - Cloud Run Environment Variables

Add:

DATABASE_URL

JWT_SECRET

NODE_ENV=production

PORT is automatically injected.

---

# Step 20 - IAM Permissions

Cloud Run Service Account requires:

Cloud SQL Client

Role:

```
Cloud SQL Client
```

---

# Step 21 - Deploy

Click:

Deploy

Cloud Build will:

- Build application
- Push container
- Deploy to Cloud Run

Cloud Run returns a public URL.

---

# Step 22 - Verify

Open Cloud Run URL.

Verify:

- Application loads
- Database connection succeeds
- CRUD operations work

---

# Git Workflow

Whenever code changes:

```bash
git add .
git commit -m "Description"
git push
```

---

# Database Workflow

Whenever schema changes:

1. Update `shared/schema.ts`

2. Generate migration

```bash
npx drizzle-kit generate
```

3. Apply migration

```bash
npx drizzle-kit migrate
```

(or)

```bash
npx drizzle-kit push
```

4. Commit:

- schema.ts
- migration folder

5. Push to GitHub

6. Deploy Cloud Run

---

# Notes

- Always commit schema changes.
- Always commit migration files.
- Do not rely on Docker or Cloud Run to automatically migrate the database.
- Apply database migrations before deploying updated application code.
- Keep Cloud SQL schema and Git repository in sync.
