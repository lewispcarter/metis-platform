'use client';

export type EventStatus = 'CREATED' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'WORKFLOW_STARTED' | 'ESCALATED' | 'RESOLVED';

export type V36Event = {
  eventId: string;
  id?: string;
  title: string;
  type?: string;
  category?: string;
  priority: string;
  severity: string;
  status: EventStatus | string;
  source?: string;
  description?: string;
  assignedPersonnelId?: string;
  assignedOwner?: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  auditTrail?: V36Audit[];
  communications?: V36Communication[];
};

export type V36Personnel = {
  personnelId: string;
  id?: string;
  name: string;
  role: string;
  department?: string;
  status: string;
  phone?: string;
  email?: string;
  activeEventId?: string;
  activeEventTitle?: string;
  updatedAt?: string;
};

export type V36Audit = {
  auditId: string;
  eventId: string;
  action: string;
  actor: string;
  detail: string;
  createdAt: string;
};

export type V36Communication = {
  communicationId: string;
  eventId: string;
  channel: 'Internal Note' | 'SMS' | 'Email' | 'Voice';
  direction: 'Internal' | 'Inbound' | 'Outbound';
  sender: string;
  recipient: string;
  body: string;
  status: 'Logged' | 'Sent' | 'Delivered' | 'Failed';
  createdAt: string;
};

const EVENTS_KEY = 'metis.systems.local.events.v36';
const PERSONNEL_KEY = 'metis.systems.local.personnel.v36';
const AUDIT_KEY = 'metis.systems.local.audit.v36';
const COMMUNICATIONS_KEY = 'metis.systems.local.communications.v36';

const LEGACY_EVENT_KEYS = [
  'metis.systems.local.events.v35',
  'metis.systems.local.events.v34',
  'metis.systems.local.events.v33',
  'metis.systems.local.events.v32',
  'metis.systems.local.events.v31',
  'metis.systems.local.events.v30',
  'metis.systems.local.events.v27',
];

const LEGACY_PERSONNEL_KEYS = [
  'metis.systems.local.personnel.v35',
  'metis.systems.local.personnel.v34',
  'metis.systems.local.personnel.v33',
  'metis.systems.local.personnel.v32',
  'metis.systems.local.personnel.v31',
  'metis.systems.local.personnel.v30',
  'metis.systems.local.personnel.v27',
];

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function now() {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('metis-v36-store-updated'));
}

const fallbackPersonnel: V36Personnel[] = [
  { personnelId: 'personnel-a-johnson', id: 'personnel-a-johnson', name: 'A. Johnson', role: 'LPN', department: 'Clinical Operations', status: 'Available', phone: '555-0101', email: 'a.johnson@example.com' },
  { personnelId: 'personnel-m-carter', id: 'personnel-m-carter', name: 'M. Carter', role: 'RN', department: 'Clinical Operations', status: 'Available', phone: '555-0102', email: 'm.carter@example.com' },
  { personnelId: 'personnel-s-lee', id: 'personnel-s-lee', name: 'S. Lee', role: 'Care Coordinator', department: 'Care Operations', status: 'Available', phone: '555-0103', email: 's.lee@example.com' },
];

const fallbackEvents: V36Event[] = [
  { eventId: 'event-employee-calloff', id: 'event-employee-calloff', title: 'Employee Call-Off', type: 'employee_calloff', category: 'STAFFING', priority: 'URGENT', severity: 'S2_HIGH', status: 'CREATED', source: 'Local Operator', description: 'Employee call-off requires coverage coordination.', createdAt: now(), updatedAt: now(), auditTrail: [], communications: [] },
];

export function migrateV36() {
  if (!hasStorage()) return;

  if (!window.localStorage.getItem(EVENTS_KEY)) {
    for (const key of LEGACY_EVENT_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        window.localStorage.setItem(EVENTS_KEY, raw);
        break;
      }
    }
  }

  if (!window.localStorage.getItem(PERSONNEL_KEY)) {
    for (const key of LEGACY_PERSONNEL_KEYS) {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        window.localStorage.setItem(PERSONNEL_KEY, raw);
        break;
      }
    }
  }
}

