import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Access Control</p>
        <h1>Access Denied</h1>
        <p className="lede">
          Your current role does not have permission for this command surface.
        </p>
        <Link className="button primary" href="/auth">
          View Access Control
        </Link>
      </section>
    </main>
  );
}
