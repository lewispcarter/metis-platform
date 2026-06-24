// @ts-nocheck
/**
 * QUEUE CONSTANTS
 * Purpose: Centralizes BullMQ queue names used by asynchronous operational workflows.
 * Role: Prevents string drift across workflow, communication, escalation, notification, and analytics jobs.
 */
export const PLATFORM_QUEUES = {
  communication: 'communication_queue',
  workflow: 'workflow_queue',
  escalation: 'escalation_queue',
  notification: 'notification_queue',
  analytics: 'analytics_queue',
} as const;

export type PlatformQueueName = (typeof PLATFORM_QUEUES)[keyof typeof PLATFORM_QUEUES];
