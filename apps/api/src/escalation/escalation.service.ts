// @ts-nocheck
/**
 * ESCALATION SERVICE
 * Purpose: Owns policy-driven escalation records and escalation state transitions.
 * Role: Prevents critical operational events from silently remaining unowned or unresolved.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { EventService } from '../event/event.service';
import { PrismaService } from '../prisma/prisma.service';
import { PLATFORM_QUEUES } from '../queue/queue.constants';
import { CreateEscalationDto } from './dto/create-escalation.dto';
import { EvaluateEscalationDto } from './dto/evaluate-escalation.dto';
import { ForceEscalationDto } from './dto/force-escalation.dto';
import type { EscalationView } from './escalation.types';
import { evaluateEscalationPolicy } from './escalation-policy';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class EscalationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
    private readonly eventService: EventService,
    @Inject(PLATFORM_QUEUES.escalation) private readonly escalationQueue: Queue,
  ) {}

  /**
   * FUNCTION: create
   * Inputs: tenant-scoped escalation payload.
   * Outputs: created escalation view.
   * Functionality: Records escalation, transitions the parent operational event, appends audit history, publishes escalation event, and schedules follow-up evaluation.
   * External calls: PrismaService.escalation.create(input) persists escalation; EventService.transitionStatus(input) updates parent event; AuditService.record(input) appends history; EventBusService.publish(event) emits domain event; Queue.add(name,data,opts) schedules follow-up.
   */
  async create(input: CreateEscalationDto, actor?: AuthenticatedActor): Promise<EscalationView> {
    const event = await this.eventService.findById(input.organizationId, input.operationalEventId);
    const escalation = await this.prisma.escalation.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        level: input.level,
        reason: input.reason,
        status: 'OPEN',
        metadata: input.metadata ?? {},
      },
    });

    if (event.status !== 'ESCALATED') {
      await this.eventService.transitionStatus(input.organizationId, input.operationalEventId, 'ESCALATED', actor);
    }

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'event_escalated',
      newState: 'ESCALATED',
      metadata: { escalationId: escalation.id, level: escalation.level, reason: escalation.reason },
    });

    await this.eventBus.publish({
      name: 'operational_event.escalated',
      payload: {
        organizationId: input.organizationId,
        eventId: input.operationalEventId,
        correlationId: input.operationalEventId,
        occurredAt: new Date().toISOString(),
        data: { escalationId: escalation.id, level: escalation.level, reason: escalation.reason },
      },
    });

    await this.escalationQueue.add('escalation.follow_up', {
      organizationId: input.organizationId,
      operationalEventId: input.operationalEventId,
      escalationId: escalation.id,
    }, { delay: 300000, attempts: 3, backoff: { type: 'exponential', delay: 60000 } });

    return this.toEscalationView(escalation);
  }

  /**
   * FUNCTION: evaluate
   * Inputs: organization id, event id, and optional policy context.
   * Outputs: escalation decision summary.
   * Functionality: Performs deterministic first-pass escalation checks for unresolved, unacknowledged, or communication-failed events.
   * External calls: EventService.findById(input) retrieves current event state; EscalationService.create(input) records escalation when policy threshold is met.
   */
  async evaluate(input: EvaluateEscalationDto): Promise<{ escalated: boolean; reason?: string; escalation?: EscalationView }> {
    const event = await this.eventService.findById(input.organizationId, input.operationalEventId);
    const ageMinutes = Math.floor((Date.now() - new Date(event.createdAt).getTime()) / 60000);
    const context = input.policyContext ?? {};

    if (event.status === 'RESOLVED' || event.status === 'CLOSED' || event.status === 'ARCHIVED') {
      return { escalated: false };
    }

    const decision = evaluateEscalationPolicy({
      priority: event.priority,
      severity: event.severity,
      ageMinutes,
      escalationLevel: event.escalationLevel,
      acknowledgmentStatus: event.acknowledgmentStatus,
      communicationFailures: context.communicationFailures === true,
    });

    if (decision.shouldEscalate && decision.reason) {
      const escalation = await this.create({
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        level: decision.level,
        reason: decision.reason,
        metadata: { ageMinutes, priority: event.priority, severity: event.severity, context },
      });
      return { escalated: true, reason: escalation.reason, escalation };
    }

    if (decision.nextCheckDelayMs) {
      await this.escalationQueue.add(
        'escalation.check',
        {
          kind: 'escalation.check',
          payload: {
            organizationId: input.organizationId,
            operationalEventId: input.operationalEventId,
            level: event.escalationLevel + 1 || 1,
            reason: 'SCHEDULED_POLICY_RECHECK',
          },
        },
        { delay: decision.nextCheckDelayMs, attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
      );
    }

    return { escalated: false };
  }


  /**
   * FUNCTION: force
   * Inputs: tenant-scoped supervisor escalation command and optional actor.
   * Outputs: created escalation view.
   * Functionality: Lets authorized supervisors force escalation immediately instead of waiting for automated policy timers.
   * External calls: EscalationService.create(input) persists escalation, updates event state, schedules follow-up, publishes event, and records audit history.
   */
  async force(input: ForceEscalationDto, actor?: AuthenticatedActor): Promise<EscalationView> {
    return this.create({
      organizationId: input.organizationId,
      operationalEventId: input.operationalEventId,
      level: input.level ?? 1,
      reason: input.reason ?? 'SUPERVISOR_FORCED_ESCALATION',
      metadata: { forcedBy: 'supervisor_control', ...input.metadata },
    }, actor);
  }

  /**
   * FUNCTION: listByOrganization
   * Inputs: organization id.
   * Outputs: tenant-scoped escalation records.
   * Functionality: Lists escalations ordered by newest first for operational visibility.
   * External calls: PrismaService.escalation.findMany(input) retrieves tenant-scoped escalation rows.
   */
  async listByOrganization(organizationId: string): Promise<EscalationView[]> {
    const records = await this.prisma.escalation.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
    return records.map((record) => this.toEscalationView(record));
  }

  /**
   * FUNCTION: resolve
   * Inputs: organization id and escalation id.
   * Outputs: resolved escalation view.
   * Functionality: Resolves an open escalation and records audit history.
   * External calls: PrismaService.escalation.findFirst(input) verifies tenant ownership; PrismaService.escalation.update(input) persists resolution; AuditService.record(input) appends history.
   */
  async resolve(organizationId: string, escalationId: string, actor?: AuthenticatedActor): Promise<EscalationView> {
    const existing = await this.prisma.escalation.findFirst({ where: { id: escalationId, organizationId } });
    if (!existing) {
      throw new NotFoundException('Escalation not found.');
    }
    const record = await this.prisma.escalation.update({ where: { id: escalationId }, data: { status: 'RESOLVED' } });
    await this.auditService.recordMutation(actor, organizationId, {
      eventId: record.operationalEventId,
      action: 'escalation_resolved',
      previousState: existing.status,
      newState: 'RESOLVED',
      metadata: { escalationId },
    });
    return this.toEscalationView(record);
  }

  /**
   * FUNCTION: toEscalationView
   * Inputs: Prisma escalation row.
   * Outputs: API-facing escalation view.
   * Functionality: Converts database rows into stable escalation contracts.
   */
  private toEscalationView(record: { id: string; organizationId: string; operationalEventId: string; level: number; status: string; reason: string; metadata: unknown; createdAt: Date; updatedAt: Date }): EscalationView {
    return {
      escalationId: record.id,
      organizationId: record.organizationId,
      operationalEventId: record.operationalEventId,
      level: record.level,
      status: record.status as EscalationView['status'],
      reason: record.reason,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
