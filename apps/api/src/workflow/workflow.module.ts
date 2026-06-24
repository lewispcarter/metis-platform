// @ts-nocheck
/**
 * WORKFLOW MODULE
 * Purpose: Registers workflow orchestration controllers and services.
 * Role: Encapsulates workflow run lifecycle behavior inside the modular monolith.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EventModule } from '../event/event.module';
import { AssignmentModule } from '../assignment/assignment.module';
import { CommunicationModule } from '../communication/communication.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PersonnelModule } from '../personnel/personnel.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { CoverageWorkflowService } from './coverage-workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [PrismaModule, AuditModule, EventModule, EventBusModule, PersonnelModule, AssignmentModule, CommunicationModule, QueueModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, CoverageWorkflowService],
  exports: [WorkflowService, CoverageWorkflowService],
})
export class WorkflowModule {}
