// @ts-nocheck
/**
 * ASSIGNMENT CONTROLLER
 * Purpose: Exposes APIs for coverage requests and assignment state transitions.
 * Role: HTTP boundary for creating personnel ownership and fulfillment records under authenticated tenant scope.
 */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateCoverageRequestDto } from './dto/create-coverage-request.dto';
import { RespondToCoverageOfferDto } from './dto/respond-to-coverage-offer.dto';
import type { AssignmentView, CoverageRequestView } from './assignment.types';

@Controller()
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  /**
   * FUNCTION: createCoverageRequest
   * Inputs: authenticated tenant id and coverage request payload.
   * Outputs: created coverage request view.
   * Functionality: Opens a personnel coverage request for an operational event under the authenticated tenant.
   * External calls: AssignmentService.createCoverageRequest(input) persists request and audit history.
   */
  @Post('coverage-requests')
  @RequirePermissions('assignment:create')
  createCoverageRequest(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Body() input: CreateCoverageRequestDto,
  ): Promise<CoverageRequestView> {
    return this.assignmentService.createCoverageRequest({ ...input, organizationId }, actor);
  }

  /**
   * FUNCTION: listCoverageRequests
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped coverage request list.
   * Functionality: Lists coverage requests for the authenticated tenant.
   * External calls: AssignmentService.listCoverageRequests(organizationId) returns PostgreSQL-backed requests.
   */
  @Get('coverage-requests')
  @RequirePermissions('assignment:read')
  listCoverageRequests(@CurrentTenant() organizationId: string): Promise<CoverageRequestView[]> {
    return this.assignmentService.listCoverageRequests(organizationId);
  }


  /**
   * FUNCTION: respondToCoverageOffer
   * Inputs: authenticated tenant id and normalized inbound coverage response.
   * Outputs: assignment view after acceptance or rejection automation.
   * Functionality: Converts personnel replies such as YES/NO into deterministic assignment state changes.
   * External calls: AssignmentService.respondToCoverageOffer(input) locates active offer, accepts/rejects, audits, and supersedes competing offers when accepted.
   */
  @Post('coverage-requests/respond')
  @RequirePermissions('assignment:update')
  respondToCoverageOffer(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Body() input: RespondToCoverageOfferDto,
  ): Promise<AssignmentView> {
    return this.assignmentService.respondToCoverageOffer({ ...input, organizationId }, actor);
  }

  /**
   * FUNCTION: createAssignment
   * Inputs: authenticated tenant id and assignment payload.
   * Outputs: created assignment view.
   * Functionality: Creates assignment ownership for an operational event under the authenticated tenant.
   * External calls: AssignmentService.createAssignment(input) persists assignment, transitions event state, and records audit history.
   */
  @Post('assignments')
  @RequirePermissions('assignment:create')
  createAssignment(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() input: CreateAssignmentDto): Promise<AssignmentView> {
    return this.assignmentService.createAssignment({ ...input, organizationId }, actor);
  }

  /**
   * FUNCTION: listAssignments
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped assignments.
   * Functionality: Lists assignments for the authenticated tenant.
   * External calls: AssignmentService.listAssignments(organizationId) retrieves assignment rows from PostgreSQL.
   */
  @Get('assignments')
  @RequirePermissions('assignment:read')
  listAssignments(@CurrentTenant() organizationId: string): Promise<AssignmentView[]> {
    return this.assignmentService.listAssignments(organizationId);
  }

  /**
   * FUNCTION: acceptAssignment
   * Inputs: authenticated tenant id and assignmentId path parameter.
   * Outputs: accepted assignment view.
   * Functionality: Accepts a pending assignment and fulfills related coverage requests inside the authenticated tenant.
   * External calls: AssignmentService.acceptAssignment(organizationId, assignmentId) persists state, updates coverage, emits events, and records audit history.
   */
  @Patch('assignments/:assignmentId/accept')
  @RequirePermissions('assignment:update')
  acceptAssignment(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Param('assignmentId') assignmentId: string): Promise<AssignmentView> {
    return this.assignmentService.acceptAssignment(organizationId, assignmentId, actor);
  }

  /**
   * FUNCTION: rejectAssignment
   * Inputs: authenticated tenant id and assignmentId path parameter.
   * Outputs: rejected assignment view.
   * Functionality: Rejects an assignment and emits a workflow-visible rejection event inside the authenticated tenant.
   * External calls: AssignmentService.rejectAssignment(organizationId, assignmentId) persists state, emits events, and records audit history.
   */
  @Patch('assignments/:assignmentId/reject')
  @RequirePermissions('assignment:update')
  rejectAssignment(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Param('assignmentId') assignmentId: string): Promise<AssignmentView> {
    return this.assignmentService.rejectAssignment(organizationId, assignmentId, actor);
  }
}
