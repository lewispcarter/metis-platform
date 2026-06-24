// @ts-nocheck
/**
 * CLERK AUTH PROVIDER
 * Purpose: Isolates Clerk-specific token verification from the rest of the platform.
 * Role: Converts Clerk session tokens into normalized provider identity claims without leaking Clerk SDK details into controllers or domain modules.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import type { EnvironmentVariables } from '../../config/environment.schema';

export type ClerkIdentityClaims = {
  providerUserId: string;
  organizationId?: string;
  role?: string;
  permissions?: string[];
  email?: string;
  displayName?: string;
};

/**
 * FUNCTION: readStringClaim
 * Inputs: decoded token payload and claim key.
 * Outputs: string claim value or undefined.
 * Functionality: Safely reads arbitrary Clerk public/private metadata claims from a decoded token payload.
 */
function readStringClaim(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/**
 * FUNCTION: readStringArrayClaim
 * Inputs: decoded token payload and claim key.
 * Outputs: string array claim value.
 * Functionality: Safely normalizes permission claim arrays while dropping non-string entries.
 */
function readStringArrayClaim(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

@Injectable()
export class ClerkAuthProvider {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  /**
   * FUNCTION: verifyBearerToken
   * Inputs: Authorization bearer token from an HTTP request.
   * Outputs: normalized Clerk identity claims.
   * Functionality: Verifies Clerk JWT signature using CLERK_SECRET_KEY and extracts platform-specific identity claims.
   * External calls: verifyToken(token, { secretKey }) verifies the bearer token against Clerk's signing configuration and returns decoded claims.
   */
  async verifyBearerToken(token: string): Promise<ClerkIdentityClaims> {
    const secretKey = this.configService.get('CLERK_SECRET_KEY', { infer: true });

    if (!secretKey) {
      throw new UnauthorizedException('Clerk authentication is not configured. Set CLERK_SECRET_KEY or use development auth headers locally.');
    }

    try {
      const payload = (await verifyToken(token, { secretKey })) as Record<string, unknown>;
      const providerUserId = readStringClaim(payload, 'sub');

      if (!providerUserId) {
        throw new UnauthorizedException('Clerk token did not include a subject claim.');
      }

      return {
        providerUserId,
        organizationId: readStringClaim(payload, 'org_id') ?? readStringClaim(payload, 'organization_id'),
        role: readStringClaim(payload, 'role') ?? readStringClaim(payload, 'org_role'),
        permissions: readStringArrayClaim(payload, 'permissions'),
        email: readStringClaim(payload, 'email') ?? readStringClaim(payload, 'email_address'),
        displayName: readStringClaim(payload, 'name') ?? readStringClaim(payload, 'full_name'),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Clerk bearer token.');
    }
  }
}
