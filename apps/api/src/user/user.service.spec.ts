// @ts-nocheck
/**
 * TEST SUITE: UserService
 * Purpose: Validates tenant-scoped platform user visibility.
 * Scope: User listing and organization membership listing.
 */
import { UserService } from './user.service';

describe('UserService', () => {
  /**
   * TEST: should_list_users_for_current_organization
   * Purpose: Confirms user queries remain scoped to the authenticated organization.
   */
  it('should_list_users_for_current_organization', async () => {
    // ARRANGE
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user_1',
            organizationId: 'org_1',
            email: 'operator@example.com',
            displayName: 'Operator One',
            status: 'ACTIVE',
            externalAuthId: 'clerk_user_1',
            role: { name: 'Operator' },
            createdAt: new Date('2026-06-10T00:00:00.000Z'),
          },
        ]),
      },
      organizationMembership: { findMany: jest.fn() },
    } as never;
    const service = new UserService(prisma);

    // ACT
    const result = await service.listByOrganization('org_1');

    // ASSERT
    expect((prisma as any).user.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org_1' },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(result[0].userId).toBe('user_1');
    expect(result[0].roleName).toBe('Operator');
  });
});
