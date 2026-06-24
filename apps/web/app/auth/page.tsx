import { getDemoUser, getSessionMode } from '../../lib/auth/session';
import { rolePermissions } from '../../lib/auth/roles';
import { protectedRoutes } from '../../lib/auth/route-policy';

export default function AuthPage() {
  const user = getDemoUser();
  const mode = getSessionMode();

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">V41 · Authentication Foundation</p>
        <h1>Access Control</h1>
        <p className="lede">
          Role-based access foundation for Metis Systems. Local demo auth remains active until a real provider is connected.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <span>Session Mode</span>
          <strong>{mode}</strong>
        </article>
        <article className="card">
          <span>User</span>
          <strong>{user.displayName}</strong>
        </article>
        <article className="card">
          <span>Role</span>
          <strong>{user.role}</strong>
        </article>
        <article className="card attention">
          <span>Provider</span>
          <strong>Demo</strong>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Role Matrix</p>
            <h2>Permissions</h2>
          </div>
          <span className="status-pill">RBAC Ready</span>
        </header>

        <div className="data-table" role="table" aria-label="Role permissions">
          <div className="data-row heading" role="row">
            <span>Role</span>
            <span>Permissions</span>
          </div>
          {Object.entries(rolePermissions).map(([role, permissions]) => (
            <div className="data-row" role="row" key={role}>
              <strong>{role}</strong>
              <span>{permissions.join(', ')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Protected Routes</p>
            <h2>Route Policy</h2>
          </div>
        </header>

        <div className="data-table" role="table" aria-label="Protected routes">
          <div className="data-row heading" role="row">
            <span>Path</span>
            <span>Required Permission</span>
          </div>
          {protectedRoutes.map((route) => (
            <div className="data-row" role="row" key={route.path}>
              <strong>{route.path}</strong>
              <span>{route.permission}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
