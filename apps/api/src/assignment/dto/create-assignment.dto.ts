// @ts-nocheck
/**
 * CREATE ASSIGNMENT DTO
 * Purpose: Defines validated input for assigning personnel to an operational event.
 * Role: Creates explicit ownership and fulfillment records for coordination workflows.
 */
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  organizationId!: string;

  @IsString()
  operationalEventId!: string;

  @IsOptional()
  @IsString()
  personnelId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
