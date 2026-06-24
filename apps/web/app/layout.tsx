/**
 * ROOT WEB LAYOUT
 * Purpose: Defines shared HTML shell for the operational dashboard.
 * Role: Establishes baseline metadata and global application structure.
 */
import type { ReactNode } from 'react';
import './globals.css';
import { Nav } from '../components/nav';

export const metadata = {
  title: 'Metis Systems Operations Platform',
  description: 'AI-native operational coordination infrastructure.',
};

/**
 * FUNCTION: RootLayout
 * Inputs: React children rendered by Next.js routing.
 * Outputs: HTML document shell.
 * Functionality: Wraps all dashboard routes with the root document structure.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><Nav />{children}</body>
    </html>
  );
}
