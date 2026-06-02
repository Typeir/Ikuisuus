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
  VocationEntry,
} from '@/lib/types/character';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';

/**
 * Proficiency levels from unproficient to savant.
 *
 * @constant PROFICIENCY_CYCLE
 * @type {ProficiencyLevel[]}
 */
export const PROFICIENCY_CYCLE: (
  | 'none'
  | 'familiarity'
  | 'proficient'
  | 'expertise'
  | 'savanthood'
)[] = ['none', 'familiarity', 'proficient', 'expertise', 'savanthood'];

/**
 * Proficiency pip levels (excludes 'none'). Use for rendering 4 pips.
 *
 * @constant PROFICIENCY_LEVELS
 * @type {Exclude<ProficiencyLevel, 'none'>[]}
 */
export const PROFICIENCY_LEVELS: (
  | 'familiarity'
  | 'proficient'
  | 'expertise'
  | 'savanthood'
)[] = ['familiarity', 'proficient', 'expertise', 'savanthood'];

/**
 * Proficiency level display labels and tooltips.
 *
 * @constant PROFICIENCY_LABELS
 * @type {Record<ProficiencyLevel, { label: string; tooltip: string }>}
 */
export const PROFICIENCY_LABELS: Record<
  'none' | 'familiarity' | 'proficient' | 'expertise' | 'savanthood',
  { label: string; tooltip: string }
> = {
  none: { label: 'Unproficient', tooltip: 'No proficiency bonus' },
  familiarity: { label: 'Familiarity', tooltip: '½ proficiency bonus' },
  proficient: { label: 'Proficient', tooltip: 'Full proficiency bonus' },
  expertise: { label: 'Expertise', tooltip: 'Double proficiency bonus' },
  savanthood: { label: 'Savanthood', tooltip: 'Triple proficiency bonus' },
};

/**
 * All 28 standard D&D skills with their linked ability.
 *
 * @constant SKILL_DEFAULTS
 * @type {CharacterSkill[]}
 */
export const SKILL_DEFAULTS: CharacterSkill[] = [
  { name: 'skills.acrobatics', ability: 'dex', proficiency: 'none' },
  { name: 'skills.animalHandling', ability: 'wis', proficiency: 'none' },
  { name: 'skills.arcana', ability: 'int', proficiency: 'none' },
  { name: 'skills.athletics', ability: 'str', proficiency: 'none' },
  { name: 'skills.deception', ability: 'cha', proficiency: 'none' },
  { name: 'skills.history', ability: 'int', proficiency: 'none' },
  { name: 'skills.insight', ability: 'wis', proficiency: 'none' },
  { name: 'skills.intimidation', ability: 'cha', proficiency: 'none' },
  { name: 'skills.investigation', ability: 'int', proficiency: 'none' },
  { name: 'skills.medicine', ability: 'wis', proficiency: 'none' },
  { name: 'skills.nature', ability: 'int', proficiency: 'none' },
  { name: 'skills.perception', ability: 'wis', proficiency: 'none' },
  { name: 'skills.performance', ability: 'cha', proficiency: 'none' },
  { name: 'skills.persuasion', ability: 'cha', proficiency: 'none' },
  { name: 'skills.religion', ability: 'int', proficiency: 'none' },
  { name: 'skills.sleightOfHand', ability: 'dex', proficiency: 'none' },
  { name: 'skills.stealth', ability: 'dex', proficiency: 'none' },
  { name: 'skills.survival', ability: 'wis', proficiency: 'none' },
  { name: 'skills.tinkering', ability: 'int', proficiency: 'none' },
];

/**
 * All standard D&D tools with no proficiency by default.
 *
 * @constant TOOL_DEFAULTS
 * @type {CharacterTool[]}
 */
