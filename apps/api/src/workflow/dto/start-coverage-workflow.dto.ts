// @ts-nocheck
/**
 * START COVERAGE WORKFLOW DTO
 * Purpose: Defines validated input for the first reference personnel coordination workflow.
 * Role: Captures the required role, shift, deadline, and communication body needed to orchestrate coverage.
 */
import { IsArray, IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';

export class StartCoverageWorkflowDto {
  @IsString()
  organizationId!: string;

  @IsString()
  operationalEventId!: string;

  @IsString()
  requiredRole!: string;

  @IsOptional()
  @IsString()
  requiredDepartment?: string;

  @IsISO8601()
  requiredShiftStart!: string;

  @IsISO8601()
  requiredShiftEnd!: string;

  @IsOptional()
  @IsArray()
  requiredCertifications?: string[];

  @IsString()
  urgency!: string;

  @IsISO8601()
  coverageDeadline!: string;

  @IsOptional()
  @IsString()
  messageBody?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
