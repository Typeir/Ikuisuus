/**
 * @fileoverview Values a card works out rather than reads.
 * @description Numbers a sheet would otherwise hand-maintain beside the number
 * they come from
 *
 * @module modules/library/domain/derive
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

/**
 * Ability modifier for a score, by the standard halving.
 *
 * @param {string | number} score - Ability score
 * @returns {number | null} Modifier, or null when the score is not a number
 *
 * @example
 * abilityModifier(18); // 4
 * abilityModifier(9); // -1
 */
export function abilityModifier(score: string | number): number | null {
  if (typeof score !== 'number' && String(score).trim() === '') return null;
  const value = typeof score === 'number' ? score : Number(String(score).trim());
  if (!Number.isFinite(value)) return null;
  return Math.floor((value - 10) / 2);
}

/**
 * A modifier written with its sign, the way a sheet prints it.
 *
 * @param {number} modifier - Modifier
 * @returns {string} Signed modifier
 *
 * @example
 * signed(4); // '+4'
 * signed(-1); // '-1'
 */
export function signed(modifier: number): string {
  return modifier < 0 ? String(modifier) : `+${modifier}`;
}

/**
 * An ability score as a sheet prints it
 *
 * @param {string | number} score - Ability score
 * @returns {string} Score and modifier, or the score alone when it is not a number
 *
 * @example
 * abilityCell(18); // '18 (+4)'
 * abilityCell('—'); // '—'
 */
export function abilityCell(score: string | number): string {
  const modifier = abilityModifier(score);
  const text = String(score).trim();
  return modifier === null ? text : `${text} (${signed(modifier)})`;
}

/**
 * Lethality as a number, accepting the fractional ratings a low-end
 * sheet carries.
 *
 * @param {string | number} lethality - Lethality, possibly `1/4`
 * @returns {number | null} Rating, or null when unreadable
 */
export function lethalityValue(lethality: string | number): number | null {
  if (typeof lethality === 'number') return lethality;
  const text = String(lethality).trim();
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const whole = text.match(/^-?\d+(?:\.\d+)?/);
  return whole ? Number(whole[0]) : null;
}

/**
 * XP awarded for each lethality, in rating order.
 */
export const XP_BY_LETHALITY: ReadonlyArray<readonly [number, number]> = [
  [0, 10],
  [0.125, 25],
  [0.25, 50],
  [0.5, 100],
  [1, 200],
  [2, 450],
  [3, 700],
  [4, 1100],
  [5, 1800],
  [6, 2300],
  [7, 2900],
  [8, 3900],
  [9, 5000],
  [10, 5900],
  [11, 7200],
  [12, 8400],
  [13, 10000],
  [14, 11500],
  [15, 13000],
  [16, 15000],
  [17, 18000],
  [18, 20000],
  [19, 22000],
  [20, 25000],
  [21, 33000],
  [22, 41000],
  [23, 50000],
  [24, 62000],
  [25, 75000],
  [26, 90000],
  [27, 105000],
  [28, 140000],
  [29, 185000],
  [30, 245000],
  [31, 325000],
  [32, 350000],
  [33, 370000],
  [34, 395000],
  [35, 425000],
];

/**
 * XP for a lethality.
 *
 * @param {string | number} lethality - Lethality
 * @returns {number | null} XP, or null when the rating is unreadable or off the table
 *
 * @example
 * xpFor(3); // 700
 * xpFor('1/4'); // 50
 */
export function xpFor(lethality: string | number): number | null {
  const value = lethalityValue(lethality);
  if (value === null) return null;
  return XP_BY_LETHALITY.find(([rating]) => rating === value)?.[1] ?? null;
}

/**
 * XP as a number, accepting the thousands separators a sheet writes.
 *
 * @param {string | number} xp - XP value, possibly `10,000`
 * @returns {number | null} XP, or null when unreadable
 */
export function xpValue(xp: string | number): number | null {
  if (typeof xp === 'number') return Number.isFinite(xp) ? xp : null;
  const text = String(xp).replace(/,/g, '').trim();
  return /^\d+$/.test(text) ? Number(text) : null;
}

/**
 * Lethality for an XP value
 *
 * @param {string | number} xp - XP value
 * @returns {number | null} Lethality, or null when the XP is unreadable
 *
 * @example
 * lethalityFor(700); // 3
 * lethalityFor('10,000'); // 13
 * lethalityFor(800); // 3
 */
