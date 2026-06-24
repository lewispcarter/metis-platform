// @ts-nocheck
/**
 * COMMUNICATION CONTROLLER
 * Purpose: Exposes provider-agnostic communication endpoints.
 * Role: Lets workflows and operators send, queue, list, and update communication records under authenticated tenant scope.
 */
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { SendCommunicationDto } from './dto/send-communication.dto';
import { CommunicationService } from './communication.service';
import type { CommunicationStatus } from './communication.types';

@Controller('communications')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  /**
   * FUNCTION: send
   * Inputs: authenticated tenant id and outbound communication body.
   * Outputs: recorded SENT communication.
   * Functionality: Records an immediate provider-agnostic communication without trusting client-supplied tenant scope.
   * External calls: CommunicationService.send(input) persists communication and emits domain event.
   */
  @Post('send')
  @RequirePermissions('communication:create')
  send(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: SendCommunicationDto) {
    return this.communicationService.send({ ...body, organizationId }, actor);
  }

  /**
   * FUNCTION: enqueue
   * Inputs: authenticated tenant id, outbound communication body, and optional delay query.
   * Outputs: queued job metadata.
   * Functionality: Queues outbound communication for asynchronous delivery under authenticated tenant scope.
   * External calls: CommunicationService.enqueueOutbound(input) schedules delivery job.
   */
  @Post('enqueue')
  @RequirePermissions('communication:create')
  enqueue(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: SendCommunicationDto, @Query('delayMs') delayMs?: string) {
    return this.communicationService.enqueueOutbound({ ...body, organizationId }, delayMs ? Number(delayMs) : 0, actor);
  }

  /**
   * FUNCTION: list
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped communication history.
   * Functionality: Lists communications for operational timelines.
   * External calls: CommunicationService.listByOrganization(input) retrieves records.
   */
  @Get()
  @RequirePermissions('communication:read')
  list(@CurrentTenant() organizationId: string) {
    return this.communicationService.listByOrganization(organizationId);
  }

  /**
   * FUNCTION: markStatus
   * Inputs: authenticated tenant id, communication id route parameter, and status body.
   * Outputs: updated communication view.
   * Functionality: Updates provider delivery state for communication tracking inside tenant scope.
   * External calls: CommunicationService.markStatus(input) persists status and emits domain event.
   */
  @Patch(':communicationId/status')
  @RequirePermissions('communication:update')
  markStatus(
    @CurrentTenant() organizationId: string,
    @Param('communicationId') communicationId: string,
    @Body() body: { status: CommunicationStatus; metadata?: Record<string, unknown> },
    @CurrentActor() actor?: AuthenticatedActor,
  ) {
    return this.communicationService.markStatus(organizationId, communicationId, body.status, body.metadata ?? {}, actor);
  }
}
