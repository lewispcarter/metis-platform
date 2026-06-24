// @ts-nocheck
/**
 * RBAC GUARD
 * Purpose: Enforces route-level role-based access control.
 * Role: Protects operational infrastructure endpoints through permission checks while remaining provider-agnostic for Clerk/Auth0 integration.
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { RequestWithAuthContext } from '../auth-context.types';
import type { PlatformPermission } from '../types/role.types';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * FUNCTION: canActivate
   * Inputs: NestJS execution context.
   * Outputs: boolean authorization decision.
   * Functionality: Compares required route permissions against the authenticated user's normalized effective permissions.
   * External calls: Reflector.getAllAndOverride reads route/controller metadata and returns required permissions.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PlatformPermission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();
    const effectivePermissions = new Set(request.user?.permissions ?? []);
    const allowed = requiredPermissions.every((permission) => effectivePermissions.has(permission));

    if (!allowed) {
      throw new ForbiddenException('Authenticated actor does not have the required platform permissions.');
    }

    return true;
  }
}
