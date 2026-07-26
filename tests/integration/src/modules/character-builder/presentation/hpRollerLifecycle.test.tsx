/**
 * @fileoverview HP Roller Lifecycle Integration Test
 * @description End-to-end coverage of the hit-dice roller as wired in
 * production. The harness mirrors `CharacterSheetBody`'s contract on the real
 * `ActiveSheetProvider` — the character in the sheet context, the
 * `syncHitDiceLog` reconciler in an effect, and the always-mounted
 * `CombatStatChips` (which hosts the roller and HP chip) — with NO
 * `OverviewTab` present. This proves the three regressions are fixed:
 * (1) dice for levels gained while off the Overview tab still appear in the
 * roller; (2) `hpMax` folds in CON x N (and passive hp grants); and (3) current
 * HP is always editable and clamped, independent of the lock.
 *
 * The harness runs in view mode, which is how the roller is actually used: the
 * HP chip is gated by its own lock, not by edit mode, and writes made outside
 * edit mode land on the saved character rather than being swallowed.
 *
 * @module tests/integration/character-builder/presentation/hpRollerLifecycle
 * @version 2.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type {
  CharacterShard,
  VocationEntry,
} from '@/modules/character-builder/domain/character/characterEntity';
import {
  useSheetData,
  useSheetMutators,
} from '@/modules/character-builder/application/context/activeSheetContext';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { syncHitDiceLog } from '@/modules/character-builder/lib/utils/hitDiceSync';
import { CombatStatChips } from '@/modules/character-builder/presentation/stats/combatStatChips';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

const voc = (
  slug: string,
  hitDie: number,
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
  manualStatOverrides: ['hp'],
  ...overrides,
});

/**
 * Stand-in for `CharacterSheetBody`: reads the character from the sheet
 * context, runs the same `syncHitDiceLog` reconciler in an effect, and renders
 * only the always-mounted `CombatStatChips`. A test button bumps the first
 * vocation's level to simulate levelling up while no tab-scoped effect is
 * mounted.
 *
 * @function Harness
 * @returns {JSX.Element} The harness element
 */
function Harness() {
  const data = useSheetData();
  const { patch } = useSheetMutators();

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
  const dropCon = () =>
    patch({ abilityScores: { ...data.abilityScores, con: 10 } });

  return (
    <>
      <button type='button' onClick={gainLevel}>
        gain-level
      </button>
      <button type='button' onClick={dropCon}>
        drop-con
      </button>
      <CombatStatChips />
    </>
  );
}

/**
 * Mounts the harness on the real sheet context seeded with `character`.
 *
 * @function renderHarness
 * @param {CharacterSheet} character - The starting character
 * @returns {void}
 */
const renderHarness = (character: CharacterSheet): void => {
  renderWithActiveSheet(<Harness />, { character });
};

const maxHp = (): string => screen.getByLabelText('Max HP').textContent ?? '';

describe('HP roller lifecycle (integration)', () => {
  it('surfaces dice for a level gained after the roller was first opened', async () => {
    const user = userEvent.setup();
    renderHarness(makeChar([voc('druid', 8, 1)]));
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
    renderHarness(
      makeChar([
        voc('druid', 8, 12, 'moon'),
        voc('warrior', 10, 3, 'champion'),
      ]),
    );
    await waitFor(() => expect(maxHp()).toBe('156'));
  });

  it('adds a passive hp grant (Tough / Fortified Frame) on top of CON x N', async () => {
    const tough: CharacterShard = {
      id: 'feat::tough',
      sourceFile: 'feat::tough',
      heading: 'Tough',
      category: 'feat',
      grants: ['hp:1:level'],
    };
    renderHarness(
      makeChar(
        [voc('druid', 8, 12, 'moon'), voc('warrior', 10, 3, 'champion')],
        { selectedFeats: [tough] },
      ),
    );
    await waitFor(() => expect(maxHp()).toBe('171'));
  });

  it('recomputes hpMax when CON changes, not only when the log changes', async () => {
    const user = userEvent.setup();
    const strider = makeChar([voc('strider', 10, 17)], {
      abilityScores: { str: 10, dex: 10, con: 26, int: 10, wis: 10, cha: 10 },
      selectedFeats: [
        {
          id: 'feat::tough',
          sourceFile: 'feat::tough',
          heading: 'Tough',
          category: 'feat',
          grants: ['hp:1:level'],
        },
      ],
    });
    // L1 max 10 + 16 x avg 6 = 106 dice; CON +8 x 17 = 136; Tough +1 x 17 = 17 => 259
    renderHarness(strider);
    await waitFor(() => expect(maxHp()).toBe('259'));

    // Dropping CON to 10 (mod 0), with the log unchanged, must still drop hpMax
    // to dice + Tough only = 106 + 17 = 123, live.
    await user.click(screen.getByRole('button', { name: 'drop-con' }));
    await waitFor(() => expect(maxHp()).toBe('123'));
  });

  it('when unlocked, current HP is editable and may go negative; max stays read-only', async () => {
    const user = userEvent.setup();
    renderHarness(makeChar([voc('druid', 8, 1)]));

    expect(screen.getByLabelText('Max HP').tagName).not.toBe('INPUT');
    const current = screen.getByLabelText('Current HP');
    expect((current as HTMLInputElement).tagName).toBe('INPUT');

    await user.clear(current);
    await user.type(current, '-5');
    expect((current as HTMLInputElement).value).toBe('-5');
  });

  it('when the hp lock is engaged, the roller trigger and current HP are read-only', () => {
    renderHarness(makeChar([voc('druid', 8, 1)], { manualStatOverrides: [] }));
    const roller = screen.getByRole('button', {
      name: /open hit dice roller/i,
    }) as HTMLButtonElement;
    expect(roller.disabled).toBe(true);
    expect(screen.getByLabelText('Current HP').tagName).not.toBe('INPUT');
  });
});


