// @ts-nocheck
/**
 * ESCALATION TYPES
 * Purpose: Defines stable contracts for escalation records and decisions.
 * Role: Keeps escalation state explicit across workflow, event, audit, and notification modules.
 */
export type EscalationStatus = 'OPEN' | 'NOTIFIED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FAILED';

export type EscalationReason =
  | 'ACKNOWLEDGMENT_TIMEOUT'
  | 'ASSIGNMENT_TIMEOUT'
  | 'COMMUNICATION_FAILURE'
  | 'UNRESOLVED_COVERAGE'
  | 'MANUAL_ESCALATION';

export type EscalationView = {
  escalationId: string;
  organizationId: string;
  operationalEventId: string;
  level: number;
  status: EscalationStatus;
  reason: EscalationReason | string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
