// @ts-nocheck
/**
 * CREATE WORKFLOW TASK DTO
 * Purpose: Defines validated input for creating persistent workflow task checkpoints.
 * Role: Ensures every workflow step can be recorded and audited independently.
 */
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateWorkflowTaskDto {
  @IsString()
  organizationId!: string;

  @IsString()
  workflowRunId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
