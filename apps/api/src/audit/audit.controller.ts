// @ts-nocheck
/**
 * AUDIT CONTROLLER
 * Purpose: Exposes tenant-scoped operational audit history for administrators and auditors.
 * Role: Provides read access to immutable operational history without allowing mutation.
 */
import { Controller, Get } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { AuditRecord, AuditService } from './audit.service';

@Controller('audit-events')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * FUNCTION: list
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped audit records.
   * Functionality: Lists append-only operational audit history for the authenticated organization.
   * External calls: AuditService.listByOrganization(organizationId) retrieves immutable audit records from PostgreSQL.
   */
  @Get()
  @RequirePermissions('audit:read')
  list(@CurrentTenant() organizationId: string): Promise<AuditRecord[]> {
    return this.auditService.listByOrganization(organizationId);
  }
}
