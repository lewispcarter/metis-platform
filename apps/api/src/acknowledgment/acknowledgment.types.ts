// @ts-nocheck
/**
 * ACKNOWLEDGMENT TYPES
 * Purpose: Defines explicit acknowledgement and acceptance contracts.
 * Role: Keeps operational responsibility separate from simple message delivery.
 */
export type AcknowledgmentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'DELIVERED'
  | 'VIEWED'
  | 'ACKNOWLEDGED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'TIMED_OUT'
  | 'FAILED';

export type AcknowledgmentView = {
  acknowledgmentId: string;
  organizationId: string;
  operationalEventId: string;
  personnelId?: string;
  status: AcknowledgmentStatus;
  responseText?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
