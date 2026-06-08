/**
 * Table Constants
 *
 * @fileoverview Sort order and display constants for metadata tables.
 * Provides compatibility exports for legacy imports used across table components and tests.
 *
 * @module src/lib/enums/tableConstants
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Item rarity sorting order from lowest to highest rarity.
 * @constant
 * @type {Readonly<Record<string, number>>}
 */
export const RARITY_SORT_ORDER: Readonly<Record<string, number>> = {
	nonmagical: 0,
	common: 1,
	uncommon: 2,
	rare: 3,
	'very rare': 4,
	legendary: 5,
	artifact: 6,
	'mythic artifact': 7,
	mythic: 8,
	unique: 9,
} as const;

/**
 * Creature size sorting order from smallest to largest.
 * @constant
 * @type {Readonly<Record<string, number>>}
 */
export const SIZE_SORT_ORDER: Readonly<Record<string, number>> = {
	tiny: 0,
	small: 1,
	medium: 2,
	large: 3,
	huge: 4,
	gargantuan: 5,
	colossal: 6,
	titanic: 7,
} as const;

/**
 * Default spell level labels used by spell table tabs.
 * @constant
 * @type {Readonly<Record<number, string>>}
 */
export const DEFAULT_SPELL_LEVEL_LABELS: Readonly<Record<number, string>> = {
	0: 'Cantrip',
	1: '1st Level',
	2: '2nd Level',
	3: '3rd Level',
	4: '4th Level',
	5: '5th Level',
	6: '6th Level',
	7: '7th Level',
	8: '8th Level',
	9: '9th Level',
	10: '10th Level',
	11: '11th Level',
	12: '12th Level',
} as const;
