'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type LocalEvent = {
  eventId: string;
  title: string;
  eventType: string;
  eventCategory: string;
  status: string;
  priority: string;
  severity: string;
  source: string;
  description: string;
  operatorNote?: string;
  createdAt: string;
  updatedAt?: string;
  acknowledgedAt?: string;
  escalatedAt?: string;
  workflowStartedAt?: string;
  resolvedAt?: string;
  assignedPersonnelId?: string;
  assignedPersonnelName?: string;
  assignedPersonnelRole?: string;
  assignedAt?: string;
};

type LocalActivity = {
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

type LocalPersonnel = {
  personnelId: string;
  displayName: string;
  roleTitle: string;
  status: string;
  activeEventId?: string;
  activeEventTitle?: string;
  lastAssignedAt?: string;
};

const STORAGE_KEY = 'metis.systems.local.events.v27';
const ACTIVITY_STORAGE_KEY = 'metis.systems.local.activity.v28';
const PERSONNEL_STORAGE_KEY = 'metis.systems.local.personnel.v30';

const fallbackPersonnel: LocalPersonnel[] = [
  { personnelId: 'demo-personnel-1', displayName: 'A. Johnson', roleTitle: 'LPN', status: 'Available' },
  { personnelId: 'demo-personnel-2', displayName: 'M. Carter', roleTitle: 'RN', status: 'Available' },
  { personnelId: 'demo-personnel-3', displayName: 'S. Lee', roleTitle: 'Supervisor', status: 'Available' },
];

const fallbackEvents: LocalEvent[] = [
  {
    eventId: 'demo-event-1',
    title: 'Employee Call-Off',
    eventType: 'employee_calloff',
    eventCategory: 'STAFFING',
    status: 'WORKFLOW_STARTED',
    priority: 'URGENT',
    severity: 'S2_HIGH',
    source: 'LOCAL_OPERATOR',
    description: 'Employee call-off requires coverage.',
    createdAt: '2026-06-18T18:10:57.000Z',
  },
  {
    eventId: 'demo-event-2',
    title: 'Coverage Request Approaching Timeout',
    eventType: 'acknowledgment_timeout',
    eventCategory: 'STAFFING',
    status: 'ESCALATED',
    priority: 'HIGH',
    severity: 'S2_HIGH',
    source: 'LOCAL_OPERATOR',
    description: 'Coverage request is approaching timeout.',
    createdAt: '2026-06-18T18:10:57.000Z',
  },
];

function readLocalEvents(): LocalEvent[] {
  if (typeof window === 'undefined') return fallbackEvents;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackEvents));
      return fallbackEvents;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalEvent[]) : fallbackEvents;
  } catch {
    return fallbackEvents;
  }
}

function writeLocalEvents(events: LocalEvent[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function readLocalActivity(): LocalActivity[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalActivity[]) : [];
  } catch {
    return [];
  }
}

function writeActivity(record: LocalActivity) {
  const current = readLocalActivity();
  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify([record, ...current]));
}

function readLocalPersonnel(): LocalPersonnel[] {
  if (typeof window === 'undefined') return fallbackPersonnel;

  try {
    const raw = window.localStorage.getItem(PERSONNEL_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(fallbackPersonnel));
      return fallbackPersonnel;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallbackPersonnel;

    return (parsed as LocalPersonnel[]).map((person) => ({
      ...person,
      status: person.status === 'On Assignment' ? 'Available' : person.status,
    }));
  } catch {
    return fallbackPersonnel;
  }
}

function writeLocalPersonnel(personnel: LocalPersonnel[]) {
  window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(personnel));
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function actionLabel(action: string) {
  return action.replaceAll('_', ' ');
}

function isPersonnelAvailable(person: LocalPersonnel, currentEventId?: string) {
  if (person.activeEventId && person.activeEventId !== currentEventId) return false;
  return person.status === 'Available' || person.status === 'On Call' || person.activeEventId === currentEventId;
}

