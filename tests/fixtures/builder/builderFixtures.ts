/**
 * @fileoverview Shared character and content fixtures for builder core, dev API, and bridge tests.
 *
 * @module tests/fixtures/builder/builderFixtures
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import type { CharacterSheet, VocationEntry } from '@/lib/types/character';
import type { VocationOption } from '@/lib/types/vocations';
import {
  createEmptyCharacter,
  createEmptyVocationEntry,
} from '@/modules/character-builder/lib/utils/characterStorage';
import type { BuilderContent } from '@/modules/character-builder/infrastructure/devApi/builderContentSource';

/**
 * Builds a character from the empty factory plus overrides.
 *
 * @function makeCharacter
 * @param {Partial<CharacterSheet>} [over] - Field overrides
 * @returns {CharacterSheet} Character
 */
export function makeCharacter(over: Partial<CharacterSheet> = {}): CharacterSheet {
  return { ...createEmptyCharacter(), ...over };
}

/**
 * Builds a vocation entry from the empty factory plus overrides.
 *
 * @function makeVocation
 * @param {Partial<VocationEntry>} [over] - Field overrides
 * @returns {VocationEntry} Vocation entry
 */
export function makeVocation(over: Partial<VocationEntry> = {}): VocationEntry {
  return {
    ...createEmptyVocationEntry(),
    slug: 'wizard',
    title: 'Wizard',
    hitDie: 6,
    ...over,
  };
}

/** Wizard vocation metadata fixture. */
export const WIZARD: VocationOption = {
  slug: 'wizard',
  title: 'Wizard',
  file: 'src/content/en/character-creation/vocations/wizard/main.mdx',
  hitDie: 6,
  savingThrows: ['Wisdom'],
  skillProficiencies: { count: 2, choices: ['Arcana', 'History'] },
  toolProficiencies: [],
  features: [
    { level: 1, name: 'Spellbook', grants: [] },
    { level: 3, name: 'Scholar', grants: ['skill:[arcana,history]:expertise'] },
  ],
};

/** Berserker vocation metadata fixture. */
export const BERSERKER: VocationOption = {
  slug: 'berserker',
  title: 'Berserker',
  file: 'src/content/en/character-creation/vocations/berserker/main.mdx',
  hitDie: 12,
  savingThrows: ['Strength'],
  features: [{ level: 1, name: 'Rage' }],
};

/**
 * Builds an in-memory content reader.
 *
 * @function makeContent
 * @returns {BuilderContent} Fake content
 */
export function makeContent(): BuilderContent {
  return {
    locale: 'en',
    bloodlines: async () => [
      {
        slug: 'empyrean',
        title: 'Empyrean',
        file: 'src/content/en/character-creation/bloodlines/empyrean.bloodline.mdx',
        boonBudget: 4,
        coreFeatures: { movementSpeeds: ['Walk: 30 ft.'] },
        boons: [
          { name: 'Extended Reach', bpValue: 3, tags: [] },
          { name: 'Radiant Wings', bpValue: 2, tags: [] },
          {
            name: 'Celestial Gift',
            bpLabel: 'varies',
            subOptionMode: 'pick-any',
            subOptions: [
              { name: 'Halo', bpValue: 1 },
              { name: 'Aura', bpValue: 2 },
            ],
          },
          { name: 'Halo', parentName: 'Celestial Gift', bpValue: 1 },
        ],
      },
      {
        slug: 'etienn',
        title: 'Etienn',
        file: 'src/content/en/character-creation/bloodlines/etienn.bloodline.mdx',
        boonBudget: 6,
        boons: [],
      },
    ] as unknown as Awaited<ReturnType<BuilderContent['bloodlines']>>,
    vocations: async () => [WIZARD, BERSERKER],
    specializations: async () => [
      {
        slug: 'evoker',
        title: 'Evoker',
        file: 'src/content/en/character-creation/vocations/wizard/evoker.specialization.mdx',
        vocation: 'wizard',
        features: [{ level: 2, name: 'Sculpt' }],
      },
      {
        slug: 'want-of-knowledge',
        title: 'Want of Knowledge',
        file: 'src/content/en/character-creation/vocations/berserker/want-of-knowledge.specialization.mdx',
        vocation: 'berserker',
        features: [],
      },
    ],
    feats: async () =>
      [
        { slug: 'tough', title: 'Tough', repeatable: true, grants: [] },
        { slug: 'alert', title: 'Alert', hasPrerequisite: true, prerequisite: 'Dex 13' },
      ] as unknown as Awaited<ReturnType<BuilderContent['feats']>>,
    heirlooms: async () =>
      [{ slug: 'dreamcatcher', title: 'Dreamcatcher', rarity: 'Rare' }] as unknown as Awaited<
        ReturnType<BuilderContent['heirlooms']>
      >,
    trinkets: async () =>
      [{ slug: 'brass-key', title: 'Brass Key' }] as unknown as Awaited<
        ReturnType<BuilderContent['trinkets']>
      >,
    spells: async () =>
      [{ slug: 'fireball', title: 'Fireball', level: 3 }] as unknown as Awaited<
        ReturnType<BuilderContent['spells']>
      >,
    shards: async (_type, _slug, keys) =>
      keys?.length
        ? keys.map((key) => ({ key, source: `prose of ${key}` }) as never)
        : [{ key: 'Spellbook', source: 'spellbook prose' } as never],
  };
}
