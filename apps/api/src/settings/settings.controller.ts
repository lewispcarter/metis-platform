// @ts-nocheck
/**
 * SETTINGS CONTROLLER
 * Purpose: Exposes organization-level operational settings APIs.
 * Role: Gives administrators a controlled surface for webhook routing and communication provider configuration.
 */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { CreateWebhookRouteDto } from './dto/create-webhook-route.dto';
import { SettingsService } from './settings.service';
import { UpdateWebhookRouteDto } from './dto/update-webhook-route.dto';
import { UpsertProviderConfigurationDto } from './dto/upsert-provider-configuration.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * FUNCTION: listWebhookRoutes
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped webhook route records.
   * Functionality: Lists phone/email addresses that route inbound provider webhooks into this tenant.
   * External calls: SettingsService.listWebhookRoutes(input) reads tenant routes.
   */
  @Get('webhook-routes')
  @RequirePermissions('settings:read')
  listWebhookRoutes(@CurrentTenant() organizationId: string) {
    return this.settingsService.listWebhookRoutes(organizationId);
  }

  /**
   * FUNCTION: createWebhookRoute
   * Inputs: authenticated tenant id, actor, and create DTO.
   * Outputs: created webhook route.
   * Functionality: Registers one inbound provider address for tenant routing.
   * External calls: SettingsService.createWebhookRoute(input) persists route and audit trail.
   */
  @Post('webhook-routes')
  @RequirePermissions('settings:manage')
  createWebhookRoute(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: CreateWebhookRouteDto) {
    return this.settingsService.createWebhookRoute(organizationId, actor, body);
  }

  /**
   * FUNCTION: updateWebhookRoute
   * Inputs: authenticated tenant id, route id, actor, and update DTO.
   * Outputs: updated webhook route.
   * Functionality: Updates or disables one tenant-owned inbound provider route.
   * External calls: SettingsService.updateWebhookRoute(input) persists route change and audit trail.
   */
  @Patch('webhook-routes/:routeId')
  @RequirePermissions('settings:manage')
  updateWebhookRoute(@CurrentTenant() organizationId: string, @Param('routeId') routeId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: UpdateWebhookRouteDto) {
    return this.settingsService.updateWebhookRoute(organizationId, routeId, actor, body);
  }

  /**
   * FUNCTION: listProviderConfigurations
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped provider configuration records.
   * Functionality: Lists production readiness status for SMS, voice, and email providers.
   * External calls: SettingsService.listProviderConfigurations(input) reads provider settings.
   */
  @Get('provider-configurations')
  @RequirePermissions('settings:read')
  listProviderConfigurations(@CurrentTenant() organizationId: string) {
    return this.settingsService.listProviderConfigurations(organizationId);
  }

  /**
   * FUNCTION: upsertProviderConfiguration
   * Inputs: authenticated tenant id, actor, and provider config DTO.
   * Outputs: persisted provider config.
   * Functionality: Creates or updates provider-channel configuration metadata with audit attribution.
   * External calls: SettingsService.upsertProviderConfiguration(input) writes config and audit trail.
   */
  @Post('provider-configurations')
  @RequirePermissions('settings:manage')
  upsertProviderConfiguration(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: UpsertProviderConfigurationDto) {
    return this.settingsService.upsertProviderConfiguration(organizationId, actor, body);
  }
}
