// @ts-nocheck
/**
 * CURRENT ACTOR DECORATOR
 * Purpose: Gives controllers typed access to the authenticated platform actor.
 * Role: Supports audit attribution, ownership decisions, and operator-visible activity without leaking provider-specific auth details.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedActor, RequestWithAuthContext } from '../auth-context.types';

/**
 * FUNCTION: CurrentActor
 * Inputs: NestJS execution context.
 * Outputs: authenticated actor context.
 * Functionality: Reads normalized auth context created by AuthContextMiddleware.
 */
export const CurrentActor = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedActor | undefined => {
  const request = context.switchToHttp().getRequest<RequestWithAuthContext>();
  return request.user ?? request.auth;
});
