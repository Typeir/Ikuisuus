/**
 * @fileoverview HP Roller Lifecycle Integration Test
 * @description End-to-end coverage of the hit-dice roller as wired in
 * production. A harness mirrors `CharacterSheetBody`'s contract exactly — a
 * character in state, the `syncHitDiceLog` reconciler in an effect, and the
 * always-mounted `CombatStatChips` (which hosts the roller and HP chip) — with
 * NO `OverviewTab` present. This proves the three regressions are fixed:
 * (1) dice for levels gained while off the Overview tab still appear in the
 * roller; (2) `hpMax` folds in CON x N (and passive hp grants); and (3) current
 * HP is always editable and clamped, independent of the lock.
 *
 * @module tests/integration/character-builder/presentation/hpRollerLifecycle
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type {
  CharacterShard,
  VocationEntry,
} from '@/modules/character-builder/domain/character/characterEntity';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { syncHitDiceLog } from '@/modules/character-builder/lib/utils/hitDiceSync';
import { CombatStatChips } from '@/modules/character-builder/presentation/stats/combatStatChips';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const voc = (
  slug: string,
  hitDie: string,
  level: number,
  specializationSlug: string | null = null,
): VocationEntry => ({
  slug,
  title: slug[0].toUpperCase() + slug.slice(1),
  level,
  hitDie,
  specializationSlug,
  specializationTitle: specializationSlug ?? '',
  vocationFeatures: [],
  specializationFeatures: [],
});

const makeChar = (
  vocations: VocationEntry[],
  overrides: Partial<CharacterSheet> = {},
): CharacterSheet => ({
  ...createEmptyCharacter(),
  vocations,
  abilityScores: { str: 10, dex: 10, con: 20, int: 10, wis: 10, cha: 10 },
  hpCurrent: 0,
  ...overrides,
});

/**
 * Stand-in for `CharacterSheetBody`: owns the character, runs the same
 * `syncHitDiceLog` reconciler in an effect, and renders only the always-mounted
 * `CombatStatChips`. A test button bumps the first vocation's level to simulate
 * levelling up while no tab-scoped effect is mounted.
 *
 * @function Harness
 * @param {{ initial: CharacterSheet }} props - The starting character
 * @returns {JSX.Element} The harness element
 */
function Harness({ initial }: { initial: CharacterSheet }) {
  const [data, setData] = useState(initial);
  const patch = useCallback(
    (p: Partial<CharacterSheet>) => setData((d) => ({ ...d, ...p })),
    [],
  );
  useEffect(() => {
    const update = syncHitDiceLog(data);
    if (update) patch(update);
  }, [data, patch]);
  const gainLevel = () =>
    patch({
      vocations: data.vocations.map((v, i) =>
        i === 0 ? { ...v, level: v.level + 1 } : v,
      ),
    });
  return (
    <>
      <button type='button' onClick={gainLevel}>
        gain-level
      </button>
      <CombatStatChips data={data} patch={patch} />
    </>
  );
}

const inputValue = (label: string): string =>
  (screen.getByLabelText(label) as HTMLInputElement).value;

describe('HP roller lifecycle (integration)', () => {
  it('surfaces dice for a level gained after the roller was first opened', async () => {
    const user = userEvent.setup();
    render(<Harness initial={makeChar([voc('druid', '8', 1)])} />);
    const trigger = () =>
      screen.getByRole('button', { name: /open hit dice roller/i });

    await user.click(trigger());
    expect(screen.getByLabelText(/roll level 1 hit die/i)).toBeTruthy();
    expect(screen.queryByLabelText(/roll level 2 hit die/i)).toBeNull();

    // Gaining a level clicks outside the panel, dismissing it — the real flow.
    await user.click(screen.getByRole('button', { name: 'gain-level' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /hit dice roller/i })).toBeNull(),
    );

    await user.click(trigger());
    await waitFor(() =>
      expect(screen.getByLabelText(/roll level 2 hit die/i)).toBeTruthy(),
    );
  });

  it('folds CON x N into hpMax for a multiclass build (far above 96)', async () => {
    render(
      <Harness
        initial={makeChar(
          [voc('druid', '8', 12, 'moon'), voc('warrior', '10', 3, 'champion')],
          { manualStatOverrides: ['hp'] },
        )}
      />,
    );
    await waitFor(() => expect(inputValue('Max HP')).toBe('156'));
  });

  it('adds a passive hp grant (Tough / Fortified Frame) on top of CON x N', async () => {
    const tough: CharacterShard = {
      id: 'feat::tough',
      sourceFile: 'feat::tough',
      heading: 'Tough',
      category: 'feat',
      grants: ['hp:1:level'],
    };
    render(
      <Harness
        initial={makeChar(
          [voc('druid', '8', 12, 'moon'), voc('warrior', '10', 3, 'champion')],
          { manualStatOverrides: ['hp'], selectedFeats: [tough] },
        )}
      />,
    );
    await waitFor(() => expect(inputValue('Max HP')).toBe('171'));
  });

  it('keeps current HP editable and able to go negative without unlocking', async () => {
    const user = userEvent.setup();
    render(<Harness initial={makeChar([voc('druid', '8', 1)])} />);

    expect(screen.queryByLabelText('Max HP')).toBeNull();
    const current = screen.getByLabelText('Current HP');
    expect(current).toBeTruthy();

    await user.clear(current);
    await user.type(current, '-5');
    expect((current as HTMLInputElement).value).toBe('-5');
  });
});
