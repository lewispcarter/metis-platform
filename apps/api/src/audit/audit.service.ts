// @ts-nocheck
/**
 * AUDIT SERVICE
 * Purpose: Records immutable operational activity for compliance, traceability, and debugging.
 * Role: Central append-only audit boundary backed by PostgreSQL through Prisma.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedActor } from '../identity/auth-context.types';

export type AuditActorType = 'SYSTEM' | 'AI_AGENT' | 'USER' | 'INTEGRATION';

export type AuditRecord = {
  auditId: string;
  organizationId: string;
  eventId?: string;
  actorType: AuditActorType;
  actorId?: string;
  action: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FUNCTION: record
   * Inputs: audit record without generated id/timestamp.
   * Outputs: persisted audit record.
   * Functionality: Appends a new immutable audit record to the database-backed audit stream.
   * External calls: PrismaService.auditEvent.create(input) inserts one append-only audit row and returns the persisted row.
   */
  async record(input: Omit<AuditRecord, 'auditId' | 'timestamp'>): Promise<AuditRecord> {
    const record = await this.prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        eventId: input.eventId,
        actorType: input.actorType,
        actorId: input.actorId,
        action: input.action,
        previousState: input.previousState,
        newState: input.newState,
        metadata: input.metadata,
      },
    });

    return {
      auditId: record.id,
      organizationId: record.organizationId,
      eventId: record.eventId ?? undefined,
      actorType: record.actorType as AuditActorType,
      actorId: record.actorId ?? undefined,
      action: record.action,
      previousState: record.previousState ?? undefined,
      newState: record.newState ?? undefined,
      timestamp: record.createdAt.toISOString(),
      metadata: record.metadata as Record<string, unknown>,
    };
  }



  /**
   * FUNCTION: recordForActor
   * Inputs: authenticated actor and audit details without actor/organization fields.
   * Outputs: persisted audit record.
   * Functionality: Records an immutable audit event using the database-backed platform user id for attribution.
   * External calls: AuditService.record(input) appends the audit row in PostgreSQL.
   */
  async recordForActor(
    actor: AuthenticatedActor,
    input: Omit<AuditRecord, 'auditId' | 'timestamp' | 'organizationId' | 'actorType' | 'actorId'>,
  ): Promise<AuditRecord> {
    return this.record({
      ...input,
      organizationId: actor.organizationId,
      actorType: 'USER',
      actorId: actor.platformUserId,
      metadata: {
        ...input.metadata,
        providerUserId: actor.providerUserId,
        organizationMembershipId: actor.organizationMembershipId,
        role: actor.role,
      },
    });
  }


  /**
   * FUNCTION: recordMutation
   * Inputs: optional authenticated actor, organization id, and audit details.
   * Outputs: persisted audit record.
   * Functionality: Records operator-visible mutation history with authenticated actor attribution when available, falling back to SYSTEM for background workflows.
   * External calls: AuditService.recordForActor(input) appends user-attributed audit rows; AuditService.record(input) appends system-attributed audit rows.
   */
  async recordMutation(
    actor: AuthenticatedActor | undefined,
    organizationId: string,
    input: Omit<AuditRecord, 'auditId' | 'timestamp' | 'organizationId' | 'actorType' | 'actorId'>,
  ): Promise<AuditRecord> {
    if (actor?.platformUserId && actor.organizationId === organizationId) {
      return this.recordForActor(actor, input);
    }

    return this.record({
      ...input,
      organizationId,
      actorType: 'SYSTEM',
      metadata: {
        ...input.metadata,
        attributionFallback: 'SYSTEM',
      },
    });
  }


  /**
   * FUNCTION: listByOrganization
   * Inputs: organization id used for tenant scoping.
   * Outputs: audit records for that organization.
   * Functionality: Returns append-only audit history visible to the tenant.
   * External calls: PrismaService.auditEvent.findMany(input) retrieves tenant-scoped audit rows ordered by newest first.
   */
  async listByOrganization(organizationId: string): Promise<AuditRecord[]> {
    const records = await this.prisma.auditEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ({
      auditId: record.id,
      organizationId: record.organizationId,
      eventId: record.eventId ?? undefined,
      actorType: record.actorType as AuditActorType,
      actorId: record.actorId ?? undefined,
      action: record.action,
      previousState: record.previousState ?? undefined,
      newState: record.newState ?? undefined,
      timestamp: record.createdAt.toISOString(),
      metadata: record.metadata as Record<string, unknown>,
    }));
  }
}
