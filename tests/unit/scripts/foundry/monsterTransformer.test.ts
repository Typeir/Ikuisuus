/**
 * @fileoverview Tests for the monster to dnd5e NPC transformer.
 * @description Five Ikuisuus abilities fill dnd5e's six, the mind stat
 * standing in for both Intelligence and Wisdom; Descry and Discern both land
 * on dnd5e Perception with their proficiency measured against the right
 * ability; the flat AC is the Defence total
 *
 * @module tests/unit/scripts/foundry/monsterTransformer.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-16
 */

import { describe, expect, it } from 'vitest';
import { transformMonster } from '../../../../foundry/scripts/transformers/monsterTransformer';
import type { MonsterMetadata } from '../../../../src/lib/db/content/schemas/monsterMetadata';

/**
 * A monster on the current metadata shape.
 *
 * @returns {MonsterMetadata} Five scores, a mind save, split Perception, a Defence
 */
const monster = (): MonsterMetadata => ({
  slug: 'probe',
  title: 'Probe',
  file: 'src/content/en/monsters/probe.sheet.mdx',
  link: '/library/monsters/probe',
  size: 'large',
  cr: '5',
  tierBonus: 2,
  defence: { value: 17, deflect: '5', dodge: '2', notes: 'natural armor' },
  hp: { average: 60, formula: '8d10+16' },
  scores: { str: 18, dex: 14, con: 14, wis: 16, cha: 8 },
  saves: { wis: 5 },
  skills: ['Descry +4', 'Discern +7', 'Arcana +7'],
});

describe('transformMonster', () => {
  it('fills six dnd5e abilities from five, the mind stat under both Intelligence and Wisdom', async () => {
    const actor = await transformMonster(monster(), '');
    const abilities = actor.system.abilities as Record<string, { value: number; proficient: number }>;
    expect(Object.keys(abilities)).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha']);
    expect(abilities.int.value).toBe(16);
    expect(abilities.wis.value).toBe(16);
    expect(abilities.int.proficient).toBe(1);
    expect(abilities.wis.proficient).toBe(1);
    expect(abilities.str.proficient).toBe(0);
  });

  it('measures Descry against Dexterity and Discern against the mind stat, both on prc', async () => {
    const actor = await transformMonster(monster(), '');
    const skills = actor.system.skills as Record<string, { value: number; ability: string }>;
    expect(skills.prc.ability).toBe('wis');
    expect(skills.prc.value).toBe(2);
    expect(skills.arc.ability).toBe('int');
    expect(skills.arc.value).toBe(2);
    const descryOnly = await transformMonster({ ...monster(), skills: ['Descry +4'] }, '');
    expect((descryOnly.system.skills as Record<string, { value: number }>).prc.value).toBe(1);
  });

  it('writes the Defence total as the flat AC', async () => {
    const actor = await transformMonster(monster(), '');
    const attributes = actor.system.attributes as { ac: { flat: number; calc: string } };
    expect(attributes.ac).toEqual({ flat: 17, calc: 'flat', formula: '' });
  });
});
