/**
 * SHARED AUTH PACKAGE
 * Purpose: Defines authorization vocabulary shared by API and web applications.
 * Role: Establishes RBAC roles before full authorization implementation.
 */
export const Roles = {
  Owner: 'Owner',
  Admin: 'Admin',
  OperationsManager: 'OperationsManager',
  Supervisor: 'Supervisor',
  Operator: 'Operator',
  StaffMember: 'StaffMember',
  Auditor: 'Auditor',
} as const;

export type RoleName = (typeof Roles)[keyof typeof Roles];
