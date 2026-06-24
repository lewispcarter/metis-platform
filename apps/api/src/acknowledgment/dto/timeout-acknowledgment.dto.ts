// @ts-nocheck
/**
 * TIMEOUT ACKNOWLEDGMENT DTO
 * Purpose: Validates acknowledgment timeout operations.
 * Role: Allows workflows to mark response windows expired and trigger escalation evaluation.
 */
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class TimeoutAcknowledgmentDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  operationalEventId!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
