'use client';

import { useEffect, useState } from 'react';

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

const ACTIVITY_STORAGE_KEY = 'metis.systems.local.activity.v28';

const fallbackActivity: LocalActivity[] = [
  { activityId: 'demo-activity-1', actorType: 'USER', actorId: 'demo-owner', action: 'event_created', eventId: 'demo-event-1', newState: 'CREATED', timestamp: '2026-06-18T18:10:57.000Z', metadata: { role: 'Owner' } },
  { activityId: 'demo-activity-2', actorType: 'SYSTEM', action: 'workflow_started', eventId: 'demo-event-1', newState: 'STARTED', timestamp: '2026-06-18T18:10:57.000Z', metadata: { workflowRunId: 'demo-workflow-1' } },
];

function readLocalActivity(): LocalActivity[] {
  if (typeof window === 'undefined') return fallbackActivity;

  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return fallbackActivity;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallbackActivity;
    return [...(parsed as LocalActivity[]), ...fallbackActivity];
  } catch {
    return fallbackActivity;
  }
}

function formatTime(value: string) {
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return value;
  }
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<LocalActivity[]>(fallbackActivity);

  useEffect(() => {
    setActivity(readLocalActivity());
  }, []);

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Audit-backed visibility</p>
        <h1>Operator Activity</h1>
        <p className="lede">See who changed what, when it happened, and which operational event was affected.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Activity Feed</p>
            <h2>Recent Operational Actions</h2>
          </div>
          <span className="status-pill">{activity.length} records</span>
        </header>
        <div className="timeline">
          {activity.map((record) => (
            <div className="timeline-item" key={record.activityId}>
              <time>{formatTime(record.timestamp)}</time>
              <div>
                <strong>{record.action.replaceAll('_', ' ')}</strong>
                <p>{record.actorType}{record.actorId ? ` · ${record.actorId}` : ''}{record.eventId ? ` · event ${record.eventId}` : ''}</p>
              </div>
              <span className="status-pill">{record.newState ?? 'recorded'}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
