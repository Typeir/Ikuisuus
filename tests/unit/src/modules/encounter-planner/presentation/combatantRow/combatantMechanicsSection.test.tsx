/**
 * @fileoverview Unit tests for Combatant Mechanics Section component
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/combatantMechanicsSection.test
 * @description Validates CombatantMechanicsSection component rendering and interactions.
 * Tests legendary deed tracker and resist counter functionality.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/encounter-planner/presentation/combatantRowMechanicsSection
 * @requires @/modules/encounter-planner/presentation/playMode/CombatantContext
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as CombatantMechanicsSectionModule from '@/modules/encounter-planner/presentation/combatantRow/combatantMechanicsSection';
import { CombatantMechanicsSection } from '@/modules/encounter-planner/presentation/combatantRow/combatantMechanicsSection';
import { CombatantProvider } from '@/modules/encounter-planner/presentation/combatantRow/utils/context/combatantContext';
import type { CombatantMechanics, InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const createDefaultMechanics = (overrides: Partial<CombatantMechanics> = {}): CombatantMechanics => ({
  lair: false,
  stratagem: false,
  legendaryDeed: false,
  resist: false,
  phase: false,
  ...overrides,
});

const createMockCombatant = (overrides: Partial<InProgressCombatant> = {}): InProgressCombatant => ({
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
  locked: [],
  heroicAwakening: {
    fateDieResult: 0,
    heroicDc: 0,
    awakened: false,
    tier: 'none',
    affixes: [],
    bonuses: { tierBonus: 0, acBonus: 0, savingThrowBonus: 0 },
    hpOverride: null,
  },
  mechanics: createDefaultMechanics(),
  legendaryDeedsUsed: [false, false, false],
  resistRemaining: 3,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
  ...overrides,
});

/**
 * Renders CombatantMechanicsSection with CombatantProvider wrapper
 */
const renderWithProvider = (
  combatantOverrides: Partial<InProgressCombatant> = {},
  onUpdate = vi.fn()
) => {
  const combatant = createMockCombatant(combatantOverrides);
  return {
    ...render(
      <CombatantProvider combatant={combatant} locale="en" onUpdate={onUpdate}>
        <CombatantMechanicsSection />
      </CombatantProvider>
    ),
    combatant,
    onUpdate,
  };
};

describe('CombatantMechanicsSection module', () => {
  it('should export CombatantMechanicsSection component', () => {
    expect(CombatantMechanicsSectionModule.CombatantMechanicsSection).toBeDefined();
    expect(typeof CombatantMechanicsSectionModule.CombatantMechanicsSection).toBe('function');
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CombatantMechanicsSectionModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CombatantMechanicsSection');
  });
});

describe('CombatantMechanicsSection with no mechanics', () => {
  it('should render nothing when mechanics is undefined', () => {
    const { container } = renderWithProvider({
      mechanics: undefined,
    });

    const mechanicsSection = container.querySelector('[class*="mechanicsSection"]');
    expect(mechanicsSection).toBeNull();
  });

  it('should render nothing when neither legendaryDeed nor resist is true', () => {
    const { container } = renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: false, resist: false }),
    });

    const mechanicsSection = container.querySelector('[class*="mechanicsSection"]');
    expect(mechanicsSection).toBeNull();
  });
});

describe('CombatantMechanicsSection legendary deeds', () => {
  it('should render deed tracker pips when legendaryDeed is true', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true }),
      legendaryDeedsUsed: [false, false, false],
    });

    const emptyPips = screen.getAllByRole('button', { name: '○' });
    expect(emptyPips).toHaveLength(3);
  });

  it('should render filled pips for used deeds', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true }),
      legendaryDeedsUsed: [true, false, true],
    });

    const filledPips = screen.getAllByRole('button', { name: '●' });
    const emptyPips = screen.getAllByRole('button', { name: '○' });
    expect(filledPips).toHaveLength(2);
    expect(emptyPips).toHaveLength(1);
  });

  it('should call onUpdate when pip is clicked', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider(
      {
        mechanics: createDefaultMechanics({ legendaryDeed: true }),
        legendaryDeedsUsed: [false, false, false],
      },
      mockOnUpdate
    );

    const pips = screen.getAllByRole('button', { name: '○' });
    await user.click(pips[1]);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ legendaryDeedsUsed: [false, true, false] })
    );
  });

  it('should toggle deed from used to unused', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider(
      {
        mechanics: createDefaultMechanics({ legendaryDeed: true }),
        legendaryDeedsUsed: [true, false, false],
      },
      mockOnUpdate
    );

    const filledPip = screen.getByRole('button', { name: '●' });
    await user.click(filledPip);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ legendaryDeedsUsed: [false, false, false] })
    );
  });

  it('should render reset deeds button', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true }),
    });

    expect(screen.getByTitle('legendaryDeedsReset')).toBeInTheDocument();
  });

  it('should reset all deeds when reset button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider(
      {
        mechanics: createDefaultMechanics({ legendaryDeed: true }),
        legendaryDeedsUsed: [true, true, true],
      },
      mockOnUpdate
    );

    await user.click(screen.getByTitle('legendaryDeedsReset'));

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ legendaryDeedsUsed: [false, false, false] })
    );
  });
});

