/**
 * @fileoverview Test that slain checkbox is rendered and clickable
 * @description This test ensures that the slain checkbox in the CombatantRow component
 * renders correctly and can be interacted with.
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/slainCheckboxBasic
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires vitest
 * @requires @testing-library/react
 * @requires @testing-library/user-event
 * @requires @/lib/components/encounterPlanner/combatantRow
 * @requires @/lib/types/inProgressCombat 
 * 
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantRow } from '@/lib/components/encounterPlanner/combatantRow';
import type { InProgressCombatant } from '@/lib/types/inProgressCombat';

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

const createCombatant = (slain: boolean = false): InProgressCombatant => ({
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
  mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  locked: [],
});

describe('Slain Checkbox - Visual Only', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
  });

  it('Step 1: Checkbox should render', () => {
    const combatant = createCombatant(false);
    
    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale="en"
      />
    );

    // Find the checkbox by its role
    const checkbox = screen.getByRole('checkbox', { name: /slain/i });
    
    expect(checkbox).toBeInTheDocument();
    console.log('✅ Step 1: Checkbox renders');
  });

  it('Step 2: Checkbox should be clickable', async () => {
    const user = userEvent.setup();
    const combatant = createCombatant(false);
    
    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale="en"
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /slain/i });
    
    // Click it
    await user.click(checkbox);
    
    // Verify it called onUpdate
    expect(mockOnUpdate).toHaveBeenCalled();
    console.log('✅ Step 2: Checkbox is clickable');
  });

  it('Step 3: Checkbox should display as checked when slain=true', () => {
    const combatant = createCombatant(true);
    
    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale="en"
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /slain/i }) as HTMLInputElement;
    
    // Should be checked
    expect(checkbox.checked).toBe(true);
    console.log('✅ Step 3: Checkbox shows as checked');
  });

  it('Step 4: Checkbox should display as unchecked when slain=false', () => {
    const combatant = createCombatant(false);
    
    render(
      <CombatantRow
        combatant={combatant}
        onUpdate={mockOnUpdate}
        onRemoveSessionOnly={vi.fn()}
        locale="en"
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /slain/i }) as HTMLInputElement;
    
    // Should NOT be checked
    expect(checkbox.checked).toBe(false);
    console.log('✅ Step 4: Checkbox shows as unchecked');
  });
});
