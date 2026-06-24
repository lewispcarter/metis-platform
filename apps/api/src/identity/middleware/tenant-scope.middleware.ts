// @ts-nocheck
/**
 * TENANT SCOPE MIDDLEWARE
 * Purpose: Enforces organization isolation at the HTTP boundary.
 * Role: Prevents callers from crossing tenant boundaries through query/body organization_id spoofing.
 */
import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { RequestWithAuthContext } from '../auth-context.types';

/**
 * FUNCTION: getOrganizationFromBody
 * Inputs: request body object.
 * Outputs: organization id when supplied in camelCase or snake_case form.
 * Functionality: Supports current DTO naming while preparing for database naming conventions.
 */
function getOrganizationFromBody(body?: Record<string, unknown>): string | undefined {
  if (!body) return undefined;
  const value = body.organizationId ?? body.organization_id;
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class TenantScopeMiddleware implements NestMiddleware {
  /**
   * FUNCTION: use
   * Inputs: HTTP request, response, and next middleware callback.
   * Outputs: invokes next callback when tenant scope is valid.
   * Functionality: Rejects requests where supplied organizationId conflicts with authenticated tenant context.
   */
  use(request: RequestWithAuthContext, _response: Response, next: NextFunction): void {
    const tenantOrganizationId = request.tenant?.organizationId;
    if (!tenantOrganizationId) {
      throw new BadRequestException('Tenant context missing from request.');
    }

    const query = request.query as Record<string, unknown>;
    const body = request.body as Record<string, unknown> | undefined;
    const queryOrganizationId = typeof query.organizationId === 'string' ? query.organizationId : undefined;
    const bodyOrganizationId = getOrganizationFromBody(body);

    if (queryOrganizationId && queryOrganizationId !== tenantOrganizationId) {
      throw new BadRequestException('Query organizationId does not match authenticated tenant.');
    }

    if (bodyOrganizationId && bodyOrganizationId !== tenantOrganizationId) {
      throw new BadRequestException('Body organizationId does not match authenticated tenant.');
    }

    if (!queryOrganizationId) {
      query.organizationId = tenantOrganizationId;
    }

    if (body && !bodyOrganizationId) {
      body.organizationId = tenantOrganizationId;
    }

    next();
  }
}
