import { getPersistenceMode } from '../../lib/database/repository';

export default function DatabasePage() {
  const mode = getPersistenceMode();

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">V40 · PostgreSQL Foundation</p>
        <h1>Database Control</h1>
        <p className="lede">
          PostgreSQL readiness layer with safe local fallback.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <span>Current Mode</span>
          <strong>{mode}</strong>
        </article>
        <article className="card">
          <span>Production Target</span>
          <strong>PostgreSQL</strong>
        </article>
        <article className="card">
          <span>Fallback</span>
          <strong>Local Storage</strong>
        </article>
        <article className="card attention">
          <span>Status</span>
          <strong>Install-Safe</strong>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">V40 Fix</p>
            <h2>What changed</h2>
          </div>
        </header>

        <ul className="launch-list">
          <li>Removed packaged install/build artifacts that can break pnpm linking on Windows.</li>
          <li>Kept PostgreSQL as a safe foundation layer only.</li>
          <li>Local persistence remains active until real database credentials are configured.</li>
          <li>Added stable pnpm workspace install settings.</li>
        </ul>
      </section>
    </main>
  );
}
