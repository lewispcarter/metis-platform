// @ts-nocheck
/**
 * TEST SUITE: Twilio Signature Service
 * Purpose: Validates deterministic Twilio webhook signature enforcement.
 * Scope: Signature computation and production validation behavior.
 */
import { ConfigService } from '@nestjs/config';
import { TwilioSignatureService } from './twilio-signature.service';

describe('TwilioSignatureService', () => {
  test('should_validate_signature_when_payload_matches_expected_hmac', () => {
    const config = { get: (key: string) => (key === 'NODE_ENV' ? 'production' : key === 'TWILIO_AUTH_TOKEN' ? 'secret' : undefined) } as ConfigService;
    const service = new TwilioSignatureService(config);
    const url = 'https://example.com/api/v1/webhooks/twilio/sms';
    const params = { From: '+15550000001', To: '+15550000002', Body: 'YES' };
    const signature = service.computeSignature(url, params, 'secret');

    expect(() => service.validateOrThrow(url, params, signature)).not.toThrow();
  });

  test('should_reject_signature_when_payload_is_tampered', () => {
    const config = { get: (key: string) => (key === 'NODE_ENV' ? 'production' : key === 'TWILIO_AUTH_TOKEN' ? 'secret' : undefined) } as ConfigService;
    const service = new TwilioSignatureService(config);
    const url = 'https://example.com/api/v1/webhooks/twilio/sms';
    const signature = service.computeSignature(url, { From: '+1', To: '+2', Body: 'YES' }, 'secret');

    expect(() => service.validateOrThrow(url, { From: '+1', To: '+2', Body: 'NO' }, signature)).toThrow('Invalid Twilio webhook signature.');
  });
});
