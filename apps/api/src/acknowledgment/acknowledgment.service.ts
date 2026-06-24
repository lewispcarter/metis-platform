// @ts-nocheck
/**
 * ACKNOWLEDGMENT SERVICE
 * Purpose: Owns explicit operational acknowledgment and acceptance state.
 * Role: Prevents the platform from treating communication delivery as operational responsibility.
 */
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcknowledgmentDto } from './dto/create-acknowledgment.dto';
import { TimeoutAcknowledgmentDto } from './dto/timeout-acknowledgment.dto';
import type { AcknowledgmentView } from './acknowledgment.types';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class AcknowledgmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
    private readonly eventService: EventService,
  ) {}

  /**
   * FUNCTION: create
   * Inputs: acknowledgment payload from personnel, operator, or workflow system.
   * Outputs: created acknowledgment view.
   * Functionality: Records acknowledgment, synchronizes parent event acknowledgment status, emits domain event for accepted/acknowledged states, and records immutable audit history.
   * External calls: PrismaService.acknowledgment.create(input) persists acknowledgment; PrismaService.operationalEvent.update(input) updates parent event; AuditService.record(input) appends history; EventBusService.publish(event) emits acknowledgment domain event.
   */
  async create(input: CreateAcknowledgmentDto, actor?: AuthenticatedActor): Promise<AcknowledgmentView> {
    await this.eventService.findById(input.organizationId, input.operationalEventId);
    const record = await this.prisma.acknowledgment.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        personnelId: input.personnelId,
        status: input.status,
        responseText: input.responseText,
        metadata: input.metadata ?? {},
      },
    });

    await this.prisma.operationalEvent.update({
      where: { id: input.operationalEventId },
      data: { acknowledgmentStatus: input.status },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'acknowledgment_recorded',
      newState: input.status,
      metadata: { acknowledgmentId: record.id, responseText: input.responseText },
    });

    if (input.status === 'ACKNOWLEDGED' || input.status === 'ACCEPTED') {
      await this.eventService.transitionStatus(input.organizationId, input.operationalEventId, 'ACKNOWLEDGED', actor);
      await this.eventBus.publish({
        name: 'operational_event.acknowledged',
        payload: {
          organizationId: input.organizationId,
          eventId: input.operationalEventId,
          correlationId: input.operationalEventId,
          occurredAt: new Date().toISOString(),
          data: { acknowledgmentId: record.id, status: input.status, personnelId: input.personnelId },
        },
      });
    }

    return this.toAcknowledgmentView(record);
  }

  /**
   * FUNCTION: timeout
   * Inputs: timeout payload bound to one event.
   * Outputs: timeout acknowledgment view.
   * Functionality: Marks acknowledgment window timed out and emits auditable timeout state.
   * External calls: AcknowledgmentService.create(input) records timeout status and updates parent event.
   */
  async timeout(input: TimeoutAcknowledgmentDto, actor?: AuthenticatedActor): Promise<AcknowledgmentView> {
    return this.create({
      organizationId: input.organizationId,
      operationalEventId: input.operationalEventId,
      status: 'TIMED_OUT',
      metadata: input.metadata ?? {},
    }, actor);
  }

  /**
   * FUNCTION: listByEvent
   * Inputs: organization id and operational event id.
   * Outputs: acknowledgment records for that event.
   * Functionality: Lists acknowledgment history for an event timeline.
   * External calls: PrismaService.acknowledgment.findMany(input) retrieves tenant-scoped acknowledgment rows.
   */
  async listByEvent(organizationId: string, operationalEventId: string): Promise<AcknowledgmentView[]> {
    const records = await this.prisma.acknowledgment.findMany({
      where: { organizationId, operationalEventId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toAcknowledgmentView(record));
  }

  /**
   * FUNCTION: toAcknowledgmentView
   * Inputs: Prisma acknowledgment row.
   * Outputs: API-facing acknowledgment view.
   * Functionality: Converts database row into stable acknowledgment contract.
   */
  private toAcknowledgmentView(record: { id: string; organizationId: string; operationalEventId: string; personnelId: string | null; status: string; responseText: string | null; metadata: unknown; createdAt: Date; updatedAt: Date }): AcknowledgmentView {
    return {
      acknowledgmentId: record.id,
      organizationId: record.organizationId,
      operationalEventId: record.operationalEventId,
      personnelId: record.personnelId ?? undefined,
      status: record.status as AcknowledgmentView['status'],
      responseText: record.responseText ?? undefined,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
