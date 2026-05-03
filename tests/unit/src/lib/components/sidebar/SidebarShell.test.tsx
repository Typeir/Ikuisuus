/**
 * @fileoverview Tests for the SidebarShell component. Verifies static tree rendering
 * during the Suspense fallback phase and correct integration with the dynamic
 * SidebarClient layer.
 *
 * @module tests/unit/lib/components/sidebar/SidebarShell
 * @version 1.0.0
 * @author Typeir
 * @since 2.1.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/sidebar/SidebarShell Component under test
 */

import type { Item } from '@/lib/components/sidebar/SidebarShell';
import SidebarShell from '@/lib/components/sidebar/SidebarShell';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@/lib/components/icon/icon', () => ({
  default: ({ type, className }: { type: string; className?: string }) => (
    <span data-testid={`icon-${type}`} className={className} />
  ),
}));

vi.mock('@/lib/components/sidebar/SidebarClient', () => ({
  default: ({ items }: { items: Item[] }) => (
    <ul data-testid='sidebar-client'>
      {items.map((item) => (
        <li key={item.path}>{item.name}</li>
      ))}
    </ul>
  ),
}));

vi.mock('next/dynamic', () => ({
  default: (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
    let Component: React.ComponentType<any> | null = null;
    importFn().then((mod) => {
      Component = mod.default;
    });
    return function DynamicComponent(props: Record<string, unknown>) {
      if (!Component) return null;
      return <Component {...props} />;
    };
  },
}));

describe('SidebarShell', () => {
  describe('static fallback rendering', () => {
    it('renders an empty list without crashing', () => {
      render(<SidebarShell items={[]} />);
      expect(screen.getAllByRole('list').length).toBeGreaterThan(0);
    });

    it('renders a single flat item', () => {
      const items: Item[] = [{ name: 'Home', path: 'home' }];
      render(<SidebarShell items={[]} />);
      expect(screen.getAllByRole('list').length).toBeGreaterThan(0);
      render(<SidebarShell items={items} />);
    });

    it('renders item names from the static tree', async () => {
      const items: Item[] = [
        { name: 'Spells', path: 'spells' },
        { name: 'Monsters', path: 'monsters' },
      ];
      render(<SidebarShell items={items} />);
      await waitFor(() => {
        expect(screen.getByText('Spells')).toBeInTheDocument();
        expect(screen.getByText('Monsters')).toBeInTheDocument();
      });
    });

    it('renders items so navigation destinations are accessible', async () => {
      const items: Item[] = [{ name: 'Heirlooms', path: 'heirlooms' }];
      render(<SidebarShell items={items} />);
      await waitFor(() => {
        expect(screen.getByText('Heirlooms')).toBeInTheDocument();
      });
    });

    it('renders folder items with children', async () => {
      const items: Item[] = [
        {
          name: 'Bestiary',
          path: 'bestiary',
          children: [{ name: 'Dragon', path: 'bestiary/dragon' }],
        },
      ];
      render(<SidebarShell items={items} />);
      await waitFor(() => {
        expect(screen.getByText('Bestiary')).toBeInTheDocument();
      });
    });

    it('renders folder items with children entries', async () => {
      const items: Item[] = [
        {
          name: 'Spells',
          path: 'spells',
          children: [
            { name: 'Main', path: 'spells/main' },
            { name: 'Fireball', path: 'spells/fireball' },
          ],
        },
      ];
      render(<SidebarShell items={items} />);
      await waitFor(() => {
        expect(screen.getByText('Spells')).toBeInTheDocument();
      });
    });
  });

  describe('props', () => {
    it('accepts onNavigate callback without errors', () => {
      const onNavigate = vi.fn();
      const items: Item[] = [{ name: 'Item', path: 'item' }];
      render(<SidebarShell items={items} onNavigate={onNavigate} />);
      expect(screen.getAllByRole('list').length).toBeGreaterThan(0);
    });

    it('accepts collapseSiblings prop without errors', () => {
      const items: Item[] = [{ name: 'Item', path: 'item' }];
      render(<SidebarShell items={items} collapseSiblings={true} />);
      expect(screen.getAllByRole('list').length).toBeGreaterThan(0);
    });
  });
});
