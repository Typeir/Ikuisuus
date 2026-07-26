/**
 * @fileoverview Character Sheet Pure Helpers
 * @description Pure factory and math utilities for character sheets.
 * CRUD persistence is handled by CharacterSheetContext via the
 * fetchPersistentData / storePersistentData abstraction layer.
 *
 * @module modules/character-builder/lib/utils/characterStorage
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    AbilityKey,
    CharacterSheet,
    CharacterSkill,
    CharacterSpellSlot,
    CharacterTool,
    EquipmentItem,
    VocationEntry
} from '@/lib/types/character';
import { UNKNOWN_DIE } from '@/lib/utils/diceUtils';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';

/**
 * Proficiency levels from unproficient to savant.
 *
 * @constant TIER_CYCLE
 * @type {TierLevel[]}
 */
export const TIER_CYCLE: (
  | 'none'
  | 'familiarity'
  | 'proficient'
  | 'expertise'
  | 'savanthood'
)[] = ['none', 'familiarity', 'proficient', 'expertise', 'savanthood'];

/**
 * Proficiency pip levels (excludes 'none'). Use for rendering 4 pips.
 *
 * @constant TIER_LEVELS
 * @type {Exclude<TierLevel, 'none'>[]}
 */
export const TIER_LEVELS: (
  | 'familiarity'
  | 'proficient'
  | 'expertise'
  | 'savanthood'
)[] = ['familiarity', 'proficient', 'expertise', 'savanthood'];

/**
 * Proficiency level display labels and tooltips.
 *
 * @constant TIER_LABELS
 * @type {Record<TierLevel, { label: string; tooltip: string }>}
 */
export const TIER_LABELS: Record<
  'none' | 'familiarity' | 'proficient' | 'expertise' | 'savanthood',
  { label: string; tooltip: string }
> = {
  none: { label: 'Unproficient', tooltip: 'No tier bonus' },
  familiarity: { label: 'Familiarity', tooltip: '½ tier bonus' },
  proficient: { label: 'Proficient', tooltip: 'Full tier bonus' },
  expertise: { label: 'Expertise', tooltip: 'Double tier bonus' },
  savanthood: { label: 'Savanthood', tooltip: 'Triple tier bonus' },
};

/**
 * All 28 standard D&D skills with their linked ability.
 *
 * @constant SKILL_DEFAULTS
 * @type {CharacterSkill[]}
 */
export const SKILL_DEFAULTS: CharacterSkill[] = [
  { name: 'skills.acrobatics', ability: 'dex', tier: 'none' },
  { name: 'skills.animalHandling', ability: 'wis', tier: 'none' },
  { name: 'skills.arcana', ability: 'int', tier: 'none' },
  { name: 'skills.athletics', ability: 'str', tier: 'none' },
  { name: 'skills.deception', ability: 'cha', tier: 'none' },
  { name: 'skills.history', ability: 'int', tier: 'none' },
  { name: 'skills.insight', ability: 'wis', tier: 'none' },
  { name: 'skills.intimidation', ability: 'cha', tier: 'none' },
  { name: 'skills.investigation', ability: 'int', tier: 'none' },
  { name: 'skills.medicine', ability: 'wis', tier: 'none' },
  { name: 'skills.nature', ability: 'int', tier: 'none' },
  { name: 'skills.perception', ability: 'wis', tier: 'none' },
  { name: 'skills.performance', ability: 'cha', tier: 'none' },
  { name: 'skills.persuasion', ability: 'cha', tier: 'none' },
  { name: 'skills.religion', ability: 'int', tier: 'none' },
  { name: 'skills.sleightOfHand', ability: 'dex', tier: 'none' },
  { name: 'skills.stealth', ability: 'dex', tier: 'none' },
  { name: 'skills.survival', ability: 'wis', tier: 'none' },
  { name: 'skills.tinkering', ability: 'int', tier: 'none' },
];

/**
 * All standard D&D tools with no proficiency by default.
 *
 * @constant TOOL_DEFAULTS
 * @type {CharacterTool[]}
 */
