/**
 * @fileoverview FeatTable tests
 * @description Verifies the feat library table renders loading, empty, and data
 * states and flags repeatable feats via the multiSelect column.
 *
 * @module tests/unit/src/modules/metadata-tables/presentation/FeatTable/FeatTable
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
          multiSelect: true,
        },
      ],
      isLoading: false,
      error: undefined,
    });
    render(<FeatTable />);
    expect(screen.getByText('Ability Score Improvement')).toBeInTheDocument();
    expect(screen.getByText('Tough')).toBeInTheDocument();
    // repeatable column renders tCommon('yes') for the multiSelect feat only
    expect(screen.getByText('yes')).toBeInTheDocument();
  });
});
