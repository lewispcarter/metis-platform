// @ts-nocheck
/**
 * SEND COMMUNICATION DTO
 * Purpose: Defines validated provider-agnostic outbound communication input.
 * Role: Prevents workflows from depending directly on Twilio, email, or future provider payloads.
 */
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class SendCommunicationDto {
  @IsString()
  organizationId!: string;

  @IsOptional()
  @IsString()
  operationalEventId?: string;

  @IsIn(['SMS', 'VOICE', 'EMAIL', 'DASHBOARD'])
  channel!: 'SMS' | 'VOICE' | 'EMAIL' | 'DASHBOARD';

  @IsString()
  recipient!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
