// @ts-nocheck
/**
 * READINESS SERVICE
 * Purpose: Performs production-readiness checks for core infrastructure dependencies.
 * Role: Protects deployments by making database, Redis, and configuration readiness observable.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ReadinessCheck, ReadinessReport } from './readiness.types';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * FUNCTION: generateReport
   * Inputs: none.
   * Outputs: ReadinessReport with PASS/WARN/FAIL status.
   * Functionality: Aggregates production-readiness checks into one deployable report.
   */
  async generateReport(): Promise<ReadinessReport> {
    const checks: ReadinessCheck[] = [];

    checks.push(await this.checkDatabase());
    checks.push(this.checkRedisConfiguration());
    checks.push(this.checkExternalProviderConfiguration());

    const status = checks.some((check) => check.status === 'FAIL')
      ? 'FAIL'
      : checks.some((check) => check.status === 'WARN')
        ? 'WARN'
        : 'PASS';

    return {
      status,
      generatedAt: new Date().toISOString(),
      checks,
    };
  }

  /**
   * FUNCTION: checkDatabase
   * Inputs: none.
   * Outputs: ReadinessCheck for PostgreSQL connectivity.
   * Functionality: Executes a low-cost query through Prisma to verify database availability.
   */
  private async checkDatabase(): Promise<ReadinessCheck> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return { name: 'database', status: 'PASS', message: 'PostgreSQL connection succeeded.' };
    } catch (error) {
      return {
        name: 'database',
        status: 'FAIL',
        message: `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }

  /**
   * FUNCTION: checkRedisConfiguration
   * Inputs: none.
   * Outputs: ReadinessCheck for Redis configuration presence.
   * Functionality: Verifies queue infrastructure configuration is present before deployment.
   */
  private checkRedisConfiguration(): ReadinessCheck {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT');

    if (!host || !port) {
      return { name: 'redis_configuration', status: 'FAIL', message: 'Redis host or port is missing.' };
    }

    return { name: 'redis_configuration', status: 'PASS', message: `Redis configured at ${host}:${port}.` };
  }

  /**
   * FUNCTION: checkExternalProviderConfiguration
   * Inputs: none.
   * Outputs: ReadinessCheck for optional external providers.
   * Functionality: Warns when production communication or AI provider credentials are absent.
   */
  private checkExternalProviderConfiguration(): ReadinessCheck {
    const configuredProviders = [
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('SENDGRID_API_KEY'),
      this.configService.get<string>('AI_PROVIDER_API_KEY'),
    ].filter(Boolean).length;

    if (configuredProviders === 0) {
      return {
        name: 'external_provider_configuration',
        status: 'WARN',
        message: 'No external communication or AI provider credentials configured. Demo mode only.',
      };
    }

    return {
      name: 'external_provider_configuration',
      status: 'PASS',
      message: `${configuredProviders} external provider credential set(s) configured.`,
    };
  }
}
