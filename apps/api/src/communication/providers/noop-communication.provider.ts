// @ts-nocheck
/**
 * NOOP COMMUNICATION PROVIDER
 * Purpose: Provides deterministic local delivery behavior for development and tests.
 * Role: Prevents workflow development from depending on Twilio, SendGrid, or external provider credentials.
 */
import { Injectable } from '@nestjs/common';
import type { CommunicationChannel } from '../communication.types';
import type { CommunicationProvider, ProviderDeliveryInput, ProviderDeliveryResult } from './communication-provider.types';

@Injectable()
export class NoopCommunicationProvider implements CommunicationProvider {
  readonly providerName = 'noop';

  /**
   * FUNCTION: supports
   * Inputs: communication channel.
   * Outputs: true for all channels.
   * Functionality: Allows local development to simulate SMS, voice, email, and dashboard dispatch.
   */
  supports(_channel: CommunicationChannel): boolean {
    return true;
  }

  /**
   * FUNCTION: deliver
   * Inputs: provider delivery payload.
   * Outputs: deterministic provider delivery result.
   * Functionality: Simulates successful communication handoff and returns a stable provider message id.
   */
  async deliver(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    return {
      status: 'SENT',
      providerName: this.providerName,
      providerMessageId: `noop_${input.communicationId}`,
      raw: { simulated: true, channel: input.channel, recipient: input.recipient },
    };
  }
}
