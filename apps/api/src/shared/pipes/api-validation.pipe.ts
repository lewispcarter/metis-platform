// @ts-nocheck
/**
 * API VALIDATION PIPE
 * Purpose: Centralizes HTTP request validation defaults for the platform API.
 * Role: Provides a named validation boundary so production hardening can evolve without scattering validation behavior across controllers.
 */
import { BadRequestException, Injectable, ValidationPipe } from '@nestjs/common';

@Injectable()
export class ApiValidationPipe extends ValidationPipe {
  /**
   * FUNCTION: constructor
   * Inputs: none.
   * Outputs: configured validation pipe instance.
   * Functionality: Enables strict whitelist validation, transformation, and actionable validation errors.
   */
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Request validation failed.',
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints ?? {},
          })),
        }),
    });
  }
}
