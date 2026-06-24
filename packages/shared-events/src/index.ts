/**
 * SHARED EVENTS PACKAGE
 * Purpose: Defines canonical internal domain event names.
 * Role: Keeps event-driven modules aligned on stable contracts.
 */
export const DomainEvents = {
  OperationalEventCreated: 'operational_event.created',
  OperationalEventAssigned: 'operational_event.assigned',
  OperationalEventAcknowledged: 'operational_event.acknowledged',
  OperationalEventEscalated: 'operational_event.escalated',
  OperationalEventResolved: 'operational_event.resolved',
  WorkflowStarted: 'workflow.started',
  WorkflowCompleted: 'workflow.completed',
  WorkflowFailed: 'workflow.failed',
  WorkflowStatusChanged: 'workflow.status_changed',
  CommunicationSent: 'communication.sent',
  CommunicationFailed: 'communication.failed',
  CommunicationDelivered: 'communication.delivered',
  CommunicationReceived: 'communication.received',
  AssignmentAccepted: 'assignment.accepted',
  AssignmentRejected: 'assignment.rejected',
} as const;

export type DomainEventName = (typeof DomainEvents)[keyof typeof DomainEvents];
