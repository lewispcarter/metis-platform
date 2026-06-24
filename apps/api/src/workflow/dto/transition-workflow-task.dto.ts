// @ts-nocheck
/**
 * TRANSITION WORKFLOW TASK DTO
 * Purpose: Defines validated input for workflow task lifecycle mutation.
 * Role: Keeps task status transitions explicit, auditable, and state-machine controlled.
 */
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import type { WorkflowTaskStatus } from '../workflow.types';

export class TransitionWorkflowTaskDto {
  @IsString()
  organizationId!: string;

  @IsString()
  workflowTaskId!: string;

  @IsIn(['PENDING', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'SKIPPED'])
  status!: WorkflowTaskStatus;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
