export default function DeploymentPage() {
  const deploymentChecks = [
    { label: 'Frontend build', status: 'Ready', detail: 'Next.js web app is configured for Vercel deployment.' },
    { label: 'Domain routing', status: 'Ready', detail: 'Connect app.metissystems.com or ops.metissystems.com in Vercel.' },
    { label: 'Local persistence', status: 'Prototype', detail: 'Current build uses browser-local persistence until production database wiring.' },
    { label: 'Production database', status: 'Next', detail: 'V40 should replace localStorage with hosted PostgreSQL persistence.' },
    { label: 'Authentication', status: 'Next', detail: 'V41 should activate authenticated access before public pilots.' },
  ];

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">V39 · Deployment Readiness</p>
        <h1>Deployment Control</h1>
        <p className="lede">
          Readiness checklist for taking Metis Systems from localhost to a public domain.
        </p>
      </section>

      <section className="grid" aria-label="Deployment summary">
        <article className="card">
          <span>Deployment Target</span>
          <strong>Vercel</strong>
        </article>
        <article className="card">
          <span>Recommended Domain</span>
          <strong>app.metissystems.com</strong>
        </article>
        <article className="card attention">
          <span>Current Data Layer</span>
          <strong>Local</strong>
        </article>
        <article className="card">
          <span>Next Hardening</span>
          <strong>PostgreSQL</strong>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Launch Checklist</p>
            <h2>Public preview readiness</h2>
          </div>
          <span className="status-pill">V39</span>
        </header>

        <div className="data-table" role="table" aria-label="Deployment checklist">
          <div className="data-row heading" role="row">
            <span>Area</span>
            <span>Status</span>
            <span>Notes</span>
          </div>
          {deploymentChecks.map((check) => (
            <div className="data-row" role="row" key={check.label}>
              <strong>{check.label}</strong>
              <span>{check.status}</span>
              <span>{check.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Instructions</p>
            <h2>How this gets shared</h2>
          </div>
        </header>
        <ol className="launch-list">
          <li>Push this project to GitHub.</li>
          <li>Create a new Vercel project from the GitHub repository.</li>
          <li>Set the Vercel root directory to the repository root.</li>
          <li>Confirm build command: <code>pnpm --filter @metis/web build</code>.</li>
          <li>Connect your domain as <code>app.metissystems.com</code> or <code>ops.metissystems.com</code>.</li>
        </ol>
      </section>
    </main>
  );
}
