// @ts-nocheck
/**
 * ROOT APPLICATION MODULE
 * Purpose: Composes the backend's bounded modules into a single deployable modular monolith.
 * Role: Maintains explicit service boundaries while applying global auth, tenant scoping, and operational infrastructure modules.
 */
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.schema';
import { HealthController } from './shared/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { QueueProcessorsModule } from './queue/queue-processors.module';
import { EventBusModule } from './event-bus/event-bus.module';
import { IdentityModule } from './identity/identity.module';
import { AuthContextMiddleware } from './identity/middleware/auth-context.middleware';
import { TenantScopeMiddleware } from './identity/middleware/tenant-scope.middleware';
import { EventModule } from './event/event.module';
import { AuditModule } from './audit/audit.module';
import { OrganizationModule } from './organization/organization.module';
import { CommunicationModule } from './communication/communication.module';
import { AssignmentModule } from './assignment/assignment.module';
import { PersonnelModule } from './personnel/personnel.module';
import { WorkflowModule } from './workflow/workflow.module';
import { EscalationModule } from './escalation/escalation.module';
import { AcknowledgmentModule } from './acknowledgment/acknowledgment.module';
import { DemoDataModule } from './demo/demo-data.module';
import { ReadinessModule } from './readiness/readiness.module';
import { UserModule } from './user/user.module';
import { ActivityModule } from './activity/activity.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    QueueModule,
    EventBusModule,
    IdentityModule,
    OrganizationModule,
    AuditModule,
    EventModule,
    CommunicationModule,
    AssignmentModule,
    PersonnelModule,
    WorkflowModule,
    EscalationModule,
    AcknowledgmentModule,
    QueueProcessorsModule,
    DemoDataModule,
    ReadinessModule,
    UserModule,
    ActivityModule,
    SettingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  /**
   * FUNCTION: configure
   * Inputs: middleware consumer.
   * Outputs: void.
   * Functionality: Applies auth context and tenant scope middleware to protected operational API routes.
   * External calls: MiddlewareConsumer.apply wires Nest middleware into the HTTP request pipeline.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthContextMiddleware, TenantScopeMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'readiness', method: RequestMethod.GET },
        { path: 'demo/seed', method: RequestMethod.POST },
        { path: 'webhooks/twilio/sms', method: RequestMethod.POST },
        { path: 'webhooks/twilio/voice', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