export const TOOL_DEFAULTS: CharacterTool[] = [
  { name: 'tools.alchemy', proficiency: 'none' },
  { name: 'tools.brewing', proficiency: 'none' },
  { name: 'tools.calligraphy', proficiency: 'none' },
  { name: 'tools.carpentry', proficiency: 'none' },
  { name: 'tools.cartography', proficiency: 'none' },
  { name: 'tools.cookery', proficiency: 'none' },
  { name: 'tools.deceit', proficiency: 'none' },
  { name: 'tools.electrics', proficiency: 'none' },
  { name: 'tools.gaming', proficiency: 'none' },
  { name: 'tools.glassblowing', proficiency: 'none' },
  { name: 'tools.herbalism', proficiency: 'none' },
  { name: 'tools.jewellery', proficiency: 'none' },
  { name: 'tools.leatherworking', proficiency: 'none' },
  { name: 'tools.masonry', proficiency: 'none' },
  { name: 'tools.music', proficiency: 'none' },
  { name: 'tools.painting', proficiency: 'none' },
  { name: 'tools.poisoncraft', proficiency: 'none' },
  { name: 'tools.pottery', proficiency: 'none' },
  { name: 'tools.smithing', proficiency: 'none' },
  { name: 'tools.thievery', proficiency: 'none' },
  { name: 'tools.tinkering', proficiency: 'none' },
  { name: 'tools.vehicles', proficiency: 'none' },
  { name: 'tools.weaving', proficiency: 'none' },
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
 * Compute proficiency bonus from level using the Damocles progression table.
 * Levels 1–29 follow the standard formula `⌈1 + level / 4⌉`; level 30 is a
 * special epic-tier case that returns +10.
 *
 * @function computeProficiencyBonus
 * @param {number} level - Character level (1–30)
 * @returns {number} Proficiency bonus
 */
export const computeProficiencyBonus = (level: number): number =>
  level >= 30 ? 10 : Math.ceil(1 + level / 4);

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
  hitDie: '',
  specializationSlug: null,
  specializationTitle: '',
  vocationFeatures: [],
  specializationFeatures: [],
});

/**
 * Migrate a legacy character (pre-vocations array) to the current schema.
 * If the character already has a `vocations` array it is returned unchanged.
 *
 * @function migrateCharacter
 * @param {Record<string, unknown>} raw - Raw character object loaded from storage
 * @returns {CharacterSheet} Migrated character sheet
 */
/**
 * Normalise a raw equipment array: converts legacy `string[]` entries to
 * `EquipmentItem` objects so old saves work after the schema upgrade.
 *
 * @function migrateEquipment
 * @param {unknown[]} items - Raw equipment array from storage
 * @returns {EquipmentItem[]} Normalised equipment items
 */
const migrateEquipment = (items: unknown[]): EquipmentItem[] =>
  items.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `item-${idx}`, name: item, quantity: 1, weightLb: 0 };
    }
    return item as EquipmentItem;
  });

export const migrateCharacter = (
  raw: Record<string, unknown>,
): CharacterSheet => {
  const rawEquipment = Array.isArray(raw['equipment']) ? raw['equipment'] : [];

  if (Array.isArray((raw as unknown as CharacterSheet).vocations)) {
    const sheet = raw as unknown as CharacterSheet;
    const needsEquipMigration = rawEquipment.some((e) => typeof e === 'string');
    if (!needsEquipMigration) return sheet;
    return { ...sheet, equipment: migrateEquipment(rawEquipment) };
  }

  const migrated: CharacterSheet = {
    ...(raw as unknown as CharacterSheet),
    vocations: [],
    equipment: migrateEquipment(rawEquipment),
  };

  const legacySlug = raw['vocationSlug'] as string | null | undefined;
  if (legacySlug) {
    migrated.vocations = [
      {
        slug: legacySlug,
        title: (raw['vocationTitle'] as string) || '',
        level: (raw['level'] as number) || 1,
        specializationSlug:
          (raw['specializationSlug'] as string | null) ?? null,
        specializationTitle: (raw['specializationTitle'] as string) || '',
        vocationFeatures:
          (raw['vocationFeatures'] as VocationEntry['vocationFeatures']) || [],
        specializationFeatures:
          (raw[
            'specializationFeatures'
          ] as VocationEntry['specializationFeatures']) || [],
      },
    ];
  }

  return migrated;
};

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
    ac: 10,
    initiativeBonus: 0,
    speedOverride: null,
    bloodlineSpeeds: [],
    proficiencyBonus: 2,
    hitDiceLog: [],
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
    background: '',
    personality: '',
    ideals: '',
    bonds: '',
    flaws: '',
    notes: '',
  };
};
