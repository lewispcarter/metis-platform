// @ts-nocheck
/**
 * PERSONNEL TYPES
 * Purpose: Defines API-facing personnel and availability contracts.
 * Role: Supports workforce coordination while keeping personnel records tenant-scoped and reusable across verticals.
 */
export type PersonnelView = {
  personnelId: string;
  organizationId: string;
  departmentId?: string;
  displayName: string;
  roleTitle: string;
  email?: string;
  phone?: string;
  certifications: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityWindowView = {
  availabilityWindowId: string;
  organizationId: string;
  personnelId: string;
  startsAt: string;
  endsAt: string;
  status: string;
  metadata: Record<string, unknown>;
};
