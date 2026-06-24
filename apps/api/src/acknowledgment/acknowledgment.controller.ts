// @ts-nocheck
/**
 * ACKNOWLEDGMENT CONTROLLER
 * Purpose: Exposes explicit acknowledgment endpoints for workflows and operators.
 * Role: Separates accepted operational responsibility from communication delivery state under authenticated tenant scope.
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { AcknowledgmentService } from './acknowledgment.service';
import { CreateAcknowledgmentDto } from './dto/create-acknowledgment.dto';
import { TimeoutAcknowledgmentDto } from './dto/timeout-acknowledgment.dto';

@Controller('acknowledgments')
export class AcknowledgmentController {
  constructor(private readonly acknowledgmentService: AcknowledgmentService) {}

  /**
   * FUNCTION: create
   * Inputs: authenticated tenant id and acknowledgment body.
   * Outputs: created acknowledgment view.
   * Functionality: Records an acknowledgment or acceptance response for an operational event inside tenant scope.
   * External calls: AcknowledgmentService.create(input) persists acknowledgment and updates parent event.
   */
  @Post()
  @RequirePermissions('acknowledgment:create')
  create(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: CreateAcknowledgmentDto) {
    return this.acknowledgmentService.create({ ...body, organizationId }, actor);
  }

  /**
   * FUNCTION: timeout
   * Inputs: authenticated tenant id and timeout request body.
   * Outputs: timeout acknowledgment view.
   * Functionality: Marks an event's acknowledgment window as timed out inside tenant scope.
   * External calls: AcknowledgmentService.timeout(input) records TIMED_OUT acknowledgment status.
   */
  @Post('timeout')
  @RequirePermissions('acknowledgment:update')
  timeout(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: TimeoutAcknowledgmentDto) {
    return this.acknowledgmentService.timeout({ ...body, organizationId }, actor);
  }

  /**
   * FUNCTION: listByEvent
   * Inputs: authenticated tenant id and event id route parameter.
   * Outputs: event acknowledgment history.
   * Functionality: Lists acknowledgment records for an operational event timeline.
   * External calls: AcknowledgmentService.listByEvent(input) retrieves records.
   */
  @Get('events/:eventId')
  @RequirePermissions('acknowledgment:read')
  listByEvent(@CurrentTenant() organizationId: string, @Param('eventId') eventId: string) {
    return this.acknowledgmentService.listByEvent(organizationId, eventId);
  }
}
