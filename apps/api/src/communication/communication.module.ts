// @ts-nocheck
/**
 * COMMUNICATION MODULE
 * Purpose: Registers communication controllers and services.
 * Role: Encapsulates provider-agnostic communications infrastructure.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { CommunicationProviderRegistry } from './providers/communication-provider.registry';
import { EmailCommunicationProvider } from './providers/email-communication.provider';
import { NoopCommunicationProvider } from './providers/noop-communication.provider';
import { TwilioCommunicationProvider } from './providers/twilio-communication.provider';
import { AssignmentModule } from '../assignment/assignment.module';
import { EventModule } from '../event/event.module';
import { InboundCommunicationController } from './inbound/inbound-communication.controller';
import { InboundCommunicationService } from './inbound/inbound-communication.service';
import { TwilioSignatureService } from './inbound/security/twilio-signature.service';
import { TwilioWebhookUrlService } from './inbound/security/twilio-webhook-url.service';
import { WebhookRouteService } from './inbound/routing/webhook-route.service';

@Module({
  imports: [PrismaModule, AuditModule, EventBusModule, QueueModule, AssignmentModule, EventModule],
  controllers: [CommunicationController, InboundCommunicationController],
  providers: [CommunicationService, InboundCommunicationService, TwilioSignatureService, TwilioWebhookUrlService, WebhookRouteService, CommunicationProviderRegistry, NoopCommunicationProvider, TwilioCommunicationProvider, EmailCommunicationProvider],
  exports: [CommunicationService],
})
export class CommunicationModule {}
