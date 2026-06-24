// @ts-nocheck
/**
 * SWAGGER CONFIGURATION
 * Purpose: Builds OpenAPI documentation for the operational coordination API.
 * Role: Provides a stable API contract for operators, integrators, and future government/enterprise review.
 */
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * FUNCTION: configureSwagger
 * Inputs: booted Nest application instance.
 * Outputs: void after mounting Swagger UI and OpenAPI JSON endpoints.
 * Functionality: Configures versioned API documentation at /api/docs using bearer authentication and operational platform metadata.
 * External calls: SwaggerModule.createDocument(app, config) inspects controllers/DTOs and generates the OpenAPI document; SwaggerModule.setup mounts the UI route.
 */
export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Metis Operational Coordination API')
    .setDescription('API contract for event-driven operational coordination, workflow orchestration, personnel assignment, communications, escalation, and audit infrastructure.')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Clerk-issued JWT containing organization and role claims.',
      },
      'clerk-bearer',
    )
    .addTag('events', 'Operational event lifecycle management')
    .addTag('workflows', 'Workflow execution and orchestration')
    .addTag('personnel', 'Personnel and availability coordination')
    .addTag('assignments', 'Coverage and assignment management')
    .addTag('communications', 'Voice/SMS/email communication tracking')
    .addTag('audit', 'Immutable operational history')
    .addTag('readiness', 'Production readiness checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}
