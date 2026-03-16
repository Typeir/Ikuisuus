/**
 * @fileoverview Unit tests for Combatant Name Section component
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/combatantNameSection.test
 * @description Validates CombatantNameSection component rendering and interactions.
 * Tests name display, CR badge, awakening badges, stratagem badge, and remove button.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/encounterPlanner/combatantRowNameSection
 * @requires @/lib/components/encounterPlanner/playMode/CombatantContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as CombatantNameSectionModule from '@/lib/components/encounterPlanner/combatantRow/combatantNameSection';
import { CombatantNameSection } from '@/lib/components/encounterPlanner/combatantRow/combatantNameSection';
import { CombatantProvider } from '@/lib/components/encounterPlanner/combatantRow/utils/context/combatantContext';
import type { HeroicAwakeningState, CombatantMechanics, InProgressCombatant } from '@/lib/types/inProgressCombat';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/lib/components/ui', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

const createDefaultHeroicAwakening = (overrides: Partial<HeroicAwakeningState> = {}): HeroicAwakeningState => ({
  fateDieResult: 0,
  heroicDc: 0,
  awakened: false,
  tier: 'none',
  affixes: [],
  bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
  hpOverride: null,
  ...overrides,
});

const createDefaultMechanics = (overrides: Partial<CombatantMechanics> = {}): CombatantMechanics => ({
  lair: false,
  stratagem: false,
  legendaryDeed: false,
  resist: false,
  phase: false,
  ...overrides,
});

/**
 * Creates a mock combatant for testing
 */
const createMockCombatant = (overrides: Partial<InProgressCombatant> = {}): InProgressCombatant => ({
  id: 'test-combatant-1',
  name: 'Test Creature',
  hpCurrent: 50,
  hpMax: 100,
  hpMaxOverride: null,
  tempHp: null,
  ac: 15,
  stats: { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 8 },
  conditions: [],
  initiativeValue: 15,
  initiativeBonus: 2,
  proficiencyBonus: 2,
  proficiencyBonusOverride: null,
  speed: '30 ft.',
  hpFormula: null,
  details: { buffs: [], items: [], spells: [], affixes: [] },
  slain: false,
  sessionOnly: false,
  locked: [],
  crText: 'CR 5',
  sourceHref: '/library/monsters/test',
  heroicAwakening: createDefaultHeroicAwakening(),
  mechanics: createDefaultMechanics(),
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
  ...overrides,
});

/**
 * Renders CombatantNameSection with CombatantProvider wrapper
 */
const renderWithProvider = (
  combatantOverrides: Partial<InProgressCombatant> = {},
  props: { locked?: boolean; onToggleLock?: () => void } = {},
  onUpdate = vi.fn(),
  onRemoveSessionOnly?: () => void
) => {
  const combatant = createMockCombatant(combatantOverrides);
  return {
    ...render(
      <CombatantProvider combatant={combatant} locale="en" onUpdate={onUpdate} onRemoveSessionOnly={onRemoveSessionOnly}>
        <CombatantNameSection {...props} />
      </CombatantProvider>
    ),
    combatant,
    onUpdate,
  };
};

describe('CombatantNameSection module', () => {
  it('should export CombatantNameSection component', () => {
    expect(CombatantNameSectionModule.CombatantNameSection).toBeDefined();
    expect(typeof CombatantNameSectionModule.CombatantNameSection).toBe('function');
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CombatantNameSectionModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CombatantNameSection');
  });
});

