/**
 * COMMUNICATIONS PAGE
 * Purpose: Displays event-tied communication timelines for operational visibility.
 * Role: Lets operators verify inbound/outbound SMS, voice, email, provider states, and response bodies without leaving the command center.
 */
import { listDashboardCommunications } from '../../lib/api';

export default async function CommunicationsPage() {
  const communications = await listDashboardCommunications();

  return (
    <main className="page-shell">
      <section className="page-header">
        <p className="eyebrow">Operational communications</p>
        <h1>Communication Timeline</h1>
        <p>Inbound and outbound provider activity tied back to operational events, coverage offers, and workflow state.</p>
      </section>

      <section className="panel">
        <div className="table-like">
          <div className="table-row table-head">
            <span>Direction</span>
            <span>Channel</span>
            <span>Status</span>
            <span>Event</span>
            <span>Body</span>
            <span>Created</span>
          </div>
          {communications.map((communication) => (
            <div className="table-row" key={communication.communicationId}>
              <span>{communication.direction}</span>
              <span>{communication.channel}</span>
              <span className={`status status-${communication.status.toLowerCase()}`}>{communication.status}</span>
              <span>{communication.operationalEventId ?? 'Unmatched'}</span>
              <span>{communication.body ?? '—'}</span>
              <span>{new Date(communication.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
