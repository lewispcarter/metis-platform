// @ts-nocheck
/**
 * WEBHOOK ROUTE SERVICE
 * Purpose: Resolves inbound provider addresses to platform organizations.
 * Role: Allows one public Twilio webhook endpoint to safely route calls/SMS to the correct tenant.
 */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export type WebhookRouteResolution = {
  organizationId: string;
  routeId?: string;
  matchedBy: 'PROVIDER_ADDRESS' | 'PAYLOAD_ORGANIZATION_ID' | 'ENVIRONMENT_FALLBACK';
};

@Injectable()
export class WebhookRouteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * FUNCTION: resolveOrganizationForInboundAddress
   * Inputs: provider name, inbound destination address, and optional payload organization id.
   * Outputs: resolved organization context.
   * Functionality: Routes Twilio inbound traffic by destination phone number first, then controlled fallbacks for development/demo use.
   * External calls: PrismaService.inboundWebhookRoute.findFirst(input) reads tenant route configuration.
   */
  async resolveOrganizationForInboundAddress(provider: string, inboundAddress: string, payloadOrganizationId?: string): Promise<WebhookRouteResolution> {
    const route = await this.prisma.inboundWebhookRoute.findFirst({
      where: {
        provider,
        inboundAddress,
        status: 'ACTIVE',
      },
    });

    if (route) {
      return { organizationId: route.organizationId, routeId: route.id, matchedBy: 'PROVIDER_ADDRESS' };
    }

    if (payloadOrganizationId && this.configService.get<string>('NODE_ENV') !== 'production') {
      return { organizationId: payloadOrganizationId, matchedBy: 'PAYLOAD_ORGANIZATION_ID' };
    }

    const fallbackOrganizationId = this.configService.get<string>('TWILIO_WEBHOOK_ORGANIZATION_ID');
    if (fallbackOrganizationId && this.configService.get<string>('NODE_ENV') !== 'production') {
      return { organizationId: fallbackOrganizationId, matchedBy: 'ENVIRONMENT_FALLBACK' };
    }

    throw new BadRequestException(`No active webhook route found for ${provider}:${inboundAddress}.`);
  }
}
