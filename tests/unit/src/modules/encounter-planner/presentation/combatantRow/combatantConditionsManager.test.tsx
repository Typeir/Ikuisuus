/**
 * @fileoverview Unit tests for CombatantConditionsManager component.
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/combatantConditionsManager.test
 * @description Tests condition display and add/remove behavior.
 * Renders component inside CombatantProvider.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/encounter-planner/presentation/combatantRowConditionsManager
 * @requires @/modules/encounter-planner/presentation/playMode/CombatantContext
 */

import * as CombatantConditionsManagerModule from '@/modules/encounter-planner/presentation/combatantRow/combatantConditionsManager';
import { CombatantConditionsManager } from '@/modules/encounter-planner/presentation/combatantRow/combatantConditionsManager';
import { CombatantProvider } from '@/modules/encounter-planner/presentation/combatantRow/utils/context/combatantContext';
import type {
  CombatantMechanics,
  ConditionEntry,
  HeroicAwakeningState,
  InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const createConditionEntry = (id: string, text: string): ConditionEntry => ({
  id,
  text,
});

/**
 * Returns default HeroicAwakeningState for combatant mock.
 */
const createDefaultHeroicAwakening = (): HeroicAwakeningState => ({
  fateDieResult: 0,
  heroicDc: 0,
  awakened: false,
  tier: 'none',
  affixes: [],
  bonuses: { tierBonus: 0, acBonus: 0, savingThrowBonus: 0 },
  hpOverride: null,
});

/**
 * Returns default CombatantMechanics for combatant mock.
 */
const createDefaultMechanics = (): CombatantMechanics => ({
  lair: false,
  stratagem: false,
  legendaryDeed: false,
  resist: false,
  phase: false,
});

/**
 * Returns a mock InProgressCombatant with optional overrides.
 */
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

/**
 * Renders CombatantConditionsManager inside CombatantProvider.
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
        <CombatantConditionsManager />
      </CombatantProvider>,
    ),
    combatant,
    onUpdate,
  };
};

describe('CombatantConditionsManager module', () => {
  it('should export CombatantConditionsManager component', () => {
    expect(
      CombatantConditionsManagerModule.CombatantConditionsManager,
    ).toBeDefined();
    expect(
      typeof CombatantConditionsManagerModule.CombatantConditionsManager,
    ).toBe('function');
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CombatantConditionsManagerModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CombatantConditionsManager');
  });
});

describe('CombatantConditionsManager empty state', () => {
  it('should render add condition input when no conditions', () => {
    renderWithProvider({ conditions: [] });

    expect(screen.getByPlaceholderText('addCondition')).toBeInTheDocument();
  });

  it('should render empty chips container when no conditions', () => {
    const { container } = renderWithProvider({ conditions: [] });

    const chipsContainer = container.querySelector('[class*="chips"]');
    expect(chipsContainer).toBeInTheDocument();
    expect(chipsContainer?.children.length).toBe(0);
  });

  it('should not render condition items when empty', () => {
    const { container } = renderWithProvider({ conditions: [] });

    expect(container.querySelectorAll('button').length).toBe(1);
  });
});

describe('CombatantConditionsManager condition display', () => {
  it('should render single condition', () => {
    renderWithProvider({
      conditions: [createConditionEntry('1', 'Stunned')],
    });

    expect(screen.getByText('Stunned')).toBeInTheDocument();
  });

  it('should render multiple conditions', () => {
    renderWithProvider({
      conditions: [
        createConditionEntry('1', 'Stunned'),
        createConditionEntry('2', 'Poisoned'),
        createConditionEntry('3', 'Frightened'),
      ],
    });

    expect(screen.getByText('Stunned')).toBeInTheDocument();
    expect(screen.getByText('Poisoned')).toBeInTheDocument();
    expect(screen.getByText('Frightened')).toBeInTheDocument();
  });

  it('should render remove button for each condition', () => {
    renderWithProvider({
      conditions: [
        createConditionEntry('1', 'Stunned'),
        createConditionEntry('2', 'Poisoned'),
      ],
    });

    const removeButtons = screen.getAllByRole('button', {
      name: 'removeCondition',
    });
    expect(removeButtons).toHaveLength(2);
  });
});

describe('CombatantConditionsManager add condition', () => {
  it('should call onUpdate when Enter is pressed with text', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, 'Blinded{Enter}');

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ text: 'Blinded' }),
        ]),
      }),
    );
  });

  it('should clear input after adding condition', async () => {
    const user = userEvent.setup();
    renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, 'Blinded{Enter}');

    expect(input).toHaveValue('');
  });

  it('should not call onUpdate for empty input', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, '{Enter}');

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should not call onUpdate for whitespace-only input', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, '   {Enter}');

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should call onUpdate when add button is clicked', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, 'Charmed');
    const addButton = screen.getByRole('button', { name: '+' });
    await user.click(addButton);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ text: 'Charmed' }),
        ]),
      }),
    );
  });

  it('should append to existing conditions', async () => {
    const user = userEvent.setup();
    const existingConditions = [createConditionEntry('1', 'Stunned')];
    const { onUpdate } = renderWithProvider({ conditions: existingConditions });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, 'Prone{Enter}');

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ text: 'Stunned' }),
          expect.objectContaining({ text: 'Prone' }),
        ]),
      }),
    );
  });
});

describe('CombatantConditionsManager remove condition', () => {
  it('should call onUpdate when remove button is clicked', async () => {
    const user = userEvent.setup();
    const conditions = [createConditionEntry('abc123', 'Stunned')];
    const { onUpdate } = renderWithProvider({ conditions });

    const removeButton = screen.getByRole('button', {
      name: 'removeCondition',
    });
    await user.click(removeButton);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [],
      }),
    );
  });

  it('should remove only the clicked condition', async () => {
    const user = userEvent.setup();
    const conditions = [
      createConditionEntry('1', 'Stunned'),
      createConditionEntry('2', 'Poisoned'),
      createConditionEntry('3', 'Frightened'),
    ];
    const { onUpdate } = renderWithProvider({ conditions });

    const removeButtons = screen.getAllByRole('button', {
      name: 'removeCondition',
    });
    await user.click(removeButtons[1]);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [
          expect.objectContaining({ text: 'Stunned' }),
          expect.objectContaining({ text: 'Frightened' }),
        ],
      }),
    );
  });
});

describe('CombatantConditionsManager input handling', () => {
  it('should update input value as user types', async () => {
    const user = userEvent.setup();
    renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, 'Grappled');

    expect(input).toHaveValue('Grappled');
  });

  it('should trim whitespace from condition text', async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderWithProvider({ conditions: [] });

    const input = screen.getByPlaceholderText('addCondition');
    await user.type(input, '  Restrained  {Enter}');

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ text: 'Restrained' }),
        ]),
      }),
    );
  });
});
