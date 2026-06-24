// @ts-nocheck
/**
 * PLATFORM USER SERVICE
 * Purpose: Synchronizes external identity provider users into the platform database.
 * Role: Establishes database-backed users, organization memberships, and role records for enterprise-grade authorization and audit attribution.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE_PERMISSIONS, type PlatformPermission, type PlatformRole } from './types/role.types';

export type SyncPlatformUserInput = {
  providerUserId?: string;
  requestedUserId: string;
  organizationId: string;
  role: PlatformRole;
  permissions: PlatformPermission[];
  email?: string;
  displayName?: string;
};

export type SyncedPlatformUser = {
  platformUserId: string;
  organizationMembershipId: string;
  organizationId: string;
  role: PlatformRole;
  permissions: PlatformPermission[];
  email: string;
  displayName: string;
};

/**
 * FUNCTION: buildFallbackEmail
 * Inputs: provider or development user id.
 * Outputs: deterministic local placeholder email.
 * Functionality: Ensures early development auth can persist users without requiring email claims.
 */
function buildFallbackEmail(userId: string): string {
  return `${userId.replace(/[^a-zA-Z0-9._-]/g, '_')}@local.metis`;
}

@Injectable()
export class PlatformUserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FUNCTION: syncAuthenticatedUser
   * Inputs: normalized auth provider/development identity.
   * Outputs: persisted platform user and organization membership context.
   * Functionality: Creates missing organization, role, user, and membership records, then returns database-backed identity metadata.
   * External calls: PrismaService performs upserts for organization, role, user, and membership records in PostgreSQL.
   */
  async syncAuthenticatedUser(input: SyncPlatformUserInput): Promise<SyncedPlatformUser> {
    const email = input.email ?? buildFallbackEmail(input.providerUserId ?? input.requestedUserId);
    const displayName = input.displayName ?? input.providerUserId ?? input.requestedUserId;
    const rolePermissions = Array.from(new Set([...(ROLE_PERMISSIONS[input.role] ?? []), ...input.permissions]));

    await this.prisma.organization.upsert({
      where: { id: input.organizationId },
      update: {},
      create: { id: input.organizationId, name: 'External Organization' },
    });

    const role = await this.prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: input.organizationId,
          name: input.role,
        },
      },
      update: { permissions: rolePermissions },
      create: {
        organizationId: input.organizationId,
        name: input.role,
        permissions: rolePermissions,
      },
    });

    const user = await this.prisma.user.upsert({
      where: input.providerUserId
        ? { externalAuthId: input.providerUserId }
        : { organizationId_email: { organizationId: input.organizationId, email } },
      update: {
        organizationId: input.organizationId,
        roleId: role.id,
        email,
        displayName,
        status: 'ACTIVE',
      },
      create: {
        organizationId: input.organizationId,
        roleId: role.id,
        externalAuthId: input.providerUserId,
        email,
        displayName,
        status: 'ACTIVE',
      },
    });

    const membership = await this.prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: user.id,
        },
      },
      update: { roleName: input.role, status: 'ACTIVE' },
      create: {
        organizationId: input.organizationId,
        userId: user.id,
        roleName: input.role,
        status: 'ACTIVE',
      },
    });

    return {
      platformUserId: user.id,
      organizationMembershipId: membership.id,
      organizationId: input.organizationId,
      role: input.role,
      permissions: rolePermissions,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
