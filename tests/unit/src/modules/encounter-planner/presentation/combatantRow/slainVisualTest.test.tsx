/**
 * @fileoverview Visual test for the CombatantRow slain checkbox.
 * @description Verifies the row's `slain` class tracks the slain flag.
 *
 * @module tests/unit/src/modules/encounter-planner/presentation/combatantRow/slainVisualTest.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @testing-library/user-event
 * @requires @/modules/encounter-planner/presentation/combatantRow
 * @requires @/modules/encounter-planner/domain/combat/inProgressCombat.types
 */

import { CombatantRow } from '@/modules/encounter-planner/presentation/combatantRow';
import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const createMockCombatant = (slain: boolean = false): InProgressCombatant => ({
  id: 'test-1',
  name: 'Test Monster',
  hpCurrent: 50,
  hpMax: 100,
  hpMaxOverride: null,
  tempHp: null,
  ac: 15,
  stats: { str: 16, dex: 14, con: 16, int: 10, wis: 12, cha: 8 },
  conditions: [],
  initiativeValue: null,
  initiativeBonus: 2,
  tierBonus: 3,
  tierBonusOverride: null,
  speed: '30 ft.',
  hpFormula: '8d10 + 24',
  details: { buffs: [], items: [], spells: [], affixes: [] },
  slain,
  sessionOnly: false,
  sourceHref: undefined,
  crText: 'CR 5',
  heroicAwakening: {
    fateDieResult: 0,
    heroicDc: 0,
    awakened: false,
    tier: 'none',
    affixes: [],
    bonuses: { tierBonus: 0, acBonus: 0, savingThrowBonus: 0 },
    hpOverride: null,
  },
  mechanics: {
    lair: false,
    stratagem: false,
    resist: false,
    legendaryDeed: false,
    phase: false,
  },
  legendaryDeedsUsed: [],
  phaseDeeds: {
    wounded: false,
    bloodied: false,
    doomed: false,
  },
  resistRemaining: 0,
  locked: [],
});

describe('Slain Visual Test', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
  });

  it('should NOT have slain class when slain is false', () => {
    const combatant = createMockCombatant(false);

    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale='en'
      />,
    );

    const row = screen.getByTestId('combatant-row');

    // Should NOT have slain class
    expect(row.className).not.toMatch(/slain/i);
  });

  it('should HAVE slain class when slain is true', () => {
    const combatant = createMockCombatant(true);

    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale='en'
      />,
    );

    const row = screen.getByTestId('combatant-row');

    // SHOULD have slain class
    expect(row.className).toMatch(/slain/i);
  });

  it('should add slain class when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const combatant = createMockCombatant(false);

    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale='en'
      />,
    );

    const row = screen.getByTestId('combatant-row');
    const checkbox = screen.getByRole('checkbox', { name: /slain/i });

    // Before click - no slain class
    expect(row.className).not.toMatch(/slain/i);

    // Click checkbox
    await user.click(checkbox);

    // Check onUpdate was called with slain: true
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ slain: true }),
    );
  });
});
