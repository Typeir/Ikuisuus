/**
 * @fileoverview Simple visual test for slain checkbox
 * Tests that clicking slain checkbox adds the slain class to the combatant row
 */

import { PlayModeCombatantRow } from '@/lib/components/encounterPlanner/playMode';
import type { InProgressCombatant } from '@/lib/types/inProgressCombat';
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
  proficiencyBonus: 3,
  proficiencyBonusOverride: null,
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
    bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
    hpOverride: null,
  },
  mechanics: {
    lair: false,
    stratagem: false,
    legendaryDeed: false,
    resist: false,
  },
  legendaryDeedsUsed: [],
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
      <PlayModeCombatantRow
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
      <PlayModeCombatantRow
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
      <PlayModeCombatantRow
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
