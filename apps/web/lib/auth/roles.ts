export type MetisRole =
  | 'ADMIN'
  | 'COMMAND'
  | 'SUPERVISOR'
  | 'OPERATOR'
  | 'VIEWER';

export type Permission =
  | '*'
  | 'dashboard:read'
  | 'events:read'
  | 'events:write'
  | 'personnel:read'
  | 'personnel:write'
  | 'communications:read'
  | 'communications:write'
  | 'intelligence:read'
  | 'deployment:read'
  | 'database:read'
  | 'auth:read';

export const rolePermissions: Record<MetisRole, Permission[]> = {
  ADMIN: ['*'],
  COMMAND: [
    'dashboard:read',
    'events:read',
    'events:write',
    'personnel:read',
    'personnel:write',
    'communications:read',
    'communications:write',
    'intelligence:read',
    'deployment:read',
    'database:read',
    'auth:read',
  ],
  SUPERVISOR: [
    'dashboard:read',
    'events:read',
    'events:write',
    'personnel:read',
    'communications:read',
    'communications:write',
    'intelligence:read',
  ],
  OPERATOR: [
    'dashboard:read',
    'events:read',
    'events:write',
    'communications:read',
    'communications:write',
  ],
  VIEWER: [
    'dashboard:read',
    'events:read',
    'personnel:read',
    'communications:read',
    'intelligence:read',
  ],
};

export function hasPermission(role: MetisRole, permission: Permission) {
  const permissions = rolePermissions[role] ?? [];
  return permissions.includes('*') || permissions.includes(permission);
}
