// @ts-nocheck
/**
 * ACTIVITY SERVICE
 * Purpose: Builds operator-visible activity feeds from immutable audit history.
 * Role: Turns backend audit attribution into product-visible operational accountability.
 */
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import type { OperatorActivityRecord } from './activity.types';

@Injectable()
export class ActivityService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * FUNCTION: listByOrganization
   * Inputs: authenticated organization id.
   * Outputs: operator-visible activity records.
   * Functionality: Returns the tenant activity feed backed by immutable audit records.
   * External calls: AuditService.listByOrganization(organizationId) retrieves tenant-scoped audit history from PostgreSQL.
   */
  async listByOrganization(organizationId: string): Promise<OperatorActivityRecord[]> {
    const records = await this.auditService.listByOrganization(organizationId);
    return records.map((record) => ({
      activityId: record.auditId,
      organizationId: record.organizationId,
      eventId: record.eventId,
      actorId: record.actorId,
      actorType: record.actorType,
      action: record.action,
      previousState: record.previousState,
      newState: record.newState,
      timestamp: record.timestamp,
      metadata: record.metadata,
    }));
  }
}
