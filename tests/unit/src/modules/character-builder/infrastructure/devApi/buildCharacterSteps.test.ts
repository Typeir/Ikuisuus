/**
 * @fileoverview buildCharacterSteps tests.
 *
 * @module tests/unit/src/modules/character-builder/infrastructure/devApi/buildCharacterSteps.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  applyImports,
  applyScalars,
  applyTiers,
  bySlugTitle,
  humanizeRowKey,
  pick,
  type BuildContext,
} from '@/modules/character-builder/infrastructure/devApi/buildCharacterSteps';
import { describe, expect, it } from 'vitest';
import {
  makeCharacter,
  makeContent,
} from '../../../../../../fixtures/builder/builderFixtures';

const ctxOf = (): BuildContext => ({
  character: makeCharacter(),
  resolution: [],
  notes: [],
  content: makeContent(),
});

describe('humanizeRowKey', () => {
  it('spaces camel row-keys', () => {
    expect(humanizeRowKey('skills.sleightOfHand')).toBe('sleight of hand');
    expect(humanizeRowKey('plain')).toBe('plain');
  });
});

describe('pick', () => {
  it('records the resolution and notes misses', () => {
    const ctx = ctxOf();
    const items = [{ slug: 'a', title: 'Alpha' }];
    expect(pick(ctx, 'f', 'alpha', items, bySlugTitle)?.slug).toBe('a');
    expect(pick(ctx, 'g', 'zzzzzzzz', items, bySlugTitle)).toBeNull();
    expect(ctx.resolution).toHaveLength(2);
    expect(ctx.notes).toEqual(['g: no match for "zzzzzzzz"']);
  });
});

describe('steps', () => {
  it('applies scalars and equipment', () => {
    const ctx = ctxOf();
    applyScalars(ctx, {
      name: 'Bo',
      abilityScores: { dex: 14 },
      savingThrows: { dex: 'proficient' },
      equipment: [{ name: 'Rope' }],
    });
    expect(ctx.character.name).toBe('Bo');
    expect(ctx.character.abilityScores.dex).toBe(14);
    expect(ctx.character.savingThrows.dex).toBe('proficient');
    expect(ctx.character.equipment[0]).toMatchObject({ name: 'Rope', quantity: 1, weightLb: 0 });
  });

  it('merges carry inputs into the stored ones', () => {
    const ctx = ctxOf();
    ctx.character = makeCharacter({ carrying: { size: 'tiny', extraLb: 4 } });
    applyScalars(ctx, { carrying: { size: 'large' } });
    expect(ctx.character.carrying).toEqual({ size: 'large', extraLb: 4 });
  });

  it('applies tiers and skips unknown tiers', () => {
    const ctx = ctxOf();
    applyTiers(ctx, 'skills', 'skills', { arcana: 'expertise', history: 'bogus' as never });
    expect(ctx.character.skills.find((s) => s.name.endsWith('arcana'))?.tier).toBe('expertise');
    expect(ctx.notes).toEqual(['skills.history: unknown tier "bogus"; skipped']);
  });

  it('imports library items as abilities', async () => {
    const ctx = ctxOf();
    await applyImports(ctx, { trinkets: ['brass key'] });
    expect(ctx.character.abilities.map((a) => a.name)).toEqual(['Brass Key']);
  });
});
