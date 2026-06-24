// @ts-nocheck
/**
 * EMAIL COMMUNICATION PROVIDER
 * Purpose: Defines the production boundary for operational email delivery.
 * Role: Keeps SendGrid/SES/Postmark implementation isolated behind CommunicationProvider.
 */
import { Injectable } from '@nestjs/common';
import type { CommunicationChannel } from '../communication.types';
import type { CommunicationProvider, ProviderDeliveryInput, ProviderDeliveryResult } from './communication-provider.types';

@Injectable()
export class EmailCommunicationProvider implements CommunicationProvider {
  readonly providerName = 'email';

  /**
   * FUNCTION: supports
   * Inputs: communication channel.
   * Outputs: true for EMAIL channel.
   * Functionality: Declares email ownership for provider selection.
   */
  supports(channel: CommunicationChannel): boolean {
    return channel === 'EMAIL';
  }

  /**
   * FUNCTION: deliver
   * Inputs: provider delivery payload.
   * Outputs: provider delivery result.
   * Functionality: Production integration placeholder that preserves the exact boundary for future email provider implementation.
   */
  async deliver(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult> {
    return {
      status: 'SENT',
      providerName: this.providerName,
      providerMessageId: `email_pending_${input.communicationId}`,
      raw: { integrationStatus: 'boundary_ready', recipient: input.recipient },
    };
  }
}
