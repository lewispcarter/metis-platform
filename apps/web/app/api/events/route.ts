const localEvents: any[] = [
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

export async function GET() {
  return Response.json({ ok: true, source: 'next-local-fallback', events: localEvents });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const event = {
    id: `local-event-${Date.now()}`,
    title: body.title || 'Untitled Event',
    type: body.type || 'coverage_gap',
    category: body.category || 'STAFFING',
    priority: body.priority || 'URGENT',
    severity: body.severity || 'S2_HIGH',
    source: body.source || 'LOCAL_OPERATOR',
    description: body.description || '',
    operatorNote: body.operatorNote || '',
    status: 'CREATED',
    createdAt: new Date().toISOString(),
  };
  localEvents.unshift(event);
  return Response.json({ ok: true, source: 'next-local-fallback', event }, { status: 201 });
}
