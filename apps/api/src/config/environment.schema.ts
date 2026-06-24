// @ts-nocheck
/**
 * ENVIRONMENT SCHEMA
 * Purpose: Validates process environment before the API boots.
 * Role: Fails fast when required infrastructure configuration is missing or malformed.
 */
import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WEBHOOK_ORGANIZATION_ID: z.string().uuid().optional(),
  TWILIO_WEBHOOK_SIGNATURE_BYPASS: z.enum(['true', 'false']).optional(),
  WEBHOOK_PUBLIC_BASE_URL: z.string().url().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AI_PROVIDER_API_KEY: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

/**
 * FUNCTION: validateEnvironment
 * Inputs: Raw environment object supplied by Nest ConfigModule.
 * Outputs: Strongly validated environment variables.
 * Functionality: Throws a clear startup error when required configuration is invalid.
 */
export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const parsed = environmentSchema.safeParse(config);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  return parsed.data;
}
