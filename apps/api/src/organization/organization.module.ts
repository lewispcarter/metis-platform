// @ts-nocheck
/**
 * ORGANIZATION MODULE
 * Purpose: Owns tenant organization records and tenant isolation boundaries.
 * Role: Foundation for multi-tenancy across all platform domains.
 */
import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
