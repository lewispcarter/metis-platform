// @ts-nocheck
/**
 * DEMO DATA SERVICE
 * Purpose: Seeds a deterministic tenant, personnel pool, event, workflow, assignments, communications, acknowledgments, and audit entries for local validation.
 * Role: Gives the greenfield platform an executable operational scenario without requiring manual database setup.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DemoSeedResult = {
  organizationId: string;
  eventId: string;
  workflowRunId: string;
  personnelIds: string[];
  assignmentIds: string[];
};

@Injectable()
export class DemoDataService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FUNCTION: seedDemoCoverageScenario
   * Inputs: none.
   * Outputs: ids for the deterministic demo scenario.
   * Functionality: Upserts the first complete coverage workflow data path for local development and dashboard validation.
   * External calls: PrismaService models perform PostgreSQL writes and reads for tenant-scoped demo records.
   */
  async seedDemoCoverageScenario(): Promise<DemoSeedResult> {
    const organization = await this.prisma.organization.upsert({
      where: { id: 'demo-org-metis' },
      update: { name: 'Metis Demo Operations' },
      create: { id: 'demo-org-metis', name: 'Metis Demo Operations' },
    });

    const department = await this.prisma.department.upsert({
      where: { id: 'demo-dept-coverage' },
      update: { name: 'Coverage Operations' },
      create: { id: 'demo-dept-coverage', organizationId: organization.id, name: 'Coverage Operations' },
    });

    await this.prisma.role.upsert({
      where: { id: 'demo-role-admin' },
      update: { permissions: ['*'] },
      create: { id: 'demo-role-admin', organizationId: organization.id, name: 'Admin', permissions: ['*'] },
    });

    const personnelInputs = [
      { id: 'demo-personnel-ava', displayName: 'Ava Johnson', roleTitle: 'LPN', phone: '+15550001001', email: 'ava@example.com', certifications: ['LPN', 'BLS'], availabilityStatus: 'AVAILABLE' },
      { id: 'demo-personnel-marcus', displayName: 'Marcus Carter', roleTitle: 'LPN', phone: '+15550001002', email: 'marcus@example.com', certifications: ['LPN'], availabilityStatus: 'AVAILABLE' },
      { id: 'demo-personnel-sam', displayName: 'Sam Lee', roleTitle: 'Supervisor', phone: '+15550001003', email: 'sam@example.com', certifications: ['Supervisor'], availabilityStatus: 'ON_CALL' },
    ];

    const now = new Date();
    const shiftStart = new Date(now.getTime() + 60 * 60 * 1000);
    const shiftEnd = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const deadline = new Date(now.getTime() + 30 * 60 * 1000);

    const personnelIds: string[] = [];
    for (const person of personnelInputs) {
      const record = await this.prisma.personnel.upsert({
        where: { id: person.id },
        update: {
          displayName: person.displayName,
          roleTitle: person.roleTitle,
          phone: person.phone,
          email: person.email,
          certifications: person.certifications,
        },
        create: {
          id: person.id,
          organizationId: organization.id,
          departmentId: department.id,
          displayName: person.displayName,
          roleTitle: person.roleTitle,
          phone: person.phone,
          email: person.email,
          certifications: person.certifications,
        },
      });
      personnelIds.push(record.id);

      await this.prisma.availabilityWindow.upsert({
        where: { id: `${person.id}-availability` },
        update: { startsAt: shiftStart, endsAt: shiftEnd, status: person.availabilityStatus },
        create: {
          id: `${person.id}-availability`,
          organizationId: organization.id,
          personnelId: record.id,
          startsAt: shiftStart,
          endsAt: shiftEnd,
          status: person.availabilityStatus,
        },
      });
    }

    const event = await this.prisma.operationalEvent.upsert({
      where: { id: 'demo-event-calloff' },
      update: {
        status: 'WORKFLOW_STARTED',
        priority: 'URGENT',
        severity: 'S2_HIGH',
        escalationLevel: 0,
        acknowledgmentStatus: 'PENDING',
      },
      create: {
        id: 'demo-event-calloff',
        organizationId: organization.id,
        departmentId: department.id,
        eventType: 'employee_calloff',
        eventCategory: 'STAFFING',
        title: 'Employee Call-Off: Morning Coverage Gap',
        description: 'A scheduled worker became unavailable before shift start. Coverage workflow launched.',
        source: 'DEMO_SEED',
        status: 'WORKFLOW_STARTED',
        priority: 'URGENT',
        severity: 'S2_HIGH',
        metadata: { shiftStart: shiftStart.toISOString(), shiftEnd: shiftEnd.toISOString() },
      },
    });

    const workflowRun = await this.prisma.workflowRun.upsert({
      where: { id: 'demo-workflow-coverage' },
      update: { status: 'RUNNING', currentStep: 'candidate_outreach_started' },
      create: {
        id: 'demo-workflow-coverage',
        organizationId: organization.id,
        operationalEventId: event.id,
        status: 'RUNNING',
        currentStep: 'candidate_outreach_started',
        metadata: { workflowType: 'personnel_coverage' },
      },
    });

    await this.prisma.coverageRequest.upsert({
      where: { id: 'demo-coverage-request' },
      update: { status: 'OPEN', requiredShiftStart: shiftStart, requiredShiftEnd: shiftEnd, coverageDeadline: deadline },
      create: {
        id: 'demo-coverage-request',
        organizationId: organization.id,
        operationalEventId: event.id,
        requiredRole: 'LPN',
        requiredDepartment: department.name,
        requiredShiftStart: shiftStart,
        requiredShiftEnd: shiftEnd,
        requiredCertifications: ['LPN'],
        status: 'OPEN',
        urgency: 'URGENT',
        coverageDeadline: deadline,
        metadata: { workflowRunId: workflowRun.id },
      },
    });

    const assignmentIds: string[] = [];
    for (const personnelId of personnelIds.slice(0, 2)) {
      const assignment = await this.prisma.assignment.upsert({
        where: { id: `demo-assignment-${personnelId}` },
        update: { status: personnelId.endsWith('ava') ? 'OFFERED' : 'PENDING' },
        create: {
          id: `demo-assignment-${personnelId}`,
          organizationId: organization.id,
          operationalEventId: event.id,
          personnelId,
          status: personnelId.endsWith('ava') ? 'OFFERED' : 'PENDING',
          metadata: { coverageRequestId: 'demo-coverage-request', workflowRunId: workflowRun.id },
        },
      });
      assignmentIds.push(assignment.id);
    }

    await this.prisma.communication.upsert({
      where: { id: 'demo-communication-sms-ava' },
      update: { status: 'SENT' },
      create: {
        id: 'demo-communication-sms-ava',
        organizationId: organization.id,
        operationalEventId: event.id,
        channel: 'SMS',
        direction: 'OUTBOUND',
        status: 'SENT',
        recipient: '+15550001001',
        body: 'Coverage needed for LPN shift. Reply YES to accept.',
        metadata: { personnelId: 'demo-personnel-ava' },
      },
    });

    await this.prisma.acknowledgment.upsert({
      where: { id: 'demo-acknowledgment-pending' },
      update: { status: 'PENDING' },
      create: {
        id: 'demo-acknowledgment-pending',
        organizationId: organization.id,
        operationalEventId: event.id,
        personnelId: 'demo-personnel-ava',
        status: 'PENDING',
        metadata: { communicationId: 'demo-communication-sms-ava' },
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        organizationId: organization.id,
        eventId: event.id,
        actorType: 'SYSTEM',
        action: 'demo_coverage_scenario_seeded',
        newState: 'READY',
        metadata: { workflowRunId: workflowRun.id, assignmentIds },
      },
    });

    return { organizationId: organization.id, eventId: event.id, workflowRunId: workflowRun.id, personnelIds, assignmentIds };
  }
}
