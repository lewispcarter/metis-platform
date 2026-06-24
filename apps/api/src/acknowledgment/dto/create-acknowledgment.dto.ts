// @ts-nocheck
/**
 * CREATE ACKNOWLEDGMENT DTO
 * Purpose: Validates acknowledgment records created by human responses or workflow systems.
 * Role: Ensures every acknowledgment is tenant-scoped and bound to an operational event.
 */
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

const ACKNOWLEDGMENT_STATUSES = ['NOT_REQUIRED', 'PENDING', 'DELIVERED', 'VIEWED', 'ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'TIMED_OUT', 'FAILED'] as const;

export class CreateAcknowledgmentDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  operationalEventId!: string;

  @IsString()
  @IsOptional()
  personnelId?: string;

  @IsIn(ACKNOWLEDGMENT_STATUSES)
  status!: (typeof ACKNOWLEDGMENT_STATUSES)[number];

  @IsString()
  @IsOptional()
  responseText?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
