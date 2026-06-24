// @ts-nocheck
/**
 * AUDIT MODULE
 * Purpose: Owns append-only operational audit logging for platform-critical state changes.
 * Role: Provides immutable history contracts used by event, workflow, assignment, and communications modules.
 */
import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
