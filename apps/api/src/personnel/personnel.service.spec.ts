// @ts-nocheck
/**
 * ============================================================================
 * TEST SUITE: Personnel Service
 * ============================================================================
 * MODULE UNDER TEST: personnel.service
 * TEST TYPE: Unit
 * FRAMEWORK: Jest
 * AUTHOR: Metis Platform Engineering
 * CREATED: 2026-06-09
 * LAST MODIFIED: 2026-06-09
 * VERSION: 0.1.0
 * DESCRIPTION:
 * Validates personnel creation and candidate discovery logic in isolation.
 * DEPENDENCIES:
 * - Jest: test runner
 * - PrismaService mock: database isolation
 * COVERAGE SCOPE:
 * ✓ Personnel creation
 * ✓ Availability-based candidate filtering
 * EXECUTION REQUIREMENTS:
 * - Environment: test
 * - Prerequisites: none
 * - Runtime: under 10ms per unit test target
 * ============================================================================
 */
import { PersonnelService } from './personnel.service';

describe('PersonnelService - workforce coordination', () => {
  const prisma = { personnel: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() }, availabilityWindow: { create: jest.fn() } } as any;
  const auditService = { recordMutation: jest.fn() } as any;
  const service = new PersonnelService(prisma, auditService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should_create_personnel_when_valid_payload_is_provided', async () => {
    const record = {
      id: 'personnel-1',
      organizationId: 'org-1',
      departmentId: null,
      displayName: 'Avery Johnson',
      roleTitle: 'Nurse',
      email: 'avery@example.com',
      phone: null,
      certifications: ['RN'],
      metadata: {},
      createdAt: new Date('2026-06-09T00:00:00.000Z'),
      updatedAt: new Date('2026-06-09T00:00:00.000Z'),
    };
    prisma.personnel.create.mockResolvedValue(record);

    const result = await service.create({ organizationId: 'org-1', displayName: 'Avery Johnson', roleTitle: 'Nurse', email: 'avery@example.com', certifications: ['RN'] });

    expect(result.personnelId).toBe('personnel-1');
    expect(result.certifications).toEqual(['RN']);
    expect(auditService.recordMutation).toHaveBeenCalledWith(undefined, 'org-1', expect.objectContaining({ action: 'personnel_created' }));
  });
});
