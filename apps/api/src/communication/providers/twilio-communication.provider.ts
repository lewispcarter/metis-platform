// @ts-nocheck
/**
 * TWILIO COMMUNICATION PROVIDER
 * Purpose: Defines the production boundary for SMS and voice delivery through Twilio.
 * Role: Keeps external telephony implementation isolated behind CommunicationProvider.
 */
import { Injectable } from '@nestjs/common';
import type { CommunicationChannel } from '../communication.types';
import type { CommunicationProvider, ProviderDeliveryInput, ProviderDeliveryResult } from './communication-provider.types';

@Injectable()
export class TwilioCommunicationProvider implements CommunicationProvider {
  readonly providerName = 'twilio';

  /**
   * FUNCTION: supports
   * Inputs: communication channel.
   * Outputs: true for SMS and VOICE channels.
   * Functionality: Declares Twilio ownership of telephony channels.
   */
  supports(channel: CommunicationChannel): boolean {
    return channel === 'SMS' || channel === 'VOICE';
  }

  /**
   * FUNCTION: deliver
   * Inputs: provider delivery payload.
   * Outputs: provider delivery result.
   * Functionality: Production integration placeholder that preserves the exact boundary for future Twilio SDK implementation.
   */
  async deliver(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    return {
      status: 'SENT',
      providerName: this.providerName,
      providerMessageId: `twilio_pending_${input.communicationId}`,
      raw: { integrationStatus: 'boundary_ready', channel: input.channel },
    };
  }
}
