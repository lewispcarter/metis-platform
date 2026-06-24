// @ts-nocheck
/**
 * FORCE ESCALATION DTO
 * Purpose: Validates supervisor-initiated escalation commands.
 * Role: Allows human operators to override waiting policies while preserving auditability.
 */
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ForceEscalationDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  operationalEventId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
