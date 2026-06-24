// @ts-nocheck
/**
 * ROLE TYPES
 * Purpose: Defines platform roles and permissions used by the RBAC authorization scaffold.
 * Role: Establishes the security vocabulary that all protected endpoints will use.
 */
export type PlatformRole =
  | 'Owner'
  | 'Admin'
  | 'OperationsManager'
  | 'Supervisor'
  | 'Operator'
  | 'StaffMember'
  | 'Auditor';

export type PlatformPermission =
  | 'organization:manage'
  | 'event:read'
  | 'event:create'
  | 'event:update'
  | 'workflow:read'
  | 'workflow:manage'
  | 'workflow:create'
  | 'workflow:update'
  | 'personnel:read'
  | 'personnel:manage'
  | 'personnel:create'
  | 'personnel:update'
  | 'assignment:manage'
  | 'assignment:read'
  | 'assignment:create'
  | 'assignment:update'
  | 'communication:send'
  | 'communication:create'
  | 'communication:read'
  | 'communication:update'
  | 'escalation:read'
  | 'escalation:create'
  | 'escalation:update'
  | 'acknowledgment:read'
  | 'acknowledgment:create'
  | 'acknowledgment:update'
  | 'audit:read'
  | 'admin:manage'
  | 'settings:read'
  | 'settings:manage'
  | 'demo:seed';

const OPERATIONAL_PERMISSIONS: PlatformPermission[] = [
  'event:read',
  'event:create',
  'event:update',
  'workflow:read',
  'workflow:manage',
  'workflow:create',
  'workflow:update',
  'personnel:read',
  'personnel:manage',
  'personnel:create',
  'personnel:update',
  'assignment:manage',
  'assignment:read',
  'assignment:create',
  'assignment:update',
  'communication:send',
  'communication:create',
  'communication:read',
  'communication:update',
  'escalation:read',
  'escalation:create',
  'escalation:update',
  'acknowledgment:read',
  'acknowledgment:create',
  'acknowledgment:update',
  'audit:read',
  'settings:read',
];

export const ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermission[]> = {
  Owner: ['organization:manage', 'admin:manage', 'settings:manage', 'demo:seed', ...OPERATIONAL_PERMISSIONS],
  Admin: ['admin:manage', 'settings:manage', 'demo:seed', ...OPERATIONAL_PERMISSIONS],
  OperationsManager: OPERATIONAL_PERMISSIONS,
  Supervisor: [
    'event:read',
    'event:create',
    'event:update',
    'workflow:read',
    'workflow:create',
    'workflow:update',
    'personnel:read',
    'personnel:update',
    'assignment:read',
    'assignment:create',
    'assignment:update',
    'communication:send',
    'communication:create',
    'communication:read',
    'communication:update',
    'escalation:read',
    'escalation:create',
    'escalation:update',
    'acknowledgment:read',
    'acknowledgment:create',
    'acknowledgment:update',
  ],
  Operator: ['event:read', 'event:create', 'event:update', 'workflow:read', 'personnel:read', 'assignment:read', 'communication:send', 'communication:create', 'communication:read', 'acknowledgment:create', 'acknowledgment:read'],
  StaffMember: ['event:read', 'assignment:read', 'acknowledgment:create'],
  Auditor: ['event:read', 'workflow:read', 'audit:read'],
};


/**
 * FUNCTION: isPlatformRole
 * Inputs: unknown role value.
 * Outputs: boolean indicating whether the value is a supported platform role.
 * Functionality: Runtime validator for auth boundary role claims.
 */
export function isPlatformRole(role: unknown): role is PlatformRole {
  return typeof role === 'string' && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role);
}