export function readV36Events(): V36Event[] {
  migrateV36();
  return readJson<V36Event[]>(EVENTS_KEY, fallbackEvents).map((event) => ({
    ...event,
    eventId: event.eventId ?? event.id ?? `event-${Date.now()}`,
    id: event.id ?? event.eventId,
    auditTrail: event.auditTrail ?? [],
    communications: event.communications ?? [],
  }));
}

export function writeV36Events(events: V36Event[]) {
  writeJson(EVENTS_KEY, events);
}

export function readV36Personnel(): V36Personnel[] {
  migrateV36();
  return readJson<V36Personnel[]>(PERSONNEL_KEY, fallbackPersonnel).map((person) => ({
    ...person,
    personnelId: person.personnelId ?? person.id ?? `personnel-${Date.now()}`,
    id: person.id ?? person.personnelId,
  }));
}

export function writeV36Personnel(personnel: V36Personnel[]) {
  writeJson(PERSONNEL_KEY, personnel);
}

export function readV36Audit(): V36Audit[] {
  return readJson<V36Audit[]>(AUDIT_KEY, []);
}

export function writeV36Audit(audit: V36Audit[]) {
  writeJson(AUDIT_KEY, audit);
}

export function readV36Communications(): V36Communication[] {
  return readJson<V36Communication[]>(COMMUNICATIONS_KEY, []);
}

export function writeV36Communications(communications: V36Communication[]) {
  writeJson(COMMUNICATIONS_KEY, communications);
}

export function appendV36Audit(eventId: string, action: string, detail: string, actor = 'Local Operator') {
  const entry: V36Audit = {
    auditId: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    eventId,
    action,
    actor,
    detail,
    createdAt: now(),
  };

  writeV36Audit([entry, ...readV36Audit()]);
  writeV36Events(
    readV36Events().map((event) =>
      event.eventId === eventId
        ? { ...event, auditTrail: [entry, ...(event.auditTrail ?? [])], updatedAt: now() }
        : event,
    ),
  );

  return entry;
}

export function updateV36Event(eventId: string, patch: Partial<V36Event>) {
  let updated: V36Event | undefined;
  writeV36Events(
    readV36Events().map((event) => {
      if (event.eventId !== eventId && event.id !== eventId) return event;
      updated = { ...event, ...patch, updatedAt: now() };
      return updated;
    }),
  );
  return updated;
}

export function getV36Event(eventId: string) {
  return readV36Events().find((event) => event.eventId === eventId || event.id === eventId);
}

export function createV36Communication(eventId: string, body: string, channel: V36Communication['channel'] = 'Internal Note') {
  const communication: V36Communication = {
    communicationId: `comm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    eventId,
    channel,
    direction: 'Internal',
    sender: 'Local Operator',
    recipient: 'Operations',
    body,
    status: 'Logged',
    createdAt: now(),
  };

  writeV36Communications([communication, ...readV36Communications()]);
  const event = getV36Event(eventId);
  if (event) {
    updateV36Event(eventId, { communications: [communication, ...(event.communications ?? [])] });
  }
  appendV36Audit(eventId, 'communication_logged', `Logged ${channel} communication.`);
  return communication;
}

export function getV36EventCommunications(eventId: string) {
  return readV36Communications().filter((communication) => communication.eventId === eventId);
}

export function getV36AssignedPersonnelIds() {
  return new Set(
    readV36Events()
      .filter((event) => event.status !== 'RESOLVED' && Boolean(event.assignedPersonnelId))
      .map((event) => event.assignedPersonnelId as string),
  );
}

export function reconcileV36PersonnelAssignments() {
  const events = readV36Events();
  const activeAssignments = new Map<string, V36Event>();

  for (const event of events) {
    if (event.status !== 'RESOLVED' && event.assignedPersonnelId) {
      activeAssignments.set(event.assignedPersonnelId, event);
    }
  }

  writeV36Personnel(
    readV36Personnel().map((person) => {
      const event = activeAssignments.get(person.personnelId);
      if (!event && person.status === 'Assigned') {
        return { ...person, status: 'Available', activeEventId: undefined, activeEventTitle: undefined, updatedAt: now() };
      }

      if (event) {
        return { ...person, status: 'Assigned', activeEventId: event.eventId, activeEventTitle: event.title, updatedAt: now() };
      }

      return person;
    }),
  );
}
