// @ts-nocheck
/**
 * EVENT BUS SERVICE
 * Purpose: Provides an in-process domain event bus for event-driven modular monolith communication.
 * Role: Allows modules to publish and subscribe to operational facts while preserving future service extractability.
 */
import { Injectable, Logger } from '@nestjs/common';
import type { DomainEvent, DomainEventHandler, DomainEventName } from './domain-event.types';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private readonly handlers = new Map<DomainEventName, DomainEventHandler[]>();

  /**
   * FUNCTION: publish
   * Inputs: domain event containing name and payload.
   * Outputs: Promise resolving after all registered handlers run.
   * Functionality: Publishes an internal domain event to all subscribers and logs handler failures.
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.name) ?? [];
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error(`Domain event handler failed for ${event.name}`, error instanceof Error ? error.stack : String(error));
        }
      }),
    );
  }

  /**
   * FUNCTION: subscribe
   * Inputs: event name and handler callback.
   * Outputs: unsubscribe function.
   * Functionality: Registers an internal handler for a domain event and returns a cleanup callback.
   */
  subscribe(name: DomainEventName, handler: DomainEventHandler): () => void {
    const handlers = this.handlers.get(name) ?? [];
    handlers.push(handler);
    this.handlers.set(name, handlers);

    return () => {
      const currentHandlers = this.handlers.get(name) ?? [];
      this.handlers.set(
        name,
        currentHandlers.filter((candidate) => candidate !== handler),
      );
    };
  }
}
