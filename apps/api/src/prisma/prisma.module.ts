// @ts-nocheck
/**
 * PRISMA MODULE
 * Purpose: Exposes PrismaService as a global infrastructure dependency.
 * Role: Lets domain modules use database persistence without creating duplicate Prisma clients.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
