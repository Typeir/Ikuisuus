/**
 * @fileoverview Character Sheet Pure Helpers
 * @description Pure factory and math utilities for character sheets.
 * CRUD persistence is handled by CharacterSheetContext via the
 * fetchPersistentData / storePersistentData abstraction layer.
 *
 * @module characterStorage
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
import { generateId } from '@/lib/utils/encounterStorage';

/**
 * All 28 standard D&D skills with their linked ability.
 *
 * @constant SKILL_DEFAULTS
 * @type {CharacterSkill[]}
 */
export const SKILL_DEFAULTS: CharacterSkill[] = [
  { name: 'Acrobatics', ability: 'dex', proficiency: 'none' },
  { name: 'Animal Handling', ability: 'wis', proficiency: 'none' },
  { name: 'Arcana', ability: 'int', proficiency: 'none' },
  { name: 'Athletics', ability: 'str', proficiency: 'none' },
  { name: 'Deception', ability: 'cha', proficiency: 'none' },
  { name: 'History', ability: 'int', proficiency: 'none' },
  { name: 'Insight', ability: 'wis', proficiency: 'none' },
  { name: 'Intimidation', ability: 'cha', proficiency: 'none' },
  { name: 'Investigation', ability: 'int', proficiency: 'none' },
  { name: 'Medicine', ability: 'wis', proficiency: 'none' },
  { name: 'Nature', ability: 'int', proficiency: 'none' },
  { name: 'Perception', ability: 'wis', proficiency: 'none' },
  { name: 'Performance', ability: 'cha', proficiency: 'none' },
  { name: 'Persuasion', ability: 'cha', proficiency: 'none' },
  { name: 'Religion', ability: 'int', proficiency: 'none' },
  { name: 'Sleight of Hand', ability: 'dex', proficiency: 'none' },
  { name: 'Stealth', ability: 'dex', proficiency: 'none' },
  { name: 'Survival', ability: 'wis', proficiency: 'none' },
  { name: 'Tinkering', ability: 'int', proficiency: 'none' },
  { name: 'Lore: Damocles', ability: 'int', proficiency: 'none' },
  { name: 'Lore: World', ability: 'int', proficiency: 'none' },
  { name: 'Lore: Creatures', ability: 'int', proficiency: 'none' },
  { name: 'Lore: Magic', ability: 'int', proficiency: 'none' },
  { name: 'Lore: Religion', ability: 'int', proficiency: 'none' },
  { name: 'Lore: Planes', ability: 'int', proficiency: 'none' },
  { name: 'Social: Etiquette', ability: 'cha', proficiency: 'none' },
  { name: 'Social: Streetwise', ability: 'cha', proficiency: 'none' },
  { name: 'Social: Influence', ability: 'cha', proficiency: 'none' },
];

/**
 * All standard D&D tools with no proficiency by default.
 *
 * @constant TOOL_DEFAULTS
 * @type {CharacterTool[]}
 */
export const TOOL_DEFAULTS: CharacterTool[] = [
  { name: "Artisan's Tools", proficiency: 'none' },
  { name: "Thieves' Tools", proficiency: 'none' },
  { name: 'Calligrapher Tools', proficiency: 'none' },
  { name: 'Cartographer Tools', proficiency: 'none' },
  { name: 'Cobbler Tools', proficiency: 'none' },
  { name: 'Cook Utensils', proficiency: 'none' },
  { name: 'Glassblower Tools', proficiency: 'none' },
  { name: 'Jeweler Tools', proficiency: 'none' },
  { name: 'Leatherworker Tools', proficiency: 'none' },
  { name: 'Mason Tools', proficiency: 'none' },
  { name: 'Painter Supplies', proficiency: 'none' },
  { name: 'Potter Tools', proficiency: 'none' },
  { name: 'Smith Tools', proficiency: 'none' },
  { name: 'Tinker Tools', proficiency: 'none' },
  { name: 'Weaver Tools', proficiency: 'none' },
  { name: 'Woodcarver Tools', proficiency: 'none' },
  { name: 'Abacus', proficiency: 'none' },
  { name: 'Alchemist Supplies', proficiency: 'none' },
  { name: 'Brewing Supplies', proficiency: 'none' },
  { name: 'Herbalism Kit', proficiency: 'none' },
  { name: 'Navigator Tools', proficiency: 'none' },
  { name: 'Poisoner Kit', proficiency: 'none' },
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