describe('CombatantNameSection rendering', () => {
  it('should render combatant name', () => {
    renderWithProvider({ name: 'Test Creature' });

    expect(screen.getByDisplayValue('Test Creature')).toBeInTheDocument();
  });

  it('should render CR badge when crText is provided', () => {
    renderWithProvider({ crText: 'CR 5' });

    expect(screen.getByText('CR 5')).toBeInTheDocument();
  });

  it('should not render CR badge when crText is undefined', () => {
    renderWithProvider({ crText: undefined });

    expect(screen.queryByText(/CR/)).not.toBeInTheDocument();
  });

  it('should render wiki link when sourceHref is provided', () => {
    renderWithProvider({ sourceHref: '/library/monsters/test' });

    const wikiLink = screen.getByText('Wiki');
    expect(wikiLink).toBeInTheDocument();
    expect(wikiLink.closest('a')).toHaveAttribute('href', '/library/monsters/test');
  });

  it('should not render wiki link when sourceHref is undefined', () => {
    renderWithProvider({ sourceHref: undefined });

    expect(screen.queryByText('Wiki')).not.toBeInTheDocument();
  });
});

describe('CombatantNameSection awakening badges', () => {
  it('should not render awakening badge when not awakened', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({ awakened: false }),
    });

    expect(screen.queryByTestId('awakened-badge')).not.toBeInTheDocument();
  });

  it('should render awakening badge when awakened', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        affixes: [{ text: 'Bloodthirsty', description: '' }],
      }),
    });

    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
  });

  it('should render legendary badge when awakened with 2 affixes', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'legendary',
        affixes: [
          { text: 'Bloodthirsty', description: '' },
          { text: 'Psionic', description: '' },
        ],
      }),
    });

    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
    expect(screen.getByTestId('legendary-badge')).toBeInTheDocument();
  });

  it('should render mythic badge when awakened with 3+ affixes', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'mythic',
        affixes: [
          { text: 'Bloodthirsty', description: '' },
          { text: 'Psionic', description: '' },
          { text: 'Stormbound', description: '' },
        ],
      }),
    });

    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
    expect(screen.getByTestId('mythic-badge')).toBeInTheDocument();
  });
});

describe('CombatantNameSection stratagem badge', () => {
  it('should not render stratagem badge when stratagem is false', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ stratagem: false }),
    });

    expect(screen.queryByTestId('stratagem-badge')).not.toBeInTheDocument();
  });

  it('should render stratagem badge when stratagem is true', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ stratagem: true }),
    });

    expect(screen.getByTestId('stratagem-badge')).toBeInTheDocument();
    expect(screen.getByText('stratagem')).toBeInTheDocument();
  });

  it('should not render stratagem badge when mechanics is undefined', () => {
    renderWithProvider({
      mechanics: undefined,
    });

    expect(screen.queryByTestId('stratagem-badge')).not.toBeInTheDocument();
  });
});

describe('CombatantNameSection remove button', () => {
  it('should not render remove button when onRemoveSessionOnly is undefined', () => {
    renderWithProvider({}, {}, vi.fn(), undefined);

    expect(screen.queryByRole('button', { name: 'removeCombatant' })).not.toBeInTheDocument();
  });

  it('should render remove button when onRemoveSessionOnly is provided', () => {
    const mockRemove = vi.fn();
    renderWithProvider({}, {}, vi.fn(), mockRemove);

    expect(screen.getByRole('button', { name: 'removeCombatant' })).toBeInTheDocument();
  });

  it('should call onRemoveSessionOnly when remove button is clicked', async () => {
    const user = userEvent.setup();
    const mockRemove = vi.fn();
    renderWithProvider({}, {}, vi.fn(), mockRemove);

    await user.click(screen.getByRole('button', { name: 'removeCombatant' }));

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe('CombatantNameSection combined badges', () => {
  it('should render all badges together when applicable', () => {
    renderWithProvider({
      crText: 'CR 10',
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'legendary',
        affixes: [
          { text: 'Bloodthirsty', description: '' },
          { text: 'Psionic', description: '' },
        ],
      }),
      mechanics: createDefaultMechanics({ stratagem: true }),
    });

    expect(screen.getByText('CR 10')).toBeInTheDocument();
    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
    expect(screen.getByTestId('legendary-badge')).toBeInTheDocument();
    expect(screen.getByTestId('stratagem-badge')).toBeInTheDocument();
  });
});
