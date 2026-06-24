// @ts-nocheck
/**
 * CREATE ESCALATION DTO
 * Purpose: Validates policy-driven escalation creation requests.
 * Role: Ensures escalation records are tenant-scoped and tied to a concrete operational event.
 */
import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateEscalationDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  operationalEventId!: string;

  @IsInt()
  @Min(1)
  level!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
