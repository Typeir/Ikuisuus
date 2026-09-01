/**
 * @fileoverview Unit tests for Combatant Main Stats component
 * @module tests/unit/src/modules/encounter-planner/presentation/combatantRow/combatantMainStats.test
 * @description Validates CombatantMainStats component rendering and interactions.
 * Tests HP display, AC, ability scores, initiative, and slain checkbox.
 * All numeric fields (HP Max, AC, stats, initiative) are now editable with keyboard support.
 *
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/encounter-planner/presentation/combatantRowMainStats
 * @requires @/modules/encounter-planner/presentation/playMode/CombatantContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as CombatantMainStatsModule from '@/modules/encounter-planner/presentation/combatantRow/combatantMainStats';
import { CombatantMainStats } from '@/modules/encounter-planner/presentation/combatantRow/combatantMainStats';
import { CombatantProvider } from '@/modules/encounter-planner/presentation/combatantRow/utils/context/combatantContext';
import type { InProgressCombatant } from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const defaultStats = { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 8 };

/**
 * Creates a mock combatant for testing
 */
const createMockCombatant = (overrides: Partial<InProgressCombatant> = {}): InProgressCombatant => ({
  id: 'test-combatant-1',
  name: 'Test Monster',
  hpCurrent: 50,
  hpMax: 100,
  hpMaxOverride: null,
  tempHp: null,
  ac: 15,
  stats: defaultStats,
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
  mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false, phase: false },
  legendaryDeedsUsed: [],
  resistRemaining: 0,
  phaseDeeds: { wounded: false, bloodied: false, doomed: false },
  ...overrides,
});

/**
 * Renders CombatantMainStats with CombatantProvider wrapper
 */
const renderWithProvider = (
  combatantOverrides: Partial<InProgressCombatant> = {},
  props: { showSlain?: boolean; locked?: boolean } = {},
  onUpdate = vi.fn()
) => {
  const combatant = createMockCombatant(combatantOverrides);
  return {
    ...render(
      <CombatantProvider combatant={combatant} locale="en" onUpdate={onUpdate}>
        <CombatantMainStats {...props} />
      </CombatantProvider>
    ),
    combatant,
    onUpdate,
  };
};

describe('CombatantMainStats module', () => {
  it('should export CombatantMainStats component', () => {
    expect(CombatantMainStatsModule.CombatantMainStats).toBeDefined();
    expect(typeof CombatantMainStatsModule.CombatantMainStats).toBe('function');
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CombatantMainStatsModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CombatantMainStats');
  });
});

describe('CombatantMainStats HP display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render HP current input', () => {
    renderWithProvider({ hpCurrent: 50 });

    const hpInput = screen.getByDisplayValue('50');
    expect(hpInput).toBeInTheDocument();
  });

  it('should render HP max input with correct value', () => {
    renderWithProvider({ hpMax: 100 });

    const hpMaxInput = screen.getByDisplayValue('100');
    expect(hpMaxInput).toBeInTheDocument();
  });

  it('should use hpMaxOverride when provided', () => {
    renderWithProvider({ hpMaxOverride: 150 });

    const hpMaxInput = screen.getByDisplayValue('150');
    expect(hpMaxInput).toBeInTheDocument();
  });

  it('should call onUpdate with hpCurrent when HP input changes', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ hpCurrent: 50 }, {}, mockOnUpdate);

    const hpInput = screen.getByDisplayValue('50');
    await user.clear(hpInput);
    await user.type(hpInput, '75');

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ hpCurrent: expect.any(Number) }));
  });

  it('should call onUpdate with hpMax when HP Max input is edited and committed', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ hpMax: 100, hpMaxOverride: null }, {}, mockOnUpdate);

    const hpMaxInput = screen.getByDisplayValue('100');
    await user.clear(hpMaxInput);
    await user.type(hpMaxInput, '120');
    fireEvent.blur(hpMaxInput);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ hpMax: 120 }));
  });

  it('should call onUpdate with hpMaxOverride when override is active and HP Max is edited', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ hpMaxOverride: 150 }, {}, mockOnUpdate);

    const hpMaxInput = screen.getByDisplayValue('150');
    await user.clear(hpMaxInput);
    await user.type(hpMaxInput, '180');
    fireEvent.blur(hpMaxInput);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ hpMaxOverride: 180 }));
  });
});

