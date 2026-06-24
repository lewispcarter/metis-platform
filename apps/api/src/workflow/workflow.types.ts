// @ts-nocheck
/**
 * WORKFLOW TYPES
 * Purpose: Defines API-facing workflow contracts for operational orchestration.
 * Role: Keeps workflow execution outputs stable across controllers, services, and future shared packages.
 */
export type WorkflowRunStatus = 'STARTED' | 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type WorkflowTaskStatus = 'PENDING' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export type WorkflowRunView = {
  workflowRunId: string;
  organizationId: string;
  operationalEventId: string;
  workflowDefinitionId?: string;
  status: WorkflowRunStatus;
  currentStep?: string;
  startedAt: string;
  completedAt?: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};


export type WorkflowTaskView = {
  workflowTaskId: string;
  organizationId: string;
  workflowRunId: string;
  name: string;
  status: WorkflowTaskStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  updatedAt: string;
};
