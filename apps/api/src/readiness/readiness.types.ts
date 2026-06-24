// @ts-nocheck
/**
 * READINESS TYPES
 * Purpose: Defines operational readiness check result contracts.
 * Role: Gives operators and deployment systems a deterministic health contract.
 */
export type ReadinessCheckStatus = 'PASS' | 'WARN' | 'FAIL';

export type ReadinessCheck = {
  name: string;
  status: ReadinessCheckStatus;
  message: string;
};

export type ReadinessReport = {
  status: ReadinessCheckStatus;
  generatedAt: string;
  checks: ReadinessCheck[];
};