export function lethalityFor(xp: string | number): number | null {
  const value = xpValue(xp);
  if (value === null) return null;
  let rating = XP_BY_LETHALITY[0][0];
  for (const [candidate, threshold] of XP_BY_LETHALITY) {
    if (threshold > value) break;
    rating = candidate;
  }
  return rating;
}

/**
 * The XP band of a rating
 *
 * @param {string | number} lethality - Lethality
 * @returns {readonly [number, number | null] | null} Low and high XP, or null for an unknown rating
 *
 * @example
 * xpBand(1); // [200, 449]
 * xpBand('1/2'); // [100, 199]
 * xpBand(35); // [425000, null]
 */
export function xpBand(lethality: string | number): readonly [number, number | null] | null {
  const value = lethalityValue(lethality);
  if (value === null) return null;
  const index = XP_BY_LETHALITY.findIndex(([rating]) => rating === value);
  if (index < 0) return null;
  const next = XP_BY_LETHALITY[index + 1];
  return [XP_BY_LETHALITY[index][1], next ? next[1] - 1 : null];
}

/**
 * A lethality as a sheet writes it
 *
 * @param {number} rating - Lethality
 * @returns {string} Rating text
 *
 * @example
 * lethalityLabel(0.25); // '1/4'
 * lethalityLabel(13); // '13'
 */
export function lethalityLabel(rating: number): string {
  if (rating === 0.125) return '1/8';
  if (rating === 0.25) return '1/4';
  if (rating === 0.5) return '1/2';
  return String(rating);
}

/**
 * Tier bonus for a lethality
 *
 * @param {string | number} lethality - Lethality
 * @returns {number | null} Tier bonus, or null when the rating is unreadable
 *
 * @example
 * tierBonusFor(3); // 1
 * tierBonusFor('1/4'); // 1
 * tierBonusFor(23); // 8
 */
export function tierBonusFor(lethality: string | number): number | null {
  const value = lethalityValue(lethality);
  if (value === null) return null;
  return Math.max(1, Math.ceil(value / 3));
}

/**
 * Ordinal suffix for a whole number.
 *
 * @param {number} value - Number
 * @returns {string} The number with its suffix
 *
 * @example
 * ordinal(3); // '3rd'
 * ordinal(11); // '11th'
 */
export function ordinal(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  const suffix = ['th', 'st', 'nd', 'rd'][value % 10] ?? 'th';
  return `${value}${suffix}`;
}

/**
 * A spell's level as its card names it.
 *
 * @param {string | number} level - Spell level
 * @returns {string | null} Level phrase, or null when the level is unreadable
 *
 * @example
 * spellLevelPhrase(3); // '3rd-level'
 * spellLevelPhrase(0); // 'Cantrip'
 */
export function spellLevelPhrase(level: string | number): string | null {
  const text = String(level).trim();
  if (text === '') return null;
  if (/^cantrip$/i.test(text)) return 'Cantrip';
  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return value === 0 ? 'Cantrip' : `${ordinal(value)}-level`;
}

/**
 * A DC and the working behind it.
 *
 * @interface DerivedDc
 * @property {number | null} total - The DC itself, when the accuracy is a number
 * @property {string} working - How that number is reached
 */
export interface DerivedDc {
  total: number | null;
  working: string;
}

/**
 * The DC a block's accuracy sets, with the calculation that reaches it.
 *
 * @description Every DC in the game is ten plus the accuracy behind it.
 *
 * @param {string} accuracy - Accuracy as the block declares it
 * @returns {DerivedDc | null} The DC, or null when there is no accuracy to add to
 *
 * @example
 * saveDcFrom('+10'); // { total: 20, working: '10 + accuracy(10)' }
 * saveDcFrom('your level + your tb');
 * // { total: null, working: '10 + accuracy(your level + your tb)' }
 */
export function saveDcFrom(accuracy: string): DerivedDc | null {
  const written = accuracy.trim().replace(/^\+\s*/, '');
  if (written === '') return null;

  const value = Number(written);
  return {
    total: Number.isFinite(value) ? 10 + value : null,
    working: `10 + accuracy(${written})`,
  };
}
