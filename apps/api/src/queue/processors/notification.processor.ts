// @ts-nocheck
/**
 * NOTIFICATION PROCESSOR
 * Purpose: Processes internal notification dispatch jobs.
 * Role: Provides an explicit async boundary for future dashboard, email, and push notification delivery.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { AuditService } from '../../audit/audit.service';
import { PLATFORM_QUEUES } from '../queue.constants';
import type { NotificationDispatchJob } from '../queue.types';

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<NotificationDispatchJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * FUNCTION: onModuleInit
   * Inputs: none.
   * Outputs: started BullMQ worker.
   * Functionality: Processes notification dispatch requests and records dispatch audit metadata until persistent notifications are introduced.
   * External calls: AuditService.record(input) appends notification dispatch evidence to the immutable operational history.
   */
  onModuleInit(): void {
    const connection = new IORedis(this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<NotificationDispatchJob>(
      PLATFORM_QUEUES.notification,
      async (job: Job<NotificationDispatchJob>) => {
        if (job.data.kind !== 'notification.dispatch') {
          throw new Error(`Unsupported notification job kind: ${job.data.kind}`);
        }

        await this.auditService.record({
          organizationId: job.data.payload.organizationId,
          actorType: 'SYSTEM',
          action: 'notification_dispatched',
          newState: 'DISPATCHED',
          metadata: { ...job.data.payload, jobId: job.id },
        });

        return { dispatched: true };
      },
      { connection, concurrency: 5 },
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
