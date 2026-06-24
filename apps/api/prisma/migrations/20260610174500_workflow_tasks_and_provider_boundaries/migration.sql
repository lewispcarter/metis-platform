-- WORKFLOW TASK HARDENING AND PROVIDER BOUNDARY SUPPORT
-- Purpose: Adds execution boundary timestamps and failure reasons for persisted workflow task checkpoints.
-- Role: Supports deterministic workflow state machines, operator timelines, and audit-friendly workflow execution.

ALTER TABLE "workflow_task"
  ADD COLUMN IF NOT EXISTS "started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;

CREATE INDEX IF NOT EXISTS "idx_workflow_task_org_status" ON "workflow_task"("organization_id", "status");
