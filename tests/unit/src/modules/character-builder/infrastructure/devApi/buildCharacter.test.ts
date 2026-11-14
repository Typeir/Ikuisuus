/**
 * @fileoverview buildCharacter tests.
 *
 * @module tests/unit/src/modules/character-builder/infrastructure/devApi/buildCharacter.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { computeBuilderFlags } from '@/modules/character-builder/application/builderCore/builderFlags';
import { buildCharacterFromPayload } from '@/modules/character-builder/infrastructure/devApi/buildCharacter';
import { describe, expect, it } from 'vitest';
import { makeContent } from '../../../../../../fixtures/builder/builderFixtures';

describe('buildCharacterFromPayload', () => {
  it('builds bloodline, vocation, specialization, boons, and feats', async () => {
    const { character, resolution, notes } = await buildCharacterFromPayload(
      {
        name: 'Ari',
        bloodline: 'empyrian',
        vocations: [{ vocation: 'wizard', level: 3, specialization: 'evoker' }],
        boons: ['Extended Reach', { name: 'Celestial Gift', subOptions: ['Halo', 'Aura'] }],
        feats: ['tough', 'tough', 'alert'],
      },
      makeContent(),
    );
    expect(notes).toEqual([]);
    expect(character.name).toBe('Ari');
    expect(character.bloodlineSlug).toBe('empyrean');
    expect(character.speedOverride).toBe(30);
    expect(character.vocations[0]).toMatchObject({
      slug: 'wizard',
      level: 3,
      specializationSlug: 'evoker',
      baseSkillChoiceCount: 2,
    });
    expect(character.vocations[0].vocationFeatures[0].cachedText).toBe('spellbook prose');
    expect(character.selectedBoons.map((b) => [b.heading, b.bpCost])).toEqual([
      ['Extended Reach', 3],
      ['Celestial Gift', 3],
    ]);
    expect(character.selectedFeats.map((f) => f.id.split('::').length)).toEqual([2, 3, 2]);
    expect(character.hitDiceLog).toHaveLength(3);
    expect(resolution.find((r) => r.field === 'bloodline')?.match?.slug).toBe('empyrean');
  });

  it('never blocks an over-budget build', async () => {
    const { character } = await buildCharacterFromPayload(
      {
        bloodline: 'empyrean',
        vocations: [{ vocation: 'wizard' }],
        boons: ['Extended Reach', 'Radiant Wings'],
      },
      makeContent(),
    );
    expect(character.selectedBoons).toHaveLength(2);
    expect(computeBuilderFlags(character).map((f) => f.code)).toContain('BP_OVER_BUDGET');
  });

  it('notes skipped inputs instead of failing', async () => {
    const { notes } = await buildCharacterFromPayload(
      {
        boons: ['Extended Reach'],
        feats: ['alert', 'alert'],
        skills: { arcana: 'wizardly' as never },
      },
      makeContent(),
    );
    expect(notes).toEqual([
      'boons: skipped, no bloodline selected',
      'feats[1]: "Alert" already selected; skipped',
      'skills.arcana: unknown tier "wizardly"; skipped',
    ]);
  });

  it('applies tiers, scores, imports, and equipment', async () => {
    const { character } = await buildCharacterFromPayload(
      {
        vocations: [{ vocation: 'wizard' }],
        abilityScores: { str: 8 },
        skills: { 'sleight of hand': 'proficient' },
        heirlooms: ['dreamcatcher'],
        spells: ['fireball'],
        equipment: [{ name: 'Rope', weightLb: 10 }],
      },
      makeContent(),
    );
    expect(character.abilityScores.str).toBe(8);
    expect(character.skills.find((s) => s.name.endsWith('sleightOfHand'))?.tier).toBe(
      'proficient',
    );
    expect(character.abilities.map((a) => a.type)).toEqual(['Heirloom', 'Spell']);
    expect(character.equipment[0]).toMatchObject({ name: 'Rope', quantity: 1, weightLb: 10 });
  });

  it('extends a base character', async () => {
    const first = await buildCharacterFromPayload(
      { vocations: [{ vocation: 'wizard' }] },
      makeContent(),
    );
    const { character } = await buildCharacterFromPayload(
      { vocations: [{ vocation: 'berserker' }] },
      makeContent(),
      { base: first.character },
    );
    expect(character.vocations.map((v) => v.slug)).toEqual(['wizard', 'berserker']);
    expect(character.id).toBe(first.character.id);
  });
});
