/**
 * SHARED TYPES PACKAGE
 * Purpose: Publishes cross-application TypeScript contracts for operational platform entities.
 * Role: Prevents API and UI contract drift across the monorepo.
 */
export type EventPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type EventSeverity = 'S1_CRITICAL' | 'S2_HIGH' | 'S3_MEDIUM' | 'S4_LOW';
export type EventStatus =
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

export type TenantScopedEntity = {
  organizationId: string;
};

export type OperationalEventContract = TenantScopedEntity & {
  id: string;
  eventType: string;
  eventCategory: string;
  title: string;
  description?: string | null;
  source: string;
  status: EventStatus;
  severity: EventSeverity;
  priority: EventPriority;
  escalationLevel: number;
  acknowledgmentStatus: AcknowledgmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowRunContract = TenantScopedEntity & {
  id: string;
  operationalEventId: string;
  status: string;
  currentStep?: string | null;
  startedAt: string;
  completedAt?: string | null;
};

export type PersonnelContract = TenantScopedEntity & {
  id: string;
  displayName: string;
  roleTitle: string;
  departmentId?: string | null;
  email?: string | null;
  phone?: string | null;
};
