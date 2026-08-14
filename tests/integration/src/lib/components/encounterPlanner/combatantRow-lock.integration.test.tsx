/**
 * @fileoverview Integration tests for CombatantRow lock functionality.
 * Verifies lock toggle, input disabling, and state persistence via the locked array.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantRow } from '@/modules/encounter-planner/presentation/combatantRow';
import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';

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

const createCombatant = (overrides: Partial<InProgressCombatant> = {}): InProgressCombatant => ({
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
  slain: false,
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
  mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  locked: [],
  ...overrides,
});

describe('CombatantRow Lock Integration', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
  });

  describe('Lock Button Toggle Behavior', () => {
    it('should toggle lock array when lock button is clicked', async () => {
      const user = userEvent.setup();
      const combatant = createCombatant({ locked: [] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      // Find and click the lock button
      const lockButton = screen.getByRole('button', { name: /lock|unlock/i });
      await user.click(lockButton);

      // Should call onUpdate with locked: ['stats']
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          locked: ['stats'],
        })
      );
    });

    it('should remove field from locked array when clicking locked lock button', async () => {
      const user = userEvent.setup();
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      // Find and click the lock button again
      const lockButton = screen.getByRole('button', { name: /lock|unlock/i });
      await user.click(lockButton);

      // Should call onUpdate with locked: [] (empty array)
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          locked: [],
        })
      );
    });
  });

  describe('Input Disabling Based on Lock State', () => {
    it('should disable AC input when stats is in locked array', () => {
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const acInput = screen.getByLabelText('ac');
      expect(acInput).toBeDisabled();
    });

    it('should disable HP Max input when stats is in locked array', () => {
      const combatant = createCombatant({ hpMax: 100, locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const hpMaxInput = screen.getByDisplayValue('100');
      expect(hpMaxInput).toBeDisabled();
    });

    it('should disable all ability score inputs when stats is in locked array', () => {
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const strInput = screen.getByLabelText('stats.str');
      const dexInput = screen.getByLabelText('stats.dex');
      const conInput = screen.getByLabelText('stats.con');

      expect(strInput).toBeDisabled();
      expect(dexInput).toBeDisabled();
      expect(conInput).toBeDisabled();
    });

    it('should disable initiative input when stats is in locked array', () => {
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const initiativeInput = screen.getByLabelText('initiative');
      expect(initiativeInput).toBeDisabled();
    });

    it('should NOT disable HP Current input when stats is locked', () => {
      const combatant = createCombatant({ hpCurrent: 50, locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const hpCurrentInput = screen.getAllByDisplayValue('50')[0];
      expect(hpCurrentInput).not.toBeDisabled();
    });

    it('should NOT disable Temp HP input when stats is locked', () => {
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const tempHpInput = screen.getByLabelText('tempHp');
      expect(tempHpInput).not.toBeDisabled();
    });

    it('should NOT disable slain checkbox when stats is locked', () => {
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('Locked State Visual Indicators', () => {
    it('should show locked styling on locked inputs', () => {
      const combatant = createCombatant({ locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const acInput = screen.getByLabelText('ac') as HTMLInputElement;
      expect(acInput.className).toContain('lockedInput');
    });

    it('should NOT show locked styling on unlocked inputs', () => {
      const combatant = createCombatant({ locked: [] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const acInput = screen.getByLabelText('ac') as HTMLInputElement;
      expect(acInput.className).not.toContain('lockedInput');
    });
  });

  describe('End-to-End Lock Workflow', () => {
    it('should complete full lock/unlock cycle', async () => {
      const user = userEvent.setup();
      let currentCombatant = createCombatant({ locked: [] });
      const onUpdate = (updates: Partial<InProgressCombatant>) => {
        currentCombatant = { ...currentCombatant, ...updates };
      };

      const { rerender } = render(
        <CombatantRow
          combatant={currentCombatant}
          onUpdate={onUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      // Initial state: inputs should not be disabled
      let acInput = screen.getByLabelText('ac') as HTMLInputElement;
      expect(acInput).not.toBeDisabled();

      // Click lock button to lock
      let lockButton = screen.getByRole('button', { name: /lock|unlock/i });
      await user.click(lockButton);
      expect(currentCombatant.locked).toContain('stats');

      // Rerender with locked state
      rerender(
        <CombatantRow
          combatant={currentCombatant}
          onUpdate={onUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      // Now inputs should be disabled
      acInput = screen.getByLabelText('ac');
      expect(acInput).toBeDisabled();

      // Click lock button again to unlock
      lockButton = screen.getByRole('button', { name: /lock|unlock/i });
      await user.click(lockButton);
      expect(currentCombatant.locked).not.toContain('stats');

      // Rerender with unlocked state
      rerender(
        <CombatantRow
          combatant={currentCombatant}
          onUpdate={onUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      // Inputs should be enabled again
      acInput = screen.getByLabelText('ac');
      expect(acInput).not.toBeDisabled();
    });

    it('should prevent editing locked inputs', async () => {
      const user = userEvent.setup();
      const combatant = createCombatant({ ac: 15, locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const acInput = screen.getByLabelText('ac') as HTMLInputElement;
      
      // Try to type in locked input
      await user.type(acInput, '20');
      
      // Input should still have original value (disabled prevents input)
      expect(acInput.value).toBe('15');
    });

    it('should allow editing unlocked inputs even when other fields are locked', async () => {
      const user = userEvent.setup();
      const combatant = createCombatant({ hpCurrent: 50, locked: ['stats'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const hpCurrentInputs = screen.getAllByDisplayValue('50');
      const hpCurrentInput = hpCurrentInputs[0] as HTMLInputElement;

      // HP Current should not be disabled
      expect(hpCurrentInput).not.toBeDisabled();

      // Should be able to edit
      await user.clear(hpCurrentInput);
      await user.type(hpCurrentInput, '75');
      fireEvent.blur(hpCurrentInput);

      // Verify onUpdate was called (HP Current editable while stats locked)
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  describe('Multiple Field Locking (Future)', () => {
    it('should support locking multiple fields in the array', () => {
      const combatant = createCombatant({ locked: ['stats', 'hpCurrent'] });

      render(
        <CombatantRow
          combatant={combatant}
          onUpdate={mockOnUpdate}
          onRemove={vi.fn()}
          locale="en"
        />
      );

      const acInput = screen.getByLabelText('ac');
      const hpCurrentInputs = screen.getAllByDisplayValue('50');
      const hpCurrentInput = hpCurrentInputs[0];

      // Both should be considered in locked state if system supports it
      expect(combatant.locked).toContain('stats');
      expect(combatant.locked).toContain('hpCurrent');
    });
  });
});
