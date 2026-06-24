// @ts-nocheck
/**
 * COMMUNICATION TYPES
 * Purpose: Defines API-facing communication records and channel status contracts.
 * Role: Gives workflows a provider-agnostic communication history model.
 */
export type CommunicationChannel = 'SMS' | 'VOICE' | 'EMAIL' | 'DASHBOARD';
export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';
export type CommunicationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'UNANSWERED' | 'ACKNOWLEDGED' | 'RECEIVED';

export type CommunicationView = {
  communicationId: string;
  organizationId: string;
  operationalEventId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  recipient: string;
  body?: string;
  providerMessageId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
