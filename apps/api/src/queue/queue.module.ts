// @ts-nocheck
/**
 * QUEUE MODULE
 * Purpose: Establishes Redis/BullMQ queue infrastructure for asynchronous operational work.
 * Role: Keeps long-running workflows, communications, retries, escalations, and analytics outside synchronous HTTP requests.
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PLATFORM_QUEUES } from './queue.constants';

const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new IORedis(configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
          maxRetriesPerRequest: null,
        }),
    },
    ...Object.values(PLATFORM_QUEUES).map((queueName) => ({
      provide: queueName,
      inject: [REDIS_CONNECTION],
      useFactory: (connection: IORedis) => new Queue(queueName, { connection }),
    })),
  ],
  exports: [REDIS_CONNECTION, ...Object.values(PLATFORM_QUEUES)],
})
export class QueueModule {}
