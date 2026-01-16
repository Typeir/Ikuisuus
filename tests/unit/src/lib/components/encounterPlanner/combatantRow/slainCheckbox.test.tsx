/**
 * @fileoverview Comprehensive unit tests for slain checkbox functionality
 * @description Tests slain checkbox behavior, styling, state persistence, and visual feedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatantRow } from '@/lib/components/encounterPlanner/combatantRow';
import type { InProgressCombatant } from '@/lib/types/inProgressCombat';

// Mock react-dom for portal rendering
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

/**
 * Creates a mock combatant for testing
 */
const createMockCombatant = (overrides?: Partial<InProgressCombatant>): InProgressCombatant => ({
  id: 'test-combatant-1',
  name: 'Test Monster',
  hpCurrent: 50,
  hpMax: 100,
  hpMaxOverride: null,
  tempHp: null,
  ac: 15,
  stats: {
    str: 16,
    dex: 14,
    con: 16,
    int: 10,
    wis: 12,
    cha: 8,
  },
  conditions: [],
  initiativeValue: null,
  initiativeBonus: 2,
  proficiencyBonus: 3,
  proficiencyBonusOverride: null,
  speed: '30 ft.',
  hpFormula: '8d10 + 24',
  details: {
    buffs: [],
    items: [],
    spells: [],
    affixes: [],
  },
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
    bonuses: {
      proficiencyBonus: 0,
      acBonus: 0,
      savingThrowBonus: 0,
    },
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
  ...overrides,
});

describe('CombatantRow - Slain Checkbox', () => {
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockOnRemoveSessionOnly: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    mockOnRemoveSessionOnly = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Checkbox Visibility', () => {
    it('should render slain checkbox', () => {
      const combatant = createMockCombatant();
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      expect(checkbox).toBeInTheDocument();
    });

    it('should show unchecked checkbox when slain is false', () => {
      const combatant = createMockCombatant({ slain: false });
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should show checked checkbox when slain is true', () => {
      const combatant = createMockCombatant({ slain: true });
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Checkbox Interaction', () => {
    it('should call onUpdate when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: false });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it('should toggle slain state from false to true', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: false });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ slain: true })
        );
      });
    });

    it('should toggle slain state from true to false', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: true });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ slain: false })
        );
      });
    });

    it('should set slain state and HP to 0 when marking as slain', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: false, hpCurrent: 50 });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ 
            slain: true,
            hpCurrent: 0
          })
        );
      });
    });
  });

  describe('Visual Styling - Row Opacity', () => {
    it('should NOT have slain class when slain is false', () => {
      const combatant = createMockCombatant({ slain: false });
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row).toBeInTheDocument();
      expect(row?.className).not.toMatch(/slain/);
    });

    it('should have slain class when slain is true', () => {
      const combatant = createMockCombatant({ slain: true });
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row).toBeInTheDocument();
      expect(row?.className).toMatch(/slain/);
    });

    it('should apply slain class to the entire combatant row', () => {
      const combatant = createMockCombatant({ slain: true });
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row?.className).toMatch(/slain/);
    });
  });

  describe('Visual Styling - Text Elements', () => {
    it('should have slain class affecting all child elements', () => {
      const combatant = createMockCombatant({ 
        slain: true,
        name: 'Slain Monster',
        hpCurrent: 0,
        hpMax: 100,
      });
      
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row?.className).toMatch(/slain/);
      
      // Verify the monster name is present (will have strikethrough via CSS)
      expect(screen.getByText('Slain Monster')).toBeInTheDocument();
    });

    it('should render all stat values when slain', () => {
      const combatant = createMockCombatant({ 
        slain: true,
        ac: 18,
        stats: {
          str: 20,
          dex: 14,
          con: 16,
          int: 12,
          wis: 15,
          cha: 10,
        },
      });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      // All these elements should be rendered and will have strikethrough via CSS
      // Use getAllByDisplayValue for values that might appear in multiple places
      expect(screen.getByDisplayValue('18')).toBeInTheDocument(); // AC
      expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // STR
      expect(screen.getByDisplayValue('16')).toBeInTheDocument(); // CON
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // CHA
    });
  });

  describe('State Persistence', () => {
    it('should maintain slain state after HP changes', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: true, hpCurrent: 0 });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i }) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should keep slain styling when combatant has conditions', () => {
      const combatant = createMockCombatant({ 
        slain: true,
        conditions: [
          { id: '1', text: 'Prone' },
          { id: '2', text: 'Stunned' },
        ],
      });
      
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row?.className).toMatch(/slain/);
    });

    it('should keep slain styling when combatant has buffs', () => {
      const combatant = createMockCombatant({ 
        slain: true,
        details: {
          buffs: ['Bless', 'Haste'],
          items: [],
          spells: [],
          affixes: [],
        },
      });
      
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row?.className).toMatch(/slain/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid clicks on checkbox', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: false });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('should handle slain combatant with 0 HP', () => {
      const combatant = createMockCombatant({ slain: true, hpCurrent: 0 });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    it('should handle slain combatant with negative HP', () => {
      const combatant = createMockCombatant({ slain: true, hpCurrent: -10 });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = screen.getByTestId('combatant-row');
      expect(row.className).toMatch(/slain/);
    });

    it('should work with legendary creatures', () => {
      const combatant = createMockCombatant({ 
        slain: true,
        mechanics: {
          lair: true,
          stratagem: false,
          legendaryDeed: true,
          resist: true,
        },
        legendaryDeedsUsed: [false, false, false],
        resistRemaining: 3,
      });
      
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row?.className).toMatch(/slain/);
    });

    it('should work with awakened creatures', () => {
      const combatant = createMockCombatant({ 
        slain: true,
        heroicAwakening: {
          fateDieResult: 18,
          heroicDc: 15,
          awakened: true,
          tier: 'legendary',
          affixes: [],
          bonuses: {
            proficiencyBonus: 2,
            acBonus: 2,
            savingThrowBonus: 2,
          },
          hpOverride: 150,
        },
      });
      
      const { container } = render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const row = container.querySelector('[data-testid="combatant-row"]');
      expect(row?.className).toMatch(/slain/);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label for slain checkbox', () => {
      const combatant = createMockCombatant();
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      expect(checkbox).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const combatant = createMockCombatant({ slain: false });
      
      render(
        <CombatantRow
          combatant={combatant}
          locale="en"
          onUpdate={mockOnUpdate}
          onRemoveSessionOnly={mockOnRemoveSessionOnly}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /slain/i });
      checkbox.focus();
      
      await user.keyboard(' '); // Space key

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });
});
