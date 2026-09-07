"""
Damocles bloodline comparison engine.

Models the subset of Damocles rules a bloodline can actually move:
attack resolution, crit range, advantage, weapon dice + size multiplier,
damage bonuses, damage reduction, saving throws, Bleeding, and prone-from-Topple.

Rules modelled (sourced from the Ikuisuus corpus):
  - d20 vs AC. Nat 20 always hits and crits; nat 1 always misses.
  - Crits double all ROLLED dice, not flat bonuses.
  - Crit range widening (Champion 19-20 / 18-20, Empyrean Heavenpiercing +1).
  - Advantage/disadvantage = 2d20 keep high/low.
  - Tier bonus from the corpus progression table.
  - Weapon size multiplies the NUMBER of dice (Large x2, Huge x3).
  - Masteries: Vex, Graze, Cleave, Topple (Con save -> prone).
  - Masterful Blows: 3 per Repose with mastery, 1 without; one per target per turn.
  - Bleeding: (counter)d4 at the start of the sufferer's turn, counter -1 after.
  - Prone: melee attacks from within 1 stride have advantage; target stands on its turn.
"""

import random
from dataclasses import dataclass, field
from typing import List, Optional

_TB_TABLE = {
    1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4,
    11: 4, 12: 4, 13: 5, 14: 5, 15: 5, 16: 6, 17: 6, 18: 6, 19: 7,
    20: 7, 21: 7, 22: 8, 23: 8, 24: 8, 25: 9, 26: 9, 27: 9, 28: 10,
    29: 10, 30: 10,
}


def TB(level: int) -> int:
    return _TB_TABLE[level]


def d(n: int, sides: int, rng) -> int:
    if n <= 0:
        return 0
    return sum(rng.randint(1, sides) for _ in range(n))


def roll_d20(adv: int, rng) -> int:
    if adv > 0:
        return max(rng.randint(1, 20), rng.randint(1, 20))
    if adv < 0:
        return min(rng.randint(1, 20), rng.randint(1, 20))
    return rng.randint(1, 20)


@dataclass
class Weapon:
    name: str
    dice_n: int
    dice_size: int
    size_mult: int = 1
    mastery: Optional[str] = None
    bonus_acc: int = 0
    bonus_dmg: int = 0
    extra_dice: List[tuple] = field(default_factory=list)
    gwf: bool = False   # Great Weapon Fighting: treat 1s and 2s on weapon dice as 3

    @property
    def n(self) -> int:
        return self.dice_n * self.size_mult

    def roll_damage(self, crit: bool, rng) -> int:
        mult = 2 if crit else 1
        total = 0
        for _ in range(self.n * mult):
            r = rng.randint(1, self.dice_size)
            if self.gwf and r < 3:
                r = 3
            total += r
        for (en, es) in self.extra_dice:
            total += d(en * mult, es, rng)
        return total


@dataclass
class Build:
    label: str
    bloodline: str
    level: int
    ability_mod: int
    weapon: Weapon
    attacks: int = 1
    crit_on: int = 20
    flat_acc: int = 0
    flat_dmg: int = 0                       # flat, not doubled on crit
    per_turn_dice: List[tuple] = field(default_factory=list)  # first hit each turn
    rider_dice: List[tuple] = field(default_factory=list)     # once/turn, doubled on crit
    rider_needs_adv: bool = False
    always_adv: bool = False
    topple_every_hit: bool = False          # Tammeni: Heir of Great Sampsa
    adv_vs_bleeding: bool = False           # Vaarat: BLOOD FOR THE BLOOD GOD
    bleed_bonus_stacks: bool = False        # Vaarat: extra 1d4 on masterful blows
    masterful_bleed: bool = False           # weapon's masterful blow is Hemorrhaging
    masterful_uses: int = 3
    first_turn_acc_die: int = 0             # Edonian: Boon of the Land Spirits d4
    hd_mode: Optional[str] = None           # 'red' (damage) | 'black' (attack roll)
    hd_pool: int = 0
    hd_size: int = 10
    hd_reroll_low: bool = False             # Chromatic Refinement
    luck_points: int = 0
    floor_five: bool = False                # Pellervi Dependable
    reroll_ones: bool = False               # Pellervi core Lucky
    charge_bonus: int = 0                   # Sunborn Charging: +TB once per turn
    oversized_disadv: bool = False          # swinging a weapon one size larger than you
    ac: int = 16
    dr: int = 0
    hp: int = 100
    save_mods: dict = field(default_factory=dict)
    notes: str = ""

    @property
    def tb(self) -> int:
        return TB(self.level)

    @property
    def acc(self) -> int:
        return self.tb + self.ability_mod + self.weapon.bonus_acc + self.flat_acc


