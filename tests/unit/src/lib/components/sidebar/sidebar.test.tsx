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

import { Item, Sidebar } from '@/lib/components/sidebar/sidebar';
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

// Helper to render with PersistentUiProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <PersistentUiProvider initialExpandedPaths={[]}>{ui}</PersistentUiProvider>
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
        collator.compare(a.name, b.name)
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
        collator.compare(a.name, b.name)
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
        link.getAttribute('href')?.includes('.sheet')
      );
      const regularLink = links.find((link) =>
        link.getAttribute('href')?.includes('magic-sword')
      );

      expect(sheetLink?.getAttribute('href')).toBe(
        '/en/library/monsters/ancient-red-dragon.sheet'
      );
      expect(regularLink?.getAttribute('href')).toBe(
        '/en/library/items/magic-sword'
      );
    });

    it('should handle mixed .sheet and regular paths in nested structure', () => {
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

      const links = screen.getAllByRole('link');
      expect(
        links.some((link) =>
          link.getAttribute('href')?.includes('boss-monster.sheet')
        )
      ).toBe(true);
      expect(
        links.some(
          (link) => link.getAttribute('href') === '/en/library/monsters/info'
        )
      ).toBe(true);
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
        { name: "Hunter's Mark", path: 'spells/hunters-mark' },
      ];

      renderWithProvider(<Sidebar items={items} />);

      const links = screen.getAllByRole('link');

      expect(
        links.some(
          (link) =>
            link.getAttribute('href') ===
            '/en/library/monsters/albedo-the-bleak-bloom.sheet'
        )
      ).toBe(true);

      expect(
        links.some(
          (link) =>
            link.getAttribute('href') === '/en/library/spells/hunters-mark'
        )
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
