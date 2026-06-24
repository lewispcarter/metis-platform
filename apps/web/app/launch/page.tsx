export default function LaunchPage() {
  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Launch Guide</p>
        <h1>Show Metis Systems Online</h1>
        <p className="lede">Use this checklist to get the beta visible on your domain through Vercel.</p>
      </section>

      <section className="panel">
        <header className="panel-header"><div><p className="eyebrow">Vercel Setup</p><h2>Correct project settings</h2></div></header>
        <div className="data-table" role="table" aria-label="Vercel settings">
          <div className="data-row heading" role="row"><span>Setting</span><span>Value</span></div>
          <div className="data-row" role="row"><strong>Framework</strong><span>Next.js</span></div>
          <div className="data-row" role="row"><strong>Root Directory</strong><span>Repository root / metis-platform folder</span></div>
          <div className="data-row" role="row"><strong>Install Command</strong><span>pnpm install --frozen-lockfile=false</span></div>
          <div className="data-row" role="row"><strong>Build Command</strong><span>pnpm --filter @metis/web build</span></div>
          <div className="data-row" role="row"><strong>Output Directory</strong><span>apps/web/.next</span></div>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header"><div><p className="eyebrow">Domain</p><h2>Recommended URL</h2></div></header>
        <ul className="launch-list">
          <li>Use <code>app.metissystems.com</code> for the beta app.</li>
          <li>Use <code>metissystems.com</code> later for the marketing website.</li>
          <li>Use <code>ops.metissystems.com</code> if you want a command-center URL.</li>
        </ul>
      </section>
    </main>
  );
}
