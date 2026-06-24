// @ts-nocheck
/**
 * TEST SUITE: Communication Provider Registry
 * Purpose: Validates provider selection for SMS, voice, email, and fallback channels.
 * Scope: Provider boundary routing only; external SDK delivery is intentionally outside unit scope.
 * Dependencies: Jest.
 */
import { CommunicationProviderRegistry } from './communication-provider.registry';
import { EmailCommunicationProvider } from './email-communication.provider';
import { NoopCommunicationProvider } from './noop-communication.provider';
import { TwilioCommunicationProvider } from './twilio-communication.provider';

describe('CommunicationProviderRegistry', () => {
  const registry = new CommunicationProviderRegistry(new NoopCommunicationProvider(), new TwilioCommunicationProvider(), new EmailCommunicationProvider());

  test('should_select_twilio_when_channel_is_sms', () => {
    const provider = registry.getProvider('SMS');
    expect(provider.providerName).toBe('twilio');
  });

  test('should_select_email_provider_when_channel_is_email', () => {
    const provider = registry.getProvider('EMAIL');
    expect(provider.providerName).toBe('email');
  });

  test('should_select_noop_provider_when_channel_is_dashboard', () => {
    const provider = registry.getProvider('DASHBOARD');
    expect(provider.providerName).toBe('noop');
  });
});
