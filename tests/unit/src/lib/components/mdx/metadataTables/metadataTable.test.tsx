/**
 * @fileoverview Unit tests for Metadata Table component
 * @module tests/unit/src/lib/components/mdx/metadataTables/metadataTable.test
 * @description Validates MetadataTable rendering, filtering, sorting, pagination,
 * and row click navigation.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/mdx/metadataTables/metadataTable
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUseTranslationsMock,
  loadMessageFile,
} from '../../../testUtils/translationMockUtils';

const mockPush = vi.fn();
const mockOpen = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: createUseTranslationsMock({
    common: loadMessageFile('messages/en/common.json'),
    tables: loadMessageFile('messages/en/tables.json'),
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/components/ui', () => ({
  FilterSelect: ({ value, onChange, options, placeholder, id }: any) => (
    <select
      data-testid={id}
      value={value || ''}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
        onChange(e.target.value || undefined)
      }>
      <option value=''>{placeholder}</option>
      {options?.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
  NumericInput: ({ value, onChange, placeholder, ...rest }: any) => (
    <input
      type='number'
      value={value ?? ''}
      placeholder={placeholder}
      aria-label={rest['aria-label']}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value === '' ? null : Number(e.target.value);
        onChange(v);
      }}
    />
  ),
}));

vi.mock('@/modules/search/application/useScopedSearch', () => ({
  useScopedSearch: () => ({ ranks: null, loading: false }),
}));

import type {
  ColumnConfig,
  MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';

/**
 * Generates test rows for the MetadataTable.
 *
 * @param {number} count - Number of rows to generate
 * @returns {MetadataRow[]} Test rows
 */
function makeRows(count: number): MetadataRow[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `item-${i}`,
    title: `Item ${i}`,
    level: i + 1,
    category: i % 2 === 0 ? 'weapon' : 'armor',
  }));
}

const baseColumns: ColumnConfig[] = [
  { key: 'title', label: 'Name', sortable: true },
  {
    key: 'level',
    label: 'Level',
    sortable: true,
    filterable: true,
    filterType: 'range',
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    filterable: true,
    filterType: 'select',
  },
];

