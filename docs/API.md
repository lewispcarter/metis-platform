# API

Base path: `/api/v1`

OpenAPI documentation is mounted at:

```bash
http://localhost:3001/api/docs
```

## Authentication

Production authentication uses Clerk bearer tokens through the platform `IdentityModule` boundary.

```http
Authorization: Bearer <clerk_jwt>
```

Local development may use trusted development headers:

```http
x-user-id: user_demo_owner
x-organization-id: <organization_uuid>
x-role: Owner
```

Protected controllers derive tenant scope from the authenticated context. Clients should not rely on query-string `organizationId` values for protected operational routes.

## Health

`GET /api/v1/health`

## Readiness

`GET /api/v1/readiness`

## Events

`POST /api/v1/events`

`GET /api/v1/events`

`GET /api/v1/events/:eventId`

`PATCH /api/v1/events/:eventId/status`

## Workflows

`POST /api/v1/workflow-runs/start`

`POST /api/v1/workflow-runs/coverage/start`

`POST /api/v1/workflow-runs/coverage/enqueue`

`GET /api/v1/workflow-runs`

`GET /api/v1/workflow-runs/:workflowRunId`

`PATCH /api/v1/workflow-runs/:workflowRunId/complete`

## Personnel

`POST /api/v1/personnel`

`GET /api/v1/personnel`

`GET /api/v1/personnel/:personnelId`

`POST /api/v1/personnel/availability-windows`

`GET /api/v1/personnel/coverage/candidates`

## Assignments

`POST /api/v1/coverage-requests`

`GET /api/v1/coverage-requests`

`POST /api/v1/assignments`

`GET /api/v1/assignments`

`PATCH /api/v1/assignments/:assignmentId/accept`

`PATCH /api/v1/assignments/:assignmentId/reject`

## Communications

`POST /api/v1/communications/send`

`POST /api/v1/communications/enqueue`

`GET /api/v1/communications`

`PATCH /api/v1/communications/:communicationId/status`

## Escalations

`POST /api/v1/escalations`

`POST /api/v1/escalations/evaluate`

`GET /api/v1/escalations`

`PATCH /api/v1/escalations/:escalationId/resolve`

## Acknowledgments

`POST /api/v1/acknowledgments`

`POST /api/v1/acknowledgments/timeout`

`GET /api/v1/acknowledgments/events/:eventId`

## Audit

`GET /api/v1/audit-events`

## Demo Seed

`POST /api/v1/demo/seed`

The demo seed route is intentionally excluded from normal auth middleware for local bootstrap workflows.

## User and Membership Endpoints

### GET `/api/v1/users/me`

Returns the normalized authenticated actor, including the database-backed `platformUserId`, organization id, role, permissions, and membership id.

### GET `/api/v1/users`

Requires `admin:manage`. Returns users synchronized into the current authenticated organization.

### GET `/api/v1/users/memberships`

Requires `admin:manage`. Returns organization membership records for the current authenticated organization.

## Operator Activity

`GET /api/v1/activity`

Returns the tenant-scoped operator activity feed derived from immutable audit history.

## Admin User Management

`GET /api/v1/users/me`

`GET /api/v1/users`

`GET /api/v1/users/memberships`

`PATCH /api/v1/users/:userId/role`

`PATCH /api/v1/users/:userId/status`

## v0.12 Workflow Task APIs

Workflow task checkpoints allow operators to inspect and mutate workflow step state independently from the parent workflow run.

### Create Workflow Task

`POST /workflow-runs/:id/tasks`

Creates a persistent task checkpoint for a workflow run.

### List Workflow Tasks

`GET /workflow-runs/:id/tasks`

Returns ordered workflow task checkpoints for the selected workflow run.

### Transition Workflow Task

`PATCH /workflow-runs/tasks/:taskId/status`

Transitions a workflow task through the approved task state machine.

Allowed task states:

- `PENDING`
- `RUNNING`
- `WAITING`
- `COMPLETED`
- `FAILED`
- `SKIPPED`

## Supervisor Escalation Controls

`POST /escalations/force`

Creates an immediate supervisor-forced escalation for an operational event. The endpoint uses the same escalation creation pipeline as automated policies, so it preserves event state transitions, scheduled follow-up, internal events, and immutable audit history.

Required body fields:

```json
{
  "operationalEventId": "uuid",
  "level": 1,
  "reason": "SUPERVISOR_FORCED_ESCALATION"
}
```

## Coverage Response Automation

`POST /coverage-requests/respond`

Converts inbound personnel replies into deterministic assignment state changes.

Supported responses:

```text
YES
ACCEPT
NO
REJECT
```

Affirmative responses accept the matching active assignment and supersede competing open offers for the same operational event. Negative responses reject only the responding personnel assignment.

## Workflow Task Timeline

`GET /workflow-runs/:id/tasks`

Returns persistent task checkpoints for the selected workflow run. The dashboard uses this endpoint to show coverage request creation, candidate discovery, outreach execution, and failure points as an operational timeline.


## Twilio Webhooks

### `POST /webhooks/twilio/sms`
Records inbound SMS and processes active coverage offer replies.

### `POST /webhooks/twilio/voice`
Creates an operational event for inbound voice calls and records the inbound communication.

Both routes are excluded from normal application auth because provider webhooks do not carry platform user context. Tenant context currently uses `organizationId` or `TWILIO_WEBHOOK_ORGANIZATION_ID`.

## Webhook Route Model

The platform uses `inbound_webhook_route` records to map provider-owned inbound addresses to organizations.

Fields:

```text
id
organization_id
provider
inbound_address
status
description
metadata
created_at
updated_at
```

This model supports secure multi-tenant routing for shared webhook ingress endpoints.


## v16 Update — Provider Routing & Settings Administration

This build adds administrator-controlled webhook route management and provider configuration surfaces. Tenant administrators can now register inbound provider addresses, disable routes, view provider readiness metadata, and upsert SMS/voice/email provider configuration records through protected settings endpoints. Public inbound webhooks still resolve tenant scope through active route records and reject unrouted production traffic.


### Settings APIs

```http
GET /settings/webhook-routes
POST /settings/webhook-routes
PATCH /settings/webhook-routes/:routeId
GET /settings/provider-configurations
POST /settings/provider-configurations
```

All settings endpoints require authenticated tenant context. Route reads require `settings:read`; mutations require `settings:manage`. Provider configuration payloads redact secret-like fields before persistence so admin UI surfaces do not become secret storage.
