/**
 * @fileoverview XP progression lookup tables and helpers. Thresholds from
 * `character-progression.mdx` (levels 1–30).
 *
 * @module modules/character-builder/lib/utils/xpProgression
 * @version 2.0.0
 * @author Typeir
 * @since 4.0.0
 */

/**
 * XP required to reach each level index (1-based).
 * Index 0 is unused; `XP_THRESHOLDS[n]` is the XP needed to be level `n`.
 *
 * @constant {number[]} XP_THRESHOLDS
 */
export const XP_THRESHOLDS: number[] = [
  0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 500000,
  650000, 800000, 1000000, 1250000, 1500000, 1800000, 2100000, 2500000, 3000000,
];

/**
 * Maximum supported XP level (1–30).
 *
 * @constant {number} MAX_XP_LEVEL
 */
export const MAX_XP_LEVEL = 30;

/**
 * Returns the character level for the given XP total.
 * Capped at {@link MAX_XP_LEVEL}; never returns less than 1.
 *
 * @function getLevelFromXP
 * @param {number} xp - Total accumulated experience points
 * @returns {number} Character level (1–{@link MAX_XP_LEVEL})
 */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 1; i <= MAX_XP_LEVEL; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Returns the minimum XP required to be at the given level.
 * Returns 0 for any level outside the range 1–{@link MAX_XP_LEVEL}.
 *
 * @function getXPForLevel
 * @param {number} level - Target character level
 * @returns {number} XP threshold for that level
 */
export function getXPForLevel(level: number): number {
  if (level < 1 || level > MAX_XP_LEVEL) return 0;
  return XP_THRESHOLDS[level];
}

/**
 * Returns a power-law position (0–100) for the given XP along the
 * 0 → {@link XP_THRESHOLDS}[{@link MAX_XP_LEVEL}] axis.
 * Uses `(xp / maxXp) ** 0.325`, expanded ×100. `xp` is clamped to [0, maxXp].
 * Guarantees `getXpAxisPosition(0) === 0`, `getXpAxisPosition(maxXp) === 100`,
 * and no decrease.
 *
 * @function getXpAxisPosition
 * @param {number} xp - Total accumulated experience points (clamped to [0, maxXp])
 * @returns {number} Power-law position along the XP axis (0–100)
 */
export function getXpAxisPosition(xp: number): number {
  const maxXp = XP_THRESHOLDS[MAX_XP_LEVEL];
  const clamped = Math.max(0, Math.min(xp, maxXp));
  if (clamped === 0) return 0;
  return Math.pow(clamped / maxXp, 0.325) * 100;
}

/**
 * Returns percentage progress (0–100) from the current level's XP floor
 * toward the next level's XP threshold. Returns 100 when level ≥ {@link MAX_XP_LEVEL}.
 *
 * @function getXPProgressPercent
 * @param {number} xp - Total accumulated experience points
 * @returns {number} Percent progress toward the next level (0–100)
 */
export function getXPProgressPercent(xp: number): number {
  const level = getLevelFromXP(xp);
  if (level >= MAX_XP_LEVEL) return 100;
  const floor = XP_THRESHOLDS[level];
  const ceiling = XP_THRESHOLDS[level + 1];
  return Math.round(((xp - floor) / (ceiling - floor)) * 100);
}
