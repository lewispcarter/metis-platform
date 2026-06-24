// @ts-nocheck
/**
 * TEST SUITE: Escalation Policy
 * Purpose: Validates deterministic timer escalation thresholds for unresolved operational events.
 * Scope: Initial v1 policy logic before database-backed custom policies exist.
 * Dependencies: Jest.
 */
import { evaluateEscalationPolicy } from './escalation-policy';

describe('Escalation Policy - timer decisions', () => {
  test('should_escalate_when_s1_event_exceeds_five_minutes', () => {
    const result = evaluateEscalationPolicy({
      priority: 'HIGH',
      severity: 'S1_CRITICAL',
      ageMinutes: 5,
      escalationLevel: 0,
    });

    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toBe('S1_TIMER_BREACH');
  });

  test('should_schedule_recheck_when_event_has_not_reached_threshold', () => {
    const result = evaluateEscalationPolicy({
      priority: 'NORMAL',
      severity: 'S3_MEDIUM',
      ageMinutes: 2,
      escalationLevel: 0,
    });

    expect(result.shouldEscalate).toBe(false);
    expect(result.nextCheckDelayMs).toBe(300000);
  });
});
