// @ts-nocheck
/**
 * UPSERT PROVIDER CONFIGURATION DTO
 * Purpose: Validates communication provider configuration records.
 * Role: Stores production provider settings metadata without requiring controllers to know provider-specific internals.
 */
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertProviderConfigurationDto {
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @IsIn(['SMS', 'VOICE', 'EMAIL'])
  channel!: 'SMS' | 'VOICE' | 'EMAIL';

  @IsIn(['ACTIVE', 'DISABLED', 'MISCONFIGURED'])
  status!: 'ACTIVE' | 'DISABLED' | 'MISCONFIGURED';

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
