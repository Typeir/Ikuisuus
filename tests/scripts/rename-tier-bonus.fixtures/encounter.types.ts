/**
 * Encounter planner domain types.
 */

export interface CreatureEntry {
  id: string;
  name: string;
  cr: string | null;
  proficiencyBonus: number | null;
  ac: number;
  hpMax: number;
  speed: string | null;
}

export interface HeroicAwakeningState {
  tier: 'awakened' | 'legendary' | 'mythic';
  bonuses: {
    proficiencyBonus: number;
    acBonus: number;
    savingThrowBonus: number;
  };
}

export interface InProgressCombatant {
  id: string;
  name: string;
  proficiencyBonus: number | null;
  proficiencyBonusOverride: number | null;
  ac: number;
  hpMax: number;
  hpCurrent: number;
  heroicState: HeroicAwakeningState | null;
}

export function resolveDisplayProficiencyBonus(
  c: InProgressCombatant,
): number | null {
  return c.proficiencyBonusOverride ?? c.proficiencyBonus;
}
