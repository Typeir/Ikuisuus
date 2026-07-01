/**
 * @fileoverview Unit tests for Combatant Heroic Section component
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/combatantHeroicSection.test
 * @description Validates CombatantHeroicSection component rendering and interactions.
 * Tests heroic awakening display, affixes, bonuses, and force awakening controls.
 * Uses CombatantProvider wrapper pattern for context-based component testing.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/encounter-planner/presentation/combatantRowHeroicSection
 * @requires @/modules/encounter-planner/presentation/playMode/CombatantContext
 */

import * as CombatantHeroicSectionModule from '@/modules/encounter-planner/presentation/combatantRow/combatantHeroicSection';
import { CombatantHeroicSection } from '@/modules/encounter-planner/presentation/combatantRow/combatantHeroicSection';
import { CombatantProvider } from '@/modules/encounter-planner/presentation/combatantRow/utils/context/combatantContext';
import type {
    AffixEntry,
    CombatantMechanics,
    HeroicAwakeningState,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/modules/encounter-planner/application/factories/combatSnapshot.factory', () => ({
  forceHeroicAwakening: vi.fn((combatant, tier) => {
    combatant.heroicAwakening = {
      ...combatant.heroicAwakening,
      awakened: true,
      tier,
      affixes: [{ text: 'Test Affix' }],
    };
  }),
}));

vi.mock('@/lib/components/ui', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createDefaultHeroicAwakening = (
  overrides: Partial<HeroicAwakeningState> = {},
): HeroicAwakeningState => ({
  fateDieResult: 0,
  heroicDc: 0,
  awakened: false,
  tier: 'none',
  affixes: [],
  bonuses: { tierBonus: 0, acBonus: 0, savingThrowBonus: 0 },
  hpOverride: null,
  ...overrides,
});

const createDefaultMechanics = (): CombatantMechanics => ({
  lair: false,
  stratagem: false,
  legendaryDeed: false,
  resist: false,
  phase: false,
});

const createMockCombatant = (
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant => ({
  id: 'test-combatant-1',
  name: 'Test Monster',
  hpCurrent: 100,
  hpMax: 100,
  hpMaxOverride: null,
  tempHp: null,
  ac: 15,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  conditions: [],
  initiativeValue: 15,
  initiativeBonus: 2,
  tierBonus: 2,
  tierBonusOverride: null,
  speed: '30 ft.',
  hpFormula: null,
  details: { buffs: [], items: [], spells: [], affixes: [] },
  slain: false,
  sessionOnly: false,
  heroicAwakening: createDefaultHeroicAwakening(),
  mechanics: createDefaultMechanics(),
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
  crText: 'CR 5',
  ...overrides,
});

const createAffixEntry = (text: string): AffixEntry => ({
  text,
});

/**
 * Renders CombatantHeroicSection wrapped in CombatantProvider.
 * Component now gets all props from context, so we pass combatant overrides.
 *
 * @param combatantOverrides - Partial combatant state to merge
 * @param onUpdate - Optional mock function for updates
 * @returns Render result with combatant and onUpdate refs
 */
const renderWithProvider = (
  combatantOverrides: Partial<InProgressCombatant> = {},
  onUpdate = vi.fn(),
) => {
  const combatant = createMockCombatant(combatantOverrides);
  return {
    ...render(
      <CombatantProvider combatant={combatant} locale='en' onUpdate={onUpdate}>
        <CombatantHeroicSection />
      </CombatantProvider>,
    ),
    combatant,
    onUpdate,
  };
};

describe('CombatantHeroicSection module', () => {
  it('should export CombatantHeroicSection component', () => {
    expect(CombatantHeroicSectionModule.CombatantHeroicSection).toBeDefined();
    expect(typeof CombatantHeroicSectionModule.CombatantHeroicSection).toBe(
      'function',
    );
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CombatantHeroicSectionModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CombatantHeroicSection');
  });
});

describe('CombatantHeroicSection not awakened', () => {
  it('should not render awakening details when not awakened', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({ awakened: false }),
    });

    expect(screen.queryByText(/Prof \+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/AC \+/)).not.toBeInTheDocument();
  });

  it('should render force awakening buttons when crText is present', () => {
    renderWithProvider({ crText: 'CR 5' });

    expect(screen.getByText('heroic.awakened')).toBeInTheDocument();
    expect(screen.getByText('heroic.legendary')).toBeInTheDocument();
    expect(screen.getByText('heroic.mythic')).toBeInTheDocument();
  });

  it('should not render force awakening buttons when crText is undefined', () => {
    renderWithProvider({ crText: undefined });

    expect(screen.queryByText('heroic.awakened')).not.toBeInTheDocument();
    expect(screen.queryByText('heroic.legendary')).not.toBeInTheDocument();
    expect(screen.queryByText('heroic.mythic')).not.toBeInTheDocument();
  });
});

