/**
 * @fileoverview CombatStatChips Unit Tests
 * @description Smoke tests for the combat stat chips component.
 *
 * @module tests/unit/character-builder/presentation/stats/combatStatChips
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CombatStatChips } from '@/modules/character-builder/presentation/stats/combatStatChips';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/** Minimal character data for smoke testing. */
const mockData = {
  id: 'test-1',
  name: 'Test',
  playerName: '',
  level: 1,
  experience: 0,
  bloodlineSlug: null,
  bloodlineTitle: '',
  boonBudget: 0,
  selectedBoons: [],
  vocations: [],
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  hpMax: 10,
  hpCurrent: 10,
  tempHp: 0,
  ac: 10,
  initiativeBonus: 0,
  speedOverride: null,
  bloodlineSpeeds: [],
  tierBonus: 2,
  gritCurrent: 3,
  gritMax: 5,
  manualStatOverrides: [],
  hitDiceLog: [],
  conditions: [],
  attacks: [],
  spellSlots: [],
  savingThrows: {
    str: 'none',
    dex: 'none',
    con: 'none',
    int: 'none',
    wis: 'none',
    cha: 'none',
  },
  skills: [],
  tools: [],
  equipment: [],
  equipmentNotes: '',
  selectedFeats: [],
  focusedShardType: null,
  focusedShardSlug: null,
  currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
  coinHoldings: [],
  wants: '',
  fears: '',
  virtues: '',
  flaws: '',
  bonds: '',
  notes: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as const;

describe('CombatStatChips', () => {
  it('renders all six stat chips', () => {
    const patch = vi.fn();
    render(<CombatStatChips data={mockData as any} patch={patch} />);
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.getByText('Initiative')).toBeInTheDocument();
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('Grit')).toBeInTheDocument();
  });

  it('shows grit value', () => {
    const patch = vi.fn();
    render(<CombatStatChips data={mockData as any} patch={patch} />);
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('shows lock buttons', () => {
    const patch = vi.fn();
    render(<CombatStatChips data={mockData as any} patch={patch} />);
    const lockButtons = screen.getAllByRole('button', { name: /lock/i });
    expect(lockButtons.length).toBe(6);
  });
});
