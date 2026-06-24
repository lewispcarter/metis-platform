// @ts-nocheck
/**
 * TEST SUITE: AuthBoundaryService
 * Purpose: Validates normalization of Clerk bearer tokens and development auth headers into database-backed platform auth context.
 * Scope: User, tenant, role, permission resolution, and identity sync boundary behavior.
 */
import { UnauthorizedException } from '@nestjs/common';
import { AuthBoundaryService } from './auth-boundary.service';
import type { RequestWithAuthContext } from './auth-context.types';
import type { ClerkAuthProvider } from './providers/clerk-auth.provider';
import type { PlatformUserService } from './platform-user.service';

describe('AuthBoundaryService', () => {
  const clerkAuthProvider = {
    verifyBearerToken: jest.fn(),
  } as unknown as jest.Mocked<ClerkAuthProvider>;

  const platformUserService = {
    syncAuthenticatedUser: jest.fn(),
  } as unknown as jest.Mocked<PlatformUserService>;

  const service = new AuthBoundaryService(clerkAuthProvider, platformUserService);

  beforeEach(() => {
    jest.clearAllMocks();
    platformUserService.syncAuthenticatedUser.mockResolvedValue({
      platformUserId: 'platform_user_123',
      organizationMembershipId: 'membership_123',
      organizationId: 'org_123',
      role: 'Owner',
      permissions: ['organization:manage', 'event:read'],
      email: 'owner@example.com',
      displayName: 'Owner User',
    });
  });

  /**
   * TEST: should_resolve_actor_when_required_development_headers_exist
   * Purpose: Confirms the auth boundary creates a normalized actor with database-backed platform user attribution.
   */
  it('should_resolve_actor_when_required_development_headers_exist', async () => {
    // ARRANGE
    const request = {
      headers: {
        'x-user-id': 'user_123',
        'x-organization-id': 'org_123',
        'x-role': 'Owner',
        'x-user-email': 'owner@example.com',
      },
    } as unknown as RequestWithAuthContext;

    // ACT
    const actor = await service.resolveActor(request);

    // ASSERT
    expect(platformUserService.syncAuthenticatedUser).toHaveBeenCalled();
    expect(actor.userId).toBe('platform_user_123');
    expect(actor.platformUserId).toBe('platform_user_123');
    expect(actor.organizationMembershipId).toBe('membership_123');
    expect(actor.permissions).toContain('organization:manage');
  });

  /**
   * TEST: should_resolve_actor_when_clerk_bearer_token_is_valid
   * Purpose: Confirms Clerk tokens are resolved through the provider boundary and synced into platform identity records.
   */
  it('should_resolve_actor_when_clerk_bearer_token_is_valid', async () => {
    // ARRANGE
    clerkAuthProvider.verifyBearerToken.mockResolvedValue({
      providerUserId: 'clerk_user_123',
      organizationId: 'org_123',
      role: 'Supervisor',
      permissions: ['event:read'],
      email: 'supervisor@example.com',
    });
    platformUserService.syncAuthenticatedUser.mockResolvedValue({
      platformUserId: 'platform_user_456',
      organizationMembershipId: 'membership_456',
      organizationId: 'org_123',
      role: 'Supervisor',
      permissions: ['event:read'],
      email: 'supervisor@example.com',
      displayName: 'Supervisor User',
    });

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as unknown as RequestWithAuthContext;

    // ACT
    const actor = await service.resolveActor(request);

    // ASSERT
    expect(clerkAuthProvider.verifyBearerToken).toHaveBeenCalledWith('valid-token');
    expect(platformUserService.syncAuthenticatedUser).toHaveBeenCalledWith(expect.objectContaining({ providerUserId: 'clerk_user_123' }));
    expect(actor.userId).toBe('platform_user_456');
    expect(actor.providerUserId).toBe('clerk_user_123');
    expect(actor.role).toBe('Supervisor');
  });

  /**
   * TEST: should_throw_when_required_auth_context_is_missing
   * Purpose: Confirms protected routes fail closed when neither provider auth nor development headers are present.
   */
  it('should_throw_when_required_auth_context_is_missing', async () => {
    // ARRANGE
    const request = { headers: {} } as unknown as RequestWithAuthContext;

    // ACT + ASSERT
    await expect(service.resolveActor(request)).rejects.toThrow(UnauthorizedException);
  });

  /**
   * TEST: should_throw_when_role_is_invalid
   * Purpose: Confirms unsupported role claims cannot enter the authorization system.
   */
  it('should_throw_when_role_is_invalid', async () => {
    // ARRANGE
    const request = {
      headers: {
        'x-user-id': 'user_123',
        'x-organization-id': 'org_123',
        'x-role': 'FakeRole',
      },
    } as unknown as RequestWithAuthContext;

    // ACT + ASSERT
    await expect(service.resolveActor(request)).rejects.toThrow(UnauthorizedException);
  });
});
