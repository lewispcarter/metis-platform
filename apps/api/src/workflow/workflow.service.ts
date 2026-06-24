// @ts-nocheck
/**
 * WORKFLOW SERVICE
 * Purpose: Owns workflow run creation, lifecycle state, persistent task checkpoints, and workflow-driven event transitions.
 * Role: Coordination engine that turns operational events into observable workflow execution.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { EventService } from '../event/event.service';
import { StartWorkflowDto } from './dto/start-workflow.dto';
import { CreateWorkflowTaskDto } from './dto/create-workflow-task.dto';
import { TransitionWorkflowTaskDto } from './dto/transition-workflow-task.dto';
import type { WorkflowRunStatus, WorkflowRunView, WorkflowTaskStatus, WorkflowTaskView } from './workflow.types';
import { assertWorkflowRunTransition, assertWorkflowTaskTransition } from './workflow-state-machine';
import type { AuthenticatedActor } from '../identity/auth-context.types';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
    private readonly eventService: EventService,
  ) {}

  /**
   * FUNCTION: start
   * Inputs: tenant-scoped workflow start DTO.
   * Outputs: created workflow run view.
   * Functionality: Creates a workflow run, transitions the source event into WORKFLOW_STARTED, records audit history, and publishes workflow.started.
   * External calls: PrismaService.workflowRun.create(input) persists the run; EventService.transitionStatus(...) updates source event lifecycle; AuditService.recordMutation(input) appends immutable history; EventBusService.publish(event) notifies internal subscribers.
   */
  async start(input: StartWorkflowDto, actor?: AuthenticatedActor): Promise<WorkflowRunView> {
    const record = await this.prisma.workflowRun.create({
      data: {
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        workflowDefinitionId: input.workflowDefinitionId,
        status: 'STARTED',
        currentStep: input.currentStep ?? 'workflow_started',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.eventService.transitionStatus(input.organizationId, input.operationalEventId, 'WORKFLOW_STARTED', actor);

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: input.operationalEventId,
      action: 'workflow_started',
      newState: 'STARTED',
      metadata: { workflowRunId: record.id, currentStep: record.currentStep },
    });

    await this.eventBus.publish({
      name: 'workflow.started',
      payload: {
        organizationId: input.organizationId,
        eventId: input.operationalEventId,
        workflowRunId: record.id,
        correlationId: input.operationalEventId,
        occurredAt: new Date().toISOString(),
        data: { status: 'STARTED', currentStep: record.currentStep ?? 'workflow_started' },
      },
    });

    return this.toWorkflowRunView(record);
  }

  /**
   * FUNCTION: transitionRunStatus
   * Inputs: organization id, workflow run id, requested run status, optional metadata.
   * Outputs: updated workflow run view.
   * Functionality: Applies workflow run state-machine validation before mutating status and publishing audit/domain events.
   * External calls: PrismaService.workflowRun.findFirst/update access workflow run persistence; AuditService.recordMutation(input) appends history; EventBusService.publish(event) emits lifecycle transitions.
   */
  async transitionRunStatus(organizationId: string, workflowRunId: string, status: WorkflowRunStatus, metadata: Record<string, unknown> = {}, actor?: AuthenticatedActor): Promise<WorkflowRunView> {
    const existing = await this.prisma.workflowRun.findFirst({ where: { id: workflowRunId, organizationId } });
    if (!existing) throw new NotFoundException('Workflow run not found.');

    assertWorkflowRunTransition(existing.status as WorkflowRunStatus, status);

    const completedAt = status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' ? new Date() : existing.completedAt;
    const record = await this.prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { status, completedAt, metadata: { ...(existing.metadata as Record<string, unknown>), ...metadata } as Prisma.InputJsonValue },
    });

    await this.auditService.recordMutation(actor, organizationId, {
      eventId: record.operationalEventId,
      action: 'workflow_status_changed',
      previousState: existing.status,
      newState: status,
      metadata: { workflowRunId, ...metadata },
    });

    await this.eventBus.publish({
      name: status === 'COMPLETED' ? 'workflow.completed' : status === 'FAILED' ? 'workflow.failed' : 'workflow.status_changed',
      payload: {
        organizationId,
        eventId: record.operationalEventId,
        workflowRunId,
        correlationId: record.operationalEventId,
        occurredAt: new Date().toISOString(),
        data: { previousStatus: existing.status, status, metadata },
      },
    });

    return this.toWorkflowRunView(record);
  }

  /**
   * FUNCTION: createTask
   * Inputs: tenant-scoped workflow task DTO.
   * Outputs: created workflow task view.
   * Functionality: Persists a task checkpoint so workflow execution can be traced step-by-step.
   * External calls: PrismaService.workflowTask.create(input) persists task; AuditService.recordMutation(input) appends task creation evidence.
   */
  async createTask(input: CreateWorkflowTaskDto, actor?: AuthenticatedActor): Promise<WorkflowTaskView> {
    const run = await this.prisma.workflowRun.findFirst({ where: { id: input.workflowRunId, organizationId: input.organizationId } });
    if (!run) throw new NotFoundException('Workflow run not found.');

    const task = await this.prisma.workflowTask.create({
      data: {
        organizationId: input.organizationId,
        workflowRunId: input.workflowRunId,
        name: input.name,
        status: 'PENDING',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: run.operationalEventId,
      action: 'workflow_task_created',
      newState: 'PENDING',
      metadata: { workflowRunId: input.workflowRunId, workflowTaskId: task.id, name: task.name },
    });

    return this.toWorkflowTaskView(task);
  }

  /**
   * FUNCTION: transitionTask
   * Inputs: tenant-scoped task transition DTO.
   * Outputs: updated workflow task view.
   * Functionality: Applies task-level state machine validation, timestamps execution boundaries, and audits task movement.
   * External calls: PrismaService.workflowTask.findFirst/update accesses task persistence; AuditService.recordMutation(input) appends lifecycle evidence.
   */
  async transitionTask(input: TransitionWorkflowTaskDto, actor?: AuthenticatedActor): Promise<WorkflowTaskView> {
    const existing = await this.prisma.workflowTask.findFirst({ where: { id: input.workflowTaskId, organizationId: input.organizationId }, include: { workflowRun: true } });
    if (!existing) throw new NotFoundException('Workflow task not found.');

    assertWorkflowTaskTransition(existing.status as WorkflowTaskStatus, input.status);

    const task = await this.prisma.workflowTask.update({
      where: { id: input.workflowTaskId },
      data: {
        status: input.status,
        startedAt: input.status === 'RUNNING' && !existing.startedAt ? new Date() : existing.startedAt,
        completedAt: ['COMPLETED', 'FAILED', 'SKIPPED'].includes(input.status) ? new Date() : existing.completedAt,
        failureReason: input.status === 'FAILED' ? input.failureReason ?? 'Unspecified workflow task failure.' : existing.failureReason,
        metadata: { ...(existing.metadata as Record<string, unknown>), ...(input.metadata ?? {}) } as Prisma.InputJsonValue,
      },
    });

    await this.auditService.recordMutation(actor, input.organizationId, {
      eventId: existing.workflowRun.operationalEventId,
      action: 'workflow_task_status_changed',
      previousState: existing.status,
      newState: input.status,
      metadata: { workflowRunId: existing.workflowRunId, workflowTaskId: existing.id, name: existing.name, failureReason: input.failureReason },
    });

    return this.toWorkflowTaskView(task);
  }

  /**
   * FUNCTION: listTasks
   * Inputs: organization id and workflow run id.
   * Outputs: tenant-scoped workflow task views.
   * Functionality: Lists persisted workflow checkpoints in creation order for operator timeline display.
   * External calls: PrismaService.workflowTask.findMany(input) retrieves task rows.
   */
  async listTasks(organizationId: string, workflowRunId: string): Promise<WorkflowTaskView[]> {
    const tasks = await this.prisma.workflowTask.findMany({ where: { organizationId, workflowRunId }, orderBy: { createdAt: 'asc' } });
    return tasks.map((task) => this.toWorkflowTaskView(task));
  }

  /**
   * FUNCTION: listByOrganization
   * Inputs: organization id used for tenant scoping.
   * Outputs: workflow runs for the tenant.
   * Functionality: Lists workflow execution instances ordered by most recently updated.
   * External calls: PrismaService.workflowRun.findMany(input) retrieves tenant-scoped workflow runs.
   */
  async listByOrganization(organizationId: string): Promise<WorkflowRunView[]> {
    const records = await this.prisma.workflowRun.findMany({ where: { organizationId }, orderBy: { updatedAt: 'desc' } });
    return records.map((record) => this.toWorkflowRunView(record));
  }

  /**
   * FUNCTION: findById
   * Inputs: organization id and workflow run id.
   * Outputs: workflow run view.
   * Functionality: Retrieves a single tenant-scoped workflow run.
   * External calls: PrismaService.workflowRun.findFirst(input) retrieves workflow run row.
   */
  async findById(organizationId: string, workflowRunId: string): Promise<WorkflowRunView> {
    const record = await this.prisma.workflowRun.findFirst({ where: { id: workflowRunId, organizationId } });
    if (!record) throw new NotFoundException('Workflow run not found.');
    return this.toWorkflowRunView(record);
  }

  /**
   * FUNCTION: complete
   * Inputs: organization id and workflow run id.
   * Outputs: completed workflow run view.
   * Functionality: Completes an active workflow run through the state machine.
   * External calls: WorkflowService.transitionRunStatus(input) validates and persists terminal state.
   */
  async complete(organizationId: string, workflowRunId: string, actor?: AuthenticatedActor): Promise<WorkflowRunView> {
    return this.transitionRunStatus(organizationId, workflowRunId, 'COMPLETED', {}, actor);
  }

  /**
   * FUNCTION: toWorkflowRunView
   * Inputs: Prisma workflow run row.
   * Outputs: stable API workflow run view.
   * Functionality: Converts persistence representation into external contract.
   */
  private toWorkflowRunView(record: { id: string; organizationId: string; operationalEventId: string; workflowDefinitionId: string | null; status: string; currentStep: string | null; metadata: unknown; startedAt: Date; completedAt: Date | null; updatedAt: Date }): WorkflowRunView {
    return {
      workflowRunId: record.id,
      organizationId: record.organizationId,
      operationalEventId: record.operationalEventId,
      workflowDefinitionId: record.workflowDefinitionId ?? undefined,
      status: record.status as WorkflowRunStatus,
      currentStep: record.currentStep ?? undefined,
      startedAt: record.startedAt.toISOString(),
      completedAt: record.completedAt?.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      metadata: record.metadata as Record<string, unknown>,
    };
  }

  /**
   * FUNCTION: toWorkflowTaskView
   * Inputs: Prisma workflow task row.
   * Outputs: stable API workflow task view.
   * Functionality: Converts persisted task checkpoints into operator-facing workflow execution contract.
   */
  private toWorkflowTaskView(record: { id: string; organizationId: string; workflowRunId: string; name: string; status: string; metadata: unknown; createdAt: Date; startedAt?: Date | null; completedAt?: Date | null; failureReason?: string | null; updatedAt: Date }): WorkflowTaskView {
    return {
      workflowTaskId: record.id,
      organizationId: record.organizationId,
      workflowRunId: record.workflowRunId,
      name: record.name,
      status: record.status as WorkflowTaskStatus,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt.toISOString(),
      startedAt: record.startedAt?.toISOString(),
      completedAt: record.completedAt?.toISOString(),
      failureReason: record.failureReason ?? undefined,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
