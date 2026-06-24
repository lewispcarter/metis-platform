/**
 * OPERATIONAL NAVIGATION COMPONENT
 * Purpose: Provides stable dashboard navigation across operational modules.
 * Role: Keeps operator movement predictable between events, workflows, personnel, and the command center.
 */
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/events', label: 'Events' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/personnel', label: 'Personnel' },
  { href: '/communications', label: 'Communications' },
  { href: '/intelligence', label: 'Intelligence' },
  { href: '/deployment', label: 'Deployment' },
  { href: '/database', label: 'Database' },
  { href: '/auth', label: 'Auth' },
  { href: '/activity', label: 'Activity' },
  { href: '/settings', label: 'Settings' },
  { href: '/beta', label: 'Beta' },
  { href: '/launch', label: 'Launch' },
];

/**
 * FUNCTION: Nav
 * Inputs: none.
 * Outputs: React navigation component.
 * Functionality: Renders the primary operational navigation links.
 */
export function Nav() {
  return (
    <nav className="nav-shell" aria-label="Primary operations navigation">
      <div className="nav-brand">Metis Systems</div>
      <div className="nav-links">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </div>
    </nav>
  );
}
