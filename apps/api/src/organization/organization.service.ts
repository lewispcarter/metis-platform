// @ts-nocheck
/**
 * ORGANIZATION SERVICE
 * Purpose: Manages organization records that scope all operational platform data.
 * Role: Provides the tenant persistence boundary used by every major platform module.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type Organization = {
  organizationId: string;
  name: string;
  createdAt: string;
};

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FUNCTION: create
   * Inputs: organization display name.
   * Outputs: created organization record.
   * Functionality: Creates a tenant organization used by all platform objects.
   * External calls: PrismaService.organization.create(input) inserts a tenant record and returns the saved row.
   */
  async create(name: string): Promise<Organization> {
    const organization = await this.prisma.organization.create({ data: { name } });
    return {
      organizationId: organization.id,
      name: organization.name,
      createdAt: organization.createdAt.toISOString(),
    };
  }

  /**
   * FUNCTION: list
   * Inputs: none.
   * Outputs: all organization records.
   * Functionality: Lists known tenants for early administrative workflows.
   * External calls: PrismaService.organization.findMany(input) retrieves tenant rows ordered by creation date.
   */
  async list(): Promise<Organization[]> {
    const organizations = await this.prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
    return organizations.map((organization) => ({
      organizationId: organization.id,
      name: organization.name,
      createdAt: organization.createdAt.toISOString(),
    }));
  }
}
