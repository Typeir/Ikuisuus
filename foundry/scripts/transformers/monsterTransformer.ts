/**
 * @fileoverview Monster metadata to dnd5e NPC Actor transformer.
 * @description Maps Ikuisuus MonsterMetadata records to Foundry VTT dnd5e v3
 * NPC Actor JSON documents. Handles ability scores, AC, HP, movement, senses,
 * saving throws, skills, damage/condition traits, and biography HTML.
 *
 * @module foundry/scripts/transformers/monsterTransformer
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-12
 *
 * @see {@link transformMonster} for the main entry point
 */

import type { MonsterMetadata } from '../../../src/lib/db/content/schemas/monsterMetadata';
import {
  SIZE_MAP,
  SKILL_ABILITY_MAP,
  SKILL_MAP,
  TOKEN_SIZE_MAP
} from '../constants/dnd5eMaps';
import { generateFoundryId } from '../utils/idGenerator';
import { extractMonsterDescription } from '../utils/mdxToHtml';
import {
  parseConditionTraits,
  parseDamageTraits,
  parseLanguages,
} from '../utils/traitParsers';

/**
 * Foundry VTT dnd5e NPC Actor JSON structure.
 *
 * @property {string} _id - 16-character alphanumeric Foundry document ID
 * @property {string} name - Display name of the actor
 * @property {'npc'} type - Always "npc" for monsters
 * @property {string} img - Token image path
 * @property {Record<string, unknown>} system - dnd5e system data
 * @property {Record<string, unknown>} prototypeToken - Token configuration
 * @property {Record<string, unknown>} flags - Module flag data
 */
interface FoundryNpcActor {
  _id: string;
  name: string;
  type: 'npc';
  img: string;
  system: Record<string, unknown>;
  prototypeToken: Record<string, unknown>;
  flags: Record<string, unknown>;
}

/**
 * Parses a CR string to a numeric value.
 *
 * @param {string} cr - Challenge rating string (e.g. "1/4", "10")
 * @returns {number} Numeric CR value
 */
function parseCr(cr: string): number {
  if (cr.includes('/')) {
    const [num, den] = cr.split('/');
    return parseInt(num) / parseInt(den);
  }
  return parseFloat(cr);
}

/**
 * Parses a skill string like "Perception +15" into a skill key and bonus.
 *
 * @param {string} skillStr - Skill string from metadata
 * @returns {{ key: string; bonus: number } | null} Parsed skill or null
 */
function parseSkill(skillStr: string): { key: string; bonus: number } | null {
  const match = skillStr.match(/^(.+?)\s+\+?(-?\d+)$/);
  if (!match) return null;
  const key = SKILL_MAP[match[1].toLowerCase().trim()];
  if (!key) return null;
  return { key, bonus: parseInt(match[2]) };
}

/**
 * Computes skill proficiency multiplier from bonus, ability mod, and prof bonus.
 *
 * @param {number} bonus - Total skill bonus
 * @param {number} mod - Ability modifier
 * @param {number} prof - Proficiency bonus
 * @returns {number} Multiplier: 0, 0.5, 1, or 2
 */
function computeSkillProf(bonus: number, mod: number, prof: number): number {
  const diff = bonus - mod;
  if (diff >= prof * 2) return 2;
  if (diff >= prof) return 1;
  if (diff >= Math.floor(prof / 2)) return 0.5;
  return 0;
}

/**
 * Builds the dnd5e ability scores object.
 *
 * @param {MonsterMetadata} m - Source monster metadata
 * @returns {Record<string, unknown>} Abilities keyed by str/dex/con/int/wis/cha
 */
function buildAbilities(m: MonsterMetadata): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    out[key] = {
      value: m.abilities?.[key]?.score ?? 10,
      proficient: m.savingThrows?.[key] !== undefined ? 1 : 0,
      bonuses: { check: '', save: '' },
    };
  }
  return out;
}

/**
 * Builds the dnd5e skills object from metadata skill strings.
 *
 * @param {MonsterMetadata} m - Source monster metadata
 * @returns {Record<string, unknown>} Skills keyed by dnd5e abbreviations
 */
