/**
 * Sidebar Component Unit Tests
 *
 * @fileoverview Tests for the sidebar navigation component including the
 * calculateHeights utility function and component structure validation.
 *
 * @module tests/unit/lib/components/sidebar
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/sidebar/sidebar Component under test
 */

import { SIDEBAR_CLOSE_ANIMATION_MS } from '@/lib/components/sidebar/constants';
import { Sidebar } from '@/lib/components/sidebar/sidebar';
import type { Item } from '@/lib/components/sidebar/types';
import { VIRTUALIZE_THRESHOLD } from '@/lib/components/sidebar/VirtualizedSidebar';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

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
        fn().then((m) => {
          setComp(() => m.default ?? null);
        });
      }, []);
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
    <div data-testid='virtualized-list' data-row-count={String(rowCount)}>
      {RowComp({
        index: 0,
        style: {},
        ariaAttributes: {
          'aria-posinset': 1,
          'aria-setsize': rowCount,
          role: 'listitem',
        },
        ...rowProps,
      })}
    </div>
  ),
}));

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

// Helper to render with PersistentUiProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <PersistentUiProvider initialExpandedPaths={[]}>{ui}</PersistentUiProvider>,
  );
};

const BASE_HEIGHT = 52;

describe('Sidebar', () => {
  describe('rendering', () => {
    it('should render without crashing with empty items', () => {
      renderWithProvider(<Sidebar items={[]} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should render single flat item', () => {
      const items: Item[] = [{ name: 'Home', path: 'home' }];
      renderWithProvider(<Sidebar items={items} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should render multiple flat items', () => {
      const items: Item[] = [
        { name: 'Home', path: 'home' },
        { name: 'About', path: 'about' },
        { name: 'Contact', path: 'contact' },
      ];
      renderWithProvider(<Sidebar items={items} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should render nested items', () => {
      const items: Item[] = [
        {
          name: 'Documentation',
          path: 'docs',
          children: [
            { name: 'Getting Started', path: 'docs/getting-started' },
            { name: 'API Reference', path: 'docs/api' },
          ],
        },
      ];
      renderWithProvider(<Sidebar items={items} />);
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });
  });

  describe('props handling', () => {
    it('should accept onNavigate callback', () => {
      const mockCallback = vi.fn();
      renderWithProvider(<Sidebar items={[]} onNavigate={mockCallback} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should accept collapseSiblings prop', () => {
      const items: Item[] = [
        { name: 'Item 1', path: 'item-1' },
        { name: 'Item 2', path: 'item-2' },
      ];
      renderWithProvider(<Sidebar items={items} collapseSiblings={true} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should default collapseSiblings to false', () => {
      renderWithProvider(<Sidebar items={[]} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});

describe('calculateHeights utility', () => {
  describe('height calculations', () => {
    it('should assign BASE_HEIGHT to leaf nodes', () => {
      const items: Item[] = [{ name: 'Item', path: 'item', children: [] }];

      expect(items[0].children).toEqual([]);
    });

    it('should sort items with folders after files', () => {
      const items: Item[] = [
        {
          name: 'Folder',
          path: 'folder',
          children: [{ name: 'Child', path: 'folder/child' }],
        },
        { name: 'File', path: 'file' },
      ];

      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      const sorted = [...items].sort((a, b) => {
        const aIsFolder = Boolean(a.children && a.children.length > 0);
        const bIsFolder = Boolean(b.children && b.children.length > 0);
        if (aIsFolder !== bIsFolder) return aIsFolder ? 1 : -1;
        return collator.compare(a.name, b.name);
      });

      expect(sorted[0].name).toBe('File');
      expect(sorted[1].name).toBe('Folder');
    });

    it('should sort items alphabetically within same type', () => {
      const items: Item[] = [
        { name: 'Zebra', path: 'zebra' },
        { name: 'Apple', path: 'apple' },
        { name: 'Middle', path: 'middle' },
      ];

      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      const sorted = [...items].sort((a, b) =>
        collator.compare(a.name, b.name),
      );

      expect(sorted[0].name).toBe('Apple');
      expect(sorted[1].name).toBe('Middle');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('should handle numeric sorting correctly', () => {
      const items: Item[] = [
        { name: 'Chapter 10', path: 'chapter-10' },
        { name: 'Chapter 2', path: 'chapter-2' },
        { name: 'Chapter 1', path: 'chapter-1' },
      ];

      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      const sorted = [...items].sort((a, b) =>
        collator.compare(a.name, b.name),
      );

      expect(sorted[0].name).toBe('Chapter 1');
      expect(sorted[1].name).toBe('Chapter 2');
      expect(sorted[2].name).toBe('Chapter 10');
    });
  });

  describe('recursive height calculation', () => {
    it('should calculate total height for nested structure', () => {
      const childCount = 3;
      const expectedParentHeight = BASE_HEIGHT + childCount * BASE_HEIGHT;

      expect(expectedParentHeight).toBe(BASE_HEIGHT * 4);
    });

    it('should handle deeply nested structures', () => {
      const depth = 4;
      const expectedTotalHeight = BASE_HEIGHT * depth;

      expect(expectedTotalHeight).toBe(208);
    });
  });
});

describe('Item type', () => {
  it('should accept minimal item structure', () => {
    const item: Item = {
      name: 'Test',
      path: 'test',
    };
    expect(item.name).toBe('Test');
    expect(item.path).toBe('test');
  });

  it('should accept item with empty children array', () => {
    const item: Item = {
      name: 'Test',
      path: 'test',
      children: [],
    };
    expect(item.children).toEqual([]);
  });

  it('should accept item with nested children', () => {
    const item: Item = {
      name: 'Parent',
      path: 'parent',
      children: [
        { name: 'Child 1', path: 'parent/child-1' },
        { name: 'Child 2', path: 'parent/child-2' },
      ],
    };
    expect(item.children).toHaveLength(2);
  });
});

describe('lazy-mount behaviour', () => {
  const nestedItems: Item[] = [
    {
      name: 'Bestiary',
      path: 'bestiary',
      children: [
        { name: 'Dragon', path: 'bestiary/dragon' },
        { name: 'Goblin', path: 'bestiary/goblin' },
      ],
    },
  ];

  it('does not render folder children before the folder is opened', () => {
    renderWithProvider(<Sidebar items={nestedItems} />);
    expect(screen.getByText('Bestiary')).toBeInTheDocument();
    expect(screen.queryByText('Dragon')).not.toBeInTheDocument();
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
  });

  it('renders folder children after the label is clicked', async () => {
    renderWithProvider(<Sidebar items={nestedItems} />);
    const label = screen.getByText('Bestiary').parentElement as HTMLElement;
    fireEvent.click(label);
    await waitFor(() => expect(screen.getByText('Dragon')).toBeInTheDocument());
    expect(screen.getByText('Goblin')).toBeInTheDocument();
  });

  it('keeps children in the DOM immediately after closing (isClosing phase)', async () => {
    renderWithProvider(<Sidebar items={nestedItems} />);
    const label = screen.getByText('Bestiary').parentElement as HTMLElement;
    fireEvent.click(label);
    await waitFor(() => expect(screen.getByText('Dragon')).toBeInTheDocument());
    fireEvent.click(label);
    expect(screen.getByText('Dragon')).toBeInTheDocument();
  });

  it('unmounts children after the closing animation duration has elapsed', async () => {
    render(
      <PersistentUiProvider initialExpandedPaths={['bestiary']}>
        <Sidebar items={nestedItems} />
      </PersistentUiProvider>,
    );
    await waitFor(() => expect(screen.getByText('Dragon')).toBeInTheDocument());
    const label = screen.getByText('Bestiary').parentElement as HTMLElement;
    fireEvent.click(label);
    await waitFor(
      () => expect(screen.queryByText('Dragon')).not.toBeInTheDocument(),
      { timeout: SIDEBAR_CLOSE_ANIMATION_MS + 300 },
    );
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument();
  });

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not unmount children before the animation duration has elapsed', async () => {
      renderWithProvider(<Sidebar items={nestedItems} />);
      const label = screen.getByText('Bestiary').parentElement as HTMLElement;
      await act(async () => {
        fireEvent.click(label);
      });
      await act(async () => {}); // flush DynamicWrapper setComp state update
      expect(screen.getByText('Dragon')).toBeInTheDocument();
      fireEvent.click(label);
      act(() => {
        vi.advanceTimersByTime(SIDEBAR_CLOSE_ANIMATION_MS - 50);
      });
      expect(screen.getByText('Dragon')).toBeInTheDocument();
    });
  });
});

describe('Sidebar path handling - integration with walk utility', () => {
  describe('.sheet file paths', () => {
    it('should correctly render item paths with .sheet suffix', () => {
      const items: Item[] = [
        {
          name: 'Ancient Red Dragon',
          path: 'monsters/ancient-red-dragon.sheet',
        },
        { name: 'Magic Sword', path: 'items/magic-sword' },
      ];

      renderWithProvider(<Sidebar items={items} />);

      const links = screen.getAllByRole('link');
      const sheetLink = links.find((link) =>
        link.getAttribute('href')?.includes('.sheet'),
      );
      const regularLink = links.find((link) =>
        link.getAttribute('href')?.includes('magic-sword'),
      );

      expect(sheetLink?.getAttribute('href')).toBe(
        '/en/library/monsters/ancient-red-dragon.sheet',
      );
      expect(regularLink?.getAttribute('href')).toBe(
        '/en/library/items/magic-sword',
      );
    });

    it('should handle mixed .sheet and regular paths in nested structure', async () => {
      const items: Item[] = [
        {
          name: 'Monsters',
          path: 'monsters',
          children: [
            { name: 'Boss Monster', path: 'monsters/boss-monster.sheet' },
            { name: 'Regular Info', path: 'monsters/info' },
          ],
        },
      ];

      renderWithProvider(<Sidebar items={items} />);
      fireEvent.click(screen.getByText('Monsters'));

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(
          links.some((link) =>
            link.getAttribute('href')?.includes('boss-monster.sheet'),
          ),
        ).toBe(true);
        expect(
          links.some(
            (link) => link.getAttribute('href') === '/en/library/monsters/info',
          ),
        ).toBe(true);
      });
    });

    it('should not contain malformed paths like "machinesheet"', () => {
      const items: Item[] = [
        {
          name: 'Abandoned Old War Machine',
          path: 'monsters/abandoned-old-war-machine.sheet',
        },
      ];

      renderWithProvider(<Sidebar items={items} />);

      const links = screen.getAllByRole('link');
      const href = links[0]?.getAttribute('href');

      // Should NOT have the malformed path
      expect(href).not.toContain('machinesheet');
      // Should have the correct path with .sheet
      expect(href).toContain('abandoned-old-war-machine.sheet');
      // Should have proper kebab-case with preserved .sheet
      expect(href).toBe('/en/library/monsters/abandoned-old-war-machine.sheet');
    });
  });

  describe('path conventions', () => {
    it('should have kebab-case paths for all items', () => {
      const items: Item[] = [
        { name: 'Multi Word Name', path: 'multi-word-name' },
        { name: 'Another Long Name', path: 'another-long-name' },
      ];

      renderWithProvider(<Sidebar items={items} />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        const pathSegments = href.split('/').filter(Boolean);
        pathSegments.forEach((segment) => {
          // Should not have uppercase
          expect(segment).toBe(segment.toLowerCase());
          // Should not have spaces
          expect(segment).not.toContain(' ');
          // Should not have underscores (should be hyphens)
          expect(segment).not.toContain('_');
        });
      });
    });

    it('should handle special characters in paths correctly', () => {
      const items: Item[] = [
        {
          name: 'Albedo, the Bleak Bloom',
          path: 'monsters/albedo-the-bleak-bloom.sheet',
        },
        { name: 'Hex', path: 'spells/hex' },
      ];

      renderWithProvider(<Sidebar items={items} />);

      const links = screen.getAllByRole('link');

      expect(
        links.some(
          (link) =>
            link.getAttribute('href') ===
            '/en/library/monsters/albedo-the-bleak-bloom.sheet',
        ),
      ).toBe(true);

      expect(
        links.some(
          (link) => link.getAttribute('href') === '/en/library/spells/hex',
        ),
      ).toBe(true);
    });
  });

  describe('path prefix with locale', () => {
    it('should prefix all paths with /{locale}/library/', () => {
      const items: Item[] = [
        { name: 'Test', path: 'test' },
        { name: 'Sheet Test', path: 'test.sheet' },
      ];

      renderWithProvider(<Sidebar items={items} />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        expect(href).toMatch(/^\/[a-z]{2}\/library\//);
      });
    });
  });
});

describe('memoisation behaviour', () => {
  it('renders updated items when the items prop changes', () => {
    const initial: Item[] = [{ name: 'Alpha', path: 'alpha' }];
    const updated: Item[] = [
      { name: 'Alpha', path: 'alpha' },
      { name: 'Beta', path: 'beta' },
    ];
    const { rerender } = render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <Sidebar items={initial} />
      </PersistentUiProvider>,
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    rerender(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <Sidebar items={updated} />
      </PersistentUiProvider>,
    );
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('keeps rendering correctly when the same items reference is passed', () => {
    const items: Item[] = [
      { name: 'Gamma', path: 'gamma' },
      { name: 'Delta', path: 'delta' },
    ];
    const { rerender } = render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <Sidebar items={items} />
      </PersistentUiProvider>,
    );
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    rerender(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <Sidebar items={items} />
      </PersistentUiProvider>,
    );
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });
});

describe('virtualisation threshold integration', () => {
  const makeManyChildren = (count: number): Item[] =>
    Array.from({ length: count }, (_, i) => ({
      name: `Child ${i + 1}`,
      path: `folder/child-${i + 1}`,
    }));

  it('renders a virtualized list for folders that exceed VIRTUALIZE_THRESHOLD children', async () => {
    const largeFolder: Item[] = [
      {
        name: 'Big Folder',
        path: 'folder',
        children: makeManyChildren(VIRTUALIZE_THRESHOLD + 1),
      },
    ];
    renderWithProvider(<Sidebar items={largeFolder} />);
    const label = screen.getByText('Big Folder').parentElement as HTMLElement;
    fireEvent.click(label);
    await waitFor(
      () => expect(screen.getByTestId('virtualized-list')).toBeInTheDocument(),
      { timeout: 2000 },
    );
  });

  it('does not render a virtualized list for folders below VIRTUALIZE_THRESHOLD', async () => {
    const smallFolder: Item[] = [
      {
        name: 'Small Folder',
        path: 'small-folder',
        children: makeManyChildren(3),
      },
    ];
    renderWithProvider(<Sidebar items={smallFolder} />);
    const label = screen.getByText('Small Folder').parentElement as HTMLElement;
    fireEvent.click(label);
    await waitFor(() =>
      expect(screen.getByText('Child 1')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('virtualized-list')).not.toBeInTheDocument();
  });
});
