import { MetisRole, Permission, hasPermission } from './roles';

export const protectedRoutes: Array<{
  path: string;
  permission: Permission;
}> = [
  { path: '/', permission: 'dashboard:read' },
  { path: '/events', permission: 'events:read' },
  { path: '/personnel', permission: 'personnel:read' },
  { path: '/communications', permission: 'communications:read' },
  { path: '/intelligence', permission: 'intelligence:read' },
  { path: '/deployment', permission: 'deployment:read' },
  { path: '/database', permission: 'database:read' },
  { path: '/auth', permission: 'auth:read' },
];

export function canAccessRoute(role: MetisRole, path: string) {
  const policy = protectedRoutes.find((route) =>
    path === route.path || path.startsWith(`${route.path}/`),
  );

  if (!policy) return true;
  return hasPermission(role, policy.permission);
}
