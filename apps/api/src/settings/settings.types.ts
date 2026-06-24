// @ts-nocheck
/**
 * SETTINGS TYPES
 * Purpose: Defines operational settings records exposed to organization administrators.
 * Role: Keeps webhook route and provider configuration contracts explicit at the service boundary.
 */
export type WebhookRouteStatus = 'ACTIVE' | 'DISABLED';
export type ProviderConfigurationStatus = 'ACTIVE' | 'DISABLED' | 'MISCONFIGURED';
export type ProviderChannel = 'SMS' | 'VOICE' | 'EMAIL';

export type WebhookRouteView = {
  routeId: string;
  organizationId: string;
  provider: string;
  inboundAddress: string;
  status: WebhookRouteStatus;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProviderConfigurationView = {
  providerConfigurationId: string;
  organizationId: string;
  provider: string;
  channel: ProviderChannel;
  status: ProviderConfigurationStatus;
  displayName: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