describe('CombatantMechanicsSection resist counter', () => {
  it('should render resist section when resist is true', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ resist: true }),
      resistRemaining: 3,
    });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('resistUse')).toBeInTheDocument();
  });

  it('should disable resist button when resistRemaining is 0', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ resist: true, legendaryDeed: true }),
      legendaryDeedsUsed: [false, false, false],
      resistRemaining: 0,
    });

    const resistButton = screen.getByText('resistUse');
    expect(resistButton).toBeDisabled();
  });

  it('should disable resist button when all deeds are used', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ resist: true, legendaryDeed: true }),
      legendaryDeedsUsed: [true, true, true],
      resistRemaining: 2,
    });

    const resistButton = screen.getByText('resistUse');
    expect(resistButton).toBeDisabled();
  });

  it('should enable resist button when resistRemaining > 0 and deeds available', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ resist: true, legendaryDeed: true }),
      legendaryDeedsUsed: [false, false, false],
      resistRemaining: 2,
    });

    const resistButton = screen.getByText('resistUse');
    expect(resistButton).not.toBeDisabled();
  });

  it('should call onUpdate when resist button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider(
      {
        mechanics: createDefaultMechanics({ resist: true, legendaryDeed: true }),
        legendaryDeedsUsed: [false, false, false],
        resistRemaining: 3,
      },
      mockOnUpdate
    );

    await user.click(screen.getByText('resistUse'));

    expect(mockOnUpdate).toHaveBeenCalled();
    const calledWith = mockOnUpdate.mock.calls[0][0];
    expect(calledWith.legendaryDeedsUsed[0]).toBe(true);
    expect(calledWith.resistRemaining).toBe(2);
  });

  it('should render reset resist button', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ resist: true }),
    });

    expect(screen.getByTitle('resistReset')).toBeInTheDocument();
  });

  it('should reset resist to 3 when reset button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider(
      {
        mechanics: createDefaultMechanics({ resist: true }),
        resistRemaining: 0,
      },
      mockOnUpdate
    );

    await user.click(screen.getByTitle('resistReset'));

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ resistRemaining: 3 })
    );
  });
});

describe('CombatantMechanicsSection combined mechanics', () => {
  it('should render both deed tracker and resist when both are true', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true, resist: true }),
      legendaryDeedsUsed: [false, false, false],
      resistRemaining: 3,
    });

    const pips = screen.getAllByRole('button', { name: '○' });
    expect(pips).toHaveLength(3);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('resistUse')).toBeInTheDocument();
  });

  it('should render labels for both sections', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true, resist: true }),
    });

    expect(screen.getByText('legendaryDeeds')).toBeInTheDocument();
    expect(screen.getByText('resist')).toBeInTheDocument();
  });
});

describe('CombatantMechanicsSection edge cases', () => {
  it('should not render deed pips when legendaryDeedsUsed is empty', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true }),
      legendaryDeedsUsed: [],
    });

    expect(screen.queryByRole('button', { name: '○' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '●' })).not.toBeInTheDocument();
  });

  it('should handle single deed slot', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true }),
      legendaryDeedsUsed: [false],
    });

    const pips = screen.getAllByRole('button', { name: '○' });
    expect(pips).toHaveLength(1);
  });

  it('should handle many deed slots', () => {
    renderWithProvider({
      mechanics: createDefaultMechanics({ legendaryDeed: true }),
      legendaryDeedsUsed: [false, false, false, false, false],
    });

    const pips = screen.getAllByRole('button', { name: '○' });
    expect(pips).toHaveLength(5);
  });
});
