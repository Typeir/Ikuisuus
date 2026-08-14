/**
 * @fileoverview Hit Dice Log Sync
 * @description Rebuilds a character's hit-dice log from its vocations and level:
 * one entry per vocation level, never-rolled dice seeded to their default, entries
 * beyond the current level or for removed vocations pruned, and `hpMax` recomputed
 * from the surviving log.
 *
 * @module modules/character-builder/lib/utils/hitDiceSync
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import type { HitDieRollEntry } from '@/lib/types/hitDice';
import { UNKNOWN_DIE } from '@/lib/utils/diceUtils';
import { computeAbilityModifier } from './characterStorage';
import { deriveHitPoints } from './hitDiceUtils';

/**
 * Seed value for a freshly-seeded or never-rolled die: `floor(faces/2) + 1`, or
 * `faces` for the first level of the primary vocation, or `null` when `faces` is
 * not finite or `<= UNKNOWN_DIE`.
 *
 * @function defaultDieResult
 * @param {number} faces - The die's face count (e.g. 8)
 * @param {boolean} isPrimaryFirstLevel - Whether this is level 1 of the primary vocation
 * @returns {number | null} The seed value, or `null` when the vocation has no usable die
 */
function defaultDieResult(
  faces: number,
  isPrimaryFirstLevel: boolean,
): number | null {
  if (!Number.isFinite(faces) || faces <= UNKNOWN_DIE) return null;
  return isPrimaryFirstLevel ? faces : Math.floor(faces / 2) + 1;
}

/**
 * Rebuilds the canonical hit-dice log: one entry per vocation level, in
 * vocation-then-level order. Keeps existing entries' rolled values, seeds
 * never-rolled entries to their default with `addedToHp` true, and drops entries
 * whose level or vocation no longer exists. Reuses the existing entry object when
 * `dieType`, `result`, and `addedToHp` are unchanged.
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
    const dieType = vocation.hitDie ?? UNKNOWN_DIE;
    for (let li = 1; li <= (vocation.level ?? 1); li += 1) {
      const id = `${vocation.slug}-${li}`;
      const isPrimaryFirstLevel = vocation.slug === primarySlug && li === 1;
      const seed = defaultDieResult(dieType, isPrimaryFirstLevel);
      const existing = byId.get(id);

      let result: number | null;
      let addedToHp: boolean;
      if (isPrimaryFirstLevel && seed != null) {
        result = seed;
        addedToHp = true;
      } else if (existing) {
        const healed = existing.result == null && seed != null;
        result = healed ? seed : existing.result;
        addedToHp = healed ? true : existing.addedToHp;
      } else {
        result = seed;
        addedToHp = seed != null;
      }

      if (
        existing &&
        existing.dieType === dieType &&
        existing.result === result &&
        existing.addedToHp === addedToHp
      ) {
        next.push(existing);
      } else {
        next.push({
          id,
          vocSlug: vocation.slug,
          vocTitle: vocation.title,
          dieType,
          levelIndex: li,
          result,
          conMod: existing?.conMod ?? conMod,
          addedToHp,
        });
      }
    }
  }

  const changed =
    next.length !== current.length || next.some((entry, i) => entry !== current[i]);
  return { log: next, changed };
}

/**
 * Computes the patch to bring a character's `hitDiceLog` and `hpMax` into sync
 * with its vocations and level. Returns `null` when already in sync. `hpMax` is
 * recomputed from {@link deriveHitPoints} on every call, so any dice, CON, or
 * passive-HP change is reflected. `tierBonus` is never included in the patch.
 *
 * @function syncHitDiceLog
 * @param {CharacterSheet} character - Character to reconcile
 * @returns {Partial<CharacterSheet> | null} The patch to apply, or `null` if in sync
 */
export function syncHitDiceLog(
  character: CharacterSheet,
): Partial<CharacterSheet> | null {
  const { log, changed } = buildCanonicalLog(character);
  const effectiveLog = changed ? log : (character.hitDiceLog ?? []);
  const nextHpMax = deriveHitPoints({
    ...character,
    hitDiceLog: effectiveLog,
  }).base;

  const patch: Partial<CharacterSheet> = {};
  if (changed) patch.hitDiceLog = log;
  if (nextHpMax !== (character.hpMax ?? 0)) patch.hpMax = nextHpMax;

  return Object.keys(patch).length > 0 ? patch : null;
}
