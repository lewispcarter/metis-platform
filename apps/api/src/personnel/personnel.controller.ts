// @ts-nocheck
/**
 * PERSONNEL CONTROLLER
 * Purpose: Exposes APIs for worker records, availability windows, and candidate discovery.
 * Role: HTTP boundary for the personnel coordination engine with authenticated tenant scoping.
 */
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { CreateAvailabilityWindowDto } from './dto/create-availability-window.dto';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import { PersonnelService } from './personnel.service';
import type { AvailabilityWindowView, PersonnelView } from './personnel.types';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  /**
   * FUNCTION: create
   * Inputs: authenticated tenant id and personnel creation payload.
   * Outputs: created personnel view.
   * Functionality: Creates a tenant-scoped personnel record without trusting client-supplied tenant scope.
   * External calls: PersonnelService.create(input) persists worker identity and audit history.
   */
  @Post()
  @RequirePermissions('personnel:create')
  create(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() input: CreatePersonnelDto): Promise<PersonnelView> {
    return this.personnelService.create({ ...input, organizationId }, actor);
  }

  /**
   * FUNCTION: list
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped personnel records.
   * Functionality: Lists workers for the authenticated organization.
   * External calls: PersonnelService.listByOrganization(organizationId) returns PostgreSQL-backed worker records.
   */
  @Get()
  @RequirePermissions('personnel:read')
  list(@CurrentTenant() organizationId: string): Promise<PersonnelView[]> {
    return this.personnelService.listByOrganization(organizationId);
  }

  /**
   * FUNCTION: createAvailabilityWindow
   * Inputs: authenticated tenant id and availability window payload.
   * Outputs: created availability window view.
   * Functionality: Records a worker availability window for candidate discovery under the authenticated tenant.
   * External calls: PersonnelService.createAvailabilityWindow(input) persists availability and audit history.
   */
  @Post('availability-windows')
  @RequirePermissions('personnel:update')
  createAvailabilityWindow(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Body() input: CreateAvailabilityWindowDto,
  ): Promise<AvailabilityWindowView> {
    return this.personnelService.createAvailabilityWindow({ ...input, organizationId }, actor);
  }

  /**
   * FUNCTION: candidates
   * Inputs: authenticated tenant id, role, shift bounds, and comma-separated certifications query params.
   * Outputs: available candidate personnel views.
   * Functionality: Finds workers eligible to cover a shift inside the authenticated tenant.
   * External calls: PersonnelService.findAvailableCandidates(input) applies availability, role, and certification filtering.
   */
  @Get('coverage/candidates')
  @RequirePermissions('personnel:read')
  candidates(
    @CurrentTenant() organizationId: string,
    @Query('requiredRole') requiredRole: string,
    @Query('requiredShiftStart') requiredShiftStart: string,
    @Query('requiredShiftEnd') requiredShiftEnd: string,
    @Query('requiredCertifications') requiredCertifications?: string,
  ): Promise<PersonnelView[]> {
    return this.personnelService.findAvailableCandidates({
      organizationId,
      requiredRole,
      requiredShiftStart,
      requiredShiftEnd,
      requiredCertifications: requiredCertifications?.split(',').filter(Boolean) ?? [],
    });
  }

  /**
   * FUNCTION: get
   * Inputs: authenticated tenant id and personnelId path parameter.
   * Outputs: matching personnel view.
   * Functionality: Reads one worker record for the authenticated tenant.
   * External calls: PersonnelService.findById(organizationId, personnelId) returns worker or throws.
   */
  @Get(':personnelId')
  @RequirePermissions('personnel:read')
  get(@CurrentTenant() organizationId: string, @Param('personnelId') personnelId: string): Promise<PersonnelView> {
    return this.personnelService.findById(organizationId, personnelId);
  }
}
