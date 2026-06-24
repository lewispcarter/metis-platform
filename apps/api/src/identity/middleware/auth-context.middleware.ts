// @ts-nocheck
/**
 * AUTH CONTEXT MIDDLEWARE
 * Purpose: Resolves authenticated actor context before protected request handlers run.
 * Role: Places normalized auth context on the request so tenant scoping and RBAC can operate consistently.
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { AuthBoundaryService } from '../auth-boundary.service';
import type { RequestWithAuthContext } from '../auth-context.types';

@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(private readonly authBoundaryService: AuthBoundaryService) {}

  /**
   * FUNCTION: use
   * Inputs: HTTP request, response, next callback.
   * Outputs: Promise<void> after auth context is attached or error is thrown.
   * Functionality: Resolves actor identity from Clerk bearer tokens or development headers and stores it on the request.
   * External calls: AuthBoundaryService.resolveActor(req) normalizes provider-specific auth material into platform auth context.
   */
  async use(req: RequestWithAuthContext, _res: Response, next: NextFunction): Promise<void> {
    const actor = await this.authBoundaryService.resolveActor(req);
    req.auth = actor;
    req.user = actor;
    req.tenant = { organizationId: actor.organizationId };
    next();
  }
}
