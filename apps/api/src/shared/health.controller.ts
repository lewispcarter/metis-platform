// @ts-nocheck
/**
 * HEALTH CONTROLLER
 * Purpose: Provides a minimal operational health endpoint for deployment and monitoring systems.
 * Role: Confirms the API process is running before deeper database/queue checks are added.
 */
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  /**
   * FUNCTION: getHealth
   * Inputs: none.
   * Outputs: service health payload.
   * Functionality: Returns basic process-level health status for load balancers and smoke tests.
   */
  @Get()
  getHealth(): { status: 'ok'; service: string } {
    return { status: 'ok', service: 'metis-api' };
  }
}
