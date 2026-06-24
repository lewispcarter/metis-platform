'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type SubmitState = 'idle' | 'saving' | 'saved' | 'error';

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
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackEvents;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalEvent[]) : fallbackEvents;
  } catch {
    return fallbackEvents;
  }
}

function writeLocalEvent(event: LocalEvent) {
  const current = readLocalEvents();
  const next = [event, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export default function CreateEventPage() {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  async function submitEvent(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setState('saving');
    setMessage('Creating operational event...');

    const form = new FormData(formEvent.currentTarget);
    const event: LocalEvent = {
      eventId: `local-event-${Date.now()}`,
      title: String(form.get('title') ?? '').trim(),
      eventType: String(form.get('eventType') ?? '').trim(),
      eventCategory: String(form.get('eventCategory') ?? 'STAFFING'),
      priority: String(form.get('priority') ?? 'NORMAL'),
      severity: String(form.get('severity') ?? 'S3_MEDIUM'),
      source: String(form.get('source') ?? 'LOCAL_OPERATOR').trim() || 'LOCAL_OPERATOR',
      description: String(form.get('description') ?? '').trim(),
      operatorNote: String(form.get('operatorNote') ?? '').trim(),
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    };

    if (!event.title || !event.eventType) {
      setState('error');
      setMessage('Title and event type are required.');
      return;
    }

    try {
      writeLocalEvent(event);
      setState('saved');
      setMessage(`Created: ${event.title}`);
      setTimeout(() => router.push('/events'), 350);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Create failed.');
    }
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">V27 Event Detail Creation</p>
        <h1>Create Event</h1>
        <p className="lede">Create an operational event that survives browser refresh through local persistent storage.</p>
      </section>

      <section className="panel form-panel">
        <form className="event-form" onSubmit={submitEvent}>
          <label>
            <span>Title</span>
            <input name="title" defaultValue="Coverage Gap: Evening Shift" placeholder="Employee call-off, outage, escalation..." required />
          </label>

          <label>
            <span>Event Type</span>
            <input name="eventType" defaultValue="coverage_gap" placeholder="coverage_gap" required />
          </label>

          <label>
            <span>Category</span>
            <select name="eventCategory" defaultValue="STAFFING">
              <option value="STAFFING">STAFFING</option>
              <option value="WORKFLOW">WORKFLOW</option>
              <option value="COMMUNICATION">COMMUNICATION</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
              <option value="INCIDENT">INCIDENT</option>
              <option value="DISPATCH">DISPATCH</option>
              <option value="APPROVAL">APPROVAL</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="COMPLIANCE">COMPLIANCE</option>
            </select>
          </label>

          <label>
            <span>Priority</span>
            <select name="priority" defaultValue="URGENT">
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>

          <label>
            <span>Severity</span>
            <select name="severity" defaultValue="S2_HIGH">
              <option value="S1_CRITICAL">S1_CRITICAL</option>
              <option value="S2_HIGH">S2_HIGH</option>
              <option value="S3_MEDIUM">S3_MEDIUM</option>
              <option value="S4_LOW">S4_LOW</option>
            </select>
          </label>

          <label>
            <span>Source</span>
            <input name="source" defaultValue="LOCAL_OPERATOR" />
          </label>

          <label className="full-span">
            <span>Description</span>
            <textarea name="description" defaultValue="A staffing coverage gap was reported and needs operational response." />
          </label>

          <label className="full-span">
            <span>Operator Note</span>
            <textarea name="operatorNote" placeholder="Optional internal note." />
          </label>

          <div className="form-actions full-span">
            <button className="button primary" type="submit" disabled={state === 'saving'}>
              {state === 'saving' ? 'Creating...' : 'Create Event'}
            </button>
            <a className="button secondary" href="/events">Back to Events</a>
          </div>

          {message ? <p className={`form-message ${state}`}>{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
