/**
 * @fileoverview Tests for SidebarItem component
 * @module tests/unit/src/lib/components/sidebar/SidebarItem
 */

import { SidebarItem } from '@/lib/components/sidebar/SidebarItem';
import type { LayoutItem } from '@/lib/components/sidebar/types';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { render, screen } from '@testing-library/react';
import React from 'react';
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

vi.mock('next/dynamic', () => ({
  default: (
    fn: () => Promise<{
      default: React.ComponentType<Record<string, unknown>>;
    }>,
  ) => {
    return function DynamicWrapper(props: Record<string, unknown>) {
      const [Comp, setComp] = React.useState<React.ComponentType<
        Record<string, unknown>
      > | null>(null);
      React.useEffect(() => {
        fn().then((m) => setComp(() => m.default ?? null));
      }, []);
      if (!Comp) return <div data-testid='dynamic-loading' />;
      const C = Comp as React.ElementType;
      return <C {...props} />;
    };
  },
}));

describe('SidebarItem', () => {
  const mockPathStore = {
    subscribe: vi.fn(() => vi.fn()),
  };

  const leafItem: LayoutItem = {
    name: 'Spell',
    path: 'spells/fireball',
    expandedHeight: 52,
  };

  const folderItem: LayoutItem = {
    name: 'Spells',
    path: 'spells',
    children: [],
    expandedHeight: 52,
  };

  it('should render a link for leaf items', () => {
    render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <SidebarItem
          item={leafItem}
          collapseSiblings={false}
          pathStore={mockPathStore}
        />
      </PersistentUiProvider>,
    );
    expect(screen.getByText('Spell')).toBeInTheDocument();
  });

  it('should render a folder element for folder items', () => {
    render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <SidebarItem
          item={folderItem}
          collapseSiblings={false}
          pathStore={mockPathStore}
        />
      </PersistentUiProvider>,
    );
    expect(screen.getByText('Spells')).toBeInTheDocument();
  });
});
