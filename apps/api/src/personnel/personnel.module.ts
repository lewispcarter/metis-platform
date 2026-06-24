// @ts-nocheck
/**
 * PERSONNEL MODULE
 * Purpose: Registers workforce coordination services and controllers.
 * Role: Encapsulates personnel records, availability, and candidate discovery.
 */
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
