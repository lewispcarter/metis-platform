/**
 * PRODUCTION READINESS CHECK SCRIPT
 * Purpose: Performs static readiness validation before deployment.
 * Role: Gives CI/CD a fast failure point before application containers are released.
 */
import { environmentSchema } from '../src/config/environment.schema';

/**
 * FUNCTION: main
 * Inputs: process.env.
 * Outputs: process exit code.
 * Functionality: Validates required environment variables and prints deployment safety status.
 */
function main(): void {
  const parsed = environmentSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Production readiness check failed.');
    console.error(parsed.error.format());
    process.exit(1);
  }

  console.log('Production readiness check passed.');
}

main();
