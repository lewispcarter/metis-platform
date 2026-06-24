// @ts-nocheck
/**
 * AUTH CONTEXT TYPES
 * Purpose: Defines the authenticated request context used by guards, middleware, and tenant scoping.
 * Role: Keeps provider-specific auth details isolated from application modules so Clerk/Auth0 can be swapped later.
 */
import type { Request } from 'express';
import type { PlatformPermission, PlatformRole } from './types/role.types';

/**
 * TYPE: AuthenticatedActor
 * Inputs: resolved identity provider claims and platform authorization metadata.
 * Outputs: normalized actor context attached to inbound requests.
 * Functionality: Represents the current authenticated platform user without leaking provider-specific token shapes.
 */
export type AuthenticatedActor = {
  userId: string;
  platformUserId: string;
  organizationId: string;
  organizationMembershipId?: string;
  role: PlatformRole;
  permissions: PlatformPermission[];
  providerUserId?: string;
  email?: string;
  displayName?: string;
};

/**
 * TYPE: RequestWithAuthContext
 * Inputs: Express/Nest HTTP request.
 * Outputs: request enriched with auth and tenant context.
 * Functionality: Gives controllers, guards, and middleware a single typed request contract.
 */
export type RequestWithAuthContext = Request & {
  user?: AuthenticatedActor;
  auth?: AuthenticatedActor;
  tenant?: {
    organizationId: string;
  };
};
