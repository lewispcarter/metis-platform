// @ts-nocheck
/**
 * DEMO DATA MODULE
 * Purpose: Packages deterministic local seed utilities for the operational coverage workflow.
 * Role: Keeps demo and validation concerns isolated from production domain modules.
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DemoDataController } from './demo-data.controller';
import { DemoDataService } from './demo-data.service';

@Module({
  imports: [PrismaModule],
  controllers: [DemoDataController],
  providers: [DemoDataService],
  exports: [DemoDataService],
})
export class DemoDataModule {}
