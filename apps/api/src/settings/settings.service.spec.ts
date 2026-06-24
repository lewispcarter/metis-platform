// @ts-nocheck
/**
 * TEST SUITE: SettingsService
 * PURPOSE: Validates provider settings safety behavior.
 * SCOPE: Secret-like provider config redaction.
 * DEPENDENCIES: None; direct private method invocation through controlled test cast.
 * LAST UPDATED: 2026-06-10
 */
import { SettingsService } from './settings.service';

describe('SettingsService - Provider Configuration Safety', () => {
  test('should_redact_secret_like_values_when_provider_config_contains_credentials', () => {
    // ARRANGE: Create service shell with unused dependencies because the tested helper is pure.
    const service = new SettingsService({} as never, {} as never);
    const input = { accountSid: 'AC123', authToken: 'super-secret', apiSecret: 'hidden' };

    // ACT: Execute config redaction through controlled test access.
    const result = (service as unknown as { redactUnsafeConfig(config: Record<string, unknown>): Record<string, unknown> }).redactUnsafeConfig(input);

    // ASSERT: Verify operational metadata remains while secret-like fields are masked.
    expect(result.accountSid).toBe('AC123');
    expect(result.authToken).toBe('***REDACTED***');
    expect(result.apiSecret).toBe('***REDACTED***');
  });
});
