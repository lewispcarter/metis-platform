/**
 * SETTINGS DASHBOARD PAGE
 * Purpose: Displays production communication setup, webhook routing, and provider readiness.
 * Role: Gives administrators visibility into the operational ingress and provider configuration layer.
 */
import { listDashboardProviderConfigurations, listDashboardWebhookRoutes } from '../../lib/api';

/**
 * FUNCTION: SettingsPage
 * Inputs: none.
 * Outputs: React settings dashboard page.
 * Functionality: Renders webhook route administration data and provider configuration readiness records.
 * External calls: Dashboard API helpers fetch settings records with fallback data during early platform bring-up.
 */
export default async function SettingsPage() {
  const [routes, providers] = await Promise.all([
    listDashboardWebhookRoutes(),
    listDashboardProviderConfigurations(),
  ]);

  return (
    <main className="dashboard-shell">
      <section className="hero-panel">
        <p className="eyebrow">Administration</p>
        <h1>Operational Settings</h1>
        <p>Configure inbound provider routing and production communication readiness without touching workflow code.</p>
      </section>

      <section className="grid-two">
        <div className="panel">
          <h2>Webhook Routes</h2>
          <p className="muted">Inbound addresses decide which organization receives Twilio SMS and voice events.</p>
          <div className="table-like">
            {routes.map((route) => (
              <div className="row" key={route.routeId}>
                <span>{route.provider}</span>
                <strong>{route.inboundAddress}</strong>
                <span>{route.status}</span>
                <small>{route.description ?? 'No description'}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Provider Configuration</h2>
          <p className="muted">Provider rows show channel readiness and safe, non-secret setup metadata.</p>
          <div className="table-like">
            {providers.map((provider) => (
              <div className="row" key={provider.providerConfigurationId}>
                <span>{provider.provider}</span>
                <strong>{provider.channel}</strong>
                <span>{provider.status}</span>
                <small>{provider.displayName}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
