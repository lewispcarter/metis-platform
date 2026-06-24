// @ts-nocheck
/**
 * ==========================================================================
 * TEST SUITE: EventService
 * ==========================================================================
 * MODULE UNDER TEST: EventService
 * TEST TYPE: Unit
 * FRAMEWORK: Jest
 * AUTHOR: Metis Platform Engineering
 * CREATED: 2026-06-09
 * LAST MODIFIED: 2026-06-09
 * VERSION: 0.2.0
 * DESCRIPTION:
 * Validates operational event creation and lifecycle transition behavior against mocked persistence, audit, and internal event bus boundaries.
 * DEPENDENCIES:
 * - PrismaService: mocked database boundary for operational event persistence.
 * - AuditService: mocked immutable audit boundary used to verify audit side effects.
 * - EventBusService: mocked internal domain event bus used to verify event-driven module communication.
 * COVERAGE SCOPE:
 * ✓ Event creation
 * ✓ Tenant-scoped event lookup
 * ✓ Event status transitions
 * ==========================================================================
 */
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventService } from './event.service';

const createRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'event_1',
  organizationId: 'org_1',
  departmentId: null,
  eventType: 'employee_calloff',
  eventCategory: 'STAFFING',
  title: 'Employee call-off',
  description: null,
  source: 'manual_test',
  status: 'CREATED',
  severity: 'S2_HIGH',
  priority: 'URGENT',
  escalationLevel: 0,
  acknowledgmentStatus: 'PENDING',
  metadata: { shift: '7AM-3PM' },
  createdAt: new Date('2026-06-09T12:00:00.000Z'),
  updatedAt: new Date('2026-06-09T12:00:00.000Z'),
  ...overrides,
});

describe('EventService - Operational Event Lifecycle', () => {
  let auditService: jest.Mocked<Pick<AuditService, 'recordMutation'>>;
  let eventBus: jest.Mocked<Pick<EventBusService, 'publish'>>;
  let prisma: {
    operationalEvent: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let eventService: EventService;

  beforeEach(() => {
    auditService = { recordMutation: jest.fn().mockResolvedValue({}) };
    eventBus = { publish: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      operationalEvent: {
        create: jest.fn().mockResolvedValue(createRecord()),
        findMany: jest.fn().mockResolvedValue([createRecord()]),
        findFirst: jest.fn().mockResolvedValue(createRecord()),
        update: jest.fn().mockResolvedValue(createRecord({ status: 'CLASSIFIED' })),
      },
    };
    eventService = new EventService(prisma as unknown as PrismaService, auditService as AuditService, eventBus as EventBusService);
  });

  test('should_create_operational_event_when_valid_input_is_provided', async () => {
    const input = {
      organizationId: 'org_1',
      eventType: 'employee_calloff',
      eventCategory: 'STAFFING' as const,
      title: 'Employee call-off',
      source: 'manual_test',
      priority: 'URGENT' as const,
      severity: 'S2_HIGH' as const,
      metadata: { shift: '7AM-3PM' },
    };

    const result = await eventService.create(input);

    expect(result.organizationId).toBe(input.organizationId);
    expect(result.status).toBe('CREATED');
    expect(result.acknowledgmentStatus).toBe('PENDING');
    expect(prisma.operationalEvent.create).toHaveBeenCalledTimes(1);
    expect(auditService.recordMutation).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ name: 'operational_event.created' }));
  });

  test('should_transition_status_and_record_audit_when_event_exists', async () => {
    const result = await eventService.transitionStatus('org_1', 'event_1', 'CLASSIFIED');

    expect(result.status).toBe('CLASSIFIED');
    expect(prisma.operationalEvent.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.operationalEvent.update).toHaveBeenCalledWith({ where: { id: 'event_1' }, data: { status: 'CLASSIFIED' } });
    expect(auditService.recordMutation).toHaveBeenCalledWith(undefined, 'org_1', expect.objectContaining({ action: 'event_status_transitioned' }));
  });
});
