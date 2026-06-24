// @ts-nocheck
/**
 * DEMO DATA CONTROLLER
 * Purpose: Exposes a local development endpoint for creating the reference coverage workflow scenario.
 * Role: Gives operators and developers a no-manual-entry path to validate dashboard and API behavior.
 */
import { Controller, Post } from '@nestjs/common';
import { RequirePermissions } from '../identity/decorators/permissions.decorator';
import { DemoDataService, DemoSeedResult } from './demo-data.service';

@Controller('demo')
export class DemoDataController {
  constructor(private readonly demoDataService: DemoDataService) {}

  /**
   * FUNCTION: seed
   * Inputs: none.
   * Outputs: deterministic demo scenario ids.
   * Functionality: Seeds the local database with a complete personnel coverage scenario.
   * External calls: DemoDataService.seedDemoCoverageScenario() writes tenant-scoped records for the reference workflow.
   */
  @Post('seed')
  @RequirePermissions('demo:seed')
  seed(): Promise<DemoSeedResult> {
    return this.demoDataService.seedDemoCoverageScenario();
  }
}
