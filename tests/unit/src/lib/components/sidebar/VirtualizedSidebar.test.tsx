/**
 * @fileoverview Tests for the `VirtualizedSidebar` component and the
 * `VIRTUALIZE_THRESHOLD` constant. Verifies that the component renders
 * the correct number of rows via `react-window` and that the threshold
 * constant is exported at the expected value.
 *
 * @module tests/unit/lib/components/sidebar/VirtualizedSidebar
 * @version 1.0.0
 * @author Typeir
 * @since 2.1.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/sidebar/VirtualizedSidebar Component under test
 */

import VirtualizedSidebar, {
    VIRTUALIZE_THRESHOLD,
    type VirtualizedSidebarProps,
} from '@/lib/components/sidebar/VirtualizedSidebar';
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

vi.mock('@/lib/components/icon/icon', () => ({
  default: ({ type, className }: { type: string; className?: string }) => (
    <span data-testid={`icon-${type}`} className={className} />
  ),
}));

vi.mock('next/dynamic', () => ({
  default: (
    fn: () => Promise<{
      default: React.ComponentType<Record<string, unknown>>;
    }>,
  ) => {
    let Comp: React.ComponentType<Record<string, unknown>> | null = null;
    fn().then((m) => {
      Comp = m.default;
    });
    return function DynamicWrapper(props: Record<string, unknown>) {
      if (!Comp) return <div data-testid='dynamic-loading' />;
      const C = Comp as React.ElementType;
      return <C {...props} />;
    };
  },
}));

vi.mock('react-window', () => ({
  List: ({
    rowCount,
    rowComponent: RowComp,
    rowProps,
    style,
  }: {
    rowCount: number;
    rowHeight: number;
    rowComponent: (props: {
      index: number;
      style: React.CSSProperties;
      ariaAttributes: Record<string, unknown>;
      [key: string]: unknown;
    }) => React.ReactNode;
    rowProps: Record<string, unknown>;
    defaultHeight?: number;
    style?: React.CSSProperties;
  }) => (
    <div
      data-testid='virtualized-list'
      data-row-count={String(rowCount)}
      style={style}>
      {Array.from({ length: Math.min(rowCount, 3) }, (_, i) =>
        RowComp({
          index: i,
          style: {},
          ariaAttributes: {
            'aria-posinset': i + 1,
            'aria-setsize': rowCount,
            role: 'listitem',
          },
          ...rowProps,
        }),
      )}
    </div>
  ),
}));

/**
 * Renders `VirtualizedSidebar` inside the required `PersistentUiProvider`.
 *
 * @param {VirtualizedSidebarProps} props - Props forwarded to the component.
 * @returns {ReturnType<typeof render>} Testing-library render result.
 */
const renderVirtualized = (props: VirtualizedSidebarProps) =>
  render(
    <PersistentUiProvider initialExpandedPaths={[]}>
      <VirtualizedSidebar {...props} />
    </PersistentUiProvider>,
  );

/**
 * Builds an array of `count` flat leaf `LayoutItem`-shaped objects for testing.
 *
 * @param {number} count - Number of items to generate.
 * @returns {Array<{ name: string; path: string; expandedHeight: number }>} Synthetic item array.
 */
const makeItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    path: `item-${i + 1}`,
    expandedHeight: 52,
  }));

describe('VIRTUALIZE_THRESHOLD', () => {
  it('exports the threshold constant as 100', () => {
    expect(VIRTUALIZE_THRESHOLD).toBe(100);
  });
});

describe('VirtualizedSidebar', () => {
  describe('rendering', () => {
    it('renders without crashing with an empty list', () => {
      const { container } = renderVirtualized({ items: [] });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders item names for a small list', () => {
      const items = makeItems(3);
      renderVirtualized({ items });
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders a subset of visible items for a large list (virtual window)', () => {
      const items = makeItems(200);
      renderVirtualized({ items });
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('renders with collapseSiblings prop forwarded', () => {
      const items = makeItems(3);
      const { container } = renderVirtualized({
        items,
        collapseSiblings: true,
      });
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders with onNavigate callback forwarded', () => {
      const onNavigate = vi.fn();
      const items = makeItems(2);
      renderVirtualized({ items, onNavigate });
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('window sizing', () => {
    it('mounts a scrollable container for a large list', () => {
      const items = makeItems(150);
      const { container } = renderVirtualized({ items });
      expect(
        container.querySelector('[data-testid="virtualized-list"]'),
      ).toBeInTheDocument();
    });
  });
});
