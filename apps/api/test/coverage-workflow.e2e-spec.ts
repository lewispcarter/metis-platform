// @ts-nocheck
/**
 * ============================================================================
 * TEST SUITE: Coverage Workflow E2E Path
 * ============================================================================
 *
 * MODULE UNDER TEST: operational coverage workflow
 * TEST TYPE: E2E
 * FRAMEWORK: Jest + Nest Testing
 *
 * AUTHOR: Metis Platform Engineering
 * CREATED: 2026-06-09
 * LAST MODIFIED: 2026-06-09
 * VERSION: 0.1.0
 *
 * DESCRIPTION:
 * Validates the reference operational path from demo scenario creation through
 * event, workflow, personnel, and assignment API visibility.
 *
 * DEPENDENCIES:
 * - @nestjs/testing: application test context
 * - supertest: HTTP API assertions
 *
 * COVERAGE SCOPE:
 * ✓ demo scenario seeding
 * ✓ event listing
 * ✓ workflow listing
 * ✓ personnel listing
 * ✓ assignment listing
 *
 * EXECUTION REQUIREMENTS:
 * - Environment: local/test
 * - Prerequisites: test database configured through DATABASE_URL
 * - Runtime: under 30 seconds
 *
 * ============================================================================
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const TEST_METADATA = {
  testId: 'coverage-workflow-e2e-001',
  testName: 'should expose seeded coverage workflow across operational APIs',
  moduleUnderTest: 'coverage-workflow',
  testType: 'e2e',
  category: 'happy-path',
  priority: 'critical',
  author: 'Metis Platform Engineering',
  createdDate: '2026-06-09',
  lastModified: '2026-06-09',
  version: '0.1.0',
  framework: 'Jest',
  environment: 'test',
  expectedDuration: '30000ms',
  dependencies: ['PostgreSQL', 'Redis optional for app boot'],
  reviewCycle: 'per release',
  deprecationDate: 'n/a',
  maintenanceNotes: 'Keep aligned with the reference personnel coverage workflow.',
};

describe('Coverage Workflow - E2E Operational Path', () => {
  let app: INestApplication;

  beforeAll(async () => {
    console.log(`🚀 SUITE START: ${TEST_METADATA.testName} at ${new Date().toISOString()}`);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    console.log(`Completed test suite: ${TEST_METADATA.testName}`);
    await app.close();
  });

  /**
   * TEST FUNCTION: seeded coverage workflow visibility
   *
   * PURPOSE: Confirms that a complete reference workflow can be created and read through public API boundaries.
   *
   * METHODOLOGY: Seed deterministic demo data, then assert each core operational API exposes the expected tenant-scoped data.
   *
   * INPUTS:
   * - none: the demo seed endpoint constructs deterministic local data.
   *
   * EXPECTED OUTCOMES:
   * - demo organization id exists
   * - operational events are visible
   * - workflow runs are visible
   * - personnel records are visible
   * - assignments are visible
   *
   * FAILURE SCENARIOS:
   * - missing database migrations
   * - broken module wiring
   * - tenant scoping errors
   *
   * DEPENDENCIES: active test database
   *
   * MAINTENANCE NOTES: This test intentionally validates the system through HTTP rather than implementation details.
   */
  test('should_expose_seeded_coverage_workflow_when_demo_seed_runs', async () => {
    console.log(`▶ TEST START: ${TEST_METADATA.testId}`);

    const seedResponse = await request(app.getHttpServer()).post('/demo/seed').expect(201);
    const organizationId = seedResponse.body.organizationId;

    expect(organizationId).toBe('demo-org-metis');
    expect(seedResponse.body.eventId).toBeTruthy();
    expect(seedResponse.body.workflowRunId).toBeTruthy();

    const eventsResponse = await request(app.getHttpServer()).get(`/events?organizationId=${organizationId}`).expect(200);
    expect(eventsResponse.body.length).toBeGreaterThan(0);
    expect(eventsResponse.body[0]).toHaveProperty('eventId');

    const workflowsResponse = await request(app.getHttpServer()).get(`/workflow-runs?organizationId=${organizationId}`).expect(200);
    expect(workflowsResponse.body.length).toBeGreaterThan(0);
    expect(workflowsResponse.body[0]).toHaveProperty('workflowRunId');

    const personnelResponse = await request(app.getHttpServer()).get(`/personnel?organizationId=${organizationId}`).expect(200);
    expect(personnelResponse.body.length).toBeGreaterThanOrEqual(3);
    expect(personnelResponse.body[0]).toHaveProperty('personnelId');

    const assignmentsResponse = await request(app.getHttpServer()).get(`/assignments?organizationId=${organizationId}`).expect(200);
    expect(assignmentsResponse.body.length).toBeGreaterThan(0);
    expect(assignmentsResponse.body[0]).toHaveProperty('assignmentId');

    console.log(`✅ PASSED: ${TEST_METADATA.testId}`);
  });
});