def _floor_roll(raw: int, b: Build, rng) -> int:
    if b.reroll_ones and raw == 1:
        raw = rng.randint(1, 20)
    if b.floor_five and raw <= 4:
        raw = 5
    return raw


def run_fight(b: Build, target_ac: int, target_con_save: int, rounds: int, rng) -> int:
    """One fight against one target. Returns total damage dealt."""
    total = 0
    bleed = 0
    masterful_left = b.masterful_uses
    luck_left = b.luck_points
    hd_left = b.hd_pool
    vex = False
    prone = False

    for r in range(rounds):
        # target's turn happened: bleeding ticks, target stands up
        if bleed > 0:
            total += d(bleed, 4, rng)
            bleed -= 1
        prone = False

        turn_rider_used = False
        turn_first_hit = False
        masterful_this_turn = False
        charge_used = False
        hd_used_this_round = False

        for i in range(b.attacks):
            adv = 0
            if b.oversized_disadv:
                adv = -1
            has_adv = False
            if b.always_adv:
                has_adv = True
            if vex:
                has_adv = True
                vex = False
            if prone:
                has_adv = True
            if b.adv_vs_bleeding and bleed > 0:
                has_adv = True
            if has_adv:
                adv = 0 if b.oversized_disadv else 1

            acc = b.acc
            if r == 0 and b.first_turn_acc_die:
                acc += d(1, b.first_turn_acc_die, rng)

            raw = roll_d20(adv, rng)
            raw = _floor_roll(raw, b, rng)

            # Homunculus black flame: spend 2 HD for +1 HD on the attack roll,
            # after rolling, before knowing the outcome. Once per round.
            if (b.hd_mode == "black" and hd_left >= 2 and not hd_used_this_round
                    and raw + acc < target_ac <= raw + acc + b.hd_size):
                bump = rng.randint(1, b.hd_size)
                if b.hd_reroll_low and bump <= 2:
                    bump = rng.randint(1, b.hd_size)
                raw += bump
                hd_left -= 2
                hd_used_this_round = True

            if luck_left > 0 and raw < 20 and raw + acc < target_ac:
                alt = rng.randint(1, 20)
                if alt > raw:
                    raw = alt
                luck_left -= 1

            crit = raw >= b.crit_on
            hit = crit or (raw != 1 and raw + acc >= target_ac)

            if not hit:
                if b.weapon.mastery == "graze":
                    total += max(0, b.ability_mod)
                continue

            dmg = b.weapon.roll_damage(crit, rng)
            dmg += b.ability_mod + b.weapon.bonus_dmg + b.flat_dmg

            if not turn_first_hit:
                for (pn, ps) in b.per_turn_dice:
                    dmg += d(pn * (2 if crit else 1), ps, rng)
                turn_first_hit = True
                if b.charge_bonus and not charge_used:
                    dmg += b.charge_bonus
                    charge_used = True
                if b.hd_mode == "red" and hd_left >= 1 and not hd_used_this_round:
                    bump = 0
                    for _ in range(2):
                        x = rng.randint(1, b.hd_size)
                        if b.hd_reroll_low and x <= 2:
                            x = rng.randint(1, b.hd_size)
                        bump += x
                    dmg += bump
                    hd_left -= 1
                    hd_used_this_round = True

            if b.rider_dice and not turn_rider_used:
                if (not b.rider_needs_adv) or adv > 0:
                    for (rn, rs) in b.rider_dice:
                        dmg += d(rn * (2 if crit else 1), rs, rng)
                    turn_rider_used = True

            total += dmg

            if b.weapon.mastery == "vex":
                vex = True
            if b.topple_every_hit and not prone:
                # Topple: Constitution save vs 10 + TB + ability mod
                dc = 10 + b.tb + b.ability_mod
                if rng.randint(1, 20) + target_con_save < dc:
                    prone = True
            if b.masterful_bleed and masterful_left > 0 and not masterful_this_turn:
                masterful_this_turn = True
                stacks = d(1, 4, rng)
                if b.bleed_bonus_stacks:
                    stacks += d(1, 4, rng)
                bleed += stacks
                masterful_left -= 1

    return total


def mean_damage(b: Build, target_ac: int, target_con_save: int = 6,
                rounds: int = 4, iters: int = 8000, seed: int = 12345) -> float:
    rng = random.Random(seed)
    return sum(run_fight(b, target_ac, target_con_save, rounds, rng)
               for _ in range(iters)) / iters
