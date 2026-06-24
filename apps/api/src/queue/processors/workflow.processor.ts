// @ts-nocheck
/**
 * WORKFLOW PROCESSOR
 * Purpose: Processes asynchronous operational workflow execution jobs.
 * Role: Keeps long-running coverage orchestration outside HTTP request lifecycles.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { CoverageWorkflowService } from '../../workflow/coverage-workflow.service';
import { PLATFORM_QUEUES } from '../queue.constants';
import type { WorkflowCoverageJob } from '../queue.types';

@Injectable()
export class WorkflowProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<WorkflowCoverageJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly coverageWorkflowService: CoverageWorkflowService,
  ) {}

  /**
   * FUNCTION: onModuleInit
   * Inputs: none.
   * Outputs: started BullMQ worker.
   * Functionality: Subscribes to workflow jobs and runs approved workflow services by kind.
   * External calls: CoverageWorkflowService.startCoverageWorkflow(input) creates workflow run, coverage request, candidate assignments, and outreach records.
   */
  onModuleInit(): void {
    const connection = new IORedis(this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<WorkflowCoverageJob>(
      PLATFORM_QUEUES.workflow,
      async (job: Job<WorkflowCoverageJob>) => {
        if (job.data.kind !== 'workflow.coverage.start') {
          throw new Error(`Unsupported workflow job kind: ${job.data.kind}`);
        }

        return this.coverageWorkflowService.startCoverageWorkflow(job.data.payload);
      },
      { connection, concurrency: 2 },
    );
  }

  /**
   * FUNCTION: onModuleDestroy
   * Inputs: none.
   * Outputs: closed worker promise.
   * Functionality: Gracefully stops the BullMQ worker when Nest shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
