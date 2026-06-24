// @ts-nocheck
/**
 * COVERAGE WORKFLOW SERVICE
 * Purpose: Implements the first reference workflow for personnel coverage coordination.
 * Role: Proves event → workflow → coverage request → candidate discovery → communication → assignment orchestration without locking the platform to healthcare.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { AssignmentService } from '../assignment/assignment.service';
import type { CoverageRequestView } from '../assignment/assignment.types';
import { CommunicationService } from '../communication/communication.service';
import { PersonnelService } from '../personnel/personnel.service';
import type { PersonnelView } from '../personnel/personnel.types';
import { StartCoverageWorkflowDto } from './dto/start-coverage-workflow.dto';
import { PLATFORM_QUEUES } from '../queue/queue.constants';
import { WorkflowService } from './workflow.service';
import type { WorkflowRunView } from './workflow.types';

export type CoverageWorkflowResult = {
  workflowRun: WorkflowRunView;
  coverageRequest: CoverageRequestView;
  candidates: PersonnelView[];
  contactedCandidateCount: number;
};

@Injectable()
export class CoverageWorkflowService {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly assignmentService: AssignmentService,
    private readonly personnelService: PersonnelService,
    private readonly communicationService: CommunicationService,
    @Inject(PLATFORM_QUEUES.workflow) private readonly workflowQueue: Queue,
  ) {}


  /**
   * FUNCTION: enqueueCoverageWorkflow
   * Inputs: coverage workflow launch payload and optional delay milliseconds.
   * Outputs: queued job metadata.
   * Functionality: Schedules the universal personnel coverage workflow for asynchronous worker execution.
   * External calls: Queue.add(name,data,opts) schedules Redis-backed workflow work with retry and failure retention.
   */
  async enqueueCoverageWorkflow(input: StartCoverageWorkflowDto, delayMs = 0): Promise<{ jobId: string | number | undefined; queued: true }> {
    const job = await this.workflowQueue.add(
      'workflow.coverage.start',
      { kind: 'workflow.coverage.start', payload: input },
      {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { jobId: job.id, queued: true };
  }

  /**
   * FUNCTION: startCoverageWorkflow
   * Inputs: coverage workflow launch payload with event id, role, shift, deadline, and optional message.
   * Outputs: workflow run, coverage request, candidate list, and outreach count.
   * Functionality: Starts the universal personnel coverage workflow, creates coverage request, discovers available candidates, sends initial outreach, and creates offered assignments.
   * External calls: WorkflowService.start(input) creates workflow run; AssignmentService.createCoverageRequest(input) opens request; PersonnelService.findAvailableCandidates(input) retrieves candidates; CommunicationService.send(input) records outreach; AssignmentService.createAssignment(input) creates candidate offers.
   */
  async startCoverageWorkflow(input: StartCoverageWorkflowDto): Promise<CoverageWorkflowResult> {
    const workflowRun = await this.workflowService.start({
      organizationId: input.organizationId,
      operationalEventId: input.operationalEventId,
      currentStep: 'coverage_request_created',
      metadata: { workflowType: 'personnel_coverage', ...input.metadata },
    });

    const coverageTask = await this.workflowService.createTask({
      organizationId: input.organizationId,
      workflowRunId: workflowRun.workflowRunId,
      name: 'coverage_request',
      metadata: { requiredRole: input.requiredRole, urgency: input.urgency },
    });
    await this.workflowService.transitionTask({
      organizationId: input.organizationId,
      workflowTaskId: coverageTask.workflowTaskId,
      status: 'RUNNING',
      metadata: { step: 'create_coverage_request' },
    });

    const coverageRequest = await this.assignmentService.createCoverageRequest({
      organizationId: input.organizationId,
      operationalEventId: input.operationalEventId,
      requiredRole: input.requiredRole,
      requiredDepartment: input.requiredDepartment,
      requiredShiftStart: input.requiredShiftStart,
      requiredShiftEnd: input.requiredShiftEnd,
      requiredCertifications: input.requiredCertifications ?? [],
      urgency: input.urgency,
      coverageDeadline: input.coverageDeadline,
      metadata: { workflowRunId: workflowRun.workflowRunId, ...input.metadata },
    });

    await this.workflowService.transitionTask({
      organizationId: input.organizationId,
      workflowTaskId: coverageTask.workflowTaskId,
      status: 'COMPLETED',
      metadata: { coverageRequestId: coverageRequest.coverageRequestId },
    });

    const candidateTask = await this.workflowService.createTask({
      organizationId: input.organizationId,
      workflowRunId: workflowRun.workflowRunId,
      name: 'candidate_discovery',
      metadata: { coverageRequestId: coverageRequest.coverageRequestId },
    });
    await this.workflowService.transitionTask({ organizationId: input.organizationId, workflowTaskId: candidateTask.workflowTaskId, status: 'RUNNING' });

    const candidates = await this.personnelService.findAvailableCandidates({
      organizationId: input.organizationId,
      requiredRole: input.requiredRole,
      requiredShiftStart: input.requiredShiftStart,
      requiredShiftEnd: input.requiredShiftEnd,
      requiredCertifications: input.requiredCertifications ?? [],
    });

    await this.workflowService.transitionTask({
      organizationId: input.organizationId,
      workflowTaskId: candidateTask.workflowTaskId,
      status: 'COMPLETED',
      metadata: { candidateCount: candidates.length },
    });

    const outreachTask = await this.workflowService.createTask({
      organizationId: input.organizationId,
      workflowRunId: workflowRun.workflowRunId,
      name: 'candidate_outreach',
      metadata: { coverageRequestId: coverageRequest.coverageRequestId, candidateCount: candidates.length },
    });
    await this.workflowService.transitionTask({ organizationId: input.organizationId, workflowTaskId: outreachTask.workflowTaskId, status: 'RUNNING' });

    const defaultBody = `Coverage needed for ${input.requiredRole} from ${input.requiredShiftStart} to ${input.requiredShiftEnd}. Reply YES to accept.`;
    let contactedCandidateCount = 0;

    for (const candidate of candidates) {
      if (!candidate.phone && !candidate.email) {
        continue;
      }

      await this.communicationService.send({
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        channel: candidate.phone ? 'SMS' : 'EMAIL',
        recipient: candidate.phone ?? candidate.email!,
        body: input.messageBody ?? defaultBody,
        metadata: {
          workflowRunId: workflowRun.workflowRunId,
          coverageRequestId: coverageRequest.coverageRequestId,
          personnelId: candidate.personnelId,
        },
      });

      await this.assignmentService.createAssignment({
        organizationId: input.organizationId,
        operationalEventId: input.operationalEventId,
        personnelId: candidate.personnelId,
        status: 'OFFERED',
        metadata: {
          workflowRunId: workflowRun.workflowRunId,
          coverageRequestId: coverageRequest.coverageRequestId,
        },
      });

      contactedCandidateCount += 1;
    }

    await this.workflowService.transitionTask({
      organizationId: input.organizationId,
      workflowTaskId: outreachTask.workflowTaskId,
      status: contactedCandidateCount > 0 ? 'COMPLETED' : 'FAILED',
      failureReason: contactedCandidateCount > 0 ? undefined : 'No reachable candidates found for coverage request.',
      metadata: { contactedCandidateCount },
    });

    if (contactedCandidateCount > 0) {
      await this.workflowService.transitionRunStatus(input.organizationId, workflowRun.workflowRunId, 'RUNNING', { currentStage: 'awaiting_acknowledgment', contactedCandidateCount });
    } else {
      await this.workflowService.transitionRunStatus(input.organizationId, workflowRun.workflowRunId, 'FAILED', { reason: 'no_reachable_candidates' });
    }

    return { workflowRun, coverageRequest, candidates, contactedCandidateCount };
  }
}
