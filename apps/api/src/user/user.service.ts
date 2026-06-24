// @ts-nocheck
/**
 * USER SERVICE
 * Purpose: Provides database-backed platform user and organization membership queries.
 * Role: Enables operators and administrators to inspect synced users without coupling business modules to Clerk.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import type { PlatformRole } from '../identity/types/role.types';
import type { OrganizationMembershipRecord, PlatformUserRecord } from './user.types';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * FUNCTION: listByOrganization
   * Inputs: authenticated organization id.
   * Outputs: tenant-scoped platform users.
   * Functionality: Lists database-backed users for the current tenant with role context.
   * External calls: PrismaService.user.findMany(input) retrieves users and their role records from PostgreSQL.
   */
  async listByOrganization(organizationId: string): Promise<PlatformUserRecord[]> {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toPlatformUserRecord(user));
  }

  /**
   * FUNCTION: listMembershipsByOrganization
   * Inputs: authenticated organization id.
   * Outputs: tenant-scoped organization membership records.
   * Functionality: Lists active and historical user memberships for RBAC inspection.
   * External calls: PrismaService.organizationMembership.findMany(input) retrieves organization membership rows from PostgreSQL.
   */
  async listMembershipsByOrganization(organizationId: string): Promise<OrganizationMembershipRecord[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((membership) => ({
      membershipId: membership.id,
      organizationId: membership.organizationId,
      userId: membership.userId,
      roleName: membership.roleName,
      status: membership.status,
      createdAt: membership.createdAt.toISOString(),
    }));
  }

  /**
   * FUNCTION: updateRole
   * Inputs: authenticated actor, tenant id, user id, and target platform role.
   * Outputs: updated platform user record.
   * Functionality: Updates a user's role and membership role with audit attribution for administrator accountability.
   * External calls: PrismaService.role.upsert(input) ensures role exists; PrismaService.user.update(input) persists role; PrismaService.organizationMembership.upsert(input) synchronizes membership; AuditService.recordMutation(input) records admin action.
   */
  async updateRole(actor: AuthenticatedActor | undefined, organizationId: string, userId: string, roleName: PlatformRole): Promise<PlatformUserRecord> {
    const existing = await this.prisma.user.findFirst({ where: { id: userId, organizationId }, include: { role: true } });
    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    const role = await this.prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: { organizationId, name: roleName, permissions: [] },
      update: {},
    });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: true },
    });

    await this.prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      create: { organizationId, userId, roleName, status: 'ACTIVE' },
      update: { roleName },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      action: 'user_role_updated',
      previousState: existing.role?.name,
      newState: roleName,
      metadata: { targetUserId: userId, targetEmail: existing.email },
    });

    return this.toPlatformUserRecord(updated);
  }

  /**
   * FUNCTION: updateStatus
   * Inputs: authenticated actor, tenant id, user id, and target user lifecycle status.
   * Outputs: updated platform user record.
   * Functionality: Updates platform user and membership status with admin audit attribution.
   * External calls: PrismaService.user.update(input) persists status; PrismaService.organizationMembership.updateMany(input) synchronizes membership lifecycle; AuditService.recordMutation(input) records admin action.
   */
  async updateStatus(
    actor: AuthenticatedActor | undefined,
    organizationId: string,
    userId: string,
    status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
  ): Promise<PlatformUserRecord> {
    const existing = await this.prisma.user.findFirst({ where: { id: userId, organizationId }, include: { role: true } });
    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data: { status }, include: { role: true } });
    await this.prisma.organizationMembership.updateMany({ where: { organizationId, userId }, data: { status } });

    await this.auditService.recordMutation(actor, organizationId, {
      action: 'user_status_updated',
      previousState: existing.status,
      newState: status,
      metadata: { targetUserId: userId, targetEmail: existing.email },
    });

    return this.toPlatformUserRecord(updated);
  }

  /**
   * FUNCTION: toPlatformUserRecord
   * Inputs: Prisma user row with optional role.
   * Outputs: API-facing platform user record.
   * Functionality: Converts database user shape into stable admin user response contract.
   */
  private toPlatformUserRecord(user: {
    id: string; organizationId: string; email: string; displayName: string; status: string; externalAuthId: string | null; createdAt: Date; role?: { name: string } | null;
  }): PlatformUserRecord {
    return {
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roleName: user.role?.name,
      externalAuthId: user.externalAuthId ?? undefined,
      createdAt: user.createdAt.toISOString(),
    };
  }

}
