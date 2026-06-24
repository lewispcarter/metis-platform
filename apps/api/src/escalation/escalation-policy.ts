// @ts-nocheck
/**
 * ESCALATION POLICY
 * Purpose: Defines deterministic timer thresholds for unresolved operational events.
 * Role: Keeps escalation timing transparent, auditable, and configurable before advanced workflow-builder policy storage exists.
 */
import type { OperationalEventPriority, OperationalEventSeverity } from '../event/event.types';

export type EscalationPolicyDecision = {
  shouldEscalate: boolean;
  level: number;
  reason?: string;
  nextCheckDelayMs?: number;
};

export type EscalationPolicyInput = {
  priority: OperationalEventPriority;
  severity: OperationalEventSeverity;
  ageMinutes: number;
  escalationLevel: number;
  acknowledgmentStatus?: string;
  communicationFailures?: boolean;
};

const MINUTE_MS = 60000;

/**
 * FUNCTION: evaluateEscalationPolicy
 * Inputs: priority, severity, event age, current escalation level, acknowledgment/communication context.
 * Outputs: deterministic escalation policy decision.
 * Functionality: Encodes initial v1 timer policy for unresolved operational events while leaving room for database-backed policies later.
 */
export function evaluateEscalationPolicy(input: EscalationPolicyInput): EscalationPolicyDecision {
  if (input.acknowledgmentStatus === 'TIMED_OUT') {
    return { shouldEscalate: true, level: input.escalationLevel + 1 || 1, reason: 'ACKNOWLEDGMENT_TIMEOUT' };
  }

  if (input.communicationFailures) {
    return { shouldEscalate: true, level: input.escalationLevel + 1 || 1, reason: 'COMMUNICATION_FAILURE' };
  }

  if (input.severity === 'S1_CRITICAL' && input.ageMinutes >= 5) {
    return { shouldEscalate: true, level: input.escalationLevel + 1 || 1, reason: 'S1_TIMER_BREACH' };
  }

  if ((input.priority === 'CRITICAL' || input.priority === 'URGENT') && input.ageMinutes >= 10) {
    return { shouldEscalate: true, level: input.escalationLevel + 1 || 1, reason: 'URGENT_TIMER_BREACH' };
  }

  if (input.ageMinutes >= 20 && input.escalationLevel === 0) {
    return { shouldEscalate: true, level: 1, reason: 'UNRESOLVED_EVENT_TIMER_BREACH' };
  }

  return { shouldEscalate: false, nextCheckDelayMs: 5 * MINUTE_MS };
}
