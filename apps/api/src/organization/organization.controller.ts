// @ts-nocheck
/**
 * ORGANIZATION CONTROLLER
 * Purpose: Exposes administrative tenant endpoints for the greenfield platform foundation.
 * Role: Allows early creation and listing of organizations that scope all operational platform records.
 */
import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { Organization, OrganizationService } from './organization.service';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  /**
   * FUNCTION: create
   * Inputs: organization creation DTO.
   * Outputs: created organization.
   * Functionality: Creates a tenant organization used for multi-tenant data isolation.
   * External calls: OrganizationService.create(name) persists the organization and returns the saved record.
   */
  @Post()
  @RequirePermissions('organization:manage')
  create(@Body() input: CreateOrganizationDto): Promise<Organization> {
    return this.organizationService.create(input.name);
  }

  /**
   * FUNCTION: list
   * Inputs: none.
   * Outputs: organization records.
   * Functionality: Lists tenant organizations for administrative visibility.
   * External calls: OrganizationService.list() retrieves organization records from PostgreSQL.
   */
  @Get()
  @RequirePermissions('organization:manage')
  list(): Promise<Organization[]> {
    return this.organizationService.list();
  }
}
