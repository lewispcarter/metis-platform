// @ts-nocheck
/**
 * PERMISSIONS DECORATOR
 * Purpose: Attaches required RBAC permissions to route handlers and controllers.
 * Role: Allows guards to enforce authorization without hardcoding security checks inside business logic.
 */
import { SetMetadata } from '@nestjs/common';
import type { PlatformPermission } from '../types/role.types';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

/**
 * FUNCTION: RequirePermissions
 * Inputs: one or more platform permissions.
 * Outputs: NestJS metadata decorator.
 * Functionality: Marks a route/controller with permissions that the RBAC guard must enforce.
 */
export const RequirePermissions = (...permissions: PlatformPermission[]) => SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
