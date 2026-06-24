// @ts-nocheck
/**
 * ACTIVITY MODULE
 * Purpose: Composes operator-visible activity feed services and controllers.
 * Role: Keeps product activity surfaces separated from raw compliance audit storage.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [AuditModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
