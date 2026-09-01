/**
 * @fileoverview Tests for HpRollerGroup component
 *
 * @module tests/unit/src/modules/character-builder/presentation/atoms/hpRollerGroup.test
 * @version 2.0.0
 * @author Typeir
 * @since 6.0.0
 */

import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { HpRollerGroup } from '@/modules/character-builder/presentation/atoms/hpRollerGroup';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const entry = (
  over: Partial<HitDieRollEntry> & { id: string },
): HitDieRollEntry => ({
  vocSlug: 'warrior',
  vocTitle: 'Warrior',
  dieType: 10,
  levelIndex: 1,
  result: null,
  conMod: 2,
  addedToHp: false,
  ...over,
});

const baseProps = {
  vocSlug: 'warrior',
  vocTitle: 'Warrior',
  dieType: 10,
  conMod: 2,
  onRoll: vi.fn(),
  onAverage: vi.fn(),
  onSet: vi.fn(),
  onAdd: vi.fn(),
  onRemove: vi.fn(),
  onRollAll: vi.fn(),
  onAverageAll: vi.fn(),
  onMaxAll: vi.fn(),
  onSetAll: vi.fn(),
  onAddAll: vi.fn(),
  onClearAll: vi.fn(),
};

describe('HpRollerGroup', () => {
  it('renders the vocation header', () => {
    const { getByText } = render(
      <HpRollerGroup {...baseProps} entries={[entry({ id: 'a' })]} />,
    );
    expect(getByText('Warrior')).toBeTruthy();
    expect(getByText('d10')).toBeTruthy();
  });

  it('gives every row a roll and an average control', () => {
    const { getByLabelText } = render(
      <HpRollerGroup {...baseProps} entries={[entry({ id: 'a' })]} />,
    );
    expect(getByLabelText(/roll level/i)).toBeTruthy();
    expect(getByLabelText(/average level/i)).toBeTruthy();
  });

  it('shows Add to HP for a valued unadded die, and the total for an added one', () => {
    const { getByText, queryByText, rerender } = render(
      <HpRollerGroup {...baseProps} entries={[entry({ id: 'a', result: 6 })]} />,
    );
    expect(getByText('Add to HP')).toBeTruthy();
    rerender(
      <HpRollerGroup
        {...baseProps}
        entries={[entry({ id: 'a', result: 6, addedToHp: true })]}
      />,
    );
    expect(queryByText('Add to HP')).toBeNull();
    expect(getByText('+ 2 = 8')).toBeTruthy();
  });

  it('disables the maxed die controls and hides its remove button', () => {
    const { getByLabelText, queryByLabelText } = render(
      <HpRollerGroup
        {...baseProps}
        maxedEntryId='warrior-1'
        entries={[entry({ id: 'warrior-1', result: 10, addedToHp: true })]}
      />,
    );
    expect((getByLabelText(/roll level 1/i) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(
      (getByLabelText(/average level 1/i) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(queryByLabelText('Remove HP entry')).toBeNull();
  });

  it('disables bulk value ops once every die is added, until cleared', () => {
    const { getByText } = render(
      <HpRollerGroup
        {...baseProps}
        entries={[
          entry({ id: 'a', result: 6, addedToHp: true }),
          entry({ id: 'b', levelIndex: 2, result: 6, addedToHp: true }),
        ]}
      />,
    );
    for (const label of ['Roll All', 'Avg All', 'Max All', 'Set All', 'Add All']) {
      expect((getByText(label) as HTMLButtonElement).disabled).toBe(true);
    }
    expect((getByText('Clear All') as HTMLButtonElement).disabled).toBe(false);
  });
});

