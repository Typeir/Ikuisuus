/**
 * @fileoverview Unit tests for FilteredSpellTable component
 * @module tests/unit/src/lib/components/mdx/spellTable/filteredSpellTable.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUseTranslationsMock,
  loadMessageFile,
} from '../../../testUtils/translationMockUtils';

const mockHook = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: createUseTranslationsMock({
    tables: loadMessageFile('messages/en/tables.json'),
  }),
}));

vi.mock('@/lib/hooks/data/useSpellSources', () => ({
  useSpellSources: (...args: unknown[]) => mockHook(...args),
}));

vi.mock('@/lib/components/mdx/spellTable/useSpellColumns', () => ({
  useSpellColumns: () => [],
}));

vi.mock('@/lib/components/mdx/metadataTables/metadataTable', () => ({
  default: ({ data }: { data: Array<{ title: string }> }) => (
    <div data-testid='metadata-table'>{data.map((row) => row.title).join(', ')}</div>
  ),
}));

vi.mock('@/lib/components/mdx/spellTable/spellTableSkeleton', () => ({
  SpellTableSkeleton: () => <div data-testid='skeleton'>Loading...</div>,
}));

vi.mock('@/lib/components/ui', () => ({
  FilterSelect: ({ id, value, options, onChange, ariaLabel }: any) => (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}>
      <option value=''>All</option>
      {options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

import FilteredSpellTable from '@/lib/components/mdx/spellTable/filteredSpellTable';

/**
 * Creates a mock spell row for table tests.
 *
 * @param {Record<string, unknown>} overrides - Fields to override
 * @returns {Record<string, unknown>} Spell-like row
 */
function makeSpell(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'fireball',
    title: 'Fireball',
    level: 3,
    school: 'Evocation',
    castingTimeRaw: '1 action',
    duration: 'Instantaneous',
    range: '150 feet',
    concentration: false,
    file: 'local',
    ...overrides,
  };
}

describe('FilteredSpellTable', () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it('shows skeleton while loading', () => {
    mockHook.mockReturnValue({ spellData: [], loading: true, error: null });

    render(<FilteredSpellTable sources={['/api/spells']} />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error message when hook returns an error', () => {
    mockHook.mockReturnValue({
      spellData: [],
      loading: false,
      error: 'Network error',
    });

    render(<FilteredSpellTable sources={['/api/spells']} />);

    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  it('filters out external spells when Damocles Only is enabled', async () => {
    const user = userEvent.setup();

    mockHook.mockReturnValue({
      spellData: [
        makeSpell({ title: 'Fireball', level: 1, file: 'local' }),
        makeSpell({ title: 'SRD Spell', slug: 'srd-spell', level: 1, file: 'external' }),
      ],
      loading: false,
      error: null,
    });

    render(<FilteredSpellTable sources={['/api/spells']} levels={[1]} />);

    expect(screen.getByTestId('metadata-table')).toHaveTextContent('Fireball');
    expect(screen.getByTestId('metadata-table')).toHaveTextContent('SRD Spell');

    await user.click(screen.getByLabelText(/damocles only/i));

    expect(screen.getByTestId('metadata-table')).toHaveTextContent('Fireball');
    expect(screen.getByTestId('metadata-table')).not.toHaveTextContent('SRD Spell');
  });
});
