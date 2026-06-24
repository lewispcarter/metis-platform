'use client';

import { useEffect, useMemo, useState } from 'react';

type LocalPersonnel = {
  personnelId: string;
  displayName: string;
  roleTitle: string;
  status: string;
  activeEventId?: string;
  activeEventTitle?: string;
  lastAssignedAt?: string;
};

type LocalEvent = {
  eventId: string;
  title: string;
  status: string;
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

const PERSONNEL_STORAGE_KEY = 'metis.systems.local.personnel.v30';
const EVENTS_STORAGE_KEY = 'metis.systems.local.events.v27';
const ACTIVITY_STORAGE_KEY = 'metis.systems.local.activity.v28';

const fallbackPersonnel: LocalPersonnel[] = [
  { personnelId: 'demo-personnel-1', displayName: 'A. Johnson', roleTitle: 'LPN', status: 'Available' },
  { personnelId: 'demo-personnel-2', displayName: 'M. Carter', roleTitle: 'RN', status: 'Available' },
  { personnelId: 'demo-personnel-3', displayName: 'S. Lee', roleTitle: 'Supervisor', status: 'Available' },
];

const availabilityStatuses = ['Available', 'On Call', 'Busy', 'Off Shift', 'Unavailable'];

function normalizePersonnel(personnel: LocalPersonnel[]): LocalPersonnel[] {
  return personnel.map((person) => ({
    ...person,
    status: person.status === 'On Assignment' ? 'Available' : person.status,
  }));
}

function readPersonnel(): LocalPersonnel[] {
  if (typeof window === 'undefined') return fallbackPersonnel;

  try {
    const raw = window.localStorage.getItem(PERSONNEL_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(fallbackPersonnel));
      return fallbackPersonnel;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizePersonnel(parsed as LocalPersonnel[]) : fallbackPersonnel;
  } catch {
    return fallbackPersonnel;
  }
}

function writePersonnel(personnel: LocalPersonnel[]) {
  window.localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(personnel));
}

function readEvents(): LocalEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalEvent[]) : [];
  } catch {
    return [];
  }
}

function readActivity(): LocalActivity[] {
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
  const current = readActivity();
  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify([record, ...current]));
}