describe('CombatantMainStats Temp HP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render temp HP input when tempHp is non-zero', () => {
    renderWithProvider({ tempHp: 10 });

    const tempHpInput = screen.getByLabelText('tempHp');
    expect(tempHpInput).toHaveValue('10');
  });

  it('should render empty temp HP input when tempHp is null', () => {
    renderWithProvider({ tempHp: null });

    const tempHpInput = screen.getByLabelText('tempHp');
    expect(tempHpInput).toHaveValue('');
  });

  it('should call onUpdate with tempHp when temp HP input changes', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ tempHp: 10 }, {}, mockOnUpdate);

    const tempHpInput = screen.getByLabelText('tempHp');
    await user.clear(tempHpInput);
    await user.type(tempHpInput, '15');

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ tempHp: expect.any(Number) }));
  });

  it('should call onUpdate with null when temp HP is cleared', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ tempHp: 10 }, {}, mockOnUpdate);

    const tempHpInput = screen.getByLabelText('tempHp');
    await user.clear(tempHpInput);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ tempHp: null }));
  });
});

describe('CombatantMainStats phase marker', () => {
  it('should render Wounded phase marker when HP is at 75% or below', () => {
    renderWithProvider({ hpCurrent: 75, hpMax: 100 });

    expect(screen.getByText('Wounded')).toBeInTheDocument();
  });

  it('should render Bloodied phase marker when HP is at 50% or below', () => {
    renderWithProvider({ hpCurrent: 50, hpMax: 100 });

    expect(screen.getByText('Bloodied')).toBeInTheDocument();
  });

  it('should render Doomed phase marker when HP is at 25% or below', () => {
    renderWithProvider({ hpCurrent: 25, hpMax: 100 });

    expect(screen.getByText('Doomed')).toBeInTheDocument();
  });

  it('should not render phase marker when HP is above 75%', () => {
    renderWithProvider({ hpCurrent: 90, hpMax: 100 });

    expect(screen.queryByText('Wounded')).not.toBeInTheDocument();
    expect(screen.queryByText('Bloodied')).not.toBeInTheDocument();
    expect(screen.queryByText('Doomed')).not.toBeInTheDocument();
  });

  it('should use hpMaxOverride for phase marker calculation', () => {
    renderWithProvider({ hpCurrent: 112, hpMax: 100, hpMaxOverride: 150 });

    expect(screen.getByText('Wounded')).toBeInTheDocument();
  });
});

describe('CombatantMainStats AC display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render AC input with value', () => {
    renderWithProvider({ ac: 18 });

    const acInput = screen.getByDisplayValue('18');
    expect(acInput).toBeInTheDocument();
  });

  it('should render AC label', () => {
    renderWithProvider();

    expect(screen.getByText('ac')).toBeInTheDocument();
  });

  it('should call onUpdate with ac when AC input is edited and committed', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ ac: 15 }, {}, mockOnUpdate);

    const acInput = screen.getByLabelText('ac');
    await user.clear(acInput);
    await user.type(acInput, '20');
    fireEvent.blur(acInput);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ ac: 20 }));
  });

  it('should disable AC input when locked', () => {
    renderWithProvider({ locked: ['stats'] }, { locked: ['stats'] });

    const acInput = screen.getByLabelText('ac');
    expect(acInput).toBeDisabled();
  });
});

describe('CombatantMainStats ability scores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all ability score labels', () => {
    renderWithProvider();

    expect(screen.getByText('stats.str')).toBeInTheDocument();
    expect(screen.getByText('stats.dex')).toBeInTheDocument();
    expect(screen.getByText('stats.con')).toBeInTheDocument();
    expect(screen.getByText('stats.int')).toBeInTheDocument();
    expect(screen.getByText('stats.wis')).toBeInTheDocument();
    expect(screen.getByText('stats.cha')).toBeInTheDocument();
  });

  it('should render positive ability modifiers with plus sign', () => {
    const stats = { str: 16, dex: 14, con: 12, int: 10, wis: 10, cha: 10 };
    renderWithProvider({ stats });

    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('should render negative ability modifiers', () => {
    const stats = { str: 8, dex: 6, con: 10, int: 10, wis: 10, cha: 10 };
    renderWithProvider({ stats });

    expect(screen.getByText('-1')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('should render zero modifier as +0', () => {
    const stats = { str: 10, dex: 11, con: 10, int: 10, wis: 10, cha: 10 };
    renderWithProvider({ stats });

    const zeroMods = screen.getAllByText('+0');
    expect(zeroMods.length).toBeGreaterThan(0);
  });

  it('should call onUpdate with stats when ability score is edited and committed', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({}, {}, mockOnUpdate);

    const strInput = screen.getByLabelText('stats.str');
    await user.clear(strInput);
    await user.type(strInput, '16');
    fireEvent.blur(strInput);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ stats: expect.objectContaining({ str: 16 }) }));
  });

  it('should disable ability score inputs when locked', () => {
    renderWithProvider({ locked: ['stats'] }, { locked: ['stats'] });

    const strInput = screen.getByLabelText('stats.str');
    expect(strInput).toBeDisabled();
  });
});