const EVENT_STATE_MACHINE = {
  CREATED: ['ACKNOWLEDGED', 'ESCALATED'],
  NEW: ['ACKNOWLEDGED', 'ESCALATED'],
  WORKFLOW_STARTED: ['ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'],
  ACKNOWLEDGED: ['ASSIGNED', 'ESCALATED', 'RESOLVED'],
  ASSIGNED: ['WORKFLOW_STARTED', 'ESCALATED', 'RESOLVED'],
  ESCALATED: ['ASSIGNED', 'WORKFLOW_STARTED', 'RESOLVED'],
  RESOLVED: [],
} as const;

function canTransition(currentStatus: string, nextStatus: string) {
  const allowed = EVENT_STATE_MACHINE[currentStatus as keyof typeof EVENT_STATE_MACHINE] ?? [];
  return (allowed as readonly string[]).includes(nextStatus);
}

function currentWorkflowStep(status: string) {
  if (status === 'CREATED') return 'new';
  if (status === 'ACKNOWLEDGED') return 'awaiting_assignment';
  if (status === 'ASSIGNED') return 'owner_assigned';
  if (status === 'WORKFLOW_STARTED') return 'workflow_running';
  if (status === 'ESCALATED') return 'escalation_in_progress';
  if (status === 'RESOLVED') return 'closed';
  return 'new';
}

