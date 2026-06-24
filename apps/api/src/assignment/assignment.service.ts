// @ts-nocheck
/**
 * ASSIGNMENT SERVICE
 * Purpose: Owns coverage requests and assignment state for operational events.
 * Role: Converts personnel coordination decisions into auditable ownership and coverage fulfillment records.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { EventService } from '../event/event.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateCoverageRequestDto } from './dto/create-coverage-request.dto';
import { RespondToCoverageOfferDto } from './dto/respond-to-coverage-offer.dto';
import type { AssignmentStatus, AssignmentView, CoverageRequestStatus, CoverageRequestView } from './assignment.types';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class AssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
    private readonly eventService: EventService,
  ) {}

  /**
   * FUNCTION: createCoverageRequest
   * Inputs: validated coverage request payload.
   * Outputs: created coverage request view.
   * Functionality: Opens a coverage request for a source event and records immutable audit history.
   * External calls: PrismaService.coverageRequest.create(input) persists request; AuditService.record(input) appends history.
   */
  async createCoverageRequest(input: CreateCoverageRequestDto, actor?: AuthenticatedActor): Promise<CoverageRequestView> {
    const record = await this.prisma.coverageRequest.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        requiredRole: input.requiredRole,
        requiredDepartment: input.requiredDepartment,
        requiredShiftStart: new Date(input.requiredShiftStart),
        requiredShiftEnd: new Date(input.requiredShiftEnd),
        requiredCertifications: input.requiredCertifications ?? [],
        status: 'OPEN',
        urgency: input.urgency,
        coverageDeadline: new Date(input.coverageDeadline),
        metadata: input.metadata ?? {},
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'coverage_request_created',
      newState: 'OPEN',
      metadata: { coverageRequestId: record.id, requiredRole: record.requiredRole, urgency: record.urgency },
    });

    return this.toCoverageRequestView(record);
  }

  /**
   * FUNCTION: listCoverageRequests
   * Inputs: organization id used for tenant scoping.
   * Outputs: coverage requests for that tenant.
   * Functionality: Lists coverage requests ordered by newest first.
   * External calls: PrismaService.coverageRequest.findMany(input) retrieves tenant-scoped rows.
   */
  async listCoverageRequests(organizationId: string): Promise<CoverageRequestView[]> {
    const records = await this.prisma.coverageRequest.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
    return records.map((record) => this.toCoverageRequestView(record));
  }

  /**
   * FUNCTION: createAssignment
   * Inputs: validated assignment payload.
   * Outputs: created assignment view.
   * Functionality: Creates an assignment, transitions the source event to ASSIGNED, records audit history, and publishes operational_event.assigned.
   * External calls: PrismaService.assignment.create(input) persists assignment; EventService.transitionStatus(...) updates event state; AuditService.record(input) appends history; EventBusService.publish(event) notifies subscribers.
   */
  async createAssignment(input: CreateAssignmentDto, actor?: AuthenticatedActor): Promise<AssignmentView> {
    const record = await this.prisma.assignment.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        personnelId: input.personnelId,
        status: input.status ?? 'PENDING',
        metadata: input.metadata ?? {},
      },
    });

    await this.eventService.transitionStatus(input.organizationId, input.operationalEventId, 'ASSIGNED', actor);

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'assignment_created',
      newState: record.status,
      metadata: { assignmentId: record.id, personnelId: record.personnelId },
    });

    return this.toAssignmentView(record);
  }

  /**
   * FUNCTION: acceptAssignment
   * Inputs: organization id and assignment id.
   * Outputs: accepted assignment view.
   * Functionality: Accepts an assignment, updates source event acknowledgment state, marks related coverage fulfilled, and publishes assignment.accepted.
   * External calls: PrismaService.assignment.update(input) persists assignment; PrismaService.operationalEvent.update(input) updates acknowledgment; PrismaService.coverageRequest.updateMany(input) fulfills coverage; AuditService.record(input) appends history; EventBusService.publish(event) notifies subscribers.
   */
  async acceptAssignment(organizationId: string, assignmentId: string, actor?: AuthenticatedActor): Promise<AssignmentView> {
    const existing = await this.findAssignmentRecord(organizationId, assignmentId);
    const record = await this.prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'ACCEPTED' } });

    await this.prisma.operationalEvent.update({
      where: { id: existing.operationalEventId },
      data: { acknowledgmentStatus: 'ACCEPTED', status: 'ACKNOWLEDGED' },
    });

    await this.prisma.coverageRequest.updateMany({
      where: { organizationId, operationalEventId: existing.operationalEventId, status: { in: ['OPEN', 'CONTACTING', 'ESCALATED'] } },
      data: { status: 'FULFILLED', personnelId: existing.personnelId },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      eventId: existing.operationalEventId,
      action: 'assignment_accepted',
      previousState: existing.status,
      newState: 'ACCEPTED',
      metadata: { assignmentId, personnelId: existing.personnelId },
    });

    await this.eventBus.publish({
      name: 'assignment.accepted',
      payload: {
        organizationId,
        eventId: existing.operationalEventId,
        correlationId: existing.operationalEventId,
        occurredAt: new Date().toISOString(),
        data: { assignmentId, personnelId: existing.personnelId },
      },
    });

    return this.toAssignmentView(record);
  }

  /**
   * FUNCTION: rejectAssignment
   * Inputs: organization id and assignment id.
   * Outputs: rejected assignment view.
   * Functionality: Rejects an assignment and publishes assignment.rejected for workflow/escalation consumers.
   * External calls: PrismaService.assignment.update(input) persists rejection; AuditService.record(input) appends history; EventBusService.publish(event) notifies subscribers.
   */
  async rejectAssignment(organizationId: string, assignmentId: string, actor?: AuthenticatedActor): Promise<AssignmentView> {
    const existing = await this.findAssignmentRecord(organizationId, assignmentId);
    const record = await this.prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'REJECTED' } });

    await this.auditService.recordMutation(actor, organizationId, {
      eventId: existing.operationalEventId,
      action: 'assignment_rejected',
      previousState: existing.status,
      newState: 'REJECTED',
      metadata: { assignmentId, personnelId: existing.personnelId },
    });

    await this.eventBus.publish({
      name: 'assignment.rejected',
      payload: {
        organizationId,
        eventId: existing.operationalEventId,
        correlationId: existing.operationalEventId,
        occurredAt: new Date().toISOString(),
        data: { assignmentId, personnelId: existing.personnelId },
      },
    });

    return this.toAssignmentView(record);
  }


  /**
   * FUNCTION: respondToCoverageOffer
   * Inputs: tenant-scoped inbound response payload from SMS, voice, email, dashboard, or integration.
   * Outputs: accepted or rejected assignment view.
   * Functionality: Finds the active assignment offer, normalizes the personnel response, accepts or rejects the offer, and supersedes competing offers after acceptance.
   * External calls: PrismaService.assignment.findFirst(input) locates the offer; AssignmentService.acceptAssignment(...) or AssignmentService.rejectAssignment(...) applies deterministic assignment state changes; PrismaService.assignment.updateMany(input) marks competing offers as superseded.
   */
  async respondToCoverageOffer(input: RespondToCoverageOfferDto, actor?: AuthenticatedActor): Promise<AssignmentView> {
    const normalizedResponse = input.response.toUpperCase();
    const accepting = normalizedResponse === 'YES' || normalizedResponse === 'ACCEPT';

    const activeOffer = await this.prisma.assignment.findFirst({
      where: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        personnelId: input.personnelId,
        status: { in: ['OFFERED', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOffer) {
      throw new NotFoundException('Active coverage offer not found.');
    }

    if (!accepting) {
      return this.rejectAssignment(input.organizationId, activeOffer.id, actor);
    }

    const accepted = await this.acceptAssignment(input.organizationId, activeOffer.id, actor);

    await this.prisma.assignment.updateMany({
      where: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        id: { not: activeOffer.id },
        status: { in: ['OFFERED', 'PENDING'] },
      },
      data: { status: 'SUPERSEDED' },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'coverage_offer_response_automated',
      newState: 'ACCEPTED',
      metadata: {
        assignmentId: activeOffer.id,
        personnelId: activeOffer.personnelId,
        inboundAddress: input.inboundAddress,
        response: input.response,
        supersededCompetingOffers: true,
        ...input.metadata,
      },
    });

    return accepted;
  }

  /**
   * FUNCTION: listAssignments
   * Inputs: organization id used for tenant scoping.
   * Outputs: assignments for that tenant.
   * Functionality: Lists assignment records ordered by newest first.
   * External calls: PrismaService.assignment.findMany(input) retrieves tenant-scoped assignments.
   */
  async listAssignments(organizationId: string): Promise<AssignmentView[]> {
    const records = await this.prisma.assignment.findMany({ where: { organizationId }, orderBy: { createdAt: 'desc' } });
    return records.map((record) => this.toAssignmentView(record));
  }

  /**
   * FUNCTION: findAssignmentRecord
   * Inputs: organization id and assignment id.
   * Outputs: Prisma assignment row.
   * Functionality: Retrieves one tenant-scoped assignment or throws.
   * External calls: PrismaService.assignment.findFirst(input) retrieves the requested assignment row.
   */
  private async findAssignmentRecord(organizationId: string, assignmentId: string) {
    const record = await this.prisma.assignment.findFirst({ where: { id: assignmentId, organizationId } });
    if (!record) {
      throw new NotFoundException('Assignment not found.');
    }
    return record;
  }

  /**
   * FUNCTION: toAssignmentView
   * Inputs: Prisma assignment row.
   * Outputs: API-facing assignment view.
   * Functionality: Converts database naming and Date objects into stable assignment contracts.
   */
  private toAssignmentView(record: {
    id: string;
    organizationId: string;
    operationalEventId: string;
    personnelId: string | null;
    status: string;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): AssignmentView {
    return {
      assignmentId: record.id,
      organizationId: record.organizationId,
      operationalEventId: record.operationalEventId,
      personnelId: record.personnelId ?? undefined,
      status: record.status as AssignmentStatus,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * FUNCTION: toCoverageRequestView
   * Inputs: Prisma coverage request row.
   * Outputs: API-facing coverage request view.
   * Functionality: Converts database naming and Date objects into stable coverage request contracts.
   */
  private toCoverageRequestView(record: {
    id: string;
    organizationId: string;
    operationalEventId: string;
    personnelId: string | null;
    requiredRole: string;
    requiredDepartment: string | null;
    requiredShiftStart: Date;
    requiredShiftEnd: Date;
    requiredCertifications: unknown;
    status: string;
    urgency: string;
    coverageDeadline: Date;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): CoverageRequestView {
    return {
      coverageRequestId: record.id,
      organizationId: record.organizationId,
      operationalEventId: record.operationalEventId,
      personnelId: record.personnelId ?? undefined,
      requiredRole: record.requiredRole,
      requiredDepartment: record.requiredDepartment ?? undefined,
      requiredShiftStart: record.requiredShiftStart.toISOString(),
      requiredShiftEnd: record.requiredShiftEnd.toISOString(),
      requiredCertifications: Array.isArray(record.requiredCertifications) ? record.requiredCertifications.map(String) : [],
      status: record.status as CoverageRequestStatus,
      urgency: record.urgency,
      coverageDeadline: record.coverageDeadline.toISOString(),
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
