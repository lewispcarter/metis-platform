// @ts-nocheck
/**
 * CREATE OPERATIONAL EVENT DTO
 * Purpose: Validates inbound API payloads for creating operational events.
 * Role: Protects the Event Service boundary from malformed external requests.
 */
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import type { OperationalEventCategory, OperationalEventPriority, OperationalEventSeverity } from '../event.types';

export class CreateOperationalEventDto {
  @IsString()
  organizationId!: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsString()
  eventType!: string;

  @IsIn(['COMMUNICATION', 'STAFFING', 'WORKFLOW', 'MAINTENANCE', 'INCIDENT', 'DISPATCH', 'APPROVAL', 'SYSTEM', 'COMPLIANCE'])
  eventCategory!: OperationalEventCategory;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  source!: string;

  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'])
  priority!: OperationalEventPriority;

  @IsIn(['S1_CRITICAL', 'S2_HIGH', 'S3_MEDIUM', 'S4_LOW'])
  severity!: OperationalEventSeverity;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
