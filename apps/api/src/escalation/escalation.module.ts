// @ts-nocheck
/**
 * ESCALATION MODULE
 * Purpose: Registers escalation policy, persistence, queue, and controller surfaces.
 * Role: Encapsulates escalation behavior so workflows do not implement ad hoc timeout logic.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EventModule } from '../event/event.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { EscalationController } from './escalation.controller';
import { EscalationService } from './escalation.service';

@Module({
  imports: [PrismaModule, AuditModule, EventBusModule, EventModule, QueueModule],
  controllers: [EscalationController],
  providers: [EscalationService],
  exports: [EscalationService],
})
export class EscalationModule {}
