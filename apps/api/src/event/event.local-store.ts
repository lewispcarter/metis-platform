export type LocalOperationalEvent = {
  id: string;
  title: string;
  type: string;
  category: string;
  priority: string;
  severity: string;
  source: string;
  description?: string;
  operatorNote?: string;
  status: string;
  createdAt: string;
};

const events: LocalOperationalEvent[] = [
  {
    id: 'demo-event-1',
    title: 'Employee Call-Off',
    type: 'employee_calloff',
    category: 'STAFFING',
    priority: 'URGENT',
    severity: 'S2_HIGH',
    source: 'LOCAL_OPERATOR',
    description: 'Employee call-off requires coverage.',
    status: 'WORKFLOW_STARTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-event-2',
    title: 'Coverage Request Approaching Timeout',
    type: 'acknowledgment_timeout',
    category: 'STAFFING',
    priority: 'HIGH',
    severity: 'S2_HIGH',
    source: 'LOCAL_OPERATOR',
    description: 'Coverage request is approaching timeout.',
    status: 'ESCALATED',
    createdAt: new Date().toISOString(),
  },
];

export function listLocalEvents() {
  return events;
}

export function createLocalEvent(input: Partial<LocalOperationalEvent>) {
  const event: LocalOperationalEvent = {
    id: `local-event-${Date.now()}`,
    title: input.title || 'Untitled Event',
    type: input.type || 'coverage_gap',
    category: input.category || 'STAFFING',
    priority: input.priority || 'URGENT',
    severity: input.severity || 'S2_HIGH',
    source: input.source || 'LOCAL_OPERATOR',
    description: input.description || '',
    operatorNote: input.operatorNote || '',
    status: input.status || 'CREATED',
    createdAt: new Date().toISOString(),
  };
  events.unshift(event);
  return event;
}
