// @ts-nocheck
/**
 * TWILIO WEBHOOK URL SERVICE
 * Purpose: Reconstructs the public URL used by Twilio for signature validation.
 * Role: Prevents proxy/local URL differences from weakening webhook verification.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class TwilioWebhookUrlService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * FUNCTION: resolvePublicUrl
   * Inputs: Express request object.
   * Outputs: public webhook URL string.
   * Functionality: Uses WEBHOOK_PUBLIC_BASE_URL when configured, otherwise reconstructs protocol and host from forwarded headers.
   */
  resolvePublicUrl(request: Request): string {
    const configuredBaseUrl = this.configService.get<string>('WEBHOOK_PUBLIC_BASE_URL');
    const path = request.originalUrl;

    if (configuredBaseUrl) {
      return `${configuredBaseUrl.replace(/\/$/, '')}${path}`;
    }

    const protocol = String(request.headers['x-forwarded-proto'] ?? request.protocol ?? 'https').split(',')[0].trim();
    const host = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? '').split(',')[0].trim();
    return `${protocol}://${host}${path}`;
  }
}
