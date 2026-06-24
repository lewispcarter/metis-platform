// @ts-nocheck
/**
 * ACTIVITY TYPES
 * Purpose: Defines operator-visible activity feed contracts.
 * Role: Gives supervisors and auditors a stable view over authenticated platform actions.
 */
export type OperatorActivityRecord = {
  activityId: string;
  organizationId: string;
  eventId?: string;
  actorId?: string;
  actorType: string;
  action: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};
