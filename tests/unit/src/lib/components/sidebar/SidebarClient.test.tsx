/**
 * @fileoverview Tests for the SidebarClient module. Verifies that the component
 * is correctly re-exported from the sidebar module and renders as expected.
 *
 * @module tests/unit/lib/components/sidebar/SidebarClient
 * @version 1.0.0
 * @author Typeir
 * @since 2.1.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/sidebar/SidebarClient Component under test
 */

import type { Item } from '@/lib/components/sidebar/SidebarClient';
import SidebarClient from '@/lib/components/sidebar/SidebarClient';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

/** Wraps the component under test in required context providers. */
const renderWithProvider = (ui: React.ReactElement) =>
  render(
    <PersistentUiProvider initialExpandedPaths={[]}>{ui}</PersistentUiProvider>,
  );

describe('SidebarClient', () => {
  it('renders a list element without crashing', () => {
    renderWithProvider(<SidebarClient items={[]} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders flat items as navigation links', () => {
    const items: Item[] = [
      { name: 'Spells', path: 'spells' },
      { name: 'Monsters', path: 'monsters' },
    ];
    renderWithProvider(<SidebarClient items={items} />);
    expect(screen.getByText('Spells')).toBeInTheDocument();
    expect(screen.getByText('Monsters')).toBeInTheDocument();
  });

  it('constructs hrefs with locale prefix', () => {
    const items: Item[] = [{ name: 'Heirlooms', path: 'heirlooms' }];
    renderWithProvider(<SidebarClient items={items} />);
    const link = screen.getByRole('link', { name: 'Heirlooms' });
    expect(link).toHaveAttribute('href', '/en/library/heirlooms');
  });
});
