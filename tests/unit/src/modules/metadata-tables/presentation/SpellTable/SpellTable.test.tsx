import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SpellTable from '@/modules/metadata-tables/presentation/SpellTable/SpellTable';

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
  SpellTableSkeleton: () => <div data-testid='spell-skeleton'>loading</div>,
}));

vi.mock('@/lib/components/mdx/metadataTables/metadataTable', () => ({
  default: ({ data }: { data: Array<{ title: string }> }) => (
    <div data-testid='spell-table'>{data.map((row) => row.title).join(', ')}</div>
  ),
}));

describe('SpellTable', () => {
  beforeEach(() => {
    mockUseSpellSources.mockReset();
  });

  it('renders skeleton while loading', () => {
    mockUseSpellSources.mockReturnValue({ spellData: [], loading: true, error: null });

    render(<SpellTable sources={['/api/spells']} />);

    expect(screen.getByTestId('spell-skeleton')).toBeInTheDocument();
  });

  it('renders level-filtered spell rows', () => {
    mockUseSpellSources.mockReturnValue({
      spellData: [
        { slug: 'fireball', title: 'Fireball', level: 3 },
        { slug: 'magic-missile', title: 'Magic Missile', level: 1 },
      ],
      loading: false,
      error: null,
    });

    render(<SpellTable sources={['/api/spells']} levels={[1, 3]} />);

    fireEvent.click(screen.getByRole('button', { name: '1st Level' }));
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
  });
});
