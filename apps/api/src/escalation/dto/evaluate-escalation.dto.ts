// @ts-nocheck
/**
 * EVALUATE ESCALATION DTO
 * Purpose: Validates escalation policy evaluation requests.
 * Role: Lets workflows request deterministic escalation evaluation without embedding escalation policy logic.
 */
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class EvaluateEscalationDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  operationalEventId!: string;

  @IsObject()
  @IsOptional()
  policyContext?: Record<string, unknown>;
}
