// @ts-nocheck
/**
 * EVENT TYPES
 * Purpose: Defines canonical operational event domain types used by the Event Module.
 * Role: Establishes stable event vocabulary before database persistence is added.
 */
export type OperationalEventCategory =
  | 'COMMUNICATION'
  | 'STAFFING'
  | 'WORKFLOW'
  | 'MAINTENANCE'
  | 'INCIDENT'
  | 'DISPATCH'
  | 'APPROVAL'
  | 'SYSTEM'
  | 'COMPLIANCE';

export type OperationalEventStatus =
  | 'CREATED'
  | 'CLASSIFIED'
  | 'QUEUED'
  | 'WORKFLOW_STARTED'
  | 'ASSIGNED'
  | 'CONTACTING'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REOPENED';

export type OperationalEventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type OperationalEventSeverity = 'S1_CRITICAL' | 'S2_HIGH' | 'S3_MEDIUM' | 'S4_LOW';
export type AcknowledgmentStatus = 'NOT_REQUIRED' | 'PENDING' | 'DELIVERED' | 'VIEWED' | 'ACKNOWLEDGED' | 'ACCEPTED' | 'REJECTED' | 'TIMED_OUT' | 'FAILED';

export type OperationalEvent = {
  eventId: string;
  organizationId: string;
  departmentId?: string;
  eventType: string;
  eventCategory: OperationalEventCategory;
  title: string;
  description?: string;
  source: string;
  status: OperationalEventStatus;
  severity: OperationalEventSeverity;
  priority: OperationalEventPriority;
  workflowId?: string;
  activeWorkflowRunId?: string;
  assignedUserId?: string;
  assignedTeamId?: string;
  escalationLevel: number;
  acknowledgmentStatus: AcknowledgmentStatus;
  communicationThreadId?: string;
  createdAt: string;
  updatedAt?: string;
  classifiedAt?: string;
  assignedAt?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  metadata: Record<string, unknown>;
};
