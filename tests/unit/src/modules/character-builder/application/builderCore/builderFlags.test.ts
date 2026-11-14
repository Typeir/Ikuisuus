/**
 * @fileoverview builderFlags tests.
 *
 * @module tests/unit/src/modules/character-builder/application/builderCore/builderFlags.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  computeBuilderFlags,
  formatSheetMessage,
} from '@/modules/character-builder/application/builderCore/builderFlags';
import { describe, expect, it } from 'vitest';
import {
  makeCharacter,
  makeVocation,
} from '../../../../../../fixtures/builder/builderFixtures';

const codes = (flags: { code: string }[]) => flags.map((f) => f.code);

describe('formatSheetMessage', () => {
  it('formats ICU plurals in English', () => {
    expect(formatSheetMessage('unassignedProficiencies', { count: 1 })).toBe(
      '1 unassigned proficiency',
    );
    expect(formatSheetMessage('bpOverBudget', { amount: 2 })).toBe(
      'Over budget by 2 BP',
    );
  });
});

describe('computeBuilderFlags', () => {
  it('flags the unassigned starting level of an empty character', () => {
    expect(codes(computeBuilderFlags(makeCharacter()))).toEqual([
      'UNASSIGNED_LEVELS',
    ]);
  });

  it('flags BP over budget with the selected boons as source', () => {
    const flags = computeBuilderFlags(
      makeCharacter({
        vocations: [makeVocation({ level: 1 })],
        boonBudget: 2,
        selectedBoons: [
          { id: 'e::A', sourceFile: 'x', heading: 'A', category: 'boon', bpCost: 3 },
        ],
      }),
    );
    const bp = flags.find((f) => f.code === 'BP_OVER_BUDGET');
    expect(bp?.message).toBe('Over budget by 1 BP');
    expect(bp?.messageKey).toBe('bpOverBudget');
    expect(bp?.source).toEqual({
      kind: 'boons',
      features: [{ id: 'e::A', label: 'A' }],
    });
    expect(bp?.severity).toBe('warning');
  });

  it('flags open base skill picks with the vocation as source', () => {
    const flags = computeBuilderFlags(
      makeCharacter({
        vocations: [makeVocation({ level: 1, baseSkillChoiceCount: 2 })],
      }),
    );
    const skill = flags.find((f) => f.code === 'UNASSIGNED_SKILL_PROFICIENCY');
    expect(skill?.params).toEqual({ count: 2 });
    expect(skill?.source.features).toEqual([{ id: 'base:skill', label: 'Wizard' }]);
  });

  it('flags carry load from equipment and carry inputs', () => {
    const character = makeCharacter({
      vocations: [makeVocation({ level: 1 })],
      equipment: [{ id: 'i', name: 'Anvil', quantity: 1, weightLb: 10000 }],
    });
    expect(codes(computeBuilderFlags(character))).toContain('CARRY_OVER_CAPACITY');
    const flag = computeBuilderFlags(character).find(
      (f) => f.code === 'CARRY_OVER_CAPACITY',
    );
    expect(flag?.messageKey).toBeNull();
    expect(flag?.message).toBe('Over capacity');
  });

  it('returns no flags for a clean build', () => {
    expect(
      computeBuilderFlags(makeCharacter({ vocations: [makeVocation({ level: 1 })] })),
    ).toEqual([]);
  });
});
