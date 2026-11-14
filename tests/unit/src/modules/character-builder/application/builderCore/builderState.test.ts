/**
 * @fileoverview builderState tests.
 *
 * @module tests/unit/src/modules/character-builder/application/builderCore/builderState.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  collectFeatureStates,
  computeBuilderState,
} from '@/modules/character-builder/application/builderCore/builderState';
import type { CharacterShard } from '@/lib/types/character';
import { describe, expect, it } from 'vitest';
import {
  makeCharacter,
  makeVocation,
} from '../../../../../../fixtures/builder/builderFixtures';

const feature = (level: number, heading: string): CharacterShard => ({
  id: `wizard::${level}::${heading}`,
  sourceFile: 'x.mdx',
  heading,
  category: 'vocation-feature',
  level,
  grants: heading === 'Scholar' ? ['skill:[arcana,history]:expertise'] : [],
});

describe('computeBuilderState', () => {
  const character = makeCharacter({
    vocations: [
      makeVocation({
        level: 3,
        baseSkillChoiceCount: 1,
        baseSkillChoices: ['skills.arcana'],
        vocationFeatures: [feature(1, 'Spellbook'), feature(3, 'Scholar'), feature(5, 'Late')],
      }),
    ],
  });

  it('is JSON-safe', () => {
    const state = computeBuilderState(character);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('reports BP, level, and carry blocks', () => {
    const state = computeBuilderState(character);
    expect(state.boonPoints).toEqual({ budget: 0, spent: 0, remaining: 0, over: false });
    expect(state.level.vocationLevel).toBe(3);
    expect(state.carry.tier).toBe('none');
  });

  it('lists assignable grants with tallies and hints', () => {
    const state = computeBuilderState(character);
    const ids = state.grants.assignable.map((g) => g.id);
    expect(ids).toContain('base:skill');
    expect(state.grants.assignable.every((g) => g.assigned === 0)).toBe(true);
    expect(state.grants.hints.skills).toContain('skills.arcana');
  });

  it('marks features locked above the vocation level', () => {
    const features = collectFeatureStates(character);
    expect(features.map((f) => [f.heading, f.unlocked])).toEqual([
      ['Spellbook', true],
      ['Scholar', true],
      ['Late', false],
    ]);
  });
});
