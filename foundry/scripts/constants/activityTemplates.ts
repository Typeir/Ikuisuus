/**
 * @fileoverview Factory functions for dnd5e 5.3 Activity data objects.
 * @description Creates fully-populated Activity entries that match the
 * canonical SRD structure (Wolf YAML reference). Base construction is
 * delegated to `activityDefaults.ts`.
 *
 * @module foundry/scripts/constants/activityTemplates
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link createAttackActivity} for weapon/spell attack activities
 * @see {@link createSaveActivity} for forced-save activities
 * @see {@link createUtilityActivity} for descriptive/non-mechanical activities
 */

import type {
  ActivityBase,
  ActivityDamagePart,
  AttackActivity,
  SaveActivity,
  UtilityActivity,
} from '../handlers/types';
import { buildBase } from './activityDefaults';

/**
 * Options for creating an Attack Activity.
 *
 * @property {string} [id] - Activity _id (default "dnd5eactivity000")
 * @property {string} [ability] - Attack ability (str, dex, etc.)
 * @property {string} [bonus] - Attack bonus string
 * @property {number | null} [criticalThreshold] - Critical hit threshold
 * @property {boolean} [flat] - Whether the bonus is a flat value
 * @property {string} [attackType] - "melee" or "ranged"
 * @property {string} [classification] - "weapon", "spell", or "unarmed"
 * @property {boolean} [includeBase] - Whether to include the item's base damage
 * @property {ActivityDamagePart[]} [damageParts] - Additional damage parts
 * @property {Partial<ActivityBase>} [base] - Base field overrides
 */
export interface AttackActivityOptions {
  id?: string;
  ability?: string;
  bonus?: string;
  criticalThreshold?: number | null;
  flat?: boolean;
  attackType?: string;
  classification?: string;
  includeBase?: boolean;
  damageParts?: ActivityDamagePart[];
  base?: Partial<ActivityBase>;
}

/**
 * Creates a dnd5e Attack Activity with all required fields populated.
 *
 * @param {AttackActivityOptions} [opts] - Configuration options
 * @returns {AttackActivity} Complete Attack Activity data object
 */
export function createAttackActivity(
  opts: AttackActivityOptions = {},
): AttackActivity {
  const base = buildBase(opts.id ?? 'dnd5eactivity000', 'attack', opts.base);

  return {
    ...base,
    type: 'attack',
    attack: {
      ability: opts.ability ?? '',
      bonus: opts.bonus ?? '',
      critical: { threshold: opts.criticalThreshold ?? null },
      flat: opts.flat ?? false,
      type: {
        value: opts.attackType ?? 'melee',
        classification: opts.classification ?? 'weapon',
      },
    },
    damage: {
      critical: { bonus: '' },
      includeBase: opts.includeBase ?? true,
      parts: opts.damageParts ?? [],
    },
  };
}

/**
 * Options for creating a Save Activity.
 *
 * @property {string} [id] - Activity _id (default "dnd5eactivity100")
 * @property {string} [ability] - Save ability (str, dex, con, int, wis, cha)
 * @property {string} [dcCalculation] - DC calculation method ("" for custom formula)
 * @property {string} [dcFormula] - DC formula string (e.g. "25")
 * @property {string} [onSave] - Effect on successful save ("half", "none")
 * @property {ActivityDamagePart[]} [damageParts] - Damage parts dealt on the save
 * @property {Partial<ActivityBase>} [base] - Base field overrides
 */
export interface SaveActivityOptions {
  id?: string;
  ability?: string;
  dcCalculation?: string;
  dcFormula?: string;
  onSave?: string;
  damageParts?: ActivityDamagePart[];
  base?: Partial<ActivityBase>;
}

/**
 * Creates a dnd5e Save Activity with all required fields populated.
 *
 * @param {SaveActivityOptions} [opts] - Configuration options
 * @returns {SaveActivity} Complete Save Activity data object
 */
export function createSaveActivity(
  opts: SaveActivityOptions = {},
): SaveActivity {
  const base = buildBase(opts.id ?? 'dnd5eactivity100', 'save', opts.base);

  return {
    ...base,
    type: 'save',
    save: {
      ability: opts.ability ?? '',
      dc: {
        calculation: opts.dcCalculation ?? '',
        formula: opts.dcFormula ?? '',
      },
    },
    damage: {
      onSave: opts.onSave ?? 'half',
      parts: opts.damageParts ?? [],
    },
  };
}

/**
 * Options for creating a Utility Activity.
 *
 * @property {string} [id] - Activity _id (default "dnd5eactivity200")
 * @property {Partial<ActivityBase>} [base] - Base field overrides
 */
export interface UtilityActivityOptions {
  id?: string;
  base?: Partial<ActivityBase>;
}

/**
 * Creates a dnd5e Utility Activity with all required fields populated.
 *
 * @param {UtilityActivityOptions} [opts] - Configuration options
 * @returns {UtilityActivity} Complete Utility Activity data object
 */
export function createUtilityActivity(
  opts: UtilityActivityOptions = {},
): UtilityActivity {
  const base = buildBase(opts.id ?? 'dnd5eactivity200', 'utility', opts.base);

  return {
    ...base,
    type: 'utility',
  };
}

/**
 * Creates a damage part for use in Activity damage arrays.
 *
 * @param {number} count - Number of dice
 * @param {number} denomination - Die sides
 * @param {string} type - Damage type key (e.g. "fire", "piercing")
 * @param {string} [bonus] - Flat bonus (default "")
 * @returns {ActivityDamagePart} A single damage part entry
 */
export function createDamagePart(
  count: number,
  denomination: number,
  type: string,
  bonus: string = '',
): ActivityDamagePart {
  return {
    number: String(count),
    denomination: String(denomination),
    bonus,
    types: [type],
    custom: { enabled: false, formula: '' },
  };
}

/**
 * Creates a custom-formula damage part for non-standard damage expressions.
 *
 * @param {string} formula - Custom damage formula (e.g. "sum(abilities)")
 * @param {string} type - Damage type key
 * @returns {ActivityDamagePart} A custom-formula damage part entry
 */
export function createCustomDamagePart(
  formula: string,
  type: string,
): ActivityDamagePart {
  return {
    number: '',
    denomination: '',
    bonus: '',
    types: [type],
    custom: { enabled: true, formula },
  };
}
