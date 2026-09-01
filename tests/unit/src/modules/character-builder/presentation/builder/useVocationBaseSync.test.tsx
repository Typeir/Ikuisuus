/**
 * @fileoverview useVocationBaseSync tests
 * @description Verifies base saving throws AND base skill-choice count sync
 * uniformly across the vocation use cases — first assignment, swap, and every
 * entry (not just the first) — plus legacy backfill, and that it no-ops on
 * convergence or missing metadata. The hook reads its vocations and write API
 * from the active-sheet context, so these assert the synced entries the context
 * ends up holding rather than a spy on a drilled callback.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/useVocationBaseSync.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { VocationEntry } from '@/lib/types/character';
import type { VocationOption } from '@/lib/types/vocations';
import { useSheetData } from '@/modules/character-builder/application/context/activeSheetContext';
import { useVocationBaseSync } from '@/modules/character-builder/presentation/builder/useVocationBaseSync';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it } from 'vitest';

const OPTIONS = [
  {
    slug: 'revenant',
    savingThrows: ['Constitution', 'Intelligence'],
    skillProficiencies: { count: 3, choices: [] },
  },
  {
    slug: 'rogue',
    savingThrows: ['Dexterity', 'Charisma'],
    skillProficiencies: { count: 4, choices: [] },
  },
  {
    slug: 'wizard',
    savingThrows: ['Intelligence', 'Wisdom'],
    skillProficiencies: { count: 2, choices: ['Arcana', 'Sleight of Hand'] },
    toolProficiencies: ['Thievery'],
  },
] as unknown as VocationOption[];

const entry = (over: Partial<VocationEntry>): VocationEntry =>
  ({
    slug: '',
    title: '',
    level: 1,
    specializationSlug: null,
    specializationTitle: '',
    vocationFeatures: [],
    specializationFeatures: [],
    ...over,
  }) as VocationEntry;

/**
 * Mounts the hook inside the active-sheet context seeded with `vocations` and
 * captures whatever entries the context holds after the sync settles.
 *
 * @function renderSync
 * @param {VocationEntry[]} vocations - Seed vocation entries
 * @param {VocationOption[]} options - Vocation metadata options
 * @returns {{ current: VocationEntry[] }} Live view of the context's entries
 */
const renderSync = (
  vocations: VocationEntry[],
  options: VocationOption[],
): { current: VocationEntry[] } => {
  const captured: { current: VocationEntry[] } = { current: vocations };

  /**
   * Probe that runs the hook and records the resulting entries.
   *
   * @component
   * @returns {null} Renders nothing
   */
  const Probe: React.FC = () => {
    useVocationBaseSync(options);
    captured.current = useSheetData().vocations;
    return null;
  };

  renderWithActiveSheet(<Probe />, { character: { vocations }, editing: true });
  return captured;
};

describe('useVocationBaseSync', () => {
  it('backfills saves and skill-choice count on a freshly-assigned vocation', () => {
    const synced = renderSync([entry({ slug: 'revenant' })], OPTIONS).current[0];
    expect(synced.baseSavingThrows).toEqual(['Constitution', 'Intelligence']);
    expect(synced.baseSkillChoiceCount).toBe(3);
  });

  it('corrects both fields when the vocation is swapped', () => {
    const synced = renderSync(
      [
        entry({
          slug: 'rogue',
          baseSavingThrows: ['Constitution', 'Intelligence'],
          baseSkillChoiceCount: 3,
        }),
      ],
      OPTIONS,
    ).current[0];
    expect(synced.baseSavingThrows).toEqual(['Dexterity', 'Charisma']);
    expect(synced.baseSkillChoiceCount).toBe(4);
  });

  it('maps offered skill choices and fixed trades to table row-keys', () => {
    const synced = renderSync([entry({ slug: 'wizard' })], OPTIONS).current[0];
    expect(synced.baseSkillChoices).toEqual([
      'skills.arcana',
      'skills.sleightOfHand',
    ]);
    expect(synced.baseTradeFixed).toEqual(['tools.thievery']);
  });

  it('syncs every entry, not just the first', () => {
    const patched = renderSync(
      [entry({ slug: 'revenant' }), entry({ slug: 'rogue' })],
      OPTIONS,
    ).current;
    expect(patched[0].baseSkillChoiceCount).toBe(3);
    expect(patched[1].baseSkillChoiceCount).toBe(4);
  });

  it('does not patch when both fields are already correct', () => {
    const seed = [
      entry({
        slug: 'revenant',
        baseSavingThrows: ['Constitution', 'Intelligence'],
        baseSkillChoiceCount: 3,
        baseSkillChoices: [],
        baseTradeFixed: [],
      }),
    ];
    expect(renderSync(seed, OPTIONS).current).toBe(seed);
  });

  it('no-ops until vocation metadata is loaded', () => {
    const seed = [entry({ slug: 'revenant' })];
    expect(renderSync(seed, []).current).toBe(seed);
  });

  it('skips entries without a slug', () => {
    const seed = [entry({ slug: '' })];
    expect(renderSync(seed, OPTIONS).current).toBe(seed);
  });
});
