'use client';

import { useEffect, useMemo, useState } from 'react';

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
  assignedPersonnelId?: string;
  assignedPersonnelName?: string;
  assignedPersonnelRole?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
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

const EVENTS_STORAGE_KEY = 'metis.systems.local.events.v27';
const PERSONNEL_STORAGE_KEY = 'metis.systems.local.personnel.v30';
const ACTIVITY_STORAGE_KEY = 'metis.systems.local.activity.v28';

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
    assignedPersonnelId: 'demo-personnel-1',
    assignedPersonnelName: 'A. Johnson',
    assignedPersonnelRole: 'LPN',
    assignedAt: '2026-06-18T18:10:57.000Z',
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

const fallbackPersonnel: LocalPersonnel[] = [
  { personnelId: 'demo-personnel-1', displayName: 'A. Johnson', roleTitle: 'LPN', status: 'Assigned', activeEventId: 'demo-event-1', activeEventTitle: 'Employee Call-Off' },
  { personnelId: 'demo-personnel-2', displayName: 'M. Carter', roleTitle: 'RN', status: 'Available' },
  { personnelId: 'demo-personnel-3', displayName: 'S. Lee', roleTitle: 'Supervisor', status: 'Available' },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function formatTime(value?: string) {
  if (!value) return 'No timestamp';
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
}

function formatDateTime(value?: string) {
  if (!value) return 'No timestamp';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function normalizePriority(priority: string) {
  return priority.toLowerCase().replaceAll('_', '-');
}

function isOpenEvent(event: LocalEvent) {
  return !['RESOLVED', 'CLOSED', 'ARCHIVED'].includes(event.status);
}

function isAssignedEvent(event: LocalEvent) {
  return Boolean(event.assignedPersonnelId) && event.status !== 'RESOLVED';
}

export default function HomePage() {
  const [events, setEvents] = useState<LocalEvent[]>(fallbackEvents);
  const [personnel, setPersonnel] = useState<LocalPersonnel[]>(fallbackPersonnel);
  const [activity, setActivity] = useState<LocalActivity[]>([]);

  useEffect(() => {
    function loadDashboardState() {
      const loadedEvents = readJson<LocalEvent[]>(EVENTS_STORAGE_KEY, fallbackEvents);
      const loadedPersonnel = readJson<LocalPersonnel[]>(PERSONNEL_STORAGE_KEY, fallbackPersonnel);
      const loadedActivity = readJson<LocalActivity[]>(ACTIVITY_STORAGE_KEY, []);
      setEvents(Array.isArray(loadedEvents) ? loadedEvents : fallbackEvents);
      setPersonnel(Array.isArray(loadedPersonnel) ? loadedPersonnel : fallbackPersonnel);
      setActivity(Array.isArray(loadedActivity) ? loadedActivity : []);
    }

    loadDashboardState();
    window.addEventListener('focus', loadDashboardState);
    window.addEventListener('storage', loadDashboardState);
    return () => {
      window.removeEventListener('focus', loadDashboardState);
      window.removeEventListener('storage', loadDashboardState);
    };
  }, []);

  const dashboard = useMemo(() => {
    const openEvents = events.filter(isOpenEvent);
    const resolvedEvents = events.filter((event) => event.status === 'RESOLVED');
    const urgentEvents = openEvents.filter((event) => event.priority === 'URGENT' || event.priority === 'CRITICAL');
    const escalatedEvents = openEvents.filter((event) => event.status === 'ESCALATED' || event.priority === 'CRITICAL');
    const assignedEvents = openEvents.filter(isAssignedEvent);
    const unassignedEvents = openEvents.filter((event) => !event.assignedPersonnelId);
    const activeWorkflows = openEvents.filter((event) => ['WORKFLOW_STARTED', 'ASSIGNED', 'ESCALATED'].includes(event.status));

    const assignedPersonnelIds = new Set(
      events
        .filter(isAssignedEvent)
        .map((event) => event.assignedPersonnelId)
        .filter(Boolean) as string[],
    );

    const availablePersonnel = personnel.filter(
      (person) =>
        (person.status === 'Available' || person.status === 'On Call') &&
        !assignedPersonnelIds.has(person.personnelId),
    );

    const unavailablePersonnel = personnel.filter(
      (person) =>
        !assignedPersonnelIds.has(person.personnelId) &&
        person.status !== 'Available' &&
        person.status !== 'On Call',
    );

    return {
      openEvents,
      resolvedEvents,
      urgentEvents,
      escalatedEvents,
      assignedEvents,
      unassignedEvents,
      activeWorkflows,
      assignedPersonnelIds,
      availablePersonnel,
      unavailablePersonnel,
    };
  }, [events, personnel]);

  const timelineEvents = [...events]
    .sort((left, right) => new Date(right.updatedAt ?? right.createdAt).getTime() - new Date(left.updatedAt ?? left.createdAt).getTime())
    .slice(0, 6);

  const recentActivity = [...activity]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 5);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Operational Response Infrastructure · V35</p>
        <h1>Metis Systems Command Dashboard</h1>
        <p className="lede">
          Live local command metrics driven by the same events, assignments, personnel availability, and audit trail used across the platform.
        </p>
      </section>

      <section className="grid" aria-label="Operational summary">
        <article className="card critical"><span>Open Events</span><strong>{dashboard.openEvents.length}</strong></article>
        <article className="card"><span>Assigned Events</span><strong>{dashboard.assignedEvents.length}</strong></article>
        <article className="card attention"><span>Urgent/Critical</span><strong>{dashboard.urgentEvents.length}</strong></article>
        <article className="card"><span>Available Personnel</span><strong>{dashboard.availablePersonnel.length}</strong></article>
      </section>

      <section className="grid" aria-label="Operational health">
        <article className="card"><span>Active Workflows</span><strong>{dashboard.activeWorkflows.length}</strong></article>
        <article className="card attention"><span>Unassigned Open Events</span><strong>{dashboard.unassignedEvents.length}</strong></article>
        <article className="card"><span>Resolved Events</span><strong>{dashboard.resolvedEvents.length}</strong></article>
        <article className="card"><span>Audit Entries</span><strong>{activity.length}</strong></article>
      </section>

      <section className="workspace">
        <article className="panel timeline-panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Live Event Feed</p>
              <h2>Operational Timeline</h2>
            </div>
            <span className="status-pill urgent">Local Live</span>
          </header>
          <div className="timeline">
            {timelineEvents.map((event) => (
              <div className="timeline-item" key={event.eventId}>
                <time>{formatTime(event.updatedAt ?? event.createdAt)}</time>
                <div>
                  <strong><a className="row-link" href={`/events/${event.eventId}`}>{event.title}</a></strong>
                  <p>{event.eventType} · {event.status} · {event.assignedPersonnelName ?? 'Unassigned'}</p>
                </div>
                <span className={`dot ${normalizePriority(event.priority)}`} />
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Escalation Panel</p>
              <h2>Needs Attention</h2>
            </div>
            <span className="status-pill high">{dashboard.escalatedEvents.length} watch</span>
          </header>
          <div className="alert-box">
            <strong>
              {dashboard.escalatedEvents.length > 0
                ? 'Escalation pressure is active'
                : dashboard.unassignedEvents.length > 0
                ? 'Open events need owners'
                : 'No critical pressure detected'}
            </strong>
            <p>
              {dashboard.unassignedEvents.length} open event(s) are unassigned. {dashboard.availablePersonnel.length} person(s) are available to accept work.
            </p>
          </div>
        </article>
      </section>

      <section className="workspace two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Workflow Queue</p>
              <h2>Active Orchestration</h2>
            </div>
          </header>
          <div className="table">
            {dashboard.activeWorkflows.length === 0 ? (
              <div className="table-row"><span>No active workflows</span><span>Ready</span><span>closed</span><span>--</span></div>
            ) : (
              dashboard.activeWorkflows.map((event) => (
                <div className="table-row" key={event.eventId}>
                  <span><a className="row-link" href={`/events/${event.eventId}`}>{event.eventId.slice(0, 14)}</a></span>
                  <span>{event.status}</span>
                  <span>{event.assignedPersonnelName ?? 'Unassigned'}</span>
                  <span>{formatTime(event.updatedAt ?? event.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Personnel</p>
              <h2>Availability Board</h2>
            </div>
            <span className="status-pill">{personnel.length} total</span>
          </header>
          <div className="personnel-list">
            {personnel.map((person) => {
              const assignedEvent = events.find((event) => event.assignedPersonnelId === person.personnelId && event.status !== 'RESOLVED');
              const calculatedStatus = assignedEvent ? 'Assigned' : person.status;
              return (
                <div className="personnel-item" key={person.personnelId}>
                  <div>
                    <strong>{person.displayName}</strong>
                    <p>{person.roleTitle}{assignedEvent ? ` · ${assignedEvent.title}` : ''}</p>
                  </div>
                  <span className="status-pill">{calculatedStatus}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="workspace two-column">
        <article className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Audit Feed</p>
              <h2>Recent Recorded Actions</h2>
            </div>
            <span className="status-pill">{activity.length} entries</span>
          </header>
          <div className="table">
            {recentActivity.length === 0 ? (
              <div className="table-row"><span>No activity yet</span><span>--</span><span>--</span><span>--</span></div>
            ) : (
              recentActivity.map((record) => (
                <div className="table-row" key={record.activityId}>
                  <span>{record.action.replaceAll('_', ' ')}</span>
                  <span>{record.actorType}</span>
                  <span>{record.newState ?? 'recorded'}</span>
                  <span>{formatDateTime(record.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Command Links</p>
              <h2>Next Operator Moves</h2>
            </div>
          </header>
          <div className="action-row">
            <a className="button primary" href="/events/create">Create Event</a>
            <a className="button secondary" href="/events">Open Events</a>
            <a className="button secondary" href="/personnel">Open Personnel</a>
            <a className="button secondary" href="/activity">Open Activity</a>
          </div>
        </article>
      </section>
    </main>
  );
}
