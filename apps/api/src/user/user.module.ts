// @ts-nocheck
/**
 * USER MODULE
 * Purpose: Owns database-backed platform user and organization membership visibility.
 * Role: Complements provider authentication by exposing the platform identity system used by RBAC and auditing.
 */
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