function blockedActionRecord(event: LocalEvent, action: string, attemptedState: string): LocalActivity {
  const now = new Date().toISOString();
  return {
    activityId: `activity-${Date.now()}`,
    actorType: 'SYSTEM',
    actorId: 'state-machine',
    action: `event_${action}_blocked`,
    eventId: event.eventId,
    previousState: event.status,
    newState: event.status,
    timestamp: now,
    metadata: {
      title: event.title,
      attemptedState,
      reason: 'invalid_state_transition',
      source: 'workflow_state_machine',
    },
  };
}

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const [events, setEvents] = useState<LocalEvent[]>(fallbackEvents);
  const [activity, setActivity] = useState<LocalActivity[]>([]);
  const [personnel, setPersonnel] = useState<LocalPersonnel[]>(fallbackPersonnel);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');

  useEffect(() => {
    const loadedPersonnel = readLocalPersonnel();
    setEvents(readLocalEvents());
    setActivity(readLocalActivity());
    setPersonnel(loadedPersonnel);
    setSelectedPersonnelId(loadedPersonnel.find((person) => isPersonnelAvailable(person))?.personnelId ?? loadedPersonnel[0]?.personnelId ?? '');
  }, []);

  const event = useMemo(() => events.find((item) => item.eventId === params.eventId), [events, params.eventId]);
  const assignablePersonnel = useMemo(
    () => personnel.filter((person) => isPersonnelAvailable(person, event?.eventId)),
    [personnel, event?.eventId],
  );

  function persistAction(nextEvents: LocalEvent[], record: LocalActivity) {
    writeLocalEvents(nextEvents);
    writeActivity(record);
    setEvents(nextEvents);
    setActivity((current) => [record, ...current]);
  }

  function releaseAssignedPersonnel(eventToRelease: LocalEvent, now: string) {
    if (!eventToRelease.assignedPersonnelId) return personnel;

    const nextPersonnel = personnel.map((person) => {
      if (person.personnelId !== eventToRelease.assignedPersonnelId) return person;
      return {
        ...person,
        status: 'Available',
        activeEventId: undefined,
        activeEventTitle: undefined,
        lastAssignedAt: now,
      };
    });

    writeLocalPersonnel(nextPersonnel);
    setPersonnel(nextPersonnel);
    return nextPersonnel;
  }

  function applyEventAction(action: 'acknowledge' | 'escalate' | 'start_workflow' | 'resolve') {
    if (!event) return;

    const now = new Date().toISOString();
    const nextStatusByAction = {
      acknowledge: 'ACKNOWLEDGED',
      escalate: 'ESCALATED',
      start_workflow: 'WORKFLOW_STARTED',
      resolve: 'RESOLVED',
    } as const;

    const nextStatus = nextStatusByAction[action];
    const previousState = event.status;

    if (!canTransition(event.status, nextStatus)) {
      const blockedRecord = blockedActionRecord(event, action, nextStatus);
      writeActivity(blockedRecord);
      setActivity((current) => [blockedRecord, ...current]);
      return;
    }

    if (action === 'resolve') {
      releaseAssignedPersonnel(event, now);
    }

    const nextEvents = events.map((item) => {
      if (item.eventId !== event.eventId) return item;
      return {
        ...item,
        status: nextStatus,
        priority: action === 'escalate' && item.priority !== 'CRITICAL' ? 'URGENT' : item.priority,
        updatedAt: now,
        acknowledgedAt: action === 'acknowledge' ? now : item.acknowledgedAt,
        escalatedAt: action === 'escalate' ? now : item.escalatedAt,
        workflowStartedAt: action === 'start_workflow' ? now : item.workflowStartedAt,
        resolvedAt: action === 'resolve' ? now : item.resolvedAt,
      };
    });

    const record: LocalActivity = {
      activityId: `activity-${Date.now()}`,
      actorType: 'USER',
      actorId: 'local-operator',
      action: `event_${action}`,
      eventId: event.eventId,
      previousState,
      newState: nextStatus,
      timestamp: now,
      metadata: { title: event.title, source: 'event_detail_action' },
    };

    persistAction(nextEvents, record);
  }

  function assignOwner() {
    if (!event || !selectedPersonnelId) return;

    const selected = personnel.find((person) => person.personnelId === selectedPersonnelId);
    if (!selected) return;

    if (!canTransition(event.status, 'ASSIGNED')) {
      const blockedRecord = blockedActionRecord(event, 'assign_owner', 'ASSIGNED');
      writeActivity(blockedRecord);
      setActivity((current) => [blockedRecord, ...current]);
      return;
    }

    if (!isPersonnelAvailable(selected, event.eventId)) {
      const blockedRecord: LocalActivity = {
        activityId: `activity-${Date.now()}`,
        actorType: 'SYSTEM',
        actorId: 'availability-engine',
        action: 'event_assign_owner_blocked',
        eventId: event.eventId,
        previousState: event.status,
        newState: event.status,
        timestamp: new Date().toISOString(),
        metadata: {
          title: event.title,
          attemptedPersonnelId: selected.personnelId,
          attemptedPersonnelName: selected.displayName,
          reason: 'personnel_not_available',
          currentStatus: selected.status,
          activeEventId: selected.activeEventId,
        },
      };
      writeActivity(blockedRecord);
      setActivity((current) => [blockedRecord, ...current]);
      return;
    }

    const now = new Date().toISOString();
    const previousState = event.status;

    const nextEvents = events.map((item) => {
      if (item.eventId !== event.eventId) return item;
      return {
        ...item,
        status: 'ASSIGNED',
        assignedPersonnelId: selected.personnelId,
        assignedPersonnelName: selected.displayName,
        assignedPersonnelRole: selected.roleTitle,
        assignedAt: now,
        updatedAt: now,
      };
    });

    const nextPersonnel = personnel.map((person) => {
      if (event.assignedPersonnelId && person.personnelId === event.assignedPersonnelId && person.personnelId !== selected.personnelId) {
        return { ...person, status: 'Available', activeEventId: undefined, activeEventTitle: undefined, lastAssignedAt: now };
      }

      if (person.personnelId !== selected.personnelId) return person;

      return {
        ...person,
        status: 'Assigned',
        activeEventId: event.eventId,
        activeEventTitle: event.title,
        lastAssignedAt: now,
      };
    });

    writeLocalPersonnel(nextPersonnel);
    setPersonnel(nextPersonnel);

    const record: LocalActivity = {
      activityId: `activity-${Date.now()}`,
      actorType: 'USER',
      actorId: 'local-operator',
      action: 'event_assign_owner',
      eventId: event.eventId,
      previousState,
      newState: 'ASSIGNED',
      timestamp: now,
      metadata: {
        title: event.title,
        assignedPersonnelId: selected.personnelId,
        assignedPersonnelName: selected.displayName,
        assignedPersonnelRole: selected.roleTitle,
        availabilityStatus: 'Assigned',
      },
    };

    persistAction(nextEvents, record);
  }

  if (!event) {
    return (
      <main className="shell">
        <section className="hero compact">
          <p className="eyebrow">Event Detail</p>
          <h1>Event Not Found</h1>
          <p className="lede">This event is not in local persistent storage.</p>
          <a className="button secondary" href="/events">Back to Events</a>
        </section>
      </main>
    );
  }

  const baseAuditRows: LocalActivity[] = [
    { activityId: `${event.eventId}-created`, actorType: event.source || 'LOCAL_OPERATOR', action: 'event_created', eventId: event.eventId, timestamp: event.createdAt, newState: event.status, metadata: {} },
    { activityId: `${event.eventId}-workflow-linked`, actorType: 'SYSTEM', action: 'workflow_linked', eventId: event.eventId, timestamp: event.createdAt, newState: 'READY_FOR_ORCHESTRATION', metadata: {} },
  ];
  const auditRows = [...activity.filter((row) => row.eventId === event.eventId), ...baseAuditRows];
  const canAcknowledge = canTransition(event.status, 'ACKNOWLEDGED');
  const canEscalate = canTransition(event.status, 'ESCALATED');
  const canAssign = canTransition(event.status, 'ASSIGNED') && assignablePersonnel.length > 0;
  const canStartWorkflow = canTransition(event.status, 'WORKFLOW_STARTED');
  const canResolve = canTransition(event.status, 'RESOLVED');
  const isResolved = event.status === 'RESOLVED';
  const assignedPersonnel = event.assignedPersonnelId ? personnel.find((person) => person.personnelId === event.assignedPersonnelId) : undefined;

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Event Detail</p>
        <h1>{event.title}</h1>
        <p className="lede">Full operational context for this event, including status, ownership, linked workflow, communications, action controls, and audit visibility.</p>
      </section>

      <section className="grid detail-grid compact-status-grid">
        <div className="card"><span>Status</span><strong>{event.status}</strong></div>
        <div className="card"><span>Priority</span><strong>{event.priority}</strong></div>
        <div className="card"><span>Severity</span><strong>{event.severity}</strong></div>
        <div className="card"><span>Owner</span><strong>{event.assignedPersonnelName ?? 'UNASSIGNED'}</strong></div>
      </section>

      <section className="workspace two-column">
        <div className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Operational Record</p>
              <h2>Event Details</h2>
            </div>
            <span className="status-pill high">{event.eventCategory}</span>
          </header>
          <div className="detail-list">
            <p><span>Event ID</span><strong>{event.eventId}</strong></p>
            <p><span>Type</span><strong>{event.eventType}</strong></p>
            <p><span>Created</span><strong>{formatDate(event.createdAt)}</strong></p>
            <p><span>Last Updated</span><strong>{event.updatedAt ? formatDate(event.updatedAt) : 'No updates yet.'}</strong></p>
            <p><span>Assigned Owner</span><strong>{event.assignedPersonnelName ? `${event.assignedPersonnelName} · ${event.assignedPersonnelRole}` : 'No owner assigned.'}</strong></p>
            <p><span>Availability Link</span><strong>{assignedPersonnel?.activeEventTitle ? `${assignedPersonnel.status} · ${assignedPersonnel.activeEventTitle}` : 'No linked active assignment.'}</strong></p>
            <p><span>Description</span><strong>{event.description || 'No description provided.'}</strong></p>
            <p><span>Operator Note</span><strong>{event.operatorNote || 'No operator note.'}</strong></p>
          </div>
        </div>

        <div className="panel warning-panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Operator Actions</p>
              <h2>Control Panel</h2>
            </div>
            <span className="status-pill">LOCAL</span>
          </header>
          <div className="detail-list">
            <p><span>Workflow Run</span><strong>workflow-{event.eventId}</strong></p>
            <p><span>Current Step</span><strong>{currentWorkflowStep(event.status)}</strong></p>
            <p><span>State Machine</span><strong>{isResolved ? 'Locked final state' : 'Transition controls active'}</strong></p>
            <p><span>Coverage Status</span><strong>{event.priority === 'URGENT' || event.priority === 'CRITICAL' ? 'Escalation watch' : 'Normal watch'}</strong></p>
          </div>
          <div className="assignment-box">
            <label htmlFor="owner-select">Assign Owner</label>
            <select id="owner-select" value={selectedPersonnelId} onChange={(changeEvent) => setSelectedPersonnelId(changeEvent.target.value)} disabled={!canAssign}>
              {personnel.map((person) => {
                const available = isPersonnelAvailable(person, event.eventId);
                return (
                  <option key={person.personnelId} value={person.personnelId} disabled={!available}>
                    {person.displayName} · {person.roleTitle} · {available ? person.status : `Unavailable (${person.status})`}
                  </option>
                );
              })}
            </select>
            <button className="button primary" type="button" onClick={assignOwner} disabled={!canAssign}>Assign Owner</button>
            <p className="muted-small">
              {isResolved
                ? 'Resolved events are locked.'
                : canAssign
                ? 'Only available personnel can be assigned. Assignments update the availability board.'
                : 'Acknowledge/escalate first, and make sure at least one person is available.'}
            </p>
          </div>
          <div className="action-row">
            <button className="button secondary" type="button" disabled={!canAcknowledge} onClick={() => applyEventAction('acknowledge')}>Acknowledge Event</button>
            <button className="button secondary" type="button" disabled={!canEscalate} onClick={() => applyEventAction('escalate')}>Escalate Event</button>
            <button className="button secondary" type="button" disabled={!canStartWorkflow} onClick={() => applyEventAction('start_workflow')}>Start Workflow</button>
            <button className="button secondary" type="button" disabled={!canResolve} onClick={() => applyEventAction('resolve')}>Resolve Event</button>
          </div>
        </div>
      </section>

      <section className="workspace two-column">
        <div className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Communications</p>
              <h2>Message Timeline</h2>
            </div>
          </header>
          <div className="timeline">
            <div className="timeline-item"><time>{formatDate(event.createdAt)}</time><div><strong>Outbound SMS prepared</strong><p>Coverage needed. Reply YES to accept.</p></div><span className="dot attention" /></div>
            <div className="timeline-item"><time>{formatDate(event.createdAt)}</time><div><strong>Inbound channel ready</strong><p>Responses will attach back to this event.</p></div><span className="dot" /></div>
            {event.assignedPersonnelName ? <div className="timeline-item"><time>{formatDate(event.assignedAt ?? event.updatedAt ?? event.createdAt)}</time><div><strong>Owner assignment ready</strong><p>{event.assignedPersonnelName} can now be used for follow-up outreach.</p></div><span className="dot urgent" /></div> : null}
          </div>
        </div>

        <div className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Audit Trail</p>
              <h2>Recorded Actions</h2>
            </div>
            <span className="status-pill">{auditRows.length} entries</span>
          </header>
          <div className="table">
            {auditRows.map((row) => (
              <div className="table-row audit-row" key={row.activityId}>
                <span>{actionLabel(row.action)}</span>
                <span>{row.actorType}</span>
                <span>{row.newState ?? 'recorded'}</span>
                <span>{formatDate(row.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="action-row">
        <a className="button secondary" href="/events">Back to Events</a>
        <a className="button secondary" href="/personnel">Open Personnel</a>
        <a className="button secondary" href="/activity">Open Activity</a>
        <a className="button secondary" href="/workflows">Open Workflows</a>
      </div>
    </main>
  );
}
