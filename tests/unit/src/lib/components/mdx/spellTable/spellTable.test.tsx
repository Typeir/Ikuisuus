/**
 * @fileoverview Unit tests for Spell Table component
 * @module tests/unit/src/lib/components/mdx/spellTable/spellTable.test
 * @description Validates SpellTable rendering across loading, error, and data states,
 * tab switching, column rendering, and ritual casting time display.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/metadata-tables/presentation/SpellTable/SpellTable
 */

import { fireEvent, render, screen } from '@testing-library/react';
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/modules/metadata-tables/application/hooks/useSpellSources', () => ({
  useSpellSources: (...args: unknown[]) => mockHook(...args),
}));

vi.mock('@/modules/metadata-tables/presentation/SpellTableSkeleton', () => ({
  SpellTableSkeleton: () => <div data-testid='skeleton'>Loading...</div>,
}));

vi.mock('@/lib/components/ui', () => ({
  FilterSelect: ({ id, placeholder }: any) => (
    <select data-testid={id}>
      <option>{placeholder}</option>
    </select>
  ),
  NumericInput: ({ placeholder, ...rest }: any) => (
    <input
      type='number'
      placeholder={placeholder}
      aria-label={rest['aria-label']}
    />
  ),
}));

import SpellTable from '@/modules/metadata-tables/presentation/SpellTable/SpellTable';

/**
 * Creates a mock spell for testing.
 *
 * @param {Partial<Record<string, unknown>>} overrides - Property overrides
 * @returns {Record<string, unknown>} Mock spell data
 */
function makeSpell(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'fireball',
    title: 'Fireball',
    level: 3,
    school: 'Evocation',
    castingTime: ['action'],
    castingTimeRaw: '1 action',
    range: '150 feet',
    duration: 'Instantaneous',
    components: {
      verbal: true,
      somatic: true,
      material: true,
    },
    materialDescription: 'a tiny ball of bat guano',
    concentration: false,
    ...overrides,
  };
}

describe('SpellTable', () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it('shows skeleton while loading', () => {
    mockHook.mockReturnValue({ spellData: [], loading: true, error: null });
    render(<SpellTable sources={['/api/spells']} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows error message', () => {
    mockHook.mockReturnValue({
      spellData: [],
      loading: false,
      error: 'Network error',
    });
    render(<SpellTable sources={['/api/spells']} />);
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('shows no spells message when filtered level is empty', () => {
    mockHook.mockReturnValue({
      spellData: [makeSpell({ level: 3 })],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[0, 1, 2, 3]} />);
    const cantripsTab = screen.getByRole('button', { name: /Cantrip/i });
    fireEvent.click(cantripsTab);
    expect(
      screen.getByText('No spells found for this level.'),
    ).toBeInTheDocument();
  });

  it('renders spell data in table', () => {
    mockHook.mockReturnValue({
      spellData: [makeSpell()],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[3]} />);
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('150 feet')).toBeInTheDocument();
  });

  it('renders school in italic', () => {
    mockHook.mockReturnValue({
      spellData: [makeSpell()],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[3]} />);
    const schoolCell = screen.getByText('Evocation');
    expect(schoolCell.tagName).toBe('EM');
  });

  it('renders casting time with ritual tag', () => {
    mockHook.mockReturnValue({
      spellData: [
        makeSpell({
          slug: 'detect-magic',
          title: 'Detect Magic',
          level: 1,
          castingTime: ['action', 'ritual'],
        }),
      ],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[1]} />);
    expect(screen.getByText('Action (R)')).toBeInTheDocument();
  });

  it('renders concentration prefix on duration', () => {
    mockHook.mockReturnValue({
      spellData: [
        makeSpell({
          slug: 'bless',
          title: 'Bless',
          level: 1,
          duration: '1 minute',
          concentration: true,
        }),
      ],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[1]} />);
    expect(screen.getByText('Concentration, 1 minute')).toBeInTheDocument();
  });

  it('renders component abbreviations V, S, M', () => {
    mockHook.mockReturnValue({
      spellData: [makeSpell()],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[3]} />);
    expect(screen.getByText('V, S, M')).toBeInTheDocument();
  });

  it('filters spells by active tab level', () => {
    mockHook.mockReturnValue({
      spellData: [
        makeSpell({ slug: 'fb', title: 'Fireball', level: 3 }),
        makeSpell({ slug: 'mm', title: 'Magic Missile', level: 1 }),
      ],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[1, 3]} />);
    const level1Tab = screen.getByRole('button', { name: /1st Level/i });
    fireEvent.click(level1Tab);
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
  });

  it('shows all spells in All tab', () => {
    mockHook.mockReturnValue({
      spellData: [
        makeSpell({ slug: 'fb', title: 'Fireball', level: 3 }),
        makeSpell({ slug: 'mm', title: 'Magic Missile', level: 1 }),
      ],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[1, 3]} showAllTab />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
  });

  it('falls back to default level label for unmapped levels', () => {
    mockHook.mockReturnValue({
      spellData: [
        makeSpell({ slug: 'mythic-bolt', title: 'Mythic Bolt', level: 99 }),
      ],
      loading: false,
      error: null,
    });
    render(<SpellTable sources={['/api/spells']} levels={[99]} />);
    expect(
      screen.getByRole('button', { name: 'Level 99' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Mythic Bolt')).toBeInTheDocument();
  });
});
