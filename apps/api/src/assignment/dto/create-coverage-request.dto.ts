// @ts-nocheck
/**
 * CREATE COVERAGE REQUEST DTO
 * Purpose: Defines validated input for creating a personnel coverage request.
 * Role: Starts coverage coordination for an operational event without hard-coding a healthcare-specific model.
 */
import { IsArray, IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCoverageRequestDto {
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
  @IsObject()
  metadata?: Record<string, unknown>;
}