describe('CombatantMainStats initiative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render initiative input with value', () => {
    renderWithProvider({ initiativeValue: 20 });

    const initiativeInput = screen.getByLabelText('initiative');
    expect(initiativeInput).toHaveValue('20');
  });

  it('should render empty initiative input when initiative is null', () => {
    renderWithProvider({ initiativeValue: null });

    const initiativeInput = screen.getByLabelText('initiative');
    expect(initiativeInput).toHaveValue('');
  });

  it('should call onUpdate when initiative input is edited and committed', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ initiativeValue: 15 }, {}, mockOnUpdate);

    const initiativeInput = screen.getByLabelText('initiative');
    await user.clear(initiativeInput);
    await user.type(initiativeInput, '20');
    fireEvent.blur(initiativeInput);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ initiativeValue: 20 }));
  });

  it('should disable initiative input when locked', () => {
    renderWithProvider({ locked: ['stats'] }, { locked: ['stats'] });

    const initiativeInput = screen.getByLabelText('initiative');
    expect(initiativeInput).toBeDisabled();
  });

  it('should cancel edit on Escape key', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ initiativeValue: 15 }, {}, mockOnUpdate);

    const initiativeInput = screen.getByLabelText('initiative');
    await user.clear(initiativeInput);
    await user.type(initiativeInput, '999');
    fireEvent.keyDown(initiativeInput, { key: 'Escape' });

    expect(mockOnUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ initiativeValue: 999 }));
  });

  it('should commit edit on Enter key', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ initiativeValue: 15 }, {}, mockOnUpdate);

    const initiativeInput = screen.getByLabelText('initiative');
    await user.clear(initiativeInput);
    await user.type(initiativeInput, '25');
    fireEvent.keyDown(initiativeInput, { key: 'Enter' });

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ initiativeValue: 25 }));
  });
});

describe('CombatantMainStats slain checkbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render slain checkbox unchecked', () => {
    renderWithProvider({ slain: false });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should render slain checkbox checked', () => {
    renderWithProvider({ slain: true });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should call onUpdate with slain true when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ slain: false }, {}, mockOnUpdate);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ slain: true }));
  });

  it('should call onUpdate with slain false when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = vi.fn();
    renderWithProvider({ slain: true }, {}, mockOnUpdate);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ slain: false }));
  });

  it('should render slain label', () => {
    renderWithProvider();

    expect(screen.getByText('slain')).toBeInTheDocument();
  });
});

describe('CombatantMainStats locked state', () => {
  it('should disable HP Max input when locked', () => {
    renderWithProvider({ hpMax: 100, locked: ['stats'] }, { locked: ['stats'] });

    const hpMaxInput = screen.getByDisplayValue('100');
    expect(hpMaxInput).toBeDisabled();
  });

  it('should not disable HP Current input when locked', () => {
    renderWithProvider({ hpCurrent: 50, locked: ['stats'] }, { locked: ['stats'] });

    const hpCurrentInput = screen.getByDisplayValue('50');
    expect(hpCurrentInput).not.toBeDisabled();
  });

  it('should not disable Temp HP input when locked', () => {
    renderWithProvider({ tempHp: 10, locked: ['stats'] }, { locked: ['stats'] });

    const tempHpInput = screen.getByLabelText('tempHp');
    expect(tempHpInput).toHaveValue('10');
    expect(tempHpInput).not.toBeDisabled();
  });

  it('should not disable slain checkbox when locked', () => {
    renderWithProvider({ locked: ['stats'] }, { locked: ['stats'] });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeDisabled();
  });
});
