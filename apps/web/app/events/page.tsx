'use client';

import { useEffect, useState } from 'react';

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
  assignedPersonnelName?: string;
  createdAt: string;
};

const STORAGE_KEY = 'metis.systems.local.events.v27';

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
    if (!Array.isArray(parsed)) return fallbackEvents;
    return parsed as LocalEvent[];
  } catch {
    return fallbackEvents;
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<LocalEvent[]>(fallbackEvents);

  useEffect(() => {
    setEvents(readLocalEvents());
  }, []);

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Event Center</p>
        <h1>Operational Events</h1>
        <p className="lede">Every workflow, communication, escalation, and audit trail starts here.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <a href="/events/create" className="status-pill high">+ Create Event</a>
          <div>
            <p className="eyebrow">Queue</p>
            <h2>Current Event Load</h2>
          </div>
          <span className="status-pill">{events.length} events</span>
        </header>
        <div className="data-table" role="table" aria-label="Operational events">
          <div className="data-row heading" role="row">
            <span>Title</span><span>Type</span><span>Status</span><span>Owner</span><span>Priority</span><span>Created</span>
          </div>
          {events.map((event) => (
            <div className="data-row" role="row" key={event.eventId}>
              <strong><a className="row-link" href={`/events/${event.eventId}`}>{event.title}</a></strong>
              <span>{event.eventType}</span>
              <span>{event.status}</span>
              <span>{event.assignedPersonnelName ?? 'Unassigned'}</span>
              <span className={`status-pill ${event.priority.toLowerCase()}`}>{event.priority}</span>
              <span>{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
