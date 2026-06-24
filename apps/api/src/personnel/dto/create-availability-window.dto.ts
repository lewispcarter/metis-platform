// @ts-nocheck
/**
 * CREATE AVAILABILITY WINDOW DTO
 * Purpose: Defines validated input for worker availability records.
 * Role: Supports candidate discovery for personnel coordination workflows.
 */
import { IsISO8601, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAvailabilityWindowDto {
  @IsString()
  organizationId!: string;

  @IsString()
  personnelId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsString()
  status!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
