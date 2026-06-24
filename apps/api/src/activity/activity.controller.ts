// @ts-nocheck
/**
 * ACTIVITY CONTROLLER
 * Purpose: Exposes tenant-scoped operator activity feed endpoints.
 * Role: Gives supervisors, managers, and auditors visibility into who changed what and when.
 */
import { Controller, Get } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { ActivityService } from './activity.service';
import type { OperatorActivityRecord } from './activity.types';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  /**
   * FUNCTION: list
   * Inputs: authenticated tenant id.
   * Outputs: operator-visible activity feed.
   * Functionality: Lists audited user/system activity for the authenticated organization.
   * External calls: ActivityService.listByOrganization(organizationId) returns audit-backed activity rows.
   */
  @Get()
  @RequirePermissions('audit:read')
  list(@CurrentTenant() organizationId: string): Promise<OperatorActivityRecord[]> {
    return this.activityService.listByOrganization(organizationId);
  }
}
