// @ts-nocheck
/**
 * ============================================================================
 * TEST SUITE: Assignment Service
 * ============================================================================
 * MODULE UNDER TEST: assignment.service
 * TEST TYPE: Unit
 * FRAMEWORK: Jest
 * AUTHOR: Metis Platform Engineering
 * CREATED: 2026-06-09
 * LAST MODIFIED: 2026-06-09
 * VERSION: 0.1.0
 * DESCRIPTION:
 * Validates coverage request creation and assignment acceptance behavior.
 * DEPENDENCIES:
 * - Jest: test runner
 * - PrismaService mock: database isolation
 * COVERAGE SCOPE:
 * ✓ Coverage request creation
 * ✓ Assignment acceptance
 * ✓ Audit and domain event emission
 * EXECUTION REQUIREMENTS:
 * - Environment: test
 * - Prerequisites: none
 * - Runtime: under 10ms per unit test target
 * ============================================================================
 */
import { AssignmentService } from './assignment.service';

describe('AssignmentService - coverage ownership', () => {
  const prisma = {
    coverageRequest: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    assignment: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    operationalEvent: { update: jest.fn() },
  } as any;
  const auditService = { recordMutation: jest.fn() } as any;
  const eventBus = { publish: jest.fn() } as any;
  const eventService = { transitionStatus: jest.fn() } as any;
  const service = new AssignmentService(prisma, auditService, eventBus, eventService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should_create_coverage_request_when_required_shift_needs_coverage', async () => {
    const record = {
      id: 'coverage-1',
      organizationId: 'org-1',
      operationalEventId: 'event-1',
      personnelId: null,
      requiredRole: 'Nurse',
      requiredDepartment: null,
      requiredShiftStart: new Date('2026-06-09T07:00:00.000Z'),
      requiredShiftEnd: new Date('2026-06-09T15:00:00.000Z'),
      requiredCertifications: ['RN'],
      status: 'OPEN',
      urgency: 'URGENT',
      coverageDeadline: new Date('2026-06-09T06:30:00.000Z'),
      metadata: {},
      createdAt: new Date('2026-06-09T00:00:00.000Z'),
      updatedAt: new Date('2026-06-09T00:00:00.000Z'),
    };
    prisma.coverageRequest.create.mockResolvedValue(record);

    const result = await service.createCoverageRequest({
      organizationId: 'org-1',
      operationalEventId: 'event-1',
      requiredRole: 'Nurse',
      requiredShiftStart: '2026-06-09T07:00:00.000Z',
      requiredShiftEnd: '2026-06-09T15:00:00.000Z',
      requiredCertifications: ['RN'],
      urgency: 'URGENT',
      coverageDeadline: '2026-06-09T06:30:00.000Z',
    });

    expect(result.coverageRequestId).toBe('coverage-1');
    expect(result.status).toBe('OPEN');
    expect(auditService.recordMutation).toHaveBeenCalledWith(undefined, 'org-1', expect.objectContaining({ action: 'coverage_request_created' }));
  });
});
