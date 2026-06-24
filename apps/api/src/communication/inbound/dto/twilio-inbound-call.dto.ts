// @ts-nocheck
/**
 * TWILIO INBOUND CALL DTO
 * Purpose: Normalizes Twilio inbound voice webhook payloads.
 * Role: Converts incoming calls into auditable operational events without coupling the platform to Twilio internals.
 */
import { IsOptional, IsString } from 'class-validator';

export class TwilioInboundCallDto {
  @IsString()
  From!: string;

  @IsString()
  To!: string;

  @IsOptional()
  @IsString()
  CallSid?: string;

  @IsOptional()
  @IsString()
  CallStatus?: string;

  @IsOptional()
  @IsString()
  AccountSid?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;
}
