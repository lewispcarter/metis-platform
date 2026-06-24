// @ts-nocheck
/**
 * TEST SUITE: PlatformUserService
 * Purpose: Validates provider-agnostic platform identity synchronization.
 * Scope: Organization, role, user, and membership upsert orchestration.
 */
import { PlatformUserService } from './platform-user.service';

describe('PlatformUserService', () => {
  const prisma = {
    organization: { upsert: jest.fn() },
    role: { upsert: jest.fn() },
    user: { upsert: jest.fn() },
    organizationMembership: { upsert: jest.fn() },
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * TEST: should_sync_authenticated_user_into_database_identity_records
   * Purpose: Confirms external identity is converted into platform-owned user and membership records.
   */
  it('should_sync_authenticated_user_into_database_identity_records', async () => {
    // ARRANGE
    const service = new PlatformUserService(prisma);
    (prisma as any).role.upsert.mockResolvedValue({ id: 'role_1' });
    (prisma as any).user.upsert.mockResolvedValue({
      id: 'user_db_1',
      email: 'operator@example.com',
      displayName: 'Operator One',
    });
    (prisma as any).organizationMembership.upsert.mockResolvedValue({ id: 'membership_1' });

    // ACT
    const result = await service.syncAuthenticatedUser({
      providerUserId: 'clerk_user_1',
      requestedUserId: 'clerk_user_1',
      organizationId: 'org_1',
      role: 'Operator',
      permissions: [],
      email: 'operator@example.com',
      displayName: 'Operator One',
    });

    // ASSERT
    expect((prisma as any).organization.upsert).toHaveBeenCalledWith({
      where: { id: 'org_1' },
      update: {},
      create: { id: 'org_1', name: 'External Organization' },
    });
    expect(result.platformUserId).toBe('user_db_1');
    expect(result.organizationMembershipId).toBe('membership_1');
    expect(result.permissions).toContain('event:read');
  });
});
