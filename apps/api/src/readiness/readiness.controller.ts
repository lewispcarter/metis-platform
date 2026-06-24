// @ts-nocheck
/**
 * READINESS CONTROLLER
 * Purpose: Exposes deployment readiness endpoints.
 * Role: Gives operators a deterministic API for pre-deployment and production checks.
 */
import { Controller, Get } from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import { ReadinessReport } from './readiness.types';

@Controller('readiness')
export class ReadinessController {
  constructor(private readonly readinessService: ReadinessService) {}

  /**
   * FUNCTION: getReadiness
   * Inputs: none.
   * Outputs: ReadinessReport.
   * Functionality: Returns current production-readiness status for the API service.
   */
  @Get()
  async getReadiness(): Promise<ReadinessReport> {
    return this.readinessService.generateReport();
  }
}
