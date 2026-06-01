import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FilteredSpellTable from '@/modules/metadata-tables/presentation/FilteredSpellTable/FilteredSpellTable';

const mockUseSpellSources = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/modules/metadata-tables/application/hooks/useSpellSources', () => ({
  useSpellSources: (...args: unknown[]) => mockUseSpellSources(...args),
}));

vi.mock('@/modules/metadata-tables/presentation/useSpellColumns', () => ({
  useSpellColumns: () => [],
}));

vi.mock('@/modules/metadata-tables/presentation/SpellTableSkeleton', () => ({
  SpellTableSkeleton: () => <div>loading</div>,
}));

vi.mock('@/lib/components/mdx/metadataTables/metadataTable', () => ({
  default: ({ data }: { data: Array<{ title: string }> }) => (
    <div data-testid='filtered-spell-table'>{data.map((row) => row.title).join(', ')}</div>
  ),
}));

describe('FilteredSpellTable', () => {
  beforeEach(() => {
    mockUseSpellSources.mockReset();
  });

  it('shows loading skeleton', () => {
    mockUseSpellSources.mockReturnValue({
      spellData: [],
      loading: true,
      refetching: false,
      error: null,
    });

    render(<FilteredSpellTable sources={['/api/spells']} />);

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('updates rendered rows after tab change', async () => {
    const user = userEvent.setup();

    mockUseSpellSources.mockReturnValue({
      spellData: [
        { slug: 'fireball', title: 'Fireball', level: 3, school: 'Evocation' },
        { slug: 'magic-missile', title: 'Magic Missile', level: 1, school: 'Evocation' },
      ],
      loading: false,
      refetching: false,
      error: null,
    });

    render(<FilteredSpellTable sources={['/api/spells']} levels={[1, 3]} />);

    await user.click(screen.getByRole('button', { name: '1st Level' }));
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
  });
});
