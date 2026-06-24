// @ts-nocheck
/**
 * AUTH BOUNDARY SERVICE
 * Purpose: Converts provider-specific authentication material into the platform's normalized auth context.
 * Role: Provides a single boundary for Clerk/Auth0/local development identity handling while protecting application modules from vendor coupling.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedActor, RequestWithAuthContext } from './auth-context.types';
import { isPlatformRole, ROLE_PERMISSIONS, type PlatformPermission, type PlatformRole } from './types/role.types';
import { ClerkAuthProvider } from './providers/clerk-auth.provider';
import { PlatformUserService } from './platform-user.service';

/**
 * FUNCTION: getHeaderValue
 * Inputs: request header map and target header name.
 * Outputs: normalized string value or undefined.
 * Functionality: Reads either a scalar header or the first value from a multi-value header.
 */
function getHeaderValue(headers: RequestWithAuthContext['headers'], name: string): string | undefined {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * FUNCTION: parsePermissions
 * Inputs: comma-separated permission string from trusted auth middleware/provider claims.
 * Outputs: platform permission list.
 * Functionality: Normalizes optional explicit permission grants without trusting arbitrary whitespace or empty entries.
 */
function parsePermissions(rawPermissions?: string): PlatformPermission[] {
  if (!rawPermissions) return [];
  return rawPermissions
    .split(',')
    .map((permission) => permission.trim())
    .filter(Boolean) as PlatformPermission[];
}

/**
 * FUNCTION: extractBearerToken
 * Inputs: inbound HTTP authorization header.
 * Outputs: bearer token value or undefined.
 * Functionality: Extracts a token from the standard Authorization: Bearer <token> format.
 */
function extractBearerToken(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader) return undefined;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
  return token;
}

@Injectable()
export class AuthBoundaryService {
  constructor(
    private readonly clerkAuthProvider: ClerkAuthProvider,
    private readonly platformUserService: PlatformUserService,
  ) {}

  /**
   * FUNCTION: resolveActor
   * Inputs: inbound HTTP request containing identity provider headers, Clerk bearer token, or local development identity headers.
   * Outputs: normalized authenticated actor backed by platform database user and membership records.
   * Functionality: Resolves user id, organization id, role, and permissions, then synchronizes the actor into PostgreSQL for audit attribution and membership enforcement.
   * External calls: ClerkAuthProvider.verifyBearerToken(token) verifies Clerk JWTs; PlatformUserService.syncAuthenticatedUser(input) upserts user/membership records.
   */
  async resolveActor(request: RequestWithAuthContext): Promise<AuthenticatedActor> {
    const bearerToken = extractBearerToken(getHeaderValue(request.headers, 'authorization'));

    if (bearerToken) {
      const claims = await this.clerkAuthProvider.verifyBearerToken(bearerToken);
      const role = claims.role ?? 'Operator';
      const organizationId = claims.organizationId;

      if (!organizationId) {
        throw new UnauthorizedException('Authenticated token is missing organization claim.');
      }

      if (!isPlatformRole(role)) {
        throw new UnauthorizedException(`Invalid platform role from auth provider: ${role}`);
      }

      const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
      const explicitPermissions = (claims.permissions ?? []) as PlatformPermission[];
      const syncedUser = await this.platformUserService.syncAuthenticatedUser({
        providerUserId: claims.providerUserId,
        requestedUserId: claims.providerUserId,
        organizationId,
        role,
        permissions: Array.from(new Set([...rolePermissions, ...explicitPermissions])),
        email: claims.email,
        displayName: claims.displayName,
      });

      return {
        userId: syncedUser.platformUserId,
        platformUserId: syncedUser.platformUserId,
        providerUserId: claims.providerUserId,
        organizationId,
        organizationMembershipId: syncedUser.organizationMembershipId,
        role,
        permissions: syncedUser.permissions,
        email: syncedUser.email,
        displayName: syncedUser.displayName,
      };
    }

    const requestedUserId = getHeaderValue(request.headers, 'x-user-id');
    const organizationId = getHeaderValue(request.headers, 'x-organization-id');
    const rawRole = getHeaderValue(request.headers, 'x-role');
    const providerUserId = getHeaderValue(request.headers, 'x-provider-user-id');
    const email = getHeaderValue(request.headers, 'x-user-email');
    const displayName = getHeaderValue(request.headers, 'x-user-name');
    const explicitPermissions = parsePermissions(getHeaderValue(request.headers, 'x-permissions'));

    if (!requestedUserId || !organizationId || !rawRole) {
      throw new UnauthorizedException('Missing authentication context. Provide a Clerk bearer token or development headers: x-user-id, x-organization-id, x-role.');
    }

    if (!isPlatformRole(rawRole)) {
      throw new UnauthorizedException(`Invalid platform role: ${rawRole}`);
    }

    const role = rawRole as PlatformRole;
    const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
    const syncedUser = await this.platformUserService.syncAuthenticatedUser({
      providerUserId,
      requestedUserId,
      organizationId,
      role,
      permissions: Array.from(new Set([...rolePermissions, ...explicitPermissions])),
      email,
      displayName,
    });

    return {
      userId: syncedUser.platformUserId,
      platformUserId: syncedUser.platformUserId,
      providerUserId,
      organizationId,
      organizationMembershipId: syncedUser.organizationMembershipId,
      role,
      permissions: syncedUser.permissions,
      email: syncedUser.email,
      displayName: syncedUser.displayName,
    };
  }
}
