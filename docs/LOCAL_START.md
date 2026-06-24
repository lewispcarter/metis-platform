# Local Startup Guide

This guide explains how to run the Metis platform foundation locally after downloading the ZIP artifact.

## Prerequisites

Install these tools first:

- Node.js 22 or newer
- pnpm through Corepack
- Docker Desktop
- VS Code

Enable pnpm:

```bash
corepack enable
```

## One-Command Bootstrap

From the project root, run:

```bash
pnpm local:bootstrap
```

This command performs the local startup sequence:

1. Creates `.env` from `.env.example` when missing.
2. Runs the workspace sanity check.
3. Starts PostgreSQL and Redis through Docker Compose.
4. Installs dependencies.
5. Generates the Prisma client.
6. Runs database migrations.
7. Seeds demo data.

## Start Development Servers

Run:

```bash
pnpm dev
```

Expected local services:

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- Web dashboard: `http://localhost:3000`

## Validate The Foundation

Run:

```bash
pnpm sanity:check
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm sanity:check` before dependency installation when you only need to verify that the repository shape is intact.

## Local Authentication Mode

Development requests can use controlled auth headers while Clerk production setup is pending:

```text
x-metis-user-id: dev-user-1
x-metis-organization-id: demo-org
x-metis-role: Owner
```

Production must use Clerk bearer tokens and must not rely on development headers.

## Local Webhook Testing

Local webhook signature bypass is allowed only outside production. Production requires signed Twilio webhook validation and routed inbound phone numbers.

Required production keys:

```text
WEBHOOK_PUBLIC_BASE_URL
TWILIO_AUTH_TOKEN
```

## Troubleshooting

If Prisma client generation fails, run:

```bash
pnpm --filter @metis/api prisma:generate
```

If migrations fail, confirm PostgreSQL is running:

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

If tenant-scoped routes reject requests, confirm the authenticated organization context matches the target organization.
