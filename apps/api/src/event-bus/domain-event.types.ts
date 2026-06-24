// @ts-nocheck
/**
 * DOMAIN EVENT TYPES
 * Purpose: Defines the internal event contracts used by the modular monolith.
 * Role: Keeps modules decoupled by communicating operational facts instead of directly manipulating each other.
 */
export type DomainEventName =
  | 'operational_event.created'
  | 'operational_event.assigned'
  | 'operational_event.acknowledged'
  | 'operational_event.escalated'
  | 'operational_event.resolved'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'workflow.status_changed'
  | 'communication.sent'
  | 'communication.failed'
  | 'communication.delivered'
  | 'communication.received'
  | 'assignment.accepted'
  | 'assignment.rejected';

export type DomainEventPayload = {
  organizationId: string;
  eventId?: string;
  workflowRunId?: string;
  correlationId: string;
  occurredAt: string;
  data: Record<string, unknown>;
};

export type DomainEvent = {
  name: DomainEventName;
  payload: DomainEventPayload;
};

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;