function buildSkills(m: MonsterMetadata): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!m.skills) return out;
  const prof = m.proficiencyBonus ?? 2;

  for (const str of m.skills) {
    const parsed = parseSkill(str);
    if (!parsed) continue;
    const abl = SKILL_ABILITY_MAP[parsed.key];
    const score =
      abl && m.abilities
        ? (m.abilities[abl as keyof typeof m.abilities]?.score ?? 10)
        : 10;
    const mod = Math.floor((score - 10) / 2);
    out[parsed.key] = {
      value: computeSkillProf(parsed.bonus, mod, prof),
      ability: abl,
      bonuses: { check: '', passive: '' },
    };
  }
  return out;
}

/**
 * Transforms an Ikuisuus MonsterMetadata record into a Foundry VTT dnd5e NPC Actor.
 *
 * @param {MonsterMetadata} monster - Source monster metadata
 * @param {string} mdxContent - Raw MDX content for biography HTML
 * @returns {Promise<FoundryNpcActor>} Foundry VTT Actor document
 */
export async function transformMonster(
  monster: MonsterMetadata,
  mdxContent: string,
): Promise<FoundryNpcActor> {
  const idSlug = monster.subSlug ?? monster.slug;
  const cr = monster.cr ? parseCr(monster.cr) : 0;
  const size = SIZE_MAP[monster.size?.toLowerCase() ?? 'medium'] ?? 'med';
  const tokenDim = TOKEN_SIZE_MAP[monster.size?.toLowerCase() ?? 'medium'] ?? 1;

  const dr = parseDamageTraits(monster.damageResistances ?? []);
  const di = parseDamageTraits(monster.damageImmunities ?? []);
  const dv = parseDamageTraits(monster.damageVulnerabilities ?? []);
  const ci = parseConditionTraits(monster.conditionImmunities ?? []);
  const langs = parseLanguages(monster.languages ?? []);

  const actorId = generateFoundryId(idSlug, 'monster');

  return {
    _id: actorId,
    _key: `!actors!${actorId}`,
    name: monster.title,
    type: 'npc',
    img: monster.image || 'icons/svg/mystery-man.svg',
    system: {
      abilities: buildAbilities(monster),
      attributes: {
        ac: { flat: monster.ac?.value ?? 10, calc: 'flat', formula: '' },
        hp: {
          value: monster.hp?.average ?? 0,
          max: monster.hp?.average ?? 0,
          formula: monster.hp?.formula ?? '',
        },
        movement: {
          walk: monster.speed?.modes?.walk ?? 0,
          fly: monster.speed?.modes?.fly ?? 0,
          swim: monster.speed?.modes?.swim ?? 0,
          climb: monster.speed?.modes?.climb ?? 0,
          burrow: monster.speed?.modes?.burrow ?? 0,
          hover: monster.speed?.modes?.hover ?? false,
          units: 'ft',
        },
        senses: {
          darkvision: monster.senses?.darkvision ?? 0,
          blindsight: monster.senses?.blindsight ?? 0,
          tremorsense: monster.senses?.tremorsense ?? 0,
          truesight: monster.senses?.truesight ?? 0,
          units: 'ft',
          special: '',
        },
      },
      details: {
        biography: {
          value: await extractMonsterDescription(mdxContent),
          public: '',
        },
        alignment: monster.alignment ?? '',
        cr,
        type: {
          value: monster.creatureType ?? '',
          subtype: '',
          swarm: '',
          custom: '',
        },
        source: { custom: 'Library of Ikuisuus — Damocles' },
      },
      traits: {
        size,
        di: { value: di.value, custom: di.custom },
        dr: { value: dr.value, custom: dr.custom },
        dv: { value: dv.value, custom: dv.custom },
        ci: { value: ci.value, custom: ci.custom },
        languages: { value: langs.value, custom: langs.custom },
      },
      skills: buildSkills(monster),
    },
    prototypeToken: {
      name: monster.title,
      displayName: 20,
      width: tokenDim,
      height: tokenDim,
      disposition: -1,
      actorLink: false,
      bar1: { attribute: 'attributes.hp' },
      sight: { enabled: true },
    },
    flags: {
      'ikuisuus-damocles': {
        slug: monster.slug,
        subSlug: monster.subSlug,
        source: monster.file,
        cr: monster.cr,
        tags: monster.tags,
      },
    },
  };
}
