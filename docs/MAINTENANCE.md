# Maintenance

## Operational Rules

- No critical workflow should fail silently.
- Every important state change must produce an audit record.
- Every major table must be tenant-scoped by organization id.

## Operational Integrity Rules Added

The current backend foundation enforces these maintenance principles:

- Use `PrismaService` as the only database client boundary.
- Keep audit records append-only.
- Publish domain events after important operational state changes.
- Use BullMQ queues for asynchronous workflow, communication, escalation, notification, and analytics work.
- Keep external identity integration behind `IdentityModule` so RBAC remains provider-agnostic.
