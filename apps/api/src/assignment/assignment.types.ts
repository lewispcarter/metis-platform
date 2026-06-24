// @ts-nocheck
/**
 * ASSIGNMENT TYPES
 * Purpose: Defines API-facing assignment and coverage request contracts.
 * Role: Represents ownership and coverage fulfillment for operational events.
 */
export type AssignmentStatus = 'PENDING' | 'OFFERED' | 'ACCEPTED' | 'REJECTED' | 'TIMED_OUT' | 'CANCELLED' | 'SUPERSEDED';

export type CoverageRequestStatus = 'OPEN' | 'CONTACTING' | 'FULFILLED' | 'ESCALATED' | 'UNRESOLVED_COVERAGE' | 'CANCELLED';

export type AssignmentView = {
  assignmentId: string;
  organizationId: string;
  operationalEventId: string;
  personnelId?: string;
  status: AssignmentStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CoverageRequestView = {
  coverageRequestId: string;
  organizationId: string;
  operationalEventId: string;
  personnelId?: string;
  requiredRole: string;
  requiredDepartment?: string;
  requiredShiftStart: string;
  requiredShiftEnd: string;
  requiredCertifications: string[];
  status: CoverageRequestStatus;
  urgency: string;
  coverageDeadline: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
