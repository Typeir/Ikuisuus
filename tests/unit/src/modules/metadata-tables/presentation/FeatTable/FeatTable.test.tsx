/**
 * @fileoverview FeatTable tests
 * @description Verifies the feat library table renders loading, empty, and data
 * states and flags repeatable feats via the repeatable column.
 *
 * @module tests/unit/src/modules/metadata-tables/presentation/FeatTable/FeatTable.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import FeatTable from '@/modules/metadata-tables/presentation/FeatTable/FeatTable';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

const useFeatsMock = vi.fn();
vi.mock('@/lib/hooks/data/useFeats', () => ({
  useFeats: () => useFeatsMock(),
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('@/lib/components/mdx/metadataTables/metadataTable', () => ({
  default: ({ data, columns }: any) => (
    <div data-testid='table'>
      {data.map((row: any) => (
        <div key={row.slug}>
          {columns.map((col: any) => {
            const value = col.getValue ? col.getValue(row) : row[col.key];
            return (
              <span key={col.key}>
                {col.render ? col.render(value, row) : String(value ?? '-')}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/components/mdx/metadataTables/metadataTableSkeleton', () => ({
  MetadataTableSkeleton: () => <div>metadata-skeleton</div>,
}));

describe('FeatTable', () => {
  it('renders the loading skeleton', () => {
    useFeatsMock.mockReturnValue({
      feats: [],
      isLoading: true,
      error: undefined,
    });
    render(<FeatTable />);
    expect(screen.getByText('metadata-skeleton')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    useFeatsMock.mockReturnValue({
      feats: [],
      isLoading: false,
      error: undefined,
    });
    render(<FeatTable />);
    expect(screen.getByText('noFeats')).toBeInTheDocument();
  });

  it('renders feats and marks repeatable ones', () => {
    useFeatsMock.mockReturnValue({
      feats: [
        { slug: 'tough', title: 'Tough', hasPrerequisite: false },
        {
          slug: 'ability-score-improvement',
          title: 'Ability Score Improvement',
          hasPrerequisite: false,
          repeatable: true,
        },
      ],
      isLoading: false,
      error: undefined,
    });
    render(<FeatTable />);
    expect(screen.getByText('Ability Score Improvement')).toBeInTheDocument();
    expect(screen.getByText('Tough')).toBeInTheDocument();
    // repeatable column renders tCommon('yes') for the repeatable feat only
    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('renders the declared category and an em dash without one', () => {
    useFeatsMock.mockReturnValue({
      feats: [
        {
          slug: 'refusal-of-fate',
          title: 'Refusal of Fate',
          hasPrerequisite: false,
          category: 'epic boon',
        },
        { slug: 'tough', title: 'Tough', hasPrerequisite: false },
      ],
      isLoading: false,
      error: undefined,
    });
    render(<FeatTable />);
    expect(screen.getByText('Epic boon')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('compiles prose fields instead of stripping their markup', () => {
    useFeatsMock.mockReturnValue({
      feats: [
        {
          slug: 'chef',
          title: 'Chef',
          hasPrerequisite: true,
          prerequisite: 'Proficiency with **cook** tools',
          description: 'You gain a **knack** for feeding people.',
        },
      ],
      isLoading: false,
      error: undefined,
    });
    const { container } = render(<FeatTable />);
    const bold = Array.from(container.querySelectorAll('strong')).map(
      (node) => node.textContent,
    );
    expect(bold).toContain('knack');
    expect(bold).toContain('cook');
    expect(container.textContent).not.toContain('**');
  });

  it('renders a link in compiled prose without emitting an anchor', () => {
    useFeatsMock.mockReturnValue({
      feats: [
        {
          slug: 'chef',
          title: 'Chef',
          hasPrerequisite: true,
          prerequisite: 'Proficiency with [Cooking](/library/items/tools/cooking)',
        },
      ],
      isLoading: false,
      error: undefined,
    });
    const { container } = render(<FeatTable />);
    expect(container.querySelector('a')).toBeNull();
    const labelled = container.querySelector('[title*="items/tools/cooking"]');
    expect(labelled).not.toBeNull();
    expect(labelled).toHaveTextContent('Cooking');
  });

  it('cuts a long summary well before the whole passage', () => {
    const passage = `${'word '.repeat(200)}tail`;
    useFeatsMock.mockReturnValue({
      feats: [
        {
          slug: 'verbose',
          title: 'Verbose',
          hasPrerequisite: false,
          description: passage,
        },
      ],
      isLoading: false,
      error: undefined,
    });
    const { container } = render(<FeatTable />);
    const text = container.textContent ?? '';
    expect(text).toContain('…');
    expect(text).not.toContain('tail');
    expect(text.length).toBeLessThan(passage.length / 2);
  });
});
