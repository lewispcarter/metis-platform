# Production Bootstrap Checklist

Use this checklist before any real customer or government-adjacent deployment.

## Environment

- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` points to a managed PostgreSQL database.
- [ ] `REDIS_URL` points to a managed Redis instance.
- [ ] `CLERK_SECRET_KEY` is configured.
- [ ] `WEBHOOK_PUBLIC_BASE_URL` uses HTTPS.
- [ ] `TWILIO_AUTH_TOKEN` is configured.

## Security

- [ ] Development auth headers are disabled by production environment checks.
- [ ] Public Twilio webhook signature validation is enabled.
- [ ] Inbound phone numbers are mapped through webhook routes.
- [ ] Tenant scoping middleware is active on protected routes.
- [ ] RBAC guard is globally registered.

## Database

- [ ] Prisma migrations are deployed with `pnpm db:deploy`.
- [ ] Prisma client is generated.
- [ ] Organization records exist before user onboarding.
- [ ] Audit event table is append-only by application policy.

## Operations

- [ ] `/api/v1/health` responds successfully.
- [ ] `/api/v1/readiness` returns deployment-ready status.
- [ ] Structured logs are collected.
- [ ] Queue workers are running.
- [ ] Dead-letter behavior is monitored.

## Communications

- [ ] Twilio provider configuration is stored for each active organization.
- [ ] Email provider configuration is stored for each active organization.
- [ ] Provider secrets are not exposed by settings APIs.
- [ ] Communication failures create audit-visible records.
