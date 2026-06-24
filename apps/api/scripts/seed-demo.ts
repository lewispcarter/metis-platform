/**
 * DEMO SEED SCRIPT
 * Purpose: Creates deterministic local data for the personnel coverage reference workflow.
 * Role: Lets developers validate APIs and dashboard screens without manual data entry.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DemoDataService } from '../src/demo/demo-data.service';

/**
 * FUNCTION: main
 * Inputs: process environment configured with DATABASE_URL.
 * Outputs: console summary and process exit code.
 * Functionality: Boots the Nest application context, runs demo seed logic, and closes resources.
 * External calls: NestFactory.createApplicationContext(AppModule) initializes providers; DemoDataService.seedDemoCoverageScenario() writes demo records.
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const demoDataService = app.get(DemoDataService);
  const result = await demoDataService.seedDemoCoverageScenario();
  console.log('Demo coverage scenario seeded:', result);
  await app.close();
}

main().catch((error) => {
  console.error('Failed to seed demo coverage scenario:', error);
  process.exit(1);
});