export const TOOL_DEFAULTS: CharacterTool[] = [
  { name: 'tools.alchemy', tier: 'none' },
  { name: 'tools.brewing', tier: 'none' },
  { name: 'tools.calligraphy', tier: 'none' },
  { name: 'tools.carpentry', tier: 'none' },
  { name: 'tools.cartography', tier: 'none' },
  { name: 'tools.cooking', tier: 'none' },
  { name: 'tools.deceit', tier: 'none' },
  { name: 'tools.electrics', tier: 'none' },
  { name: 'tools.gaming', tier: 'none' },
  { name: 'tools.glassblowing', tier: 'none' },
  { name: 'tools.herbalism', tier: 'none' },
  { name: 'tools.jewellery', tier: 'none' },
  { name: 'tools.leatherworking', tier: 'none' },
  { name: 'tools.masonry', tier: 'none' },
  { name: 'tools.music', tier: 'none' },
  { name: 'tools.painting', tier: 'none' },
  { name: 'tools.poisoncraft', tier: 'none' },
  { name: 'tools.pottery', tier: 'none' },
  { name: 'tools.smithing', tier: 'none' },
  { name: 'tools.thievery', tier: 'none' },
  { name: 'tools.tinkering', tier: 'none' },
  { name: 'tools.vehicles', tier: 'none' },
  { name: 'tools.weaving', tier: 'none' },
];
export const SPELL_SLOT_DEFAULTS: CharacterSpellSlot[] = Array.from(
  { length: 9 },
  (_, i) => ({ level: i + 1, total: 0, used: 0 }),
);

/**
 * Default saving throw proficiency record — all none.
 *
 * @constant DEFAULT_SAVES
 * @type {Record<AbilityKey, 'none'>}
 */
const DEFAULT_SAVES: Record<AbilityKey, 'none'> = {
  str: 'none',
  dex: 'none',
  con: 'none',
  int: 'none',
  wis: 'none',
  cha: 'none',
};

/**
 * Compute tier bonus from level using the Damocles progression table.
 * Starts at +1 (levels 1–3) and increases every 3 levels: `⌈level / 3⌉`.
 * Level 30 yields +10.
 *
 * @function computeTierBonus
 * @param {number} level - Character level (1–30)
 * @returns {number} Tier bonus
 */
export const computeTierBonus = (level: number): number => Math.ceil(level / 3);

/**
 * Compute ability modifier from an ability score.
 *
 * @function computeAbilityModifier
 * @param {number} score - Ability score (1–30)
 * @returns {number} Modifier
 */
export const computeAbilityModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

/**
 * Roll a single ability score using the standard 4d6-drop-lowest method.
 *
 * @function rollAbilityScore
 * @returns {number} Rolled ability score in the range 3–18
 */
export const rollAbilityScore = (): number => {
  const rolls = Array.from(
    { length: 4 },
    () => Math.floor(Math.random() * 6) + 1,
  );
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
};

/**
 * Create a blank vocation entry for use in the vocation selector.
 *
 * @function createEmptyVocationEntry
 * @returns {VocationEntry} New vocation entry with level 1 and empty features
 */
export const createEmptyVocationEntry = (): VocationEntry => ({
  slug: '',
  title: '',
  level: 1,
  hitDie: UNKNOWN_DIE,
  baseSavingThrows: [],
  baseSkillChoiceCount: 0,
  baseSkillChoices: [],
  baseTradeFixed: [],
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
});

/**
 * Create a fresh empty character sheet with defaults.
 *
 * @function createEmptyCharacter
 * @returns {CharacterSheet} New character with default values and no identity set
 */
export const createEmptyCharacter = (): CharacterSheet => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    name: '',
    playerName: '',
    level: 1,
    experience: 0,
    bloodlineSlug: null,
    bloodlineTitle: '',
    boonBudget: 0,
    selectedBoons: [],
    vocations: [],
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    hpMax: 0,
    hpCurrent: 0,
    tempHp: 0,
    grievousWounds: 0,
    ac: 10,
    initiativeBonus: 0,
    speedOverride: null,
    bloodlineSpeeds: [],
    tierBonus: 2,
    gritCurrent: 0,
    gritMax: 0,
    manualStatOverrides: [],
    hitDiceLog: [],
    spentHitDice: {},
    lostHitDice: {},
    conditions: [],
    attacks: [],
    spellSlots: SPELL_SLOT_DEFAULTS.map((s) => ({ ...s })),
    savingThrows: { ...DEFAULT_SAVES },
    skills: SKILL_DEFAULTS.map((s) => ({ ...s })),
    tools: TOOL_DEFAULTS.map((t) => ({ ...t })),
    equipment: [],
    equipmentNotes: '',
    selectedFeats: [],
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    coinHoldings: [],
    wants: '',
    fears: '',
    virtues: '',
    flaws: '',
    bonds: '',
    notes: '',
    bibliographyNotes: '',
    abilities: [],
  };
};
