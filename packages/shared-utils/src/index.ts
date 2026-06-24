/**
 * SHARED UTILS PACKAGE
 * Purpose: Provides safe, reusable utility functions for the monorepo.
 * Role: Keeps low-level helper logic centralized and testable.
 */

/**
 * FUNCTION: assertNever
 * Inputs: unreachable value.
 * Outputs: never; throws when reached.
 * Functionality: Enforces exhaustive switch handling in TypeScript.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
