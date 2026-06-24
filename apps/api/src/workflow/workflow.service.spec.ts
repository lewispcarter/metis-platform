// @ts-nocheck
/**
 * ============================================================================
 * TEST SUITE: Workflow Service
 * ============================================================================
 * MODULE UNDER TEST: workflow.service
 * TEST TYPE: Unit
 * FRAMEWORK: Jest
 * AUTHOR: Metis Platform Engineering
 * CREATED: 2026-06-09
 * LAST MODIFIED: 2026-06-09
 * VERSION: 0.1.0
 * DESCRIPTION:
 * Validates workflow run orchestration behavior without touching external systems.
 * DEPENDENCIES:
 * - Jest: test runner
 * - PrismaService mock: database isolation
 * COVERAGE SCOPE:
 * ✓ Workflow run creation
 * ✓ Event transition orchestration
 * ✓ Audit append behavior
 * ✓ Domain event publication
 * EXECUTION REQUIREMENTS:
 * - Environment: test
 * - Prerequisites: none
 * - Runtime: under 10ms per unit test target
 * ============================================================================
 */
import { WorkflowService } from './workflow.service';

describe('WorkflowService - workflow orchestration', () => {
  const prisma = { workflowRun: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() } } as any;
  const auditService = { recordMutation: jest.fn() } as any;
  const eventBus = { publish: jest.fn() } as any;
  const eventService = { transitionStatus: jest.fn() } as any;
  const service = new WorkflowService(prisma, auditService, eventBus, eventService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should_start_workflow_when_valid_event_is_provided', async () => {
    const record = {
      id: 'workflow-1',
      organizationId: 'org-1',
      operationalEventId: 'event-1',
      workflowDefinitionId: null,
      status: 'STARTED',
      currentStep: 'workflow_started',
      metadata: {},
      startedAt: new Date('2026-06-09T00:00:00.000Z'),
      completedAt: null,
      updatedAt: new Date('2026-06-09T00:00:00.000Z'),
    };
    prisma.workflowRun.create.mockResolvedValue(record);

    const result = await service.start({ organizationId: 'org-1', operationalEventId: 'event-1' });

    expect(result.workflowRunId).toBe('workflow-1');
    expect(eventService.transitionStatus).toHaveBeenCalledWith('org-1', 'event-1', 'WORKFLOW_STARTED', undefined);
    expect(auditService.recordMutation).toHaveBeenCalledWith(undefined, 'org-1', expect.objectContaining({ action: 'workflow_started' }));
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ name: 'workflow.started' }));
  });
});
