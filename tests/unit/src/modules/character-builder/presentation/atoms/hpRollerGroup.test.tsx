/**
 * @fileoverview Tests for HpRollerGroup component
 *
 * @module tests/unit/lib/components/characterSheet/atoms/hpRollerGroup
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { HpRollerGroup } from '@/modules/character-builder/presentation/atoms/hpRollerGroup';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('HpRollerGroup', () => {
  const mockEntry: HitDieRollEntry = {
    id: 'test-1',
    vocSlug: 'warrior',
    vocTitle: 'Warrior',
    dieType: '10',
    levelIndex: 1,
    result: null,
    conMod: 2,
    addedToHp: false,
  };

  it('renders group header with vocation name and die type', () => {
    const { getByText } = render(
      <HpRollerGroup
        vocSlug='warrior'
        vocTitle='Warrior'
        dieType='10'
        entries={[mockEntry]}
        conMod={2}
        setAllMode={new Set()}
        manualValues={new Map()}
        onRoll={vi.fn()}
        onRollAll={vi.fn()}
        onAverageAll={vi.fn()}
        onSetAll={vi.fn()}
        onAddAll={vi.fn()}
        onConfirm={vi.fn()}
        onManualChange={vi.fn()}
        getAverage={() => 5}
      />,
    );

    expect(getByText('Warrior')).toBeTruthy();
    expect(getByText('d10')).toBeTruthy();
  });

  it('renders action buttons', () => {
    const { getAllByRole } = render(
      <HpRollerGroup
        vocSlug='warrior'
        vocTitle='Warrior'
        dieType='10'
        entries={[]}
        conMod={2}
        setAllMode={new Set()}
        manualValues={new Map()}
        onRoll={vi.fn()}
        onRollAll={vi.fn()}
        onAverageAll={vi.fn()}
        onSetAll={vi.fn()}
        onAddAll={vi.fn()}
        onConfirm={vi.fn()}
        onManualChange={vi.fn()}
        getAverage={() => 5}
      />,
    );

    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });
});
