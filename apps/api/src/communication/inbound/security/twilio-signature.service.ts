// @ts-nocheck
/**
 * TWILIO SIGNATURE SERVICE
 * Purpose: Validates Twilio webhook signatures before public webhook payloads are trusted.
 * Role: Provides a provider-specific security boundary for inbound SMS and voice ingress.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class TwilioSignatureService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * FUNCTION: validateOrThrow
   * Inputs: public request URL, parsed Twilio parameters, and Twilio signature header.
   * Outputs: void when valid; throws UnauthorizedException when validation fails.
   * Functionality: Enforces Twilio HMAC-SHA1 request signing in production and allows explicit dev bypass only outside production.
   */
  validateOrThrow(url: string, params: Record<string, unknown>, signature?: string): void {
    if (this.shouldBypassValidation()) return;

    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!authToken) {
      throw new UnauthorizedException('Twilio webhook validation is enabled, but TWILIO_AUTH_TOKEN is missing.');
    }

    if (!signature) {
      throw new UnauthorizedException('Missing Twilio webhook signature.');
    }

    const expected = this.computeSignature(url, params, authToken);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new UnauthorizedException('Invalid Twilio webhook signature.');
    }
  }

  /**
   * FUNCTION: computeSignature
   * Inputs: request URL, Twilio request parameters, and Twilio auth token.
   * Outputs: Base64 encoded HMAC-SHA1 signature.
   * Functionality: Implements Twilio's classic form-encoded webhook signature algorithm using sorted parameter keys.
   */
  computeSignature(url: string, params: Record<string, unknown>, authToken: string): string {
    const sortedPayload = Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null)
      .sort()
      .map((key) => `${key}${String(params[key])}`)
      .join('');

    return createHmac('sha1', authToken).update(`${url}${sortedPayload}`).digest('base64');
  }

  /**
   * FUNCTION: shouldBypassValidation
   * Inputs: none.
   * Outputs: boolean.
   * Functionality: Allows local development to receive webhooks without public signature configuration while enforcing validation in production.
   */
  private shouldBypassValidation(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    const bypass = this.configService.get<string>('TWILIO_WEBHOOK_SIGNATURE_BYPASS') === 'true';
    return nodeEnv !== 'production' && bypass;
  }
}
