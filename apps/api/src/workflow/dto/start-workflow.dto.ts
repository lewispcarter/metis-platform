// @ts-nocheck
/**
 * START WORKFLOW DTO
 * Purpose: Defines the validated shape used to start workflow execution.
 * Role: Prevents controllers from passing unstructured workflow launch data into orchestration services.
 */
import { IsObject, IsOptional, IsString } from 'class-validator';

export class StartWorkflowDto {
  @IsString()
  organizationId!: string;

  @IsString()
  operationalEventId!: string;

  @IsOptional()
  @IsString()
  workflowDefinitionId?: string;

  @IsOptional()
  @IsString()
  currentStep?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
