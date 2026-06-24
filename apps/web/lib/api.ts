/**
 * DASHBOARD API CLIENT
 * Purpose: Provides server-side API accessors for the operational dashboard.
 * Role: Keeps Next.js pages decoupled from backend endpoint strings while supporting graceful fallback data during early platform bring-up.
 */
export type DashboardOperationalEvent = {
  eventId: string;
  title: string;
  eventType: string;
  status: string;
  priority: string;
  severity: string;
  createdAt: string;
};

export type DashboardWorkflowRun = {
  workflowRunId: string;
  status: string;
  currentStep?: string;
  operationalEventId: string;
  updatedAt: string;
};

export type DashboardPersonnel = {
  personnelId: string;
  displayName: string;
  roleTitle: string;
  status?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';
const DEMO_ORGANIZATION_ID = process.env.NEXT_PUBLIC_DEMO_ORGANIZATION_ID ?? 'demo-org-metis';

const devHeaders = {
  'x-user-id': 'demo-owner',
  'x-provider-user-id': 'demo-owner',
  'x-organization-id': DEMO_ORGANIZATION_ID,
  'x-role': 'Owner',
  'x-user-email': 'owner@metissystems.local',
  'x-user-name': 'Metis Systems Owner',
};

/**
 * FUNCTION: getJson
 * Inputs: URL path relative to the API server.
 * Outputs: parsed JSON response or fallback value.
 * Functionality: Performs no-store dashboard API reads and degrades safely to fallback data when the backend is not running.
 */
async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!DEMO_ORGANIZATION_ID) {
    return fallback;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store', headers: devHeaders });
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

/**
 * FUNCTION: listDashboardEvents
 * Inputs: none.
 * Outputs: event rows for dashboard rendering.
 * Functionality: Reads tenant-scoped operational events or returns stable fallback data until a demo tenant is configured.
 */
export function listDashboardEvents(): Promise<DashboardOperationalEvent[]> {
  return getJson<DashboardOperationalEvent[]>(`/events`, [
    {
      eventId: 'demo-event-1',
      title: 'Employee Call-Off',
      eventType: 'employee_calloff',
      status: 'WORKFLOW_STARTED',
      priority: 'URGENT',
      severity: 'S2_HIGH',
      createdAt: new Date().toISOString(),
    },
    {
      eventId: 'demo-event-2',
      title: 'Coverage Request Approaching Timeout',
      eventType: 'acknowledgment_timeout',
      status: 'ESCALATED',
      priority: 'HIGH',
      severity: 'S2_HIGH',
      createdAt: new Date().toISOString(),
    },
  ]);
}

/**
 * FUNCTION: listDashboardWorkflows
 * Inputs: none.
 * Outputs: workflow rows for dashboard rendering.
 * Functionality: Reads tenant-scoped workflow runs or returns stable fallback data until a demo tenant is configured.
 */
export function listDashboardWorkflows(): Promise<DashboardWorkflowRun[]> {
  return getJson<DashboardWorkflowRun[]>(`/workflow-runs`, [
    {
      workflowRunId: 'demo-workflow-1',
      status: 'STARTED',
      currentStep: 'awaiting_acknowledgment',
      operationalEventId: 'demo-event-1',
      updatedAt: new Date().toISOString(),
    },
    {
      workflowRunId: 'demo-workflow-2',
      status: 'QUEUED',
      currentStep: 'supervisor_escalation_pending',
      operationalEventId: 'demo-event-2',
      updatedAt: new Date().toISOString(),
    },
  ]);
}

/**
 * FUNCTION: listDashboardPersonnel
 * Inputs: none.
 * Outputs: personnel rows for dashboard rendering.
 * Functionality: Reads tenant-scoped personnel records or returns stable fallback data until a demo tenant is configured.
 */
export function listDashboardPersonnel(): Promise<DashboardPersonnel[]> {
  return getJson<DashboardPersonnel[]>(`/personnel`, [
    { personnelId: 'demo-personnel-1', displayName: 'A. Johnson', roleTitle: 'LPN', status: 'Available' },
    { personnelId: 'demo-personnel-2', displayName: 'M. Carter', roleTitle: 'RN', status: 'On Assignment' },
    { personnelId: 'demo-personnel-3', displayName: 'S. Lee', roleTitle: 'Supervisor', status: 'Available' },
  ]);
}

export type DashboardAssignment = {
  assignmentId: string;
  operationalEventId: string;
  personnelId?: string;
  status: string;
  createdAt: string;
};

export type DashboardCoverageRequest = {
  coverageRequestId: string;
  operationalEventId: string;
  requiredRole: string;
  status: string;
  urgency: string;
  coverageDeadline: string;
};

/**
 * FUNCTION: listDashboardAssignments
 * Inputs: none.
 * Outputs: assignment rows for dashboard rendering.
 * Functionality: Reads tenant-scoped assignments or returns stable fallback data until a demo tenant is configured.
 */
export function listDashboardAssignments(): Promise<DashboardAssignment[]> {
  return getJson<DashboardAssignment[]>(`/assignments`, [
    { assignmentId: 'demo-assignment-1', operationalEventId: 'demo-event-1', personnelId: 'demo-personnel-1', status: 'OFFERED', createdAt: new Date().toISOString() },
    { assignmentId: 'demo-assignment-2', operationalEventId: 'demo-event-1', personnelId: 'demo-personnel-2', status: 'PENDING', createdAt: new Date().toISOString() },
  ]);
}

/**
 * FUNCTION: listDashboardCoverageRequests
 * Inputs: none.
 * Outputs: coverage request rows for dashboard rendering.
 * Functionality: Reads tenant-scoped coverage requests or returns stable fallback data until a demo tenant is configured.
 */
export function listDashboardCoverageRequests(): Promise<DashboardCoverageRequest[]> {
  return getJson<DashboardCoverageRequest[]>(`/coverage-requests`, [
    { coverageRequestId: 'demo-coverage-1', operationalEventId: 'demo-event-1', requiredRole: 'LPN', status: 'OPEN', urgency: 'URGENT', coverageDeadline: new Date(Date.now() + 30 * 60 * 1000).toISOString() },
  ]);
}

export type DashboardActivityRecord = {
  activityId: string;
  actorType: string;
  actorId?: string;
  action: string;
  eventId?: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

/**
 * FUNCTION: listDashboardActivity
 * Inputs: none.
 * Outputs: operator activity records for dashboard rendering.
 * Functionality: Reads tenant-scoped activity feed or returns stable fallback data until a demo tenant is configured.
 */
export function listDashboardActivity(): Promise<DashboardActivityRecord[]> {
  return getJson<DashboardActivityRecord[]>(`/activity`, [
    { activityId: 'demo-activity-1', actorType: 'USER', actorId: 'demo-owner', action: 'event_created', eventId: 'demo-event-1', newState: 'CREATED', timestamp: new Date().toISOString(), metadata: { role: 'Owner' } },
    { activityId: 'demo-activity-2', actorType: 'SYSTEM', action: 'workflow_started', eventId: 'demo-event-1', newState: 'STARTED', timestamp: new Date().toISOString(), metadata: { workflowRunId: 'demo-workflow-1' } },
  ]);
}

export type DashboardWorkflowTask = {
  workflowTaskId: string;
  workflowRunId: string;
  name: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  updatedAt: string;
};

export type DashboardEscalation = {
  escalationId: string;
  operationalEventId: string;
  level: number;
  status: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * FUNCTION: listDashboardWorkflowTasks
 * Inputs: workflow run id.
 * Outputs: task checkpoints for a selected workflow run.
 * Functionality: Reads workflow task timeline data or returns stable fallback checkpoints for early bring-up.
 */
export function listDashboardWorkflowTasks(workflowRunId: string): Promise<DashboardWorkflowTask[]> {
  return getJson<DashboardWorkflowTask[]>(`/workflow-runs/${workflowRunId}/tasks?organizationId=${DEMO_ORGANIZATION_ID}`, [
    { workflowTaskId: 'demo-task-1', workflowRunId, name: 'coverage_request', status: 'COMPLETED', createdAt: new Date(Date.now() - 12 * 60000).toISOString(), completedAt: new Date(Date.now() - 11 * 60000).toISOString(), updatedAt: new Date(Date.now() - 11 * 60000).toISOString() },
    { workflowTaskId: 'demo-task-2', workflowRunId, name: 'candidate_discovery', status: 'COMPLETED', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), completedAt: new Date(Date.now() - 9 * 60000).toISOString(), updatedAt: new Date(Date.now() - 9 * 60000).toISOString() },
    { workflowTaskId: 'demo-task-3', workflowRunId, name: 'candidate_outreach', status: 'RUNNING', createdAt: new Date(Date.now() - 8 * 60000).toISOString(), startedAt: new Date(Date.now() - 8 * 60000).toISOString(), updatedAt: new Date(Date.now() - 2 * 60000).toISOString() },
  ]);
}

/**
 * FUNCTION: listDashboardEscalations
 * Inputs: none.
 * Outputs: escalation rows for supervisor controls and dashboard pressure display.
 * Functionality: Reads tenant-scoped escalation records or returns stable fallback data until backend auth is configured.
 */
export function listDashboardEscalations(): Promise<DashboardEscalation[]> {
  return getJson<DashboardEscalation[]>(`/escalations?organizationId=${DEMO_ORGANIZATION_ID}`, [
    { escalationId: 'demo-escalation-1', operationalEventId: 'demo-event-2', level: 2, status: 'OPEN', reason: 'ACKNOWLEDGMENT_TIMEOUT', createdAt: new Date(Date.now() - 6 * 60000).toISOString(), updatedAt: new Date(Date.now() - 6 * 60000).toISOString() },
  ]);
}


export type DashboardCommunication = {
  communicationId: string;
  organizationId: string;
  operationalEventId?: string;
  channel: string;
  direction: string;
  status: string;
  recipient: string;
  body?: string;
  providerMessageId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/**
 * FUNCTION: listDashboardCommunications
 * Inputs: optional operational event id.
 * Outputs: communications filtered by event in the page layer.
 * Functionality: Reads tenant communications and supports event-tied timeline rendering with safe fallback data.
 */
export async function listDashboardCommunications(eventId?: string): Promise<DashboardCommunication[]> {
  const rows = await getJson<DashboardCommunication[]>(`/communications?organizationId=${DEMO_ORGANIZATION_ID}`, [
    { communicationId: 'demo-comm-1', organizationId: DEMO_ORGANIZATION_ID || 'demo-org', operationalEventId: 'demo-event-1', channel: 'SMS', direction: 'OUTBOUND', status: 'SENT', recipient: '+15555550100', body: 'Coverage needed. Reply YES to accept.', metadata: {}, createdAt: new Date(Date.now() - 5 * 60000).toISOString(), updatedAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { communicationId: 'demo-comm-2', organizationId: DEMO_ORGANIZATION_ID || 'demo-org', operationalEventId: 'demo-event-1', channel: 'SMS', direction: 'INBOUND', status: 'RECEIVED', recipient: '+15555550100', body: 'YES', metadata: { sender: '+15555550100' }, createdAt: new Date(Date.now() - 3 * 60000).toISOString(), updatedAt: new Date(Date.now() - 3 * 60000).toISOString() },
  ]);

  return eventId ? rows.filter((row) => row.operationalEventId === eventId) : rows;
}


export type DashboardWebhookRoute = {
  routeId: string;
  organizationId: string;
  provider: string;
  inboundAddress: string;
  status: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DashboardProviderConfiguration = {
  providerConfigurationId: string;
  organizationId: string;
  provider: string;
  channel: string;
  status: string;
  displayName: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/**
 * FUNCTION: listDashboardWebhookRoutes
 * Inputs: none.
 * Outputs: tenant webhook route records for settings UI rendering.
 * Functionality: Reads protected settings route data or returns safe fallback configuration examples during early bring-up.
 */
export function listDashboardWebhookRoutes(): Promise<DashboardWebhookRoute[]> {
  return getJson<DashboardWebhookRoute[]>(`/settings/webhook-routes?organizationId=${DEMO_ORGANIZATION_ID}`, [
    {
      routeId: 'demo-route-1',
      organizationId: DEMO_ORGANIZATION_ID || 'demo-org',
      provider: 'twilio',
      inboundAddress: '+15555550123',
      status: 'ACTIVE',
      description: 'Primary operations SMS and voice number',
      metadata: { environment: 'demo' },
      createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    },
  ]);
}

/**
 * FUNCTION: listDashboardProviderConfigurations
 * Inputs: none.
 * Outputs: tenant provider configuration records for settings UI rendering.
 * Functionality: Reads protected provider setup data or returns safe fallback readiness rows during early bring-up.
 */
export function listDashboardProviderConfigurations(): Promise<DashboardProviderConfiguration[]> {
  return getJson<DashboardProviderConfiguration[]>(`/settings/provider-configurations?organizationId=${DEMO_ORGANIZATION_ID}`, [
    {
      providerConfigurationId: 'demo-provider-1',
      organizationId: DEMO_ORGANIZATION_ID || 'demo-org',
      provider: 'twilio',
      channel: 'SMS',
      status: 'ACTIVE',
      displayName: 'Twilio SMS',
      config: { accountSid: 'AC********', fromNumber: '+15555550123' },
      createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
      providerConfigurationId: 'demo-provider-2',
      organizationId: DEMO_ORGANIZATION_ID || 'demo-org',
      provider: 'sendgrid',
      channel: 'EMAIL',
      status: 'DISABLED',
      displayName: 'SendGrid Email',
      config: { senderDomain: 'ops.example.com' },
      createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    },
  ]);
}
