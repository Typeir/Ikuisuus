/**
 * @fileoverview useVocationBaseSync tests
 * @description Verifies base saving throws AND base skill-choice count sync
 * uniformly across the vocation use cases — first assignment, swap, and every
 * entry (not just the first) — plus legacy backfill, and that it no-ops on
 * convergence or missing metadata.
 *
 * @module tests/unit/src/modules/character-builder/presentation/builder/useVocationBaseSync
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import type { VocationOption } from '@/lib/types/vocations';
import { useVocationBaseSync } from '@/modules/character-builder/presentation/builder/useVocationBaseSync';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

const patchedVocations = (onChange: ReturnType<typeof vi.fn>): VocationEntry[] =>
  (onChange.mock.calls[0][0] as Partial<CharacterSheet>).vocations ?? [];

describe('useVocationBaseSync', () => {
  it('backfills saves and skill-choice count on a freshly-assigned vocation', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync([entry({ slug: 'revenant' })], OPTIONS, onChange),
    );
    const synced = patchedVocations(onChange)[0];
    expect(synced.baseSavingThrows).toEqual(['Constitution', 'Intelligence']);
    expect(synced.baseSkillChoiceCount).toBe(3);
  });

  it('corrects both fields when the vocation is swapped', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync(
        [
          entry({
            slug: 'rogue',
            baseSavingThrows: ['Constitution', 'Intelligence'],
            baseSkillChoiceCount: 3,
          }),
        ],
        OPTIONS,
        onChange,
      ),
    );
    const synced = patchedVocations(onChange)[0];
    expect(synced.baseSavingThrows).toEqual(['Dexterity', 'Charisma']);
    expect(synced.baseSkillChoiceCount).toBe(4);
  });

  it('maps offered skill choices and fixed trades to table row-keys', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync([entry({ slug: 'wizard' })], OPTIONS, onChange),
    );
    const synced = patchedVocations(onChange)[0];
    expect(synced.baseSkillChoices).toEqual([
      'skills.arcana',
      'skills.sleightOfHand',
    ]);
    expect(synced.baseTradeFixed).toEqual(['tools.thievery']);
  });

  it('syncs every entry, not just the first', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync(
        [entry({ slug: 'revenant' }), entry({ slug: 'rogue' })],
        OPTIONS,
        onChange,
      ),
    );
    const patched = patchedVocations(onChange);
    expect(patched[0].baseSkillChoiceCount).toBe(3);
    expect(patched[1].baseSkillChoiceCount).toBe(4);
  });

  it('does not patch when both fields are already correct', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync(
        [
          entry({
            slug: 'revenant',
            baseSavingThrows: ['Constitution', 'Intelligence'],
            baseSkillChoiceCount: 3,
          }),
        ],
        OPTIONS,
        onChange,
      ),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('no-ops until vocation metadata is loaded', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync([entry({ slug: 'revenant' })], [], onChange),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('skips entries without a slug', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useVocationBaseSync([entry({ slug: '' })], OPTIONS, onChange),
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
