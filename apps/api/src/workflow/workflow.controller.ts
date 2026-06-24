// @ts-nocheck
/**
 * WORKFLOW CONTROLLER
 * Purpose: Exposes workflow execution endpoints for operational orchestration.
 * Role: API boundary for starting, listing, reading, and completing workflow runs under authenticated tenant scope.
 */
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentTenant } from '../identity/decorators/current-tenant.decorator';
import { CurrentActor } from '../identity/decorators/current-actor.decorator';
import type { AuthenticatedActor } from '../identity/auth-context.types';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { StartCoverageWorkflowDto } from './dto/start-coverage-workflow.dto';
import { CreateWorkflowTaskDto } from './dto/create-workflow-task.dto';
import { TransitionWorkflowTaskDto } from './dto/transition-workflow-task.dto';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { CoverageWorkflowResult, CoverageWorkflowService } from './coverage-workflow.service';
import { WorkflowService } from './workflow.service';
import type { WorkflowRunView, WorkflowTaskView } from './workflow.types';

@Controller('workflow-runs')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly coverageWorkflowService: CoverageWorkflowService,
  ) {}

  /**
   * FUNCTION: start
   * Inputs: authenticated tenant id and workflow start payload.
   * Outputs: created workflow run view.
   * Functionality: Starts a workflow through the Workflow Service under authenticated tenant scope.
   * External calls: WorkflowService.start(input) creates the run, transitions event state, publishes workflow events, and records audit history.
   */
  @Post('start')
  @RequirePermissions('workflow:create')
  start(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Body() input: StartWorkflowDto): Promise<WorkflowRunView> {
    return this.workflowService.start({ ...input, organizationId }, actor);
  }

  /**
   * FUNCTION: startCoverageWorkflow
   * Inputs: authenticated tenant id and coverage workflow start payload.
   * Outputs: coverage workflow result containing run, request, candidates, and outreach count.
   * Functionality: Starts the first reference personnel coordination workflow under authenticated tenant scope.
   * External calls: CoverageWorkflowService.startCoverageWorkflow(input) orchestrates workflow run, coverage request, candidate discovery, outreach, and assignments.
   */
  @Post('coverage/start')
  @RequirePermissions('workflow:create')
  startCoverageWorkflow(@CurrentTenant() organizationId: string, @Body() input: StartCoverageWorkflowDto): Promise<CoverageWorkflowResult> {
    return this.coverageWorkflowService.startCoverageWorkflow({ ...input, organizationId });
  }

  /**
   * FUNCTION: enqueueCoverageWorkflow
   * Inputs: authenticated tenant id and coverage workflow start payload.
   * Outputs: queued workflow job metadata.
   * Functionality: Queues the reference personnel coordination workflow so HTTP requests stay fast and operational work happens asynchronously.
   * External calls: CoverageWorkflowService.enqueueCoverageWorkflow(input) schedules Redis/BullMQ workflow execution.
   */
  @Post('coverage/enqueue')
  @RequirePermissions('workflow:create')
  enqueueCoverageWorkflow(
    @CurrentTenant() organizationId: string,
    @Body() input: StartCoverageWorkflowDto,
  ): Promise<{ jobId: string | number | undefined; queued: true }> {
    return this.coverageWorkflowService.enqueueCoverageWorkflow({ ...input, organizationId });
  }

  /**
   * FUNCTION: list
   * Inputs: authenticated tenant id.
   * Outputs: tenant-scoped workflow runs.
   * Functionality: Lists workflow runs for the authenticated tenant.
   * External calls: WorkflowService.listByOrganization(organizationId) returns PostgreSQL-backed workflow runs.
   */
  @Get()
  @RequirePermissions('workflow:read')
  list(@CurrentTenant() organizationId: string): Promise<WorkflowRunView[]> {
    return this.workflowService.listByOrganization(organizationId);
  }

  /**
   * FUNCTION: get
   * Inputs: authenticated tenant id and workflowRunId path parameter.
   * Outputs: matching workflow run view.
   * Functionality: Reads one tenant-scoped workflow run.
   * External calls: WorkflowService.findById(organizationId, workflowRunId) returns run or throws.
   */
  @Get(':workflowRunId')
  @RequirePermissions('workflow:read')
  get(@CurrentTenant() organizationId: string, @Param('workflowRunId') workflowRunId: string): Promise<WorkflowRunView> {
    return this.workflowService.findById(organizationId, workflowRunId);
  }

  /**
   * FUNCTION: complete
   * Inputs: authenticated tenant id and workflowRunId path parameter.
   * Outputs: completed workflow run view.
   * Functionality: Completes workflow execution and resolves the source event inside tenant scope.
   * External calls: WorkflowService.complete(organizationId, workflowRunId) performs completion, audit, event transition, and event publishing.
   */
  @Patch(':workflowRunId/complete')
  @RequirePermissions('workflow:update')
  complete(@CurrentTenant() organizationId: string, @CurrentActor() actor: AuthenticatedActor | undefined, @Param('workflowRunId') workflowRunId: string): Promise<WorkflowRunView> {
    return this.workflowService.complete(organizationId, workflowRunId, actor);
  }

  /**
   * FUNCTION: createTask
   * Inputs: authenticated tenant id, workflow run id, and task creation payload.
   * Outputs: created workflow task view.
   * Functionality: Creates a persistent workflow task checkpoint for operator visibility and auditability.
   * External calls: WorkflowService.createTask(input) persists task state and audit evidence.
   */
  @Post(':id/tasks')
  @RequirePermissions('workflow:create')
  createTask(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Param('id') workflowRunId: string,
    @Body() input: CreateWorkflowTaskDto,
  ): Promise<WorkflowTaskView> {
    return this.workflowService.createTask({ ...input, organizationId, workflowRunId }, actor);
  }

  /**
   * FUNCTION: listTasks
   * Inputs: authenticated tenant id and workflow run id.
   * Outputs: tenant-scoped workflow task list.
   * Functionality: Returns task checkpoints for the selected workflow run.
   * External calls: WorkflowService.listTasks(organizationId, workflowRunId) reads workflow task persistence.
   */
  @Get(':id/tasks')
  @RequirePermissions('workflow:read')
  listTasks(@CurrentTenant() organizationId: string, @Param('id') workflowRunId: string): Promise<WorkflowTaskView[]> {
    return this.workflowService.listTasks(organizationId, workflowRunId);
  }

  /**
   * FUNCTION: transitionTask
   * Inputs: authenticated tenant id, task id, and requested task status.
   * Outputs: updated workflow task view.
   * Functionality: Mutates task lifecycle through deterministic state-machine rules.
   * External calls: WorkflowService.transitionTask(input) validates transition, persists state, and records audit evidence.
   */
  @Patch('tasks/:taskId/status')
  @RequirePermissions('workflow:update')
  transitionTask(
    @CurrentTenant() organizationId: string,
    @CurrentActor() actor: AuthenticatedActor | undefined,
    @Param('taskId') workflowTaskId: string,
    @Body() input: TransitionWorkflowTaskDto,
  ): Promise<WorkflowTaskView> {
    return this.workflowService.transitionTask({ ...input, organizationId, workflowTaskId }, actor);
  }

}
