// @ts-nocheck
/**
 * ASSIGNMENT MODULE
 * Purpose: Registers assignment and coverage request controllers and services.
 * Role: Encapsulates explicit operational ownership and coverage fulfillment behavior.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EventModule } from '../event/event.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';

@Module({
  imports: [PrismaModule, AuditModule, EventBusModule, EventModule],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
