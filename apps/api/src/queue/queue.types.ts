// @ts-nocheck
/**
 * QUEUE TYPES
 * Purpose: Defines typed BullMQ job payloads for asynchronous operational infrastructure.
 * Role: Keeps worker/processors aligned with workflow, communication, escalation, and notification contracts.
 */
import type { SendCommunicationDto } from '../communication/dto/send-communication.dto';
import type { StartCoverageWorkflowDto } from '../workflow/dto/start-coverage-workflow.dto';

export type CommunicationSendJob = {
  kind: 'communication.send';
  payload: SendCommunicationDto;
};

export type WorkflowCoverageJob = {
  kind: 'workflow.coverage.start';
  payload: StartCoverageWorkflowDto;
};

export type EscalationCheckJob = {
  kind: 'escalation.check';
  payload: {
    organizationId: string;
    operationalEventId: string;
    reason: string;
    level: number;
  };
};

export type NotificationDispatchJob = {
  kind: 'notification.dispatch';
  payload: {
    organizationId: string;
    recipientUserId?: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  };
};
