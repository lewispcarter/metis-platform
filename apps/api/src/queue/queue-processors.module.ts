// @ts-nocheck
/**
 * QUEUE PROCESSORS MODULE
 * Purpose: Registers BullMQ workers that execute asynchronous operational jobs.
 * Role: Keeps queue worker lifecycle separate from queue client creation while preserving bounded service dependencies.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { CommunicationModule } from '../communication/communication.module';
import { EscalationModule } from '../escalation/escalation.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { CommunicationProcessor } from './processors/communication.processor';
import { EscalationProcessor } from './processors/escalation.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { WorkflowProcessor } from './processors/workflow.processor';

@Module({
  imports: [ConfigModule, AuditModule, CommunicationModule, WorkflowModule, EscalationModule],
  providers: [CommunicationProcessor, WorkflowProcessor, EscalationProcessor, NotificationProcessor],
})
export class QueueProcessorsModule {}
