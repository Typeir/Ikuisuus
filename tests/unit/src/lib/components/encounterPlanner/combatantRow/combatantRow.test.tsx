/**
 * @fileoverview Unit tests for Play Mode Combatant Row component
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/combatantRow.test
 * @description Validates CombatantRow export and component signature.
 * Tests row component for displaying combatants during play mode with deed and resist mechanics.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/lib/components/encounterPlanner/playMode/playModeCombatantRow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as CombatantRowModule from '@/lib/components/encounterPlanner/combatantRow';
import { CombatantRow } from '@/lib/components/encounterPlanner/combatantRow';
import type { InProgressCombatant } from '@/lib/types/inProgressCombat';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock UI components
vi.mock('@/lib/components/ui', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

// Mock forceHeroicAwakening
vi.mock('@/lib/utils/inProgressCombatStorage', () => ({
  forceHeroicAwakening: vi.fn(),
}));

/**
 * Creates a mock combatant for testing
 */
const createMockCombatant = (overrides: Partial<InProgressCombatant> = {}): InProgressCombatant => ({
  id: 'test-combatant',
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
  hpFormula: '5d8 + 10',
  details: { buffs: [], items: [], spells: [], affixes: [] },
  slain: false,
  sessionOnly: false,
  sourceHref: '/library/monsters/test',
  crText: 'CR 2',
  legendaryDeedsUsed: [false, false, false],
  mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false, phase: false },
  resistRemaining: 0,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
  heroicAwakening: {
    fateDieResult: 0,
    heroicDc: 0,
    awakened: false,
    tier: 'none',
    affixes: [],
    bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
    hpOverride: null,
  },
  ...overrides,
});

describe('playModeCombatantRow', () => {
  it('should export CombatantRow component', () => {
    expect(CombatantRowModule.CombatantRow).toBeDefined();
    expect(typeof CombatantRowModule.CombatantRow).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = CombatantRowModule.CombatantRow.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export CombatantRow and sub-components', () => {
    const exports = Object.keys(CombatantRowModule);
    expect(exports).toContain('CombatantRow');
    expect(exports).toContain('CombatantMainStats');
    expect(exports).toContain('CombatantNameSection');
    expect(exports).toContain('CombatantMechanicsSection');
    expect(exports).toContain('CombatantHeroicSection');
    expect(exports).toContain('CombatantConditionsManager');
  });
});

describe('CombatantRow Resist Mechanics', () => {
  it('should display resist count when creature has resist mechanic', () => {
    const combatant = createMockCombatant({
      mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: true },
      resistRemaining: 2,
    });
    const mockOnUpdate = vi.fn();

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should not display resist section when creature lacks resist mechanic', () => {
    const combatant = createMockCombatant({
      mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
      resistRemaining: 3,
    });
    const mockOnUpdate = vi.fn();

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={mockOnUpdate}
      />
    );

    // Should not show resist count if no resist mechanic
    expect(screen.queryByRole('button', { name: /resistUse/i })).not.toBeInTheDocument();
  });

  it('should display resist button when creature has resist mechanic', () => {
    const combatant = createMockCombatant({
      mechanics: { lair: false, stratagem: false, legendaryDeed: true, resist: true },
      resistRemaining: 3,
      legendaryDeedsUsed: [false, false, false],
    });
    const mockOnUpdate = vi.fn();

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={mockOnUpdate}
      />
    );

    const resistButton = screen.getByRole('button', { name: /resistUse/i });
    expect(resistButton).toBeInTheDocument();
    expect(resistButton).not.toBeDisabled();
  });

  it('should disable resist button when resistRemaining is 0', () => {
    const combatant = createMockCombatant({
      mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: true },
      resistRemaining: 0,
      legendaryDeedsUsed: [false, false, false],
    });
    const mockOnUpdate = vi.fn();

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={mockOnUpdate}
      />
    );

    const resistButton = screen.getByRole('button', { name: /resistUse/i });
    expect(resistButton).toBeDisabled();
  });

  it('should update legendary deed pips when resist is used', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    const combatant = createMockCombatant({
      mechanics: { lair: false, stratagem: false, legendaryDeed: true, resist: true, phase: false },
      resistRemaining: 3,
      legendaryDeedsUsed: [false, false, false],
    });

    const { rerender } = render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={mockOnUpdate}
      />
    );

    // Verify initial state - all pips should be empty circles
    const initialPips = screen.getAllByRole('button', { name: '○' });
    expect(initialPips).toHaveLength(3);

    // Click resist button
    const resistButton = screen.getByRole('button', { name: /resistUse/i });
    await user.click(resistButton);

    // Verify onUpdate was called with complete updated combatant
    expect(mockOnUpdate).toHaveBeenCalled();
    const callArgs = mockOnUpdate.mock.calls[0][0];
    expect(callArgs.legendaryDeedsUsed).toEqual([true, false, false]);
    expect(callArgs.resistRemaining).toBe(2);

    // Simulate component re-render with updated state
    const updatedCombatant = createMockCombatant({
      mechanics: { lair: false, stratagem: false, legendaryDeed: true, resist: true, phase: false },
      resistRemaining: 2,
      legendaryDeedsUsed: [true, false, false],
    });

    rerender(
      <CombatantRow
        combatant={updatedCombatant}
        locale="en"
        onUpdate={mockOnUpdate}
      />
    );

    // Verify first pip is now filled and others are empty
    const filledPips = screen.getAllByRole('button', { name: '●' });
    expect(filledPips).toHaveLength(1);
    
    const emptyPips = screen.getAllByRole('button', { name: '○' });
    expect(emptyPips).toHaveLength(2);
  });
});

