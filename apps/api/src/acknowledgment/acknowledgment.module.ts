// @ts-nocheck
/**
 * ACKNOWLEDGMENT MODULE
 * Purpose: Registers acknowledgment persistence, controller, and service boundaries.
 * Role: Makes acknowledgment tracking a first-class operational primitive.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EventModule } from '../event/event.module';
import { EventBusModule } from '../event-bus/event-bus.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AcknowledgmentController } from './acknowledgment.controller';
import { AcknowledgmentService } from './acknowledgment.service';

@Module({
  imports: [PrismaModule, AuditModule, EventBusModule, EventModule],
  controllers: [AcknowledgmentController],
  providers: [AcknowledgmentService],
  exports: [AcknowledgmentService],
})
export class AcknowledgmentModule {}
