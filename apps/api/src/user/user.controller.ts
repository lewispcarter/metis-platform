// @ts-nocheck
/**
 * USER CONTROLLER
 * Purpose: Exposes tenant-scoped user and membership visibility endpoints.
 * Role: Allows administrators and auditors to inspect database-backed identity state created by the auth sync boundary.
 */
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { UserService } from './user.service';
import type { OrganizationMembershipRecord, PlatformUserRecord } from './user.types';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * FUNCTION: me
   * Inputs: authenticated actor context.
   * Outputs: current authenticated actor with platform database ids.
   * Functionality: Confirms the Clerk/development identity has been normalized and synced into platform identity tables.
   */
  @Get('me')
  @RequirePermissions('event:read')
  me(@CurrentActor() actor?: AuthenticatedActor): AuthenticatedActor | undefined {
    return actor;
  }

  /**
   * FUNCTION: list
   * Inputs: current tenant id.
   * Outputs: tenant-scoped platform users.
   * Functionality: Lists database-backed users visible to the current organization.
   * External calls: UserService.listByOrganization(organizationId) queries PostgreSQL for tenant users.
   */
  @Get()
  @RequirePermissions('admin:manage')
  list(@CurrentTenant() organizationId: string): Promise<PlatformUserRecord[]> {
    return this.userService.listByOrganization(organizationId);
  }

  /**
   * FUNCTION: memberships
   * Inputs: current tenant id.
   * Outputs: tenant-scoped organization memberships.
   * Functionality: Lists membership records used by RBAC and audit attribution.
   * External calls: UserService.listMembershipsByOrganization(organizationId) queries PostgreSQL for tenant memberships.
   */
  @Get('memberships')
  @RequirePermissions('admin:manage')
  memberships(@CurrentTenant() organizationId: string): Promise<OrganizationMembershipRecord[]> {
    return this.userService.listMembershipsByOrganization(organizationId);
  }

  /**
   * FUNCTION: updateRole
   * Inputs: authenticated tenant, current actor, target user id, and target role.
   * Outputs: updated platform user.
   * Functionality: Allows administrators to update user role with immutable audit attribution.
   * External calls: UserService.updateRole(input) persists role and membership changes.
   */
  @Patch(':userId/role')
  @RequirePermissions('admin:manage')
  updateRole(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Param('userId') userId: string,
    @Body() body: UpdateUserRoleDto,
  ): Promise<PlatformUserRecord> {
    return this.userService.updateRole(actor, organizationId, userId, body.roleName);
  }

  /**
   * FUNCTION: updateStatus
   * Inputs: authenticated tenant, current actor, target user id, and target lifecycle status.
   * Outputs: updated platform user.
   * Functionality: Allows administrators to activate, suspend, or deactivate users with audit attribution.
   * External calls: UserService.updateStatus(input) persists user and membership status.
   */
  @Patch(':userId/status')
  @RequirePermissions('admin:manage')
  updateStatus(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Param('userId') userId: string,
    @Body() body: UpdateUserStatusDto,
  ): Promise<PlatformUserRecord> {
    return this.userService.updateStatus(actor, organizationId, userId, body.status);
  }

}
