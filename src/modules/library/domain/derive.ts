/**
 * @fileoverview Values a card works out rather than reads.
 * @description Numbers a sheet would otherwise hand-maintain beside the number
 * they come from: an ability modifier beside its score, a tier bonus beside a
 * challenge rating, an ordinal beside a level. Each is arithmetic the rules
 * already fix, so authoring both halves only creates a pair that can disagree.
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
 * An ability score as a sheet prints it: the score, then its modifier.
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
 * Challenge rating as a number, accepting the fractional ratings a low-end
 * sheet carries.
 *
 * @param {string | number} challenge - Challenge rating, possibly `1/4`
 * @returns {number | null} Rating, or null when unreadable
 */
export function challengeValue(challenge: string | number): number | null {
  if (typeof challenge === 'number') return challenge;
  const text = String(challenge).trim();
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const whole = text.match(/^-?\d+(?:\.\d+)?/);
  return whole ? Number(whole[0]) : null;
}

/**
 * XP awarded for each challenge rating, in rating order. Through 27 this is
 * what the sheets carrying both numbers agree on wherever two or more agree.
 * From 28 the budget grows geometrically through two fixed points — 31 at
 * 325,000 and 35 at 425,000, the sheets whose budgets are the reference —
 * because a power budget compounds and the sparse data up there is noise.
 */
export const XP_BY_CHALLENGE: ReadonlyArray<readonly [number, number]> = [
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
 * XP for a challenge rating.
 *
 * @param {string | number} challenge - Challenge rating
 * @returns {number | null} XP, or null when the rating is unreadable or off the table
 *
 * @example
 * xpFor(3); // 700
 * xpFor('1/4'); // 50
 */
export function xpFor(challenge: string | number): number | null {
  const value = challengeValue(challenge);
  if (value === null) return null;
  return XP_BY_CHALLENGE.find(([rating]) => rating === value)?.[1] ?? null;
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
 * Challenge rating for an XP value: the rating whose XP band the value falls
 * in, each band running from a rating's XP up to the next rating's.
 *
 * @param {string | number} xp - XP value
 * @returns {number | null} Challenge rating, or null when the XP is unreadable
 *
 * @example
 * challengeFor(700); // 3
 * challengeFor('10,000'); // 13
 * challengeFor(800); // 3
 */
export function challengeFor(xp: string | number): number | null {
  const value = xpValue(xp);
  if (value === null) return null;
  let rating = XP_BY_CHALLENGE[0][0];
  for (const [candidate, threshold] of XP_BY_CHALLENGE) {
    if (threshold > value) break;
    rating = candidate;
  }
  return rating;
}

/**
 * A challenge rating as a sheet writes it: the low ratings as fractions.
 *
 * @param {number} rating - Challenge rating
 * @returns {string} Rating text
 *
 * @example
 * challengeLabel(0.25); // '1/4'
 * challengeLabel(13); // '13'
 */
export function challengeLabel(rating: number): string {
  if (rating === 0.125) return '1/8';
  if (rating === 0.25) return '1/4';
  if (rating === 0.5) return '1/2';
  return String(rating);
}

/**
 * Tier bonus for a challenge rating: one step per three rating, rounded up,
 * never below one. This is what `Tier Bonus by Challenge Rating` states and
 * what all 71 sheets carrying both numbers print.
 *
 * @param {string | number} challenge - Challenge rating
 * @returns {number | null} Tier bonus, or null when the rating is unreadable
 *
 * @example
 * tierBonusFor(3); // 1
 * tierBonusFor('1/4'); // 1
 * tierBonusFor(23); // 8
 */
export function tierBonusFor(challenge: string | number): number | null {
  const value = challengeValue(challenge);
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
 * A spell's level as its card names it. Level zero is a cantrip, which carries
 * no ordinal at all.
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
