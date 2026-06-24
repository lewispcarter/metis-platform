// @ts-nocheck
/**
 * TWILIO INBOUND MESSAGE DTO
 * Purpose: Normalizes Twilio form-encoded inbound SMS webhook payloads.
 * Role: Keeps provider-specific webhook shape outside assignment and workflow services.
 */
import { IsOptional, IsString } from 'class-validator';

export class TwilioInboundMessageDto {
  @IsString()
  From!: string;

  @IsString()
  To!: string;

  @IsString()
  Body!: string;

  @IsOptional()
  @IsString()
  MessageSid?: string;

  @IsOptional()
  @IsString()
  AccountSid?: string;

  @IsOptional()
  @IsString()
  SmsStatus?: string;

  @IsOptional()
  @IsString()
  organizationId?: string;
}
