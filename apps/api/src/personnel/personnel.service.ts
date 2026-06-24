// @ts-nocheck
/**
 * PERSONNEL SERVICE
 * Purpose: Owns worker records, availability windows, and candidate discovery for operational coordination.
 * Role: Workforce coordination engine used by coverage, dispatch, maintenance, and future government operations workflows.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAvailabilityWindowDto } from './dto/create-availability-window.dto';
import { CreatePersonnelDto } from './dto/create-personnel.dto';
import type { AvailabilityWindowView, PersonnelView } from './personnel.types';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class PersonnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * FUNCTION: create
   * Inputs: validated personnel creation payload.
   * Outputs: created personnel view.
   * Functionality: Creates a tenant-scoped worker record and records audit history.
   * External calls: PrismaService.personnel.create(input) persists worker; AuditService.record(input) appends immutable creation history.
   */
  async create(input: CreatePersonnelDto, actor?: AuthenticatedActor): Promise<PersonnelView> {
    const record = await this.prisma.personnel.create({
      data: {
        organizationId: input.organizationId,
        departmentId: input.departmentId,
        displayName: input.displayName,
        roleTitle: input.roleTitle,
        email: input.email,
        phone: input.phone,
        certifications: input.certifications ?? [],
        metadata: input.metadata ?? {},
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      action: 'personnel_created',
      metadata: { personnelId: record.id, roleTitle: record.roleTitle },
    });

    return this.toPersonnelView(record);
  }

  /**
   * FUNCTION: listByOrganization
   * Inputs: organization id for tenant scoping.
   * Outputs: personnel records for that tenant.
   * Functionality: Returns workers ordered by display name.
   * External calls: PrismaService.personnel.findMany(input) retrieves tenant-scoped personnel rows.
   */
  async listByOrganization(organizationId: string): Promise<PersonnelView[]> {
    const records = await this.prisma.personnel.findMany({ where: { organizationId }, orderBy: { displayName: 'asc' } });
    return records.map((record) => this.toPersonnelView(record));
  }

  /**
   * FUNCTION: findById
   * Inputs: organization id and personnel id.
   * Outputs: matching personnel view.
   * Functionality: Reads one tenant-scoped worker record or throws if absent.
   * External calls: PrismaService.personnel.findFirst(input) retrieves the matching worker row.
   */
  async findById(organizationId: string, personnelId: string): Promise<PersonnelView> {
    const record = await this.prisma.personnel.findFirst({ where: { id: personnelId, organizationId } });
    if (!record) {
      throw new NotFoundException('Personnel record not found.');
    }
    return this.toPersonnelView(record);
  }

  /**
   * FUNCTION: createAvailabilityWindow
   * Inputs: validated availability window creation payload.
   * Outputs: created availability window view.
   * Functionality: Adds worker availability used by candidate discovery.
   * External calls: PrismaService.availabilityWindow.create(input) persists availability; AuditService.record(input) appends immutable availability history.
   */
  async createAvailabilityWindow(input: CreateAvailabilityWindowDto, actor?: AuthenticatedActor): Promise<AvailabilityWindowView> {
    const record = await this.prisma.availabilityWindow.create({
      data: {
        organizationId: input.organizationId,
        personnelId: input.personnelId,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        status: input.status,
        metadata: input.metadata ?? {},
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      action: 'availability_window_created',
      metadata: { personnelId: input.personnelId, availabilityWindowId: record.id, status: record.status },
    });

    return this.toAvailabilityWindowView(record);
  }

  /**
   * FUNCTION: findAvailableCandidates
   * Inputs: organization id, required role, target shift bounds, and optional certifications.
   * Outputs: ranked personnel records available for the shift.
   * Functionality: Finds eligible workers whose availability overlaps the target shift and whose role/certifications match the request.
   * External calls: PrismaService.personnel.findMany(input) retrieves candidates and availability windows from PostgreSQL.
   */
  async findAvailableCandidates(input: {
    organizationId: string;
    requiredRole: string;
    requiredShiftStart: string;
    requiredShiftEnd: string;
    requiredCertifications?: string[];
  }): Promise<PersonnelView[]> {
    const requiredCertifications = input.requiredCertifications ?? [];
    const records = await this.prisma.personnel.findMany({
      where: {
        organizationId: input.organizationId,
        roleTitle: input.requiredRole,
        availability: {
          some: {
            organizationId: input.organizationId,
            status: 'AVAILABLE',
            startsAt: { lte: new Date(input.requiredShiftStart) },
            endsAt: { gte: new Date(input.requiredShiftEnd) },
          },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    return records
      .filter((record) => {
        const certifications = Array.isArray(record.certifications) ? record.certifications.map(String) : [];
        return requiredCertifications.every((certification) => certifications.includes(certification));
      })
      .map((record) => this.toPersonnelView(record));
  }

  /**
   * FUNCTION: toPersonnelView
   * Inputs: Prisma personnel row.
   * Outputs: API-facing personnel view.
   * Functionality: Converts database rows into stable personnel API contracts.
   */
  private toPersonnelView(record: {
    id: string;
    organizationId: string;
    departmentId: string | null;
    displayName: string;
    roleTitle: string;
    email: string | null;
    phone: string | null;
    certifications: unknown;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): PersonnelView {
    return {
      personnelId: record.id,
      organizationId: record.organizationId,
      departmentId: record.departmentId ?? undefined,
      displayName: record.displayName,
      roleTitle: record.roleTitle,
      email: record.email ?? undefined,
      phone: record.phone ?? undefined,
      certifications: Array.isArray(record.certifications) ? record.certifications.map(String) : [],
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * FUNCTION: toAvailabilityWindowView
   * Inputs: Prisma availability window row.
   * Outputs: API-facing availability window view.
   * Functionality: Converts database naming and Date objects into stable availability contracts.
   */
  private toAvailabilityWindowView(record: {
    id: string;
    organizationId: string;
    personnelId: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    metadata: unknown;
  }): AvailabilityWindowView {
    return {
      availabilityWindowId: record.id,
      organizationId: record.organizationId,
      personnelId: record.personnelId,
      startsAt: record.startsAt.toISOString(),
      endsAt: record.endsAt.toISOString(),
      status: record.status,
      metadata: record.metadata as Record<string, unknown>,
    };
  }
}