describe('CombatantHeroicSection awakened display', () => {
  it('should render tier badge when awakened', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'legendary',
        fateDieResult: 15,
        heroicDc: 10,
        affixes: [createAffixEntry('Bloodthirsty')],
      }),
    });

    expect(screen.getAllByText('heroic.legendary').length).toBeGreaterThan(0);
  });

  it('should render fate die result', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        fateDieResult: 18,
        heroicDc: 12,
        affixes: [createAffixEntry('Test')],
      }),
    });

    expect(screen.getByText(/18/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('should render affixes when awakened', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        affixes: [createAffixEntry('Bloodthirsty')],
      }),
    });

    expect(screen.getByText('Bloodthirsty')).toBeInTheDocument();
  });

  it('should render multiple affixes', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        affixes: [
          createAffixEntry('Bloodthirsty'),
          createAffixEntry('Psionic'),
          createAffixEntry('Stormbound'),
        ],
      }),
    });

    expect(screen.getByText('Bloodthirsty')).toBeInTheDocument();
    expect(screen.getByText('Psionic')).toBeInTheDocument();
    expect(screen.getByText('Stormbound')).toBeInTheDocument();
  });

  it('should render bonuses when awakened', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        affixes: [createAffixEntry('Test')],
        bonuses: { tierBonus: 2, acBonus: 1, savingThrowBonus: 1 },
      }),
    });

    expect(screen.getByText('Prof +2')).toBeInTheDocument();
    expect(screen.getByText('AC +1')).toBeInTheDocument();
    expect(screen.getByText('Saves +1')).toBeInTheDocument();
  });
});

describe('CombatantHeroicSection force awakening', () => {
  it('should call onUpdate when awakened button is clicked', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({ awakened: false }),
      crText: 'CR 5',
    });

    await user.click(screen.getByText('heroic.awakened'));

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should call onUpdate when legendary button is clicked', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({ awakened: false }),
      crText: 'CR 5',
    });

    await user.click(screen.getByText('heroic.legendary'));

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should call onUpdate when mythic button is clicked', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({ awakened: false }),
      crText: 'CR 5',
    });

    await user.click(screen.getByText('heroic.mythic'));

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should render unawaken button when crText is present', () => {
    renderWithProvider({ crText: 'CR 5' });

    expect(
      screen.getByRole('button', { name: 'removeAwakening' }),
    ).toBeInTheDocument();
  });

  it('should call onUpdate with reset state when unawaken is clicked', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'legendary',
        affixes: [createAffixEntry('Test')],
      }),
      crText: 'CR 5',
    });

    await user.click(screen.getByRole('button', { name: 'removeAwakening' }));

    expect(onUpdate).toHaveBeenCalled();
    const calledWith = onUpdate.mock.calls[0][0];
    expect(calledWith.heroicAwakening.awakened).toBe(false);
    expect(calledWith.heroicAwakening.tier).toBe('none');
  });
});

describe('CombatantHeroicSection tier display', () => {
  it('should display awakened tier', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'awakened',
        affixes: [createAffixEntry('Test')],
      }),
    });

    expect(screen.getAllByText('heroic.awakened').length).toBeGreaterThan(0);
  });

  it('should display legendary tier', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'legendary',
        affixes: [createAffixEntry('Test')],
      }),
    });

    expect(screen.getAllByText('heroic.legendary').length).toBeGreaterThan(0);
  });

  it('should display mythic tier', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        tier: 'mythic',
        affixes: [createAffixEntry('Test')],
      }),
    });

    expect(screen.getAllByText('heroic.mythic').length).toBeGreaterThan(0);
  });
});

describe('CombatantHeroicSection bonuses display', () => {
  it('should display all bonuses together', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        affixes: [createAffixEntry('Test')],
        bonuses: { tierBonus: 3, acBonus: 2, savingThrowBonus: 1 },
      }),
    });

    expect(screen.getByText('Prof +3')).toBeInTheDocument();
    expect(screen.getByText('AC +2')).toBeInTheDocument();
    expect(screen.getByText('Saves +1')).toBeInTheDocument();
  });

  it('should display zero bonuses correctly', () => {
    renderWithProvider({
      heroicAwakening: createDefaultHeroicAwakening({
        awakened: true,
        affixes: [createAffixEntry('Test')],
        bonuses: { tierBonus: 0, acBonus: 0, savingThrowBonus: 0 },
      }),
    });

    expect(screen.getByText('Prof +0')).toBeInTheDocument();
    expect(screen.getByText('AC +0')).toBeInTheDocument();
    expect(screen.getByText('Saves +0')).toBeInTheDocument();
  });
});
