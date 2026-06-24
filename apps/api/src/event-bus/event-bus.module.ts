// @ts-nocheck
/**
 * EVENT BUS MODULE
 * Purpose: Exposes internal domain event publishing/subscription capability.
 * Role: Supports event-driven internals without introducing distributed systems complexity in v1.
 */
import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';

@Global()
@Module({
  providers: [EventBusService],
  exports: [EventBusService],
})
export class EventBusModule {}
