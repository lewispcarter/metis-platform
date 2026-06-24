# Metis Platform

AI-native operational coordination infrastructure for event-driven workflows, personnel coordination, communications orchestration, escalation management, and auditability.

## Status

Greenfield foundation scaffold generated from the approved architecture plan.

## Architecture

- Apps: `apps/api`, `apps/web`
- Shared packages: contracts, auth, events, validation, utilities
- Infrastructure: Docker, deployment, monitoring, scripts
- Tests: integration, E2E, fixtures, utilities

## Core Principle

Every operational action begins with or produces an event.

## Current Build Status

Implemented foundation layers:

- Monorepo structure
- NestJS API scaffold
- Next.js web scaffold
- PostgreSQL/Prisma schema and migration
- Redis/BullMQ queue foundation and processors
- Prisma database service
- Organization persistence
- Operational event persistence
- Workflow engine foundation
- Personnel coordination module
- Assignment module
- Communication service foundation
- Escalation module
- Acknowledgment module
- Append-only audit persistence
- Internal domain event bus
- RBAC role/permission scaffold
- Clerk authentication boundary
- Tenant scoping middleware and `@CurrentTenant()` usage
- OpenAPI/Swagger documentation at `/api/docs`
- GitHub Actions CI workflow

## Local Development

1. Install dependencies.
2. Start PostgreSQL and Redis with Docker Compose.
3. Run Prisma migrations.
4. Start the API and web apps.

See [`docs/SETUP.md`](docs/SETUP.md) for commands.

## Security

See [`docs/SECURITY.md`](docs/SECURITY.md) for auth, tenant scoping, and RBAC rules.

## API

See [`docs/API.md`](docs/API.md) or open `/api/docs` after starting the API.


## Local Execution

Run the dependency-free repository shape check first:

```bash
pnpm sanity:check
```

Then bootstrap the local development environment:

```bash
pnpm local:bootstrap
pnpm dev
```

See [docs/LOCAL_START.md](docs/LOCAL_START.md) for the full local startup path.


## v33 Personnel Availability Integration

This build links personnel assignment state to the availability board.

Validation:
1. Create or open an event.
2. Acknowledge or escalate it.
3. Assign an available owner.
4. Open Personnel.
5. Confirm the assigned person shows as assigned to that event.
6. Change personnel availability from the Personnel page.
7. Confirm unavailable personnel cannot be assigned to another event.
8. Resolve the event and confirm the assigned person returns to Available.


## v35 Personnel Sync Hotfix

Personnel board now refreshes from local persistent event/personnel state on focus, page show, visibility return, storage change, and manual Refresh Board click. Assigned counts are derived from non-resolved event assignments.


## V36

Adds centralized command lifecycle store for events, personnel, communications, audit, and assignment reconciliation.


## V37 Operational Communications Dashboard
- Communications center metrics
- Assignment reconciliation helper
- Stability release


## V38 Workload Intelligence

Adds `/intelligence` for operational decision support:
- personnel workload scores
- assignment balancing
- best-candidate recommendation
- overloaded personnel warnings
- coverage gap alerts
- staffing health metrics
- event-to-personnel ratio


## V39 Deployment Readiness

Adds public-preview deployment preparation:
- Vercel configuration
- Deployment Control page
- Domain connection guidance
- Deployment scripts
- Public preview checklist

Recommended URL:
`app.metissystems.com`


## V40 Install-Safe Fix

This version removes generated dependency/build artifacts from the ZIP and keeps the PostgreSQL foundation install-safe.

Test:
`pnpm install`
`pnpm ci:local`
`pnpm dev`


## V40 Sanity Env Fix

Fixes `pnpm ci:local` failing at workspace sanity check by adding required local placeholder environment keys.

Run:
`pnpm install`
`pnpm ci:local`
`pnpm dev`


## V41 Authentication Foundation

Adds local-safe RBAC foundation:
- `/auth`
- demo session
- role permissions
- route policy
- access denied page

Run:
`pnpm install`
`pnpm ci:local`
`pnpm dev`


## V42 Public Beta

First showable beta build.

Added:
- `/beta`
- `/launch`
- public beta readiness checklist
- demo script
- Vercel/domain setup guidance

Recommended demo URL:
`app.metissystems.com`
