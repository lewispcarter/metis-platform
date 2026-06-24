// @ts-nocheck
/**
 * EVENT SERVICE
 * Purpose: Owns operational event creation, lifecycle state, and tenant-scoped querying.
 * Role: Platform nervous system. No operational workflow should bypass this service.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { CreateOperationalEventDto } from './dto/create-operational-event.dto';
import type { OperationalEvent, OperationalEventStatus } from './event.types';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * FUNCTION: create
   * Inputs: validated operational event creation DTO.
   * Outputs: created operational event.
   * Functionality: Creates the canonical event object, records immutable audit history, and publishes an internal event.
   * External calls: PrismaService.operationalEvent.create(input) persists the event; AuditService.record(input) appends immutable operational history; EventBusService.publish(event) notifies internal subscribers.
   */
  async create(input: CreateOperationalEventDto, actor?: AuthenticatedActor): Promise<OperationalEvent> {
    const record = await this.prisma.operationalEvent.create({
      data: {
        organizationId: input.organizationId,
        departmentId: input.departmentId,
        eventType: input.eventType,
        eventCategory: input.eventCategory,
        title: input.title,
        description: input.description,
        source: input.source,
        severity: input.severity,
        priority: input.priority,
        metadata: input.metadata ?? {},
      },
    });

    const event = this.toOperationalEvent(record);

    await this.auditService.recordMutation(actor, event.organizationId, {
      eventId: event.eventId,
      action: 'event_created',
      newState: event.status,
      metadata: { eventType: event.eventType, priority: event.priority, severity: event.severity },
    });

    await this.eventBus.publish({
      name: 'operational_event.created',
      payload: {
        organizationId: event.organizationId,
        eventId: event.eventId,
        correlationId: event.eventId,
        occurredAt: new Date().toISOString(),
        data: { eventType: event.eventType, priority: event.priority, severity: event.severity },
      },
    });

    return event;
  }

  /**
   * FUNCTION: listByOrganization
   * Inputs: organization id for tenant scoping.
   * Outputs: operational events owned by the organization.
   * Functionality: Returns tenant-scoped event records ordered by newest first.
   * External calls: PrismaService.operationalEvent.findMany(input) retrieves tenant-scoped event rows.
   */
  async listByOrganization(organizationId: string): Promise<OperationalEvent[]> {
    const records = await this.prisma.operationalEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toOperationalEvent(record));
  }

  /**
   * FUNCTION: findById
   * Inputs: organization id and event id.
   * Outputs: matching operational event.
   * Functionality: Finds a tenant-scoped operational event or throws if absent.
   * External calls: PrismaService.operationalEvent.findFirst(input) retrieves the requested tenant-scoped event row.
   */
  async findById(organizationId: string, eventId: string): Promise<OperationalEvent> {
    const record = await this.prisma.operationalEvent.findFirst({ where: { id: eventId, organizationId } });
    if (!record) {
      throw new NotFoundException('Operational event not found.');
    }
    return this.toOperationalEvent(record);
  }

  /**
   * FUNCTION: transitionStatus
   * Inputs: organization id, event id, and target status.
   * Outputs: updated operational event.
   * Functionality: Transitions event state, records an immutable audit entry, and publishes a domain event for important state changes.
   * External calls: PrismaService.operationalEvent.update(input) persists state; AuditService.record(input) appends state-transition history; EventBusService.publish(event) notifies internal subscribers.
   */
  async transitionStatus(organizationId: string, eventId: string, status: OperationalEventStatus, actor?: AuthenticatedActor): Promise<OperationalEvent> {
    const existing = await this.findById(organizationId, eventId);
    const record = await this.prisma.operationalEvent.update({
      where: { id: eventId },
      data: { status },
    });
    const event = this.toOperationalEvent(record);

    await this.auditService.recordMutation(actor, organizationId, {
      eventId,
      action: 'event_status_transitioned',
      previousState: existing.status,
      newState: status,
      metadata: {},
    });

    if (status === 'ASSIGNED' || status === 'ACKNOWLEDGED' || status === 'ESCALATED' || status === 'RESOLVED') {
      await this.eventBus.publish({
        name: `operational_event.${status.toLowerCase()}` as 'operational_event.assigned' | 'operational_event.acknowledged' | 'operational_event.escalated' | 'operational_event.resolved',
        payload: {
          organizationId,
          eventId,
          correlationId: eventId,
          occurredAt: new Date().toISOString(),
          data: { previousState: existing.status, newState: status },
        },
      });
    }

    return event;
  }

  /**
   * FUNCTION: toOperationalEvent
   * Inputs: Prisma operational event row.
   * Outputs: API-facing operational event object.
   * Functionality: Converts database naming and Date objects into the platform event contract.
   */
  private toOperationalEvent(record: {
    id: string;
    organizationId: string;
    departmentId: string | null;
    eventType: string;
    eventCategory: string;
    title: string;
    description: string | null;
    source: string;
    status: string;
    severity: string;
    priority: string;
    escalationLevel: number;
    acknowledgmentStatus: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: unknown;
  }): OperationalEvent {
    return {
      eventId: record.id,
      organizationId: record.organizationId,
      departmentId: record.departmentId ?? undefined,
      eventType: record.eventType,
      eventCategory: record.eventCategory as OperationalEvent['eventCategory'],
      title: record.title,
      description: record.description ?? undefined,
      source: record.source,
      status: record.status as OperationalEventStatus,
      severity: record.severity as OperationalEvent['severity'],
      priority: record.priority as OperationalEvent['priority'],
      escalationLevel: record.escalationLevel,
      acknowledgmentStatus: record.acknowledgmentStatus as OperationalEvent['acknowledgmentStatus'],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      metadata: record.metadata as Record<string, unknown>,
    };
  }
}
