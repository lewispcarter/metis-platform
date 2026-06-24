# Setup

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker

## Local Infrastructure

Run PostgreSQL and Redis:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

## Install Dependencies

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Database and Queue Foundation

The backend expects PostgreSQL and Redis.

Start local infrastructure:

```bash
cd infrastructure/docker
docker compose up -d
```

Generate Prisma client and apply schema:

```bash
cd apps/api
pnpm prisma generate
pnpm prisma db push
```

Run the API:

```bash
pnpm dev
```

## Seed Local Demo Data

After the database is running and migrations are applied, seed the reference workflow:

```bash
pnpm --filter @metis/api seed:demo
```

This creates the deterministic `demo-org-metis` tenant and a complete personnel coverage scenario.

Then configure the web app:

```bash
NEXT_PUBLIC_DEMO_ORGANIZATION_ID=demo-org-metis
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

The dashboard falls back to safe demo rows when no backend tenant is configured.

## E2E Coverage Workflow Test

Run the reference workflow API path test:

```bash
pnpm --filter @metis/api test:e2e
```

The test validates seeded scenario visibility across event, workflow, personnel, and assignment APIs.


## Database Migration Commands

Generate Prisma client:

```bash
pnpm db:generate
```

Run local migrations:

```bash
pnpm db:migrate
```

Apply production migrations:

```bash
pnpm db:deploy
```

## Readiness Check

Run the static readiness check before deployment:

```bash
pnpm readiness:check
```

Start the API and inspect runtime readiness:

```http
GET /readiness
```

## Local API Auth Context

Use development auth headers while testing protected endpoints:

```bash
curl http://localhost:3001/api/v1/events \
  -H "x-user-id: user_demo" \
  -H "x-organization-id: demo-org" \
  -H "x-role: Owner"
```

The API injects `organizationId` from the authenticated tenant when it is missing. If a request supplies a different `organizationId`, the API rejects the request to prevent tenant data leakage.

## API Documentation

After starting the API, open:

```bash
http://localhost:3001/api/docs
```

## Local Development Auth

Until Clerk is fully configured, protected API routes can be tested with trusted local headers:

```http
x-user-id: user_demo_owner
x-organization-id: <organization_uuid>
x-role: Owner
```

## Clerk Auth Boundary

Production authentication uses Clerk through the API identity boundary.

Set these environment variables before enabling real provider authentication:

```bash
CLERK_SECRET_KEY=<secret>
CLERK_PUBLISHABLE_KEY=<publishable>
```

Clerk JWT claims must include tenant and role context.

## Identity Sync Development Headers

For local API testing without Clerk, include:

```text
x-user-id: local_owner
x-organization-id: org_demo
x-role: Owner
x-user-email: owner@local.metis
x-user-name: Local Owner
```

The API will create or update the matching organization, role, user, and organization membership records automatically.


## v16 Update — Provider Routing & Settings Administration

This build adds administrator-controlled webhook route management and provider configuration surfaces. Tenant administrators can now register inbound provider addresses, disable routes, view provider readiness metadata, and upsert SMS/voice/email provider configuration records through protected settings endpoints. Public inbound webhooks still resolve tenant scope through active route records and reject unrouted production traffic.


## Local Startup Guide

The project now includes a dedicated startup runbook at [LOCAL_START.md](LOCAL_START.md).

Primary commands:

```bash
pnpm sanity:check
pnpm local:bootstrap
pnpm dev
```

Use `pnpm sanity:check` before full dependency installation to verify that the ZIP extracted correctly and all required project files exist.
