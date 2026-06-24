-- INITIAL OPERATIONAL PLATFORM MIGRATION
-- Purpose: Creates the first production database schema for the operational coordination platform.
-- Role: Establishes tenant-scoped persistence for events, workflows, personnel, communications, assignments, escalations, acknowledgments, RBAC, and immutable audits.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "EventStatus" AS ENUM ('CREATED','CLASSIFIED','QUEUED','WORKFLOW_STARTED','ASSIGNED','CONTACTING','ACKNOWLEDGED','IN_PROGRESS','ESCALATED','RESOLVED','CLOSED','ARCHIVED','FAILED','CANCELLED','REOPENED');
CREATE TYPE "EventPriority" AS ENUM ('LOW','NORMAL','HIGH','URGENT','CRITICAL');
CREATE TYPE "EventSeverity" AS ENUM ('S1_CRITICAL','S2_HIGH','S3_MEDIUM','S4_LOW');
CREATE TYPE "AcknowledgmentStatus" AS ENUM ('NOT_REQUIRED','PENDING','DELIVERED','VIEWED','ACKNOWLEDGED','ACCEPTED','REJECTED','TIMED_OUT','FAILED');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','INVITED','SUSPENDED','DEACTIVATED');

CREATE TABLE "organization" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "department" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "uq_department_org_name" UNIQUE ("organization_id", "name")
);
CREATE INDEX "idx_department_org" ON "department"("organization_id");

CREATE TABLE "role" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "uq_role_org_name" UNIQUE ("organization_id", "name")
);
CREATE INDEX "idx_role_org" ON "role"("organization_id");

CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "department_id" TEXT REFERENCES "department"("id") ON DELETE SET NULL,
  "role_id" TEXT REFERENCES "role"("id") ON DELETE SET NULL,
  "external_auth_id" TEXT UNIQUE,
  "email" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "uq_user_org_email" UNIQUE ("organization_id", "email")
);
CREATE INDEX "idx_user_org_status" ON "user"("organization_id", "status");

CREATE TABLE "personnel" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "department_id" TEXT REFERENCES "department"("id") ON DELETE SET NULL,
  "display_name" TEXT NOT NULL,
  "role_title" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "certifications" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_personnel_org_role" ON "personnel"("organization_id", "role_title");
CREATE INDEX "idx_personnel_org_department" ON "personnel"("organization_id", "department_id");

CREATE TABLE "availability_window" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "personnel_id" TEXT NOT NULL REFERENCES "personnel"("id") ON DELETE CASCADE,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_availability_org_personnel" ON "availability_window"("organization_id", "personnel_id");
CREATE INDEX "idx_availability_org_window" ON "availability_window"("organization_id", "starts_at", "ends_at");

CREATE TABLE "operational_event" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "department_id" TEXT REFERENCES "department"("id") ON DELETE SET NULL,
  "event_type" TEXT NOT NULL,
  "event_category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "source" TEXT NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'CREATED',
  "severity" "EventSeverity" NOT NULL,
  "priority" "EventPriority" NOT NULL,
  "escalation_level" INTEGER NOT NULL DEFAULT 0,
  "acknowledgment_status" "AcknowledgmentStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_operational_event_org_status" ON "operational_event"("organization_id", "status");
CREATE INDEX "idx_operational_event_org_priority" ON "operational_event"("organization_id", "priority");
CREATE INDEX "idx_operational_event_org_severity" ON "operational_event"("organization_id", "severity");

CREATE TABLE "workflow_definition" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "definition" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "uq_workflow_definition_org_name_version" UNIQUE ("organization_id", "name", "version")
);
CREATE INDEX "idx_workflow_definition_org_active" ON "workflow_definition"("organization_id", "is_active");

CREATE TABLE "workflow_run" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "operational_event_id" TEXT NOT NULL REFERENCES "operational_event"("id") ON DELETE CASCADE,
  "workflow_definition_id" TEXT REFERENCES "workflow_definition"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL,
  "current_step" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMPTZ,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_workflow_run_org_status" ON "workflow_run"("organization_id", "status");
CREATE INDEX "idx_workflow_run_event" ON "workflow_run"("operational_event_id");

CREATE TABLE "workflow_task" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "workflow_run_id" TEXT NOT NULL REFERENCES "workflow_run"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_workflow_task_org_run" ON "workflow_task"("organization_id", "workflow_run_id");

CREATE TABLE "coverage_request" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "operational_event_id" TEXT NOT NULL REFERENCES "operational_event"("id") ON DELETE CASCADE,
  "personnel_id" TEXT REFERENCES "personnel"("id") ON DELETE SET NULL,
  "required_role" TEXT NOT NULL,
  "required_department" TEXT,
  "required_shift_start" TIMESTAMPTZ NOT NULL,
  "required_shift_end" TIMESTAMPTZ NOT NULL,
  "required_certifications" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status" TEXT NOT NULL,
  "urgency" TEXT NOT NULL,
  "coverage_deadline" TIMESTAMPTZ NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_coverage_request_org_status" ON "coverage_request"("organization_id", "status");
CREATE INDEX "idx_coverage_request_event" ON "coverage_request"("operational_event_id");
CREATE INDEX "idx_coverage_request_org_role" ON "coverage_request"("organization_id", "required_role");

CREATE TABLE "assignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "operational_event_id" TEXT NOT NULL REFERENCES "operational_event"("id") ON DELETE CASCADE,
  "personnel_id" TEXT REFERENCES "personnel"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_assignment_org_status" ON "assignment"("organization_id", "status");
CREATE INDEX "idx_assignment_event" ON "assignment"("operational_event_id");

CREATE TABLE "communication" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "operational_event_id" TEXT REFERENCES "operational_event"("id") ON DELETE SET NULL,
  "channel" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "body" TEXT,
  "provider_message_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_communication_org_status" ON "communication"("organization_id", "status");
CREATE INDEX "idx_communication_event" ON "communication"("operational_event_id");

CREATE TABLE "escalation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "operational_event_id" TEXT NOT NULL REFERENCES "operational_event"("id") ON DELETE CASCADE,
  "level" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_escalation_org_status" ON "escalation"("organization_id", "status");
CREATE INDEX "idx_escalation_event" ON "escalation"("operational_event_id");

CREATE TABLE "acknowledgment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "operational_event_id" TEXT NOT NULL REFERENCES "operational_event"("id") ON DELETE CASCADE,
  "personnel_id" TEXT REFERENCES "personnel"("id") ON DELETE SET NULL,
  "status" "AcknowledgmentStatus" NOT NULL,
  "response_text" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_acknowledgment_org_status" ON "acknowledgment"("organization_id", "status");
CREATE INDEX "idx_acknowledgment_event" ON "acknowledgment"("operational_event_id");

CREATE TABLE "audit_event" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "event_id" TEXT REFERENCES "operational_event"("id") ON DELETE SET NULL,
  "actor_type" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "previous_state" TEXT,
  "new_state" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_audit_event_org_created" ON "audit_event"("organization_id", "created_at");
CREATE INDEX "idx_audit_event_event" ON "audit_event"("event_id");
