// @ts-nocheck
/**
 * COMMUNICATION SERVICE
 * Purpose: Owns provider-agnostic communication records and outbound communication state.
 * Role: Abstracts SMS, voice, email, and dashboard notifications away from workflow logic.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { PLATFORM_QUEUES } from '../queue/queue.constants';
import { SendCommunicationDto } from './dto/send-communication.dto';
import type { CommunicationChannel, CommunicationDirection, CommunicationStatus, CommunicationView } from './communication.types';
import { CommunicationProviderRegistry } from './providers/communication-provider.registry';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
    @Inject(PLATFORM_QUEUES.communication) private readonly communicationQueue: Queue,
    private readonly providerRegistry: CommunicationProviderRegistry,
  ) {}

  /**
   * FUNCTION: send
   * Inputs: provider-agnostic outbound communication payload.
   * Outputs: sent communication view.
   * Functionality: Records outbound communication as SENT, appends audit history, and publishes communication.sent. Provider delivery is intentionally abstracted for later Twilio/email implementation.
   * External calls: PrismaService.communication.create(input) persists communication; AuditService.record(input) appends history; EventBusService.publish(event) notifies workflow subscribers.
   */
  async send(input: SendCommunicationDto, actor?: AuthenticatedActor): Promise<CommunicationView> {
    const record = await this.prisma.communication.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        channel: input.channel,
        direction: 'OUTBOUND',
        status: 'SENT',
        recipient: input.recipient,
        body: input.body,
        metadata: input.metadata ?? {},
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'communication_sent',
      newState: 'SENT',
      metadata: { communicationId: record.id, channel: record.channel, recipient: record.recipient },
    });

    await this.eventBus.publish({
      name: 'communication.sent',
      payload: {
        organizationId: input.organizationId,
        eventId: input.operationalEventId,
        correlationId: input.operationalEventId ?? record.id,
        occurredAt: new Date().toISOString(),
        data: { communicationId: record.id, channel: record.channel, recipient: record.recipient },
      },
    });

    return this.toCommunicationView(record);
  }


  /**
   * FUNCTION: deliverQueued
   * Inputs: provider-agnostic outbound communication payload.
   * Outputs: communication view after provider handoff and status update.
   * Functionality: Creates a communication record, selects the channel provider, performs provider handoff, persists provider message id/status, and emits audit/domain events.
   * External calls: CommunicationService.send(input) creates operational communication record; CommunicationProviderRegistry.getProvider(channel) selects provider; CommunicationProvider.deliver(input) hands message to provider; CommunicationService.markStatus(input) stores delivery state.
   */
  async deliverQueued(input: SendCommunicationDto, actor?: AuthenticatedActor): Promise<CommunicationView> {
    const communication = await this.send(input, actor);
    const provider = this.providerRegistry.getProvider(communication.channel);
    const result = await provider.deliver({
      organizationId: input.organizationId,
      communicationId: communication.communicationId,
      channel: communication.channel,
      recipient: communication.recipient,
      body: communication.body,
      metadata: communication.metadata,
    });

    const record = await this.prisma.communication.update({
      where: { id: communication.communicationId },
      data: {
        status: result.status,
        providerMessageId: result.providerMessageId,
        metadata: { ...communication.metadata, providerName: result.providerName, providerRaw: result.raw ?? {} },
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'communication_provider_dispatched',
      newState: result.status,
      metadata: { communicationId: communication.communicationId, providerName: result.providerName, providerMessageId: result.providerMessageId },
    });

    return this.toCommunicationView(record);
  }


  /**
   * FUNCTION: enqueueOutbound
   * Inputs: outbound communication payload and optional delay milliseconds.
   * Outputs: queued job id and stable communication intent.
   * Functionality: Schedules provider delivery work without blocking API or workflow execution.
   * External calls: Queue.add(name,data,opts) schedules Redis-backed BullMQ delivery work.
   */
  async enqueueOutbound(input: SendCommunicationDto, delayMs = 0, actor?: AuthenticatedActor): Promise<{ jobId: string | number | undefined; queued: true }> {
    const job = await this.communicationQueue.add('communication.send', { kind: 'communication.send', payload: input }, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'communication_enqueued',
      newState: 'QUEUED',
      metadata: { jobId: job.id, channel: input.channel, recipient: input.recipient },
    });

    return { jobId: job.id, queued: true };
  }

  /**
   * FUNCTION: markStatus
   * Inputs: organization id, communication id, and new communication status.
   * Outputs: updated communication view.
   * Functionality: Updates provider delivery status, appends audit history, and emits success/failure domain events.
   * External calls: PrismaService.communication.findFirst(input) verifies tenant ownership; PrismaService.communication.update(input) persists status; AuditService.record(input) appends history; EventBusService.publish(event) emits communication status events.
   */
  async markStatus(organizationId: string, communicationId: string, status: CommunicationStatus, metadata: Record<string, unknown> = {}, actor?: AuthenticatedActor): Promise<CommunicationView> {
    const existing = await this.prisma.communication.findFirst({ where: { id: communicationId, organizationId } });
    if (!existing) {
      throw new NotFoundException('Communication not found.');
    }

    const record = await this.prisma.communication.update({
      where: { id: communicationId },
      data: { status, metadata: { ...(existing.metadata as Record<string, unknown>), ...metadata } },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      eventId: record.operationalEventId ?? undefined,
      action: 'communication_status_updated',
      previousState: existing.status,
      newState: status,
      metadata: { communicationId, channel: record.channel },
    });

    if (status === 'FAILED' || status === 'DELIVERED') {
      await this.eventBus.publish({
        name: status === 'FAILED' ? 'communication.failed' : 'communication.delivered',
        payload: {
          organizationId,
          eventId: record.operationalEventId ?? undefined,
          correlationId: record.operationalEventId ?? communicationId,
          occurredAt: new Date().toISOString(),
          data: { communicationId, status, channel: record.channel },
        },
      });
    }

    return this.toCommunicationView(record);
  }

  /**
   * FUNCTION: scheduleFallback
   * Inputs: failed communication id and fallback communication payload.
   * Outputs: queued fallback delivery metadata.
   * Functionality: Creates deterministic channel fallback behavior for failed or unanswered operational communications.
   * External calls: CommunicationService.markStatus(input) marks original communication failed; CommunicationService.enqueueOutbound(input) schedules replacement channel delivery.
   */
  async scheduleFallback(organizationId: string, failedCommunicationId: string, fallback: SendCommunicationDto): Promise<{ jobId: string | number | undefined; queued: true }> {
    await this.markStatus(organizationId, failedCommunicationId, 'FAILED', { fallbackScheduled: true, fallbackChannel: fallback.channel });
    return this.enqueueOutbound(fallback, 0);
  }




  /**
   * FUNCTION: recordInbound
   * Inputs: normalized inbound communication payload from a provider webhook or integration.
   * Outputs: persisted communication view.
   * Functionality: Records inbound SMS, voice, or email communication, appends audit history, and publishes communication.received for downstream workflow consumers.
   * External calls: PrismaService.communication.create(input) persists inbound communication; AuditService.recordMutation(input) appends immutable history; EventBusService.publish(event) notifies subscribers.
   */
  async recordInbound(input: {
    organizationId: string;
    operationalEventId?: string;
    channel: CommunicationChannel;
    sender: string;
    recipient: string;
    body?: string;
    providerMessageId?: string;
    metadata?: Record<string, unknown>;
  }, actor?: AuthenticatedActor): Promise<CommunicationView> {
    const record = await this.prisma.communication.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        channel: input.channel,
        direction: 'INBOUND',
        status: 'RECEIVED',
        recipient: input.sender,
        body: input.body,
        providerMessageId: input.providerMessageId,
        metadata: { ...(input.metadata ?? {}), sender: input.sender, recipient: input.recipient },
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'communication_received',
      newState: 'RECEIVED',
      metadata: { communicationId: record.id, channel: record.channel, sender: input.sender, recipient: input.recipient },
    });

    await this.eventBus.publish({
      name: 'communication.received',
      payload: {
        organizationId: input.organizationId,
        eventId: input.operationalEventId,
        correlationId: input.operationalEventId ?? record.id,
        occurredAt: new Date().toISOString(),
        data: { communicationId: record.id, channel: record.channel, sender: input.sender },
      },
    });

    return this.toCommunicationView(record);
  }

  /**
   * FUNCTION: listByOrganization
   * Inputs: organization id used for tenant scoping.
   * Outputs: communication records for the tenant.
   * Functionality: Lists communication history ordered by newest first.
   * External calls: PrismaService.communication.findMany(input) retrieves tenant-scoped communication rows.
   */
  async listByOrganization(organizationId: string): Promise<CommunicationView[]> {
    const records = await this.prisma.communication.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
    return records.map((record) => this.toCommunicationView(record));
  }

  /**
   * FUNCTION: toCommunicationView
   * Inputs: Prisma communication row.
   * Outputs: API-facing communication view.
   * Functionality: Converts database naming and Date objects into stable communication contracts.
   */
  private toCommunicationView(record: {
    id: string;
    organizationId: string;
    operationalEventId: string | null;
    channel: string;
    direction: string;
    status: string;
    recipient: string;
    body: string | null;
    providerMessageId: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): CommunicationView {
    return {
      communicationId: record.id,
      organizationId: record.organizationId,
      operationalEventId: record.operationalEventId ?? undefined,
      channel: record.channel as CommunicationChannel,
      direction: record.direction as CommunicationDirection,
      status: record.status as CommunicationStatus,
      recipient: record.recipient,
      body: record.body ?? undefined,
      providerMessageId: record.providerMessageId ?? undefined,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
