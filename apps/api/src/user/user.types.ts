// @ts-nocheck
/**
 * USER TYPES
 * Purpose: Defines API-facing platform user and organization membership contracts.
 * Role: Keeps identity persistence responses stable across Clerk/Auth0/provider changes.
 */
import type { PlatformRole } from '../identity/types/role.types';

export type PlatformUserRecord = {
  userId: string;
  organizationId: string;
  email: string;
  displayName: string;
  status: string;
  roleName?: PlatformRole | string;
  externalAuthId?: string;
  createdAt: string;
};

export type OrganizationMembershipRecord = {
  membershipId: string;
  organizationId: string;
  userId: string;
  roleName: PlatformRole | string;
  status: string;
  createdAt: string;
};
