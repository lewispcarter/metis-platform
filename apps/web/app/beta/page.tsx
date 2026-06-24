export default function BetaPage() {
  const readiness = [
    ['Command Dashboard', 'Ready', 'Live operational overview for events, workflows, personnel, and escalations.'],
    ['Event Management', 'Ready', 'Create, acknowledge, escalate, assign, start, and resolve operational events.'],
    ['Personnel Coordination', 'Ready', 'Track availability and ownership across active assignments.'],
    ['Communications', 'Ready', 'Show communication history and event-linked operational messaging.'],
    ['Workload Intelligence', 'Ready', 'Decision-support surface for workload scoring and assignment recommendations.'],
    ['Deployment', 'Ready', 'Configured for public preview deployment through Vercel.'],
    ['Authentication', 'Demo Mode', 'Role and session foundation exists; real login provider comes after beta demo.'],
    ['Database', 'Foundation', 'PostgreSQL foundation exists; current demo mode still uses local prototype persistence.'],
  ];

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">V42 · Public Beta</p>
        <h1>Metis Systems Public Beta</h1>
        <p className="lede">
          A showable command-center demo for operational events, personnel coordination,
          communications, audit visibility, and workload intelligence.
        </p>
      </section>

      <section className="grid">
        <article className="card"><span>Beta Stage</span><strong>Public Preview</strong></article>
        <article className="card"><span>Best Demo URL</span><strong>app.metissystems.com</strong></article>
        <article className="card"><span>Showability</span><strong>Ready</strong></article>
        <article className="card attention"><span>Real Customer Data</span><strong>Not Yet</strong></article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div><p className="eyebrow">Beta Readiness</p><h2>What is ready to show</h2></div>
          <span className="status-pill">V42</span>
        </header>

        <div className="data-table" role="table" aria-label="Beta readiness">
          <div className="data-row heading" role="row"><span>Area</span><span>Status</span><span>Demo Note</span></div>
          {readiness.map(([area, status, note]) => (
            <div className="data-row" role="row" key={area}>
              <strong>{area}</strong><span>{status}</span><span>{note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace two-column">
        <section className="panel">
          <header className="panel-header"><div><p className="eyebrow">Demo Script</p><h2>What to show someone</h2></div></header>
          <ol className="launch-list">
            <li>Start on Dashboard and explain Metis as an operational command center.</li>
            <li>Open Events and show active operational issues.</li>
            <li>Create a new event for a staffing gap or incident.</li>
            <li>Open the event detail page and acknowledge it.</li>
            <li>Assign an owner from Personnel.</li>
            <li>Log a communication note.</li>
            <li>Show the audit trail proving every action was recorded.</li>
            <li>Open Intelligence and show workload recommendations.</li>
          </ol>
        </section>

        <section className="panel">
          <header className="panel-header"><div><p className="eyebrow">Buyer Language</p><h2>Simple explanation</h2></div></header>
          <p className="lede">
            Metis Systems is an AI-powered operations command platform that helps
            organizations coordinate people, incidents, communications, and workflows
            from one dashboard.
          </p>
          <p className="muted">
            Public beta is for demo and pilot conversations. Production customer data
            should wait until PostgreSQL persistence and real authentication are fully active.
          </p>
        </section>
      </section>
    </main>
  );
}
