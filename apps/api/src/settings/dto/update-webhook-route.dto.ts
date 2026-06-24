// @ts-nocheck
/**
 * UPDATE WEBHOOK ROUTE DTO
 * Purpose: Validates partial webhook route updates.
 * Role: Lets administrators disable, describe, or retarget inbound route records safely.
 */
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateWebhookRouteDto {
  @IsOptional()
  @IsString()
  inboundAddress?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED'])
  status?: 'ACTIVE' | 'DISABLED';

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
