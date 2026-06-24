// @ts-nocheck
/**
 * INBOUND COMMUNICATION CONTROLLER
 * Purpose: Exposes provider webhook endpoints for inbound SMS and voice events.
 * Role: Gives Twilio a narrow ingress path while preserving the platform's event, communication, assignment, and audit boundaries.
 */
import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { InboundCommunicationService } from './inbound-communication.service';
import { TwilioInboundMessageDto } from './dto/twilio-inbound-message.dto';
import { TwilioInboundCallDto } from './dto/twilio-inbound-call.dto';
import { TwilioSignatureService } from './security/twilio-signature.service';
import { TwilioWebhookUrlService } from './security/twilio-webhook-url.service';
import type { Request } from 'express';

@Controller('webhooks/twilio')
export class InboundCommunicationController {
  constructor(
    private readonly inboundCommunicationService: InboundCommunicationService,
    private readonly twilioSignatureService: TwilioSignatureService,
    private readonly twilioWebhookUrlService: TwilioWebhookUrlService,
  ) {}

  /**
   * FUNCTION: inboundSms
   * Inputs: Twilio inbound SMS webhook body.
   * Outputs: processing result.
   * Functionality: Records inbound SMS and applies coverage response automation when the reply matches an active offer.
   * External calls: InboundCommunicationService.handleInboundSms(input) performs provider normalization, matching, assignment mutation, and audit logging.
   */
  @Post('sms')
  @HttpCode(200)
  async inboundSms(
    @Req() request: Request,
    @Headers('x-twilio-signature') signature: string | undefined,
    @Body() input: TwilioInboundMessageDto,
  ) {
    const publicUrl = this.twilioWebhookUrlService.resolvePublicUrl(request);
    this.twilioSignatureService.validateOrThrow(publicUrl, input as unknown as Record<string, unknown>, signature);
    return this.inboundCommunicationService.handleInboundSms(input);
  }

  /**
   * FUNCTION: inboundVoice
   * Inputs: Twilio inbound voice webhook body.
   * Outputs: processing result.
   * Functionality: Converts inbound voice calls into communication operational events for operator handling.
   * External calls: InboundCommunicationService.handleInboundVoice(input) creates event, communication, and audit records.
   */
  @Post('voice')
  @HttpCode(200)
  async inboundVoice(
    @Req() request: Request,
    @Headers('x-twilio-signature') signature: string | undefined,
    @Body() input: TwilioInboundCallDto,
  ) {
    const publicUrl = this.twilioWebhookUrlService.resolvePublicUrl(request);
    this.twilioSignatureService.validateOrThrow(publicUrl, input as unknown as Record<string, unknown>, signature);
    return this.inboundCommunicationService.handleInboundVoice(input);
  }
}
