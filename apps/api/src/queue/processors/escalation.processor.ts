// @ts-nocheck
/**
 * ESCALATION PROCESSOR
 * Purpose: Processes delayed escalation checks for active operational events.
 * Role: Converts unresolved/time-sensitive workflow conditions into auditable escalation records.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { EscalationService } from '../../escalation/escalation.service';
import { PLATFORM_QUEUES } from '../queue.constants';
import type { EscalationCheckJob } from '../queue.types';

@Injectable()
export class EscalationProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<EscalationCheckJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly escalationService: EscalationService,
  ) {}

  /**
   * FUNCTION: onModuleInit
   * Inputs: none.
   * Outputs: started BullMQ worker.
   * Functionality: Runs delayed escalation checks and creates escalation records when policy timers fire.
   * External calls: EscalationService.evaluate(input) applies timer policy and persists escalation state when thresholds are breached.
   */
  onModuleInit(): void {
    const connection = new IORedis(this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<EscalationCheckJob>(
      PLATFORM_QUEUES.escalation,
      async (job: Job<EscalationCheckJob>) => {
        if (job.data.kind !== 'escalation.check') {
          throw new Error(`Unsupported escalation job kind: ${job.data.kind}`);
        }

        return this.escalationService.evaluate({
          organizationId: job.data.payload.organizationId,
          operationalEventId: job.data.payload.operationalEventId,
          policyContext: { source: 'escalation_queue', jobId: job.id, requestedLevel: job.data.payload.level, reason: job.data.payload.reason },
        });
      },
      { connection, concurrency: 3 },
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
