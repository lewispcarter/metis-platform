// @ts-nocheck
/**
 * INBOUND COMMUNICATION SERVICE
 * Purpose: Converts Twilio inbound SMS/voice webhooks into platform-native communications, coverage responses, and operational events.
 * Role: Protects the rest of the platform from provider-specific webhook payloads while preserving auditability.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationService } from '../communication.service';
import { AssignmentService } from '../../assignment/assignment.service';
import { EventService } from '../../event/event.service';
import { AuditService } from '../../audit/audit.service';
import { TwilioInboundMessageDto } from './dto/twilio-inbound-message.dto';
import { TwilioInboundCallDto } from './dto/twilio-inbound-call.dto';
import type { InboundWebhookResult } from './inbound-communication.types';
import { WebhookRouteService } from './routing/webhook-route.service';

@Injectable()
export class InboundCommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly communicationService: CommunicationService,
    private readonly assignmentService: AssignmentService,
    private readonly eventService: EventService,
    private readonly auditService: AuditService,
    private readonly webhookRouteService: WebhookRouteService,
  ) {}

  /**
   * FUNCTION: handleInboundSms
   * Inputs: Twilio inbound SMS webhook payload.
   * Outputs: Platform webhook processing summary.
   * Functionality: Records the inbound SMS, finds the latest active coverage offer tied to the sender, and applies YES/NO response automation when possible.
   * External calls: CommunicationService.recordInbound(...) persists inbound communication; PrismaService.communication.findMany(...) locates related outbound offers; AssignmentService.respondToCoverageOffer(...) mutates assignment state; AuditService.recordMutation(...) appends webhook trace.
   */
  async handleInboundSms(input: TwilioInboundMessageDto): Promise<InboundWebhookResult> {
    const route = await this.webhookRouteService.resolveOrganizationForInboundAddress('TWILIO', input.To, input.organizationId);
    const organizationId = route.organizationId;
    const normalizedBody = this.normalizeResponse(input.Body);

    const matchedOffer = await this.findLatestCoverageOffer(organizationId, input.From);

    const inboundCommunication = await this.communicationService.recordInbound({
      organizationId,
      operationalEventId: matchedOffer?.operationalEventId,
      channel: 'SMS',
      sender: input.From,
      recipient: input.To,
      body: input.Body,
      providerMessageId: input.MessageSid,
      metadata: {
        provider: 'twilio',
        providerPayloadType: 'inbound_sms',
        accountSid: input.AccountSid,
        smsStatus: input.SmsStatus,
        matchedCoverageOffer: Boolean(matchedOffer),
        webhookRouteId: route.routeId,
        webhookMatchedBy: route.matchedBy,
      },
    });

    if (!matchedOffer || !normalizedBody) {
      await this.auditService.recordMutation(undefined, organizationId, {
        eventId: matchedOffer?.operationalEventId,
        action: 'inbound_sms_unmatched',
        newState: 'RECEIVED',
        metadata: {
          communicationId: inboundCommunication.communicationId,
          from: input.From,
          to: input.To,
          body: input.Body,
          reason: !matchedOffer ? 'NO_ACTIVE_COVERAGE_OFFER' : 'UNSUPPORTED_RESPONSE',
        },
      });

      return {
        handled: false,
        organizationId,
        communicationId: inboundCommunication.communicationId,
        operationalEventId: matchedOffer?.operationalEventId,
        action: 'coverage_response_unmatched',
        message: 'Inbound SMS recorded but no active coverage response was applied.',
      };
    }

    const assignment = await this.assignmentService.respondToCoverageOffer({
      organizationId,
      operationalEventId: matchedOffer.operationalEventId,
      personnelId: matchedOffer.personnelId,
      inboundAddress: input.From,
      response: normalizedBody,
      metadata: { inboundCommunicationId: inboundCommunication.communicationId, providerMessageId: input.MessageSid },
    });

    await this.auditService.recordMutation(undefined, organizationId, {
      eventId: matchedOffer.operationalEventId,
      action: 'inbound_sms_coverage_response_processed',
      newState: assignment.status,
      metadata: {
        communicationId: inboundCommunication.communicationId,
        assignmentId: assignment.assignmentId,
        personnelId: matchedOffer.personnelId,
        response: normalizedBody,
      },
    });

    return {
      handled: true,
      organizationId,
      communicationId: inboundCommunication.communicationId,
      operationalEventId: matchedOffer.operationalEventId,
      assignmentId: assignment.assignmentId,
      action: 'coverage_response_processed',
      message: `Coverage response processed as ${assignment.status}.`,
    };
  }

  /**
   * FUNCTION: handleInboundVoice
   * Inputs: Twilio inbound voice webhook payload.
   * Outputs: Created event and communication processing summary.
   * Functionality: Records an inbound voice communication and creates an operational communication event for operator review/routing.
   * External calls: EventService.create(input) creates an operational event; CommunicationService.recordInbound(input) persists the inbound call record; AuditService.recordMutation(input) appends webhook trace.
   */
  async handleInboundVoice(input: TwilioInboundCallDto): Promise<InboundWebhookResult> {
    const route = await this.webhookRouteService.resolveOrganizationForInboundAddress('TWILIO', input.To, input.organizationId);
    const organizationId = route.organizationId;

    const event = await this.eventService.create({
      organizationId,
      eventType: 'inbound_call_received',
      eventCategory: 'COMMUNICATION',
      title: `Inbound call from ${input.From}`,
      description: `Inbound Twilio call received at ${input.To}.`,
      source: 'TWILIO_VOICE_WEBHOOK',
      priority: 'NORMAL',
      severity: 'S3_MEDIUM',
      metadata: {
        provider: 'twilio',
        callSid: input.CallSid,
        callStatus: input.CallStatus,
        from: input.From,
        to: input.To,
        webhookRouteId: route.routeId,
        webhookMatchedBy: route.matchedBy,
      },
    });

    const communication = await this.communicationService.recordInbound({
      organizationId,
      operationalEventId: event.eventId,
      channel: 'VOICE',
      sender: input.From,
      recipient: input.To,
      body: `Inbound call status: ${input.CallStatus ?? 'received'}`,
      providerMessageId: input.CallSid,
      metadata: { provider: 'twilio', providerPayloadType: 'inbound_voice', accountSid: input.AccountSid, callStatus: input.CallStatus, webhookRouteId: route.routeId, webhookMatchedBy: route.matchedBy },
    });

    await this.auditService.recordMutation(undefined, organizationId, {
      eventId: event.eventId,
      action: 'inbound_voice_event_created',
      newState: event.status,
      metadata: { communicationId: communication.communicationId, callSid: input.CallSid, from: input.From, to: input.To },
    });

    return {
      handled: true,
      organizationId,
      communicationId: communication.communicationId,
      operationalEventId: event.eventId,
      action: 'voice_event_created',
      message: 'Inbound voice call converted into an operational event.',
    };
  }

  /**
   * FUNCTION: normalizeResponse
   * Inputs: raw inbound SMS body.
   * Outputs: accepted coverage response token or undefined.
   * Functionality: Converts common personnel replies into deterministic coverage actions.
   */
  private normalizeResponse(body: string): 'YES' | 'NO' | 'ACCEPT' | 'REJECT' | undefined {
    const firstToken = body.trim().toUpperCase().split(/\s+/)[0];
    if (firstToken === 'YES' || firstToken === 'Y') return 'YES';
    if (firstToken === 'NO' || firstToken === 'N') return 'NO';
    if (firstToken === 'ACCEPT') return 'ACCEPT';
    if (firstToken === 'REJECT' || firstToken === 'DECLINE') return 'REJECT';
    return undefined;
  }

  /**
   * FUNCTION: findLatestCoverageOffer
   * Inputs: organization id and sender phone number.
   * Outputs: latest active outbound coverage offer context, if present.
   * Functionality: Matches inbound SMS replies to recent outbound coverage communications using recipient phone and communication metadata.
   * External calls: PrismaService.communication.findMany(input) retrieves candidate outbound messages; PrismaService.assignment.findFirst(input) verifies active offer state.
   */
  private async findLatestCoverageOffer(organizationId: string, inboundAddress: string): Promise<{ operationalEventId: string; personnelId: string } | undefined> {
    const outboundMessages = await this.prisma.communication.findMany({
      where: {
        organizationId,
        channel: 'SMS',
        direction: 'OUTBOUND',
        recipient: inboundAddress,
        operationalEventId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const message of outboundMessages) {
      const metadata = message.metadata as Record<string, unknown>;
      const personnelId = typeof metadata.personnelId === 'string' ? metadata.personnelId : undefined;
      if (!message.operationalEventId || !personnelId) continue;

      const activeAssignment = await this.prisma.assignment.findFirst({
        where: {
          organizationId,
          operationalEventId: message.operationalEventId,
          personnelId,
          status: { in: ['OFFERED', 'PENDING'] },
        },
      });

      if (activeAssignment) {
        return { operationalEventId: message.operationalEventId, personnelId };
      }
    }

    return undefined;
  }
}
