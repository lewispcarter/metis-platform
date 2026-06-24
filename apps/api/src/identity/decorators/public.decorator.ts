// @ts-nocheck
/**
 * PUBLIC ROUTE DECORATOR
 * Purpose: Marks routes that intentionally bypass authentication and tenant middleware.
 * Role: Supports health/readiness endpoints without weakening protected operational APIs.
 */
import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE_KEY = 'isPublicRoute';

/**
 * FUNCTION: PublicRoute
 * Inputs: none.
 * Outputs: route metadata flag.
 * Functionality: Allows guards/middleware configuration to identify intentionally unauthenticated endpoints.
 */
export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
