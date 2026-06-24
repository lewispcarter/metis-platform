# Security Model

## Purpose

The platform uses an authentication boundary so provider-specific identity logic never leaks into operational modules.

## Authentication Boundary

`IdentityModule` resolves an authenticated actor from either:

1. Clerk bearer token in the `Authorization` header.
2. Local development headers for non-production testing.

Production requests should use:

```http
Authorization: Bearer <clerk_jwt>
```

The Clerk token must provide organization and role claims.

## Tenant Scoping

Protected controllers derive `organizationId` from authenticated tenant context with `@CurrentTenant()`.

This prevents clients from switching tenants by changing query-string or request-body organization ids.

## RBAC

RBAC is enforced globally through `RbacGuard`.

Current roles:

- Owner
- Admin
- OperationsManager
- Supervisor
- Operator
- StaffMember
- Auditor

## Operational Security Rules

1. Every protected route requires an authenticated actor.
2. Every protected route is tenant-scoped.
3. Every operational mutation requires explicit permission.
4. Audit records remain append-only.
5. Clerk remains isolated behind `ClerkAuthProvider` and `AuthBoundaryService`.

## Database-Backed Identity Attribution

External auth providers are treated as verification boundaries only. After verification, the platform syncs the actor into internal `user` and `organization_membership` records. Audit logs should use the database-backed platform user id rather than raw provider ids.

Development headers supported locally:

```text
x-user-id
x-organization-id
x-role
x-user-email
x-user-name
x-provider-user-id
```

Production requests should use Clerk bearer tokens. The identity boundary can later be replaced with Auth0 or enterprise SSO without rewriting operational modules.

## Authenticated Actor Attribution

Core mutation paths now accept the normalized authenticated actor from the identity boundary and pass it into audit recording. When a platform user is present, audit rows store the database-backed `platformUserId`. Background workflows still record as `SYSTEM` with an explicit attribution fallback marker.

Protected mutation paths covered:

- Operational events
- Workflows
- Personnel records
- Availability windows
- Coverage requests
- Assignments
- Communications
- Acknowledgments
- Escalations
- Admin user role/status changes

## Operator Activity Feed

The `/api/v1/activity` endpoint exposes an operator-facing feed generated from immutable audit events. This keeps compliance logging as the source of truth while giving supervisors and auditors a product surface for accountability.

## Public Webhook Security Boundary

Public webhook routes are treated as untrusted ingress. Twilio SMS and voice endpoints now enforce:

- signed webhook verification using `X-Twilio-Signature`;
- production-safe rejection when signatures are missing or invalid;
- destination-phone-number tenant routing;
- production rejection for unrouted inbound phone numbers;
- audit records for matched and unmatched inbound communications.

Tenant context must come from configured webhook routes in production. Payload-provided organization identifiers are development-only conveniences and must not be trusted for production routing.


## v16 Update — Provider Routing & Settings Administration

This build adds administrator-controlled webhook route management and provider configuration surfaces. Tenant administrators can now register inbound provider addresses, disable routes, view provider readiness metadata, and upsert SMS/voice/email provider configuration records through protected settings endpoints. Public inbound webhooks still resolve tenant scope through active route records and reject unrouted production traffic.