describe('CombatantRow Heroic Awakening Styling', () => {
  it('should not display awakened badge when not awakened', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 0,
        heroicDc: 0,
        awakened: false,
        tier: 'none',
        affixes: [],
        bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    expect(screen.queryByTestId('awakened-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('legendary-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mythic-badge')).not.toBeInTheDocument();
  });

  it('should display awakened badge when awakened with single affix', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 15,
        heroicDc: 12,
        awakened: true,
        tier: 'awakened',
        affixes: [{ text: 'Bloodthirsty' }],
        bonuses: { proficiencyBonus: 1, acBonus: 1, savingThrowBonus: 1 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('legendary-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mythic-badge')).not.toBeInTheDocument();
  });

  it('should display legendary badge when awakened with two affixes', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 18,
        heroicDc: 12,
        awakened: true,
        tier: 'legendary',
        affixes: [{ text: 'Stormbound' }, { text: 'Psionic' }],
        bonuses: { proficiencyBonus: 2, acBonus: 2, savingThrowBonus: 2 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
    expect(screen.getByTestId('legendary-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('mythic-badge')).not.toBeInTheDocument();
  });

  it('should display mythic badge when awakened with three affixes', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 20,
        heroicDc: 12,
        awakened: true,
        tier: 'mythic',
        affixes: [
          { text: 'Crusading' },
          { text: 'Flametongued' },
          { text: 'Frostveined' },
        ],
        bonuses: { proficiencyBonus: 3, acBonus: 3, savingThrowBonus: 3 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByTestId('awakened-badge')).toBeInTheDocument();
    expect(screen.queryByTestId('legendary-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('mythic-badge')).toBeInTheDocument();
  });

  it('should apply awakened class to combatant row when awakened', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 15,
        heroicDc: 12,
        awakened: true,
        tier: 'awakened',
        affixes: [{ text: 'Bloodthirsty' }],
        bonuses: { proficiencyBonus: 1, acBonus: 1, savingThrowBonus: 1 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    const row = screen.getByTestId('combatant-row');
    expect(row.className).toContain('awakened');
  });

  it('should apply affix-specific class based on first affix', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 18,
        heroicDc: 12,
        awakened: true,
        tier: 'legendary',
        affixes: [{ text: 'Stormbound' }, { text: 'Psionic' }],
        bonuses: { proficiencyBonus: 2, acBonus: 2, savingThrowBonus: 2 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    const row = screen.getByTestId('combatant-row');
    expect(row.className).toContain('awakened--stormbound');
  });

  it('should apply legendary tier class when awakened with two affixes', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 18,
        heroicDc: 12,
        awakened: true,
        tier: 'legendary',
        affixes: [{ text: 'Championed' }, { text: 'Rakish' }],
        bonuses: { proficiencyBonus: 2, acBonus: 2, savingThrowBonus: 2 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    const row = screen.getByTestId('combatant-row');
    expect(row.className).toContain('awakened--legendary');
  });

  it('should apply mythic tier class when awakened with three affixes', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 20,
        heroicDc: 12,
        awakened: true,
        tier: 'mythic',
        affixes: [
          { text: 'Sulphurous' },
          { text: 'Crusading' },
          { text: 'Flametongued' },
        ],
        bonuses: { proficiencyBonus: 3, acBonus: 3, savingThrowBonus: 3 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    const row = screen.getByTestId('combatant-row');
    expect(row.className).toContain('awakened--mythic');
  });

  it('should not apply awakened classes when not awakened', () => {
    const combatant = createMockCombatant({
      heroicAwakening: {
        fateDieResult: 5,
        heroicDc: 12,
        awakened: false,
        tier: 'none',
        affixes: [],
        bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
        hpOverride: null,
      },
    });

    render(
      <CombatantRow
        combatant={combatant}
        locale="en"
        onUpdate={vi.fn()}
      />
    );

    const row = screen.getByTestId('combatant-row');
    expect(row.className).not.toContain('awakened');
  });
});
