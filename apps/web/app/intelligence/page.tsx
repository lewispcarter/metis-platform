'use client';

import { useEffect, useMemo, useState } from 'react';

type LocalEvent = {
  eventId: string;
  title: string;
  eventType?: string;
  eventCategory?: string;
  status: string;
  priority: string;
  severity: string;
  source?: string;
  description?: string;
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

type WorkloadInsight = {
  personnelId: string;
  name: string;
  role: string;
  status: string;
  activeAssignments: number;
  resolvedAssignments: number;
  totalAssignments: number;
  score: number;
  recommendation: string;
  warning: string;
};

const EVENTS_STORAGE_KEY = 'metis.systems.local.events.v27';
const PERSONNEL_STORAGE_KEY = 'metis.systems.local.personnel.v30';

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
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function isOpenEvent(event: LocalEvent) {
  return !['RESOLVED', 'CLOSED', 'ARCHIVED'].includes(event.status);
}

function isAssignedEvent(event: LocalEvent) {
  return Boolean(event.assignedPersonnelId) && isOpenEvent(event);
}

function getRecommendation(insight: WorkloadInsight) {
  if (insight.status === 'Unavailable' || insight.status === 'Off Shift' || insight.status === 'Busy') {
    return 'Do not assign';
  }

  if (insight.activeAssignments >= 2) {
    return 'Avoid unless urgent';
  }

  if (insight.activeAssignments === 1) {
    return 'Secondary option';
  }

  if (insight.status === 'On Call') {
    return 'Strong option';
  }

  return 'Best option';
}

function getWarning(insight: Omit<WorkloadInsight, 'recommendation' | 'warning'>) {
  if (insight.activeAssignments >= 2) return 'Overloaded';
  if (insight.activeAssignments === 1) return 'Already assigned';
  if (insight.status === 'Unavailable' || insight.status === 'Off Shift' || insight.status === 'Busy') return 'Unavailable';
  return 'Healthy';
}

export default function IntelligencePage() {
  const [events, setEvents] = useState<LocalEvent[]>(fallbackEvents);
  const [personnel, setPersonnel] = useState<LocalPersonnel[]>(fallbackPersonnel);

  function refreshIntelligence() {
    setEvents(readJson<LocalEvent[]>(EVENTS_STORAGE_KEY, fallbackEvents));
    setPersonnel(readJson<LocalPersonnel[]>(PERSONNEL_STORAGE_KEY, fallbackPersonnel));
  }

  useEffect(() => {
    refreshIntelligence();

    window.addEventListener('focus', refreshIntelligence);
    window.addEventListener('storage', refreshIntelligence);
    window.addEventListener('pageshow', refreshIntelligence);

    return () => {
      window.removeEventListener('focus', refreshIntelligence);
      window.removeEventListener('storage', refreshIntelligence);
      window.removeEventListener('pageshow', refreshIntelligence);
    };
  }, []);

  const intelligence = useMemo(() => {
    const openEvents = events.filter(isOpenEvent);
    const assignedEvents = events.filter(isAssignedEvent);
    const unassignedEvents = openEvents.filter((event) => !event.assignedPersonnelId);
    const urgentUnassignedEvents = unassignedEvents.filter((event) => event.priority === 'URGENT' || event.priority === 'CRITICAL');

    const assignedPersonnelIds = new Set(
      assignedEvents
        .map((event) => event.assignedPersonnelId)
        .filter(Boolean) as string[],
    );

    const availabilityPool = personnel.filter(
      (person) =>
        (person.status === 'Available' || person.status === 'On Call') &&
        !assignedPersonnelIds.has(person.personnelId),
    );

    const workload: WorkloadInsight[] = personnel
      .map((person) => {
        const activeAssignments = assignedEvents.filter((event) => event.assignedPersonnelId === person.personnelId).length;
        const resolvedAssignments = events.filter(
          (event) => event.status === 'RESOLVED' && event.assignedPersonnelId === person.personnelId,
        ).length;
        const totalAssignments = events.filter((event) => event.assignedPersonnelId === person.personnelId).length;

        const baseScore = 100;
        const activePenalty = activeAssignments * 35;
        const unavailablePenalty = ['Unavailable', 'Off Shift', 'Busy'].includes(person.status) ? 60 : 0;
        const historyPenalty = Math.min(resolvedAssignments * 3, 15);
        const onCallBoost = person.status === 'On Call' ? 8 : 0;

        const score = Math.max(0, Math.min(100, baseScore - activePenalty - unavailablePenalty - historyPenalty + onCallBoost));

        const rawInsight = {
          personnelId: person.personnelId,
          name: person.displayName,
          role: person.roleTitle,
          status: assignedPersonnelIds.has(person.personnelId) ? 'Assigned' : person.status,
          activeAssignments,
          resolvedAssignments,
          totalAssignments,
          score,
        };

        const warning = getWarning(rawInsight);
        const recommendation = getRecommendation({ ...rawInsight, warning, recommendation: '' });

        return {
          ...rawInsight,
          warning,
          recommendation,
        };
      })
      .sort((left, right) => right.score - left.score);

    const bestCandidate = workload.find((candidate) => candidate.recommendation === 'Best option' || candidate.recommendation === 'Strong option');

    return {
      openEvents,
      assignedEvents,
      unassignedEvents,
      urgentUnassignedEvents,
      availabilityPool,
      workload,
      bestCandidate,
      eventToPersonnelRatio:
        personnel.length === 0 ? 0 : Number((openEvents.length / personnel.length).toFixed(2)),
    };
  }, [events, personnel]);

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">V38 · Operational Decision Support</p>
        <h1>Workload Intelligence</h1>
        <p className="lede">
          Assignment balancing, workload scores, coverage gap alerts, and staffing health for the command center.
        </p>
      </section>

      <section className="grid" aria-label="Workload intelligence summary">
        <article className="card">
          <span>Best Candidate</span>
          <strong>{intelligence.bestCandidate?.name ?? 'None'}</strong>
        </article>
        <article className="card attention">
          <span>Coverage Gaps</span>
          <strong>{intelligence.unassignedEvents.length}</strong>
        </article>
        <article className="card critical">
          <span>Urgent Gaps</span>
          <strong>{intelligence.urgentUnassignedEvents.length}</strong>
        </article>
        <article className="card">
          <span>Event/Personnel Ratio</span>
          <strong>{intelligence.eventToPersonnelRatio}</strong>
        </article>
      </section>

      <section className="workspace two-column">
        <section className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Recommendation Engine</p>
              <h2>Who should I assign?</h2>
            </div>
            <button className="status-pill" type="button" onClick={refreshIntelligence}>Refresh</button>
          </header>

          <div className="intelligence-list">
            {intelligence.workload.map((person) => (
              <article className="intelligence-item" key={person.personnelId}>
                <div>
                  <h3>{person.name}</h3>
                  <p>{person.role} · {person.status}</p>
                  <p className="muted">
                    Active: {person.activeAssignments} · Total: {person.totalAssignments} · Prior resolved: {person.resolvedAssignments}
                  </p>
                </div>

                <div className="score-block">
                  <strong>{person.score}</strong>
                  <span>{person.recommendation}</span>
                  <small>{person.warning}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <div>
              <p className="eyebrow">Coverage Risk</p>
              <h2>Open gaps</h2>
            </div>
            <span className="status-pill">{intelligence.unassignedEvents.length} gaps</span>
          </header>

          <div className="timeline">
            {intelligence.unassignedEvents.length === 0 ? (
              <article className="alert-box">
                <strong>No open coverage gaps.</strong>
                <p>All current open events have assigned owners.</p>
              </article>
            ) : (
              intelligence.unassignedEvents.map((event) => (
                <article className="timeline-item" key={event.eventId}>
                  <time>{event.priority}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.status} · {event.severity}</p>
                    <p>{event.description}</p>
                  </div>
                  <span className={`dot ${event.priority.toLowerCase()}`} />
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Staffing Health</p>
            <h2>Assignment balance</h2>
          </div>
          <span className="status-pill">{intelligence.availabilityPool.length} available now</span>
        </header>

        <div className="data-table" role="table" aria-label="Assignment balance table">
          <div className="data-row heading" role="row">
            <span>Personnel</span>
            <span>Status</span>
            <span>Score</span>
            <span>Recommendation</span>
            <span>Active</span>
            <span>Warning</span>
          </div>
          {intelligence.workload.map((person) => (
            <div className="data-row" role="row" key={`balance-${person.personnelId}`}>
              <strong>{person.name}</strong>
              <span>{person.status}</span>
              <span>{person.score}</span>
              <span>{person.recommendation}</span>
              <span>{person.activeAssignments}</span>
              <span>{person.warning}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
