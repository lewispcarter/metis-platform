# Production Readiness

## Purpose

This document defines the production-readiness gates for the operational coordination platform.

## Required Checks

1. Environment validation passes before API boot.
2. PostgreSQL is reachable through Prisma.
3. Redis queue configuration is present.
4. External providers are explicitly configured or the system runs in demo mode.
5. Prisma migrations are applied before deployment.
6. TypeScript typecheck passes across the monorepo.
7. Unit and E2E test suites pass before deploy.

## Commands

```bash
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm readiness:check
pnpm typecheck
pnpm test
```

## API Endpoint

```http
GET /readiness
```

The endpoint returns `PASS`, `WARN`, or `FAIL` with specific infrastructure checks.

## Deployment Gate

A production deployment must not proceed when readiness status is `FAIL`.

A `WARN` status is acceptable only for demo environments where Twilio, SendGrid, or AI provider keys are intentionally absent.

## Security Readiness Additions

v0.8 adds the first real security boundary:

- Auth context normalization through `AuthBoundaryService`
- Tenant scope enforcement through middleware
- Global RBAC guard registration
- Strict request validation through `ApiValidationPipe`
- Tenant spoofing rejection for query/body organization mismatches

Before production, the development header auth boundary must be replaced with verified provider token validation from Clerk/Auth0. The internal actor shape should remain stable so application modules do not change.