function formatDate(value?: string) {
  if (!value) return 'Not assigned';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<LocalPersonnel[]>(fallbackPersonnel);
  const [events, setEvents] = useState<LocalEvent[]>([]);

  function refreshPersonnelBoard() {
    setPersonnel(readPersonnel());
    setEvents(readEvents());
  }

  useEffect(() => {
    refreshPersonnelBoard();

    function handleRefreshSignal() {
      refreshPersonnelBoard();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        refreshPersonnelBoard();
      }
    }

    window.addEventListener('focus', handleRefreshSignal);
    window.addEventListener('pageshow', handleRefreshSignal);
    window.addEventListener('storage', handleRefreshSignal);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleRefreshSignal);
      window.removeEventListener('pageshow', handleRefreshSignal);
      window.removeEventListener('storage', handleRefreshSignal);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const assignmentsByPersonnel = useMemo(() => {
    return events.reduce<Record<string, LocalEvent[]>>((index, event) => {
      if (!event.assignedPersonnelId) return index;
      index[event.assignedPersonnelId] = [...(index[event.assignedPersonnelId] ?? []), event];
      return index;
    }, {});
  }, [events]);

  const assignedPersonnelIds = new Set(
    events
      .filter((event) => Boolean(event.assignedPersonnelId) && event.status !== 'RESOLVED')
      .map((event) => event.assignedPersonnelId as string)
  );

  const assignedCount = assignedPersonnelIds.size;

  const availableCount = personnel.filter(
    (person) =>
      (person.status === 'Available' || person.status === 'On Call') &&
      !assignedPersonnelIds.has(person.personnelId)
  ).length;

  const unavailableCount = personnel.filter(
    (person) =>
      !assignedPersonnelIds.has(person.personnelId) &&
      person.status !== 'Available' &&
      person.status !== 'On Call'
  ).length;

  function updateAvailability(personnelId: string, nextStatus: string) {
    const person = personnel.find((item) => item.personnelId === personnelId);
    if (!person) return;

    const now = new Date().toISOString();
    const nextPersonnel = personnel.map((item) => {
      if (item.personnelId !== personnelId) return item;

      if (nextStatus === 'Available' || nextStatus === 'On Call') {
        return {
          ...item,
          status: nextStatus,
          activeEventId: undefined,
          activeEventTitle: undefined,
        };
      }

      return {
        ...item,
        status: nextStatus,
      };
    });

    writePersonnel(nextPersonnel);
    setPersonnel(nextPersonnel);

    writeActivity({
      activityId: `activity-${Date.now()}`,
      actorType: 'USER',
      actorId: 'local-operator',
      action: 'personnel_availability_updated',
      previousState: person.status,
      newState: nextStatus,
      timestamp: now,
      metadata: {
        personnelId,
        displayName: person.displayName,
        roleTitle: person.roleTitle,
        source: 'personnel_availability_board',
      },
    });
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Personnel Coordination</p>
        <h1>Availability Board</h1>
        <p className="lede">Track the people who can accept work, cover gaps, and own operational outcomes.</p>
      </section>

      <section className="grid detail-grid compact-status-grid">
        <div className="card"><span>Available</span><strong>{availableCount}</strong></div>
        <div className="card"><span>Assigned</span><strong>{assignedCount}</strong></div>
        <div className="card"><span>Unavailable</span><strong>{unavailableCount}</strong></div>
        <div className="card"><span>Total Personnel</span><strong>{personnel.length}</strong></div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div><p className="eyebrow">Directory</p><h2>Operational Personnel</h2></div>
          <div className="header-actions">
            <button className="button secondary compact-button" type="button" onClick={refreshPersonnelBoard}>
              Refresh Board
            </button>
            <span className="status-pill">{personnel.length} records</span>
          </div>
        </header>
        <div className="personnel-grid">
          {personnel.map((person) => {
            const assignments = assignmentsByPersonnel[person.personnelId] ?? [];
            const isAssigned = assignedPersonnelIds.has(person.personnelId);
            const activeAssignment = person.activeEventTitle ?? assignments[0]?.title;
            return (
              <article className="person-card" key={person.personnelId}>
                <div>
                  <strong>{person.displayName}</strong>
                  <p>{person.roleTitle}</p>
                  {activeAssignment ? (
                    <p className="muted-small">Assigned: {activeAssignment}</p>
                  ) : (
                    <p className="muted-small">No active local assignment.</p>
                  )}
                  {person.lastAssignedAt ? <p className="muted-small">Last assignment update: {formatDate(person.lastAssignedAt)}</p> : null}
                </div>
                <div className="assignment-box">
                  <span className="status-pill">{isAssigned ? 'Assigned' : person.status}</span>
                  <select
                    aria-label={`Availability for ${person.displayName}`}
                    value={person.status}
                    onChange={(event) => updateAvailability(person.personnelId, event.target.value)}
                  >
                    {availabilityStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div><p className="eyebrow">Active Assignments</p><h2>Coverage Ownership</h2></div>
          <span className="status-pill">{events.filter((event) => event.assignedPersonnelId && event.status !== 'RESOLVED').length} assigned events</span>
        </header>
        <div className="table">
          {events.filter((event) => event.assignedPersonnelId && event.status !== 'RESOLVED').length === 0 ? (
            <div className="table-row"><span>No active assignments yet.</span><span>Assign an owner from an event detail page.</span></div>
          ) : (
            events.filter((event) => event.assignedPersonnelId && event.status !== 'RESOLVED').map((event) => (
              <div className="table-row" key={event.eventId}>
                <span><a className="row-link" href={`/events/${event.eventId}`}>{event.title}</a></span>
                <span>{event.assignedPersonnelName}</span>
                <span>{event.status}</span>
                <span>{formatDate(event.assignedAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
