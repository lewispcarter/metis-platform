// @ts-nocheck
/**
 * INBOUND COMMUNICATION TYPES
 * Purpose: Defines stable API-facing contracts for provider webhooks entering the communications layer.
 * Role: Keeps Twilio-specific fields translated into platform-native response summaries.
 */
export type InboundWebhookResult = {
  handled: boolean;
  organizationId: string;
  communicationId?: string;
  operationalEventId?: string;
  assignmentId?: string;
  action: 'coverage_response_processed' | 'coverage_response_unmatched' | 'voice_event_created';
  message: string;
};
