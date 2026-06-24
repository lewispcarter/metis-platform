import { MetisRole, hasPermission, Permission } from './roles';

export type MetisUser = {
  userId: string;
  displayName: string;
  email: string;
  role: MetisRole;
  organizationId: string;
  organizationName: string;
};

export function getDemoUser(): MetisUser {
  return {
    userId: 'demo-admin',
    displayName: 'Metis Administrator',
    email: 'admin@metissystems.local',
    role: 'ADMIN',
    organizationId: 'org-metis-demo',
    organizationName: 'Metis Systems Demo Org',
  };
}

export function getSessionMode() {
  return process.env.NEXT_PUBLIC_AUTH_MODE || 'DEMO';
}

export function canCurrentUser(permission: Permission) {
  const user = getDemoUser();
  return hasPermission(user.role, permission);
}
