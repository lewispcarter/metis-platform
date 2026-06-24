// @ts-nocheck
/**
 * ============================================================================
 * TEST SUITE: Workflow State Machine
 * ============================================================================
 *
 * MODULE UNDER TEST: workflow-state-machine
 * TEST TYPE: Unit
 * FRAMEWORK: Jest
 *
 * AUTHOR: Metis Platform Engineering
 * CREATED: 2026-06-10
 * LAST MODIFIED: 2026-06-10
 * VERSION: 0.1.0
 *
 * DESCRIPTION:
 * Validates deterministic workflow run and workflow task lifecycle rules.
 *
 * DEPENDENCIES:
 * - Jest: test runner
 *
 * COVERAGE SCOPE:
 * ✓ Valid run transitions
 * ✓ Invalid run transitions
 * ✓ Valid task transitions
 * ✓ Invalid task transitions
 *
 * EXECUTION REQUIREMENTS:
 * - Environment: test
 * - Runtime: under 10ms per unit test target
 * ============================================================================
 */
import { assertWorkflowRunTransition, assertWorkflowTaskTransition } from './workflow-state-machine';

describe('Workflow State Machine - run transitions', () => {
  test('should_allow_run_to_complete_when_current_status_is_running', () => {
    // ARRANGE: Running workflow can complete.
    const current = 'RUNNING';
    const next = 'COMPLETED';

    // ACT / ASSERT: No exception means transition is allowed.
    expect(() => assertWorkflowRunTransition(current, next)).not.toThrow();
  });

  test('should_reject_run_reactivation_when_current_status_is_completed', () => {
    // ARRANGE: Completed workflow is terminal.
    const current = 'COMPLETED';
    const next = 'RUNNING';

    // ACT / ASSERT: Terminal run cannot be restarted.
    expect(() => assertWorkflowRunTransition(current, next)).toThrow('Invalid workflow run transition');
  });
});

describe('Workflow State Machine - task transitions', () => {
  test('should_allow_task_to_complete_when_current_status_is_running', () => {
    // ARRANGE: Running task can complete.
    const current = 'RUNNING';
    const next = 'COMPLETED';

    // ACT / ASSERT: No exception means transition is allowed.
    expect(() => assertWorkflowTaskTransition(current, next)).not.toThrow();
  });

  test('should_reject_task_reopen_when_current_status_is_completed', () => {
    // ARRANGE: Completed task is terminal.
    const current = 'COMPLETED';
    const next = 'RUNNING';

    // ACT / ASSERT: Terminal task cannot be mutated back to running.
    expect(() => assertWorkflowTaskTransition(current, next)).toThrow('Invalid workflow task transition');
  });
});
