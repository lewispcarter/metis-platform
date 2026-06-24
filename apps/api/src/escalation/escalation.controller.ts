// @ts-nocheck
/**
 * ESCALATION CONTROLLER
 * Purpose: Exposes escalation lifecycle endpoints for operators and workflow systems.
 * Role: Provides escalation creation, evaluation, listing, and resolution surfaces under authenticated tenant scope.
 */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { CreateEscalationDto } from './dto/create-escalation.dto';
import { EvaluateEscalationDto } from './dto/evaluate-escalation.dto';
import { ForceEscalationDto } from './dto/force-escalation.dto';
import { EscalationService } from './escalation.service';

@Controller('escalations')
export class EscalationController {
  constructor(private readonly escalationService: EscalationService) {}

  /**
   * FUNCTION: create
   * Inputs: authenticated tenant id and escalation creation body.
   * Outputs: created escalation view.
   * Functionality: Creates an escalation for an operational event under authenticated tenant scope.
   * External calls: EscalationService.create(input) persists escalation and updates event state.
   */
  @Post()
  @RequirePermissions('escalation:create')
  create(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: CreateEscalationDto) {
    return this.escalationService.create({ ...body, organizationId }, actor);
  }

  /**
   * FUNCTION: evaluate
   * Inputs: authenticated tenant id and escalation evaluation body.
   * Outputs: escalation decision.
   * Functionality: Evaluates whether an event should escalate under current policy context.
   * External calls: EscalationService.evaluate(input) performs deterministic policy evaluation.
   */
  @Post('evaluate')
  @RequirePermissions('escalation:read')
  evaluate(@CurrentTenant() organizationId: string, @Body() body: EvaluateEscalationDto) {
    return this.escalationService.evaluate({ ...body, organizationId });
  }


  /**
   * FUNCTION: force
   * Inputs: authenticated tenant id and supervisor escalation command.
   * Outputs: created escalation view.
   * Functionality: Allows authorized supervisors to force immediate escalation with audit trail.
   * External calls: EscalationService.force(input) delegates to standard escalation creation and audit pipeline.
   */
  @Post('force')
  @RequirePermissions('escalation:create')
  force(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() body: ForceEscalationDto) {
    return this.escalationService.force({ ...body, organizationId }, actor);
  }

  /**
   * FUNCTION: list
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped escalation records.
   * Functionality: Lists escalations for operational monitoring.
   * External calls: EscalationService.listByOrganization(input) retrieves tenant records.
   */
  @Get()
  @RequirePermissions('escalation:read')
  list(@CurrentTenant() organizationId: string) {
    return this.escalationService.listByOrganization(organizationId);
  }

  /**
   * FUNCTION: resolve
   * Inputs: authenticated tenant id and escalation id route parameter.
   * Outputs: resolved escalation view.
   * Functionality: Marks an escalation resolved inside tenant scope.
   * External calls: EscalationService.resolve(input) updates escalation state.
   */
  @Patch(':escalationId/resolve')
  @RequirePermissions('escalation:update')
  resolve(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Param('escalationId') escalationId: string) {
    return this.escalationService.resolve(organizationId, escalationId, actor);
  }
}
