// @ts-nocheck
/**
 * TEST SUITE: Webhook Route Service
 * Purpose: Verifies tenant routing for inbound communication provider addresses.
 * Scope: Provider-address routing and strict production fallback behavior.
 */
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookRouteService } from './webhook-route.service';

describe('WebhookRouteService', () => {
  test('should_route_to_organization_when_active_provider_address_exists', async () => {
    const prisma = { inboundWebhookRoute: { findFirst: jest.fn().mockResolvedValue({ id: 'route-1', organizationId: 'org-1' }) } } as any;
    const config = { get: jest.fn().mockReturnValue('production') } as unknown as ConfigService;
    const service = new WebhookRouteService(prisma, config);

    await expect(service.resolveOrganizationForInboundAddress('TWILIO', '+15550000000')).resolves.toEqual({
      organizationId: 'org-1',
      routeId: 'route-1',
      matchedBy: 'PROVIDER_ADDRESS',
    });
  });

  test('should_reject_unrouted_webhook_in_production', async () => {
    const prisma = { inboundWebhookRoute: { findFirst: jest.fn().mockResolvedValue(null) } } as any;
    const config = { get: (key: string) => (key === 'NODE_ENV' ? 'production' : undefined) } as ConfigService;
    const service = new WebhookRouteService(prisma, config);

    await expect(service.resolveOrganizationForInboundAddress('TWILIO', '+15550000000')).rejects.toBeInstanceOf(BadRequestException);
  });
});