describe('MetadataTable', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockOpen.mockReset();
    Object.defineProperty(window, 'open', { value: mockOpen, writable: true });
  });

  it('renders table with data rows', () => {
    const data = makeRows(3);
    render(<MetadataTable data={data} columns={baseColumns} />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<MetadataTable data={makeRows(1)} columns={baseColumns} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Name');
    expect(headers[1]).toHaveTextContent('Level');
    expect(headers[2]).toHaveTextContent('Category');
  });

  it('filters rows via global search', async () => {
    const data = makeRows(5);
    render(
      <MetadataTable
        data={data}
        columns={baseColumns}
        searchKeys={['title']}
      />,
    );
    const search = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(search, { target: { value: 'Item 3' } });
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument();
  });

  it('sorts by column ascending then descending', async () => {
    const data = [
      { slug: 'c', title: 'Charlie', level: 3, category: 'weapon' },
      { slug: 'a', title: 'Alpha', level: 1, category: 'armor' },
      { slug: 'b', title: 'Bravo', level: 2, category: 'weapon' },
    ];
    render(<MetadataTable data={data} columns={baseColumns} />);
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alpha');
    fireEvent.click(nameHeader);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Charlie');
  });

  it('clears sort on third click', () => {
    const data = [
      { slug: 'b', title: 'Bravo', level: 2, category: 'armor' },
      { slug: 'a', title: 'Alpha', level: 1, category: 'weapon' },
    ];
    render(<MetadataTable data={data} columns={baseColumns} />);
    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);
    fireEvent.click(nameHeader);
    fireEvent.click(nameHeader);
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Bravo');
  });

  it('navigates on row click using slug', () => {
    const data = [
      { slug: 'alpha', title: 'Alpha', level: 1, category: 'weapon' },
    ];
    render(
      <MetadataTable data={data} columns={baseColumns} basePath='/items' />,
    );
    const link = screen.getByText('Alpha').closest('a');
    expect(link).toHaveAttribute('href', '/en/library/items/alpha');
  });

  it('navigates using custom getRowSlug with hash', () => {
    const data = [
      { slug: 'test', title: 'Test', level: 1, category: 'weapon' },
    ];
    render(
      <MetadataTable
        data={data}
        columns={baseColumns}
        getRowSlug={() => '/monsters/dragon#ancient'}
      />,
    );
    const link = screen.getByText('Test').closest('a');
    expect(link).toHaveAttribute('href', '/en/library/monsters/dragon#ancient');
  });

  it('opens external links in new tab', () => {
    const data = [
      {
        slug: 'ext',
        title: 'External',
        level: 1,
        category: 'weapon',
        link: 'https://example.com',
      },
    ];
    render(<MetadataTable data={data} columns={baseColumns} />);
    const link = screen.getByText('External').closest('a');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('navigates for internal link field', () => {
    const data = [
      {
        slug: 'int',
        title: 'Internal',
        level: 1,
        category: 'armor',
        link: '/library/spells/fireball',
      },
    ];
    render(<MetadataTable data={data} columns={baseColumns} />);
    const link = screen.getByText('Internal').closest('a');
    expect(link).toHaveAttribute('href', '/en/library/spells/fireball');
  });

  it('filters by select column', async () => {
    const data = makeRows(4);
    render(<MetadataTable data={data} columns={baseColumns} />);
    const select = screen.getByTestId('filter-category');
    fireEvent.change(select, { target: { value: 'weapon' } });
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  it('uses custom render function for cell display', () => {
    const data = [{ slug: 'a', title: 'alpha', level: 1, category: 'weapon' }];
    const cols: ColumnConfig[] = [
      {
        key: 'title',
        label: 'Name',
        render: (v: unknown) => String(v).toUpperCase(),
      },
    ];
    render(<MetadataTable data={data} columns={cols} />);
    expect(screen.getByText('ALPHA')).toBeInTheDocument();
  });

  it('uses custom compareValues for sorting', () => {
    const data = [
      { slug: 'a', title: 'A', level: 10, category: 'weapon' },
      { slug: 'b', title: 'B', level: 2, category: 'armor' },
    ];
    const cols: ColumnConfig[] = [
      {
        key: 'level',
        label: 'Level',
        sortable: true,
        compareValues: (a, b) => a - b,
      },
    ];
    render(<MetadataTable data={data} columns={cols} />);
    fireEvent.click(screen.getByText('Level'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('2');
  });

  it('paginates large datasets', () => {
    const data = makeRows(60);
    render(<MetadataTable data={data} columns={baseColumns} pageSize={50} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Item 50')).toBeInTheDocument();
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument();
  });

  it('shows result count', () => {
    const data = makeRows(3);
    render(<MetadataTable data={data} columns={baseColumns} />);
    expect(screen.getByText('Showing 3 of 3 items')).toBeInTheDocument();
  });

  it('shows filtered result count text', () => {
    const data = makeRows(4);
    render(<MetadataTable data={data} columns={baseColumns} />);
    const search = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(search, { target: { value: 'Item 1' } });
    expect(
      screen.getByText('Showing 1 of 1 items (filtered from 4)'),
    ).toBeInTheDocument();
  });

  it('handles null/undefined values with default display', () => {
    const data = [{ slug: 'a', title: null, level: undefined, category: null }];
    render(<MetadataTable data={data} columns={baseColumns} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('pushes null values to end when sorting', () => {
    const data = [
      { slug: 'a', title: null, level: 1, category: 'weapon' },
      { slug: 'b', title: 'Bravo', level: 2, category: 'armor' },
    ];
    render(<MetadataTable data={data} columns={baseColumns} />);
    fireEvent.click(screen.getByText('Name'));
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bravo');
  });

  it('sorts filter options using filterSortOrder when provided', async () => {
    const rarityOrder = {
      common: 0,
      uncommon: 1,
      rare: 2,
      legendary: 3,
    };
    const data = [
      { slug: 'a', title: 'Item A', rarity: 'legendary' },
      { slug: 'b', title: 'Item B', rarity: 'common' },
      { slug: 'c', title: 'Item C', rarity: 'rare' },
      { slug: 'd', title: 'Item D', rarity: 'uncommon' },
    ];
    const cols: ColumnConfig[] = [
      { key: 'title', label: 'Name' },
      {
        key: 'rarity',
        label: 'Rarity',
        filterable: true,
        filterType: 'select',
        filterSortOrder: rarityOrder,
      },
    ];
    render(<MetadataTable data={data} columns={cols} />);
    const raritySelect = screen.getByTestId('filter-rarity');
    const options = raritySelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('All');
    expect(options[1]).toHaveTextContent('common');
    expect(options[2]).toHaveTextContent('uncommon');
    expect(options[3]).toHaveTextContent('rare');
    expect(options[4]).toHaveTextContent('legendary');
  });

  it('handles filterSortOrder with missing keys by pushing them to end', async () => {
    const rarityOrder = {
      common: 0,
      uncommon: 1,
    };
    const data = [
      { slug: 'a', title: 'Item A', rarity: 'exotic' },
      { slug: 'b', title: 'Item B', rarity: 'common' },
      { slug: 'c', title: 'Item C', rarity: 'uncommon' },
    ];
    const cols: ColumnConfig[] = [
      { key: 'title', label: 'Name' },
      {
        key: 'rarity',
        label: 'Rarity',
        filterable: true,
        filterType: 'select',
        filterSortOrder: rarityOrder,
      },
    ];
    render(<MetadataTable data={data} columns={cols} />);
    const raritySelect = screen.getByTestId('filter-rarity');
    const options = raritySelect.querySelectorAll('option');
    expect(options[0]).toHaveTextContent('All');
    expect(options[1]).toHaveTextContent('common');
    expect(options[2]).toHaveTextContent('uncommon');
    expect(options[3]).toHaveTextContent('exotic');
  });
});
