// @ts-nocheck
/**
 * WORKFLOW STATE MACHINE
 * Purpose: Defines deterministic workflow run and task state transitions.
 * Role: Prevents invalid workflow mutations from entering operational infrastructure and makes execution auditable.
 */
import { BadRequestException } from '@nestjs/common';
import type { WorkflowRunStatus, WorkflowTaskStatus } from './workflow.types';

export const WORKFLOW_RUN_TRANSITIONS: Record<WorkflowRunStatus, WorkflowRunStatus[]> = {
  STARTED: ['RUNNING', 'WAITING', 'FAILED', 'CANCELLED'],
  WAITING: ['RUNNING', 'FAILED', 'CANCELLED'],
  RUNNING: ['WAITING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export const WORKFLOW_TASK_TRANSITIONS: Record<WorkflowTaskStatus, WorkflowTaskStatus[]> = {
  PENDING: ['RUNNING', 'SKIPPED', 'FAILED'],
  RUNNING: ['COMPLETED', 'WAITING', 'FAILED'],
  WAITING: ['RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'],
  COMPLETED: [],
  FAILED: [],
  SKIPPED: [],
};

/**
 * FUNCTION: assertWorkflowRunTransition
 * Inputs: current workflow run status and requested next status.
 * Outputs: void when transition is valid; BadRequestException when invalid.
 * Functionality: Enforces deterministic workflow run lifecycle rules.
 */
export function assertWorkflowRunTransition(current: WorkflowRunStatus, next: WorkflowRunStatus): void {
  if (current === next) return;
  const allowed = WORKFLOW_RUN_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(`Invalid workflow run transition: ${current} -> ${next}`);
  }
}

/**
 * FUNCTION: assertWorkflowTaskTransition
 * Inputs: current workflow task status and requested next status.
 * Outputs: void when transition is valid; BadRequestException when invalid.
 * Functionality: Enforces deterministic workflow task lifecycle rules.
 */
export function assertWorkflowTaskTransition(current: WorkflowTaskStatus, next: WorkflowTaskStatus): void {
  if (current === next) return;
  const allowed = WORKFLOW_TASK_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(`Invalid workflow task transition: ${current} -> ${next}`);
  }
}
