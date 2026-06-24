// @ts-nocheck
/**
 * COMMUNICATION PROCESSOR
 * Purpose: Processes asynchronous outbound communication delivery jobs.
 * Role: Converts queued communication intent into persisted communication records while preserving retry/failure behavior in BullMQ.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { CommunicationService } from '../../communication/communication.service';
import { PLATFORM_QUEUES } from '../queue.constants';
import type { CommunicationSendJob } from '../queue.types';

@Injectable()
export class CommunicationProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<CommunicationSendJob>;

  constructor(
    private readonly configService: ConfigService,
    private readonly communicationService: CommunicationService,
  ) {}

  /**
   * FUNCTION: onModuleInit
   * Inputs: none.
   * Outputs: started BullMQ worker.
   * Functionality: Starts the Redis-backed communication processor when the API process boots.
   * External calls: Worker(queueName,processor,opts) subscribes to BullMQ jobs; CommunicationService.send(input) persists outbound communication/audit/event data.
   */
  onModuleInit(): void {
    const connection = new IORedis(this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<CommunicationSendJob>(
      PLATFORM_QUEUES.communication,
      async (job: Job<CommunicationSendJob>) => {
        if (job.data.kind !== 'communication.send') {
          throw new Error(`Unsupported communication job kind: ${job.data.kind}`);
        }

        return this.communicationService.deliverQueued(job.data.payload);
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
