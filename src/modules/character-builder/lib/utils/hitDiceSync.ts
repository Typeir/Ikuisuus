/**
 * @fileoverview Hit Dice Log Sync
 * @description Single source of truth that keeps a character's hit-dice log,
 * tier bonus, and `hpMax` in step with its vocations and level — decoupled from
 * any tab's render lifecycle. Backfills one entry per vocation level, heals
 * never-rolled dice to their average (the very first level of the primary
 * vocation to its die max), prunes entries beyond the current level or for
 * removed vocations, and recomputes `hpMax` from the surviving log. Because
 * every level's die is seeded added-at-average, a freshly-levelled sheet reflects
 * the character's full HP immediately; the roller can still re-roll any die.
 *
 * @module modules/character-builder/lib/utils/hitDiceSync
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { getTotalCharacterLevel } from './characterDerivation';
import {
  computeAbilityModifier,
  computeTierBonus,
} from './characterStorage';
import { deriveHitPoints } from './hitDiceUtils';

/**
 * The default value a freshly-seeded or never-rolled die contributes: the die
 * average (`floor(faces/2) + 1`), or the die maximum for the very first level of
 * the primary vocation, or `null` when the vocation has no valid hit die.
 *
 * @function defaultDieResult
 * @param {number} faces - The die's face count (e.g. 8)
 * @param {boolean} isPrimaryFirstLevel - Whether this is level 1 of the primary vocation
 * @returns {number | null} The seed value, or `null` if `faces` is not finite
 */
function defaultDieResult(
  faces: number,
  isPrimaryFirstLevel: boolean,
): number | null {
  if (!Number.isFinite(faces)) return null;
  return isPrimaryFirstLevel ? faces : Math.floor(faces / 2) + 1;
}

/**
 * Rebuilds the canonical hit-dice log for a character: one entry per vocation
 * level, in vocation-then-level order. Preserves any entry that already carries a
 * rolled value (respecting the player's rolls and removals), heals never-rolled
 * entries to their default seed added-to-HP, and drops entries whose level or
 * vocation no longer exists. Reference-stable for unchanged entries so callers
 * can detect a real change cheaply.
 *
 * @function buildCanonicalLog
 * @param {CharacterSheet} character - Character to rebuild the log for
 * @returns {{ log: HitDieRollEntry[]; changed: boolean }} The canonical log and whether it differs from the current one
 */
function buildCanonicalLog(character: CharacterSheet): {
  log: HitDieRollEntry[];
  changed: boolean;
} {
  const current = character.hitDiceLog ?? [];
  const byId = new Map(current.map((entry) => [entry.id, entry]));
  const conMod = computeAbilityModifier(character.abilityScores.con);
  const primarySlug = character.vocations.find((v) => v.slug)?.slug;

  const next: HitDieRollEntry[] = [];
  for (const vocation of character.vocations) {
    if (!vocation.slug) continue;
    const faces = parseInt(vocation.hitDie ?? '', 10);
    const dieType = vocation.hitDie ?? '?';
    for (let li = 1; li <= (vocation.level ?? 1); li += 1) {
      const id = `${vocation.slug}-${li}`;
      const seed = defaultDieResult(faces, vocation.slug === primarySlug && li === 1);
      const existing = byId.get(id);
      if (existing) {
        if (existing.result == null && seed != null) {
          next.push({ ...existing, result: seed, addedToHp: true });
        } else {
          next.push(existing);
        }
        continue;
      }
      next.push({
        id,
        vocSlug: vocation.slug,
        vocTitle: vocation.title,
        dieType,
        levelIndex: li,
        result: seed,
        conMod,
        addedToHp: seed != null,
      });
    }
  }

  const changed =
    next.length !== current.length || next.some((entry, i) => entry !== current[i]);
  return { log: next, changed };
}

/**
 * Computes the patch needed to bring a character's hit-dice log, tier bonus, and
 * `hpMax` into sync with its vocations and level. Returns `null` when everything
 * is already consistent, so the caller can skip an idempotent no-op patch (and
 * avoid a render loop). `hpMax` is only recomputed when the log actually changes,
 * leaving a manual max override intact between dice edits.
 *
 * @function syncHitDiceLog
 * @param {CharacterSheet} character - Character to reconcile
 * @returns {Partial<CharacterSheet> | null} The patch to apply, or `null` if in sync
 */
export function syncHitDiceLog(
  character: CharacterSheet,
): Partial<CharacterSheet> | null {
  const { log, changed } = buildCanonicalLog(character);
  const tierBonus = computeTierBonus(getTotalCharacterLevel(character));

  const patch: Partial<CharacterSheet> = {};
  if (changed) {
    patch.hitDiceLog = log;
    const nextHpMax = deriveHitPoints({ ...character, hitDiceLog: log }).base;
    if (nextHpMax !== (character.hpMax ?? 0)) patch.hpMax = nextHpMax;
  }
  if (tierBonus !== character.tierBonus) patch.tierBonus = tierBonus;

  return Object.keys(patch).length > 0 ? patch : null;
}
