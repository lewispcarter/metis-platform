// @ts-nocheck
/**
 * SETTINGS SERVICE
 * Purpose: Owns organization-level operational configuration for webhook routes and communication providers.
 * Role: Keeps production provider setup tenant-scoped, auditable, and isolated from public webhook ingress handlers.
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import type { ProviderConfigurationView, WebhookRouteView } from './settings.types';
import { CreateWebhookRouteDto } from './dto/create-webhook-route.dto';
import { UpdateWebhookRouteDto } from './dto/update-webhook-route.dto';
import { UpsertProviderConfigurationDto } from './dto/upsert-provider-configuration.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * FUNCTION: listWebhookRoutes
   * Inputs: tenant organization id.
   * Outputs: webhook route views.
   * Functionality: Lists active and disabled inbound provider routes scoped to one organization.
   * External calls: PrismaService.inboundWebhookRoute.findMany(input) retrieves route rows.
   */
  async listWebhookRoutes(organizationId: string): Promise<WebhookRouteView[]> {
    const rows = await this.prisma.inboundWebhookRoute.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toWebhookRouteView(row));
  }

  /**
   * FUNCTION: createWebhookRoute
   * Inputs: tenant organization id, authenticated actor, and route DTO.
   * Outputs: created webhook route view.
   * Functionality: Creates a tenant-owned inbound provider address route and records an audit mutation.
   * External calls: PrismaService.inboundWebhookRoute.create(input) inserts the route; AuditService.recordMutation(input) logs it.
   */
  async createWebhookRoute(organizationId: string, actor: AuthenticatedActor | undefined, input: CreateWebhookRouteDto): Promise<WebhookRouteView> {
    const existing = await this.prisma.inboundWebhookRoute.findFirst({
      where: { provider: input.provider, inboundAddress: input.inboundAddress },
    });

    if (existing) {
      throw new ConflictException('Inbound provider address is already routed.');
    }

    const row = await this.prisma.inboundWebhookRoute.create({
      data: {
        organizationId,
        provider: input.provider,
        inboundAddress: input.inboundAddress,
        status: input.status ?? 'ACTIVE',
        description: input.description,
        metadata: input.metadata ?? {},
      },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      action: 'webhook_route_created',
      newState: row.status,
      metadata: { routeId: row.id, provider: row.provider, inboundAddress: row.inboundAddress },
    });

    return this.toWebhookRouteView(row);
  }

  /**
   * FUNCTION: updateWebhookRoute
   * Inputs: tenant organization id, route id, authenticated actor, and partial route DTO.
   * Outputs: updated webhook route view.
   * Functionality: Updates a tenant-owned inbound route while preventing cross-tenant mutations.
   * External calls: PrismaService.inboundWebhookRoute.update(input) persists changes; AuditService.recordMutation(input) logs the change.
   */
  async updateWebhookRoute(organizationId: string, routeId: string, actor: AuthenticatedActor | undefined, input: UpdateWebhookRouteDto): Promise<WebhookRouteView> {
    const current = await this.prisma.inboundWebhookRoute.findFirst({ where: { id: routeId, organizationId } });
    if (!current) {
      throw new NotFoundException('Webhook route not found for tenant.');
    }

    const row = await this.prisma.inboundWebhookRoute.update({
      where: { id: routeId },
      data: {
        inboundAddress: input.inboundAddress ?? current.inboundAddress,
        status: input.status ?? current.status,
        description: input.description ?? current.description,
        metadata: input.metadata ?? (current.metadata as Record<string, unknown>),
      },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      action: 'webhook_route_updated',
      previousState: current.status,
      newState: row.status,
      metadata: { routeId: row.id, provider: row.provider, inboundAddress: row.inboundAddress },
    });

    return this.toWebhookRouteView(row);
  }

  /**
   * FUNCTION: listProviderConfigurations
   * Inputs: tenant organization id.
   * Outputs: provider configuration views.
   * Functionality: Lists communication provider settings for the organization.
   * External calls: PrismaService.providerConfiguration.findMany(input) reads provider rows.
   */
  async listProviderConfigurations(organizationId: string): Promise<ProviderConfigurationView[]> {
    const rows = await this.prisma.providerConfiguration.findMany({
      where: { organizationId },
      orderBy: [{ provider: 'asc' }, { channel: 'asc' }],
    });

    return rows.map((row) => this.toProviderConfigurationView(row));
  }

  /**
   * FUNCTION: upsertProviderConfiguration
   * Inputs: tenant organization id, authenticated actor, and provider configuration DTO.
   * Outputs: persisted provider configuration view.
   * Functionality: Creates or updates one provider-channel configuration without storing unmasked secrets in the UI layer.
   * External calls: PrismaService.providerConfiguration.upsert(input) persists config; AuditService.recordMutation(input) logs it.
   */
  async upsertProviderConfiguration(organizationId: string, actor: AuthenticatedActor | undefined, input: UpsertProviderConfigurationDto): Promise<ProviderConfigurationView> {
    const safeConfig = this.redactUnsafeConfig(input.config ?? {});

    const row = await this.prisma.providerConfiguration.upsert({
      where: {
        organizationId_provider_channel: {
          organizationId,
          provider: input.provider,
          channel: input.channel,
        },
      },
      update: {
        status: input.status,
        displayName: input.displayName,
        config: safeConfig,
      },
      create: {
        organizationId,
        provider: input.provider,
        channel: input.channel,
        status: input.status,
        displayName: input.displayName,
        config: safeConfig,
      },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      action: 'provider_configuration_upserted',
      newState: row.status,
      metadata: { providerConfigurationId: row.id, provider: row.provider, channel: row.channel },
    });

    return this.toProviderConfigurationView(row);
  }

  /**
   * FUNCTION: redactUnsafeConfig
   * Inputs: arbitrary provider config metadata.
   * Outputs: config metadata with known secret-like fields replaced.
   * Functionality: Prevents accidental secret exposure through admin surfaces while preserving operational setup metadata.
   */
  private redactUnsafeConfig(config: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      const lowered = key.toLowerCase();
      redacted[key] = lowered.includes('secret') || lowered.includes('token') || lowered.includes('password') ? '***REDACTED***' : value;
    }
    return redacted;
  }

  /**
   * FUNCTION: toWebhookRouteView
   * Inputs: Prisma inbound route record.
   * Outputs: API-safe route view.
   * Functionality: Normalizes database fields to stable API contract naming.
   */
  private toWebhookRouteView(row: { id: string; organizationId: string; provider: string; inboundAddress: string; status: string; description: string | null; metadata: unknown; createdAt: Date; updatedAt: Date }): WebhookRouteView {
    return {
      routeId: row.id,
      organizationId: row.organizationId,
      provider: row.provider,
      inboundAddress: row.inboundAddress,
      status: row.status as WebhookRouteView['status'],
      description: row.description ?? undefined,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * FUNCTION: toProviderConfigurationView
   * Inputs: Prisma provider configuration record.
   * Outputs: API-safe provider configuration view.
   * Functionality: Normalizes database fields to stable API contract naming.
   */
  private toProviderConfigurationView(row: { id: string; organizationId: string; provider: string; channel: string; status: string; displayName: string; config: unknown; createdAt: Date; updatedAt: Date }): ProviderConfigurationView {
    return {
      providerConfigurationId: row.id,
      organizationId: row.organizationId,
      provider: row.provider,
      channel: row.channel as ProviderConfigurationView['channel'],
      status: row.status as ProviderConfigurationView['status'],
      displayName: row.displayName,
      config: row.config as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
