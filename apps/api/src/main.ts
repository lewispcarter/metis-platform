// @ts-nocheck
/**
 * API ENTRYPOINT
 * Purpose: Boots the NestJS modular monolith that powers the operational coordination platform.
 * Role: Configures validation, API prefixing, OpenAPI documentation, and HTTP server lifecycle for the backend service.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiValidationPipe } from './shared/pipes/api-validation.pipe';
import { configureSwagger } from './shared/swagger/swagger.config';

/**
 * FUNCTION: bootstrap
 * Inputs: none.
 * Outputs: Promise<void> once the HTTP server is listening.
 * Functionality: Creates and starts the NestJS application with global API settings and documentation endpoints.
 * External calls: configureSwagger(app) mounts OpenAPI documentation at /api/docs for contract visibility.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ApiValidationPipe());
  configureSwagger(app);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}

void bootstrap();
