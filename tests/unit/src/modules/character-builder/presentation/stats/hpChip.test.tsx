/**
 * @fileoverview HpChip Unit Tests
 * @description Smoke tests for the HP combat stat chip.
 *
 * @module tests/unit/character-builder/presentation/stats/hpChip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { HpChipMemo } from '@/modules/character-builder/presentation/stats/hpChip';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('HpChip', () => {
  it('renders the HP label and keeps current HP editable when locked', () => {
    const patch = vi.fn();
    render(
      <HpChipMemo
        data={mockData as any}
        conMod={0}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
        onHitDiceCommit={vi.fn()}
      />,
    );
    expect(screen.getByText('hp')).toBeInTheDocument();
    const current = screen.getByLabelText('hpCurrent') as HTMLInputElement;
    expect(current.value).toBe('10');
    expect(screen.queryByLabelText('hpMax')).toBeNull();
  });

  it('shows temp HP when present', () => {
    const patch = vi.fn();
    const data = { ...mockData, tempHp: 5 };
    render(
      <HpChipMemo
        data={data as any}
        conMod={0}
        isUnlocked={() => false}
        toggle={vi.fn()}
        patch={patch}
        onHitDiceCommit={vi.fn()}
      />,
    );
    expect(screen.getByText(/\+5/)).toBeInTheDocument();
  });

  it('shows inputs when unlocked', () => {
    const patch = vi.fn();
    render(
      <HpChipMemo
        data={mockData as any}
        conMod={0}
        isUnlocked={() => true}
        toggle={vi.fn()}
        patch={patch}
        onHitDiceCommit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('hpCurrent')).toBeInTheDocument();
    expect(screen.getByLabelText('hpMax')).toBeInTheDocument();
  });
});
