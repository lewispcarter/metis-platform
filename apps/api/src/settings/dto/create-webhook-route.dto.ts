// @ts-nocheck
/**
 * CREATE WEBHOOK ROUTE DTO
 * Purpose: Validates administrator-created inbound webhook routing rules.
 * Role: Prevents public inbound numbers from being routed without explicit tenant configuration.
 */
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateWebhookRouteDto {
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsString()
  @IsNotEmpty()
  inboundAddress!: string;

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
