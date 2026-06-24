// @ts-nocheck
/**
 * CURRENT TENANT DECORATOR
 * Purpose: Gives controllers typed access to the authenticated organization scope.
 * Role: Removes tenant lookup boilerplate while preserving strict multi-tenant boundaries.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithAuthContext } from '../auth-context.types';

/**
 * FUNCTION: CurrentTenant
 * Inputs: NestJS execution context.
 * Outputs: authenticated organization id.
 * Functionality: Reads tenant context created by AuthContextMiddleware and TenantScopeMiddleware.
 */
export const CurrentTenant = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const request = context.switchToHttp().getRequest<RequestWithAuthContext>();
  return request.tenant?.organizationId ?? '';
});
