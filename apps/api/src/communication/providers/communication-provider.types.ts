// @ts-nocheck
/**
 * COMMUNICATION PROVIDER TYPES
 * Purpose: Defines stable provider contracts for SMS, voice, and email delivery.
 * Role: Allows workflow logic to remain provider-agnostic while Twilio/email implementations evolve independently.
 */
import type { CommunicationChannel } from '../communication.types';

export type ProviderDeliveryInput = {
  organizationId: string;
  communicationId: string;
  channel: CommunicationChannel;
  recipient: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

export type ProviderDeliveryResult = {
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  providerMessageId?: string;
  providerName: string;
  raw?: Record<string, unknown>;
};

export interface CommunicationProvider {
  readonly providerName: string;
  supports(channel: CommunicationChannel): boolean;
  deliver(input: ProviderDeliveryInput): Promise<ProviderDeliveryResult>;
}
