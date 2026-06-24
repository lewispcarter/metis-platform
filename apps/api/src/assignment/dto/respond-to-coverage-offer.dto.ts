// @ts-nocheck
/**
 * RESPOND TO COVERAGE OFFER DTO
 * Purpose: Validates inbound personnel responses to coverage offers.
 * Role: Supports SMS/voice/email response automation without exposing raw assignment mutation internals.
 */
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class RespondToCoverageOfferDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  operationalEventId!: string;

  @IsOptional()
  @IsUUID()
  personnelId?: string;

  @IsOptional()
  @IsString()
  inboundAddress?: string;

  @IsString()
  @IsIn(['YES', 'NO', 'ACCEPT', 'REJECT'])
  response!: 'YES' | 'NO' | 'ACCEPT' | 'REJECT';

  @IsOptional()
  metadata?: Record<string, unknown>;
}
