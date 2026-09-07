"""
The attrition layer.

Damocles' rest economy is the whole point of the system (spell slots refresh only
on Recovery; Repose restores no hit points directly, you spend Hit Dice). So a
single-fight comparison misses most of what a bloodline is worth. This models a
full Recovery cycle:

  4 encounters, with a Repose after encounter 2.
  Repose: regain half your Hit Dice (rounded down, min 1) and spend what you like.
  Hit Die healing: 1d10 + CON mod per die (Warrior d10).
  Recovery: full reset (not modelled - the day ends).

Measures: how many of the 4 encounters the character finishes on their feet,
and how many Hit Dice they have left at the end.
"""
import random

TB11 = 4
LEVEL = 11
BOSS_ACC = 11
BOSS_ATTACKS = 1   # one PC's share of a boss routine in a 4-person party
BOSS_SAVE_DC = 19
ROUNDS_PER_FIGHT = 4


def mod(s):
    return (s - 10) // 2


class Char:
    def __init__(self, name, con_bl=0, ac_bonus=0, extra_dr=0, dr_uses_per_recovery=0,
                 floor_five=False, reroll_ones=False, luck_per_recovery=0,
                 hd_burn_per_fight=0.0, hd_regain_per_repose=0,
                 heal_bonus_per_die=0, cannot_heal_normally=False,
                 survive_per_repose=0, crit_denial_per_repose=0,
                 temp_hp_per_repose=0, temp_hp_double=False,
                 con_save_adv=False, notes=""):
        self.name = name
        self.con = 14 + con_bl + 2 + 4
        self.ac = 16 + 2 + 1 + ac_bonus
        self.maxhp = 10 + 6 * (LEVEL - 1) + mod(self.con) * LEVEL + LEVEL
        self.dr = TB11 + 0
        self.extra_dr = extra_dr
        self.dr_uses_per_recovery = dr_uses_per_recovery
        self.floor_five = floor_five
        self.reroll_ones = reroll_ones
        self.luck_per_recovery = luck_per_recovery
        self.hd_burn = hd_burn_per_fight
        self.hd_regain = hd_regain_per_repose
        self.heal_bonus = heal_bonus_per_die
        self.cannot_heal = cannot_heal_normally
        self.survive_per_repose = survive_per_repose
        self.crit_denial_per_repose = crit_denial_per_repose
        self.temp_hp_per_repose = temp_hp_per_repose * (2 if temp_hp_double else 1)
        self.con_save_adv = con_save_adv
        self.notes = notes

    def save(self, rng):
        r = rng.randint(1, 20)
        if self.con_save_adv:
            r = max(r, rng.randint(1, 20))
        if self.reroll_ones and r == 1:
            r = rng.randint(1, 20)
        if self.floor_five and r <= 4:
            r = 5
        return r + mod(self.con) + TB11


def run_day(c: Char, rng):
    hp = c.maxhp
    temp = 0
    hd = LEVEL
    dr_left = c.dr_uses_per_recovery
    luck_left = c.luck_per_recovery
    cleared = 0

    for fight in range(1, 5):
        survive_left = c.survive_per_repose
        crit_left = c.crit_denial_per_repose
        down = False
        for _rnd in range(ROUNDS_PER_FIGHT):
            for _ in range(BOSS_ATTACKS):
                r = rng.randint(1, 20)
                if luck_left > 0 and r + BOSS_ACC >= c.ac and r != 20:
                    alt = rng.randint(1, 20)
                    if alt < r:
                        r = alt
                    luck_left -= 1
                crit = r == 20
                if crit and crit_left > 0:
                    crit, crit_left = False, crit_left - 1
                if not crit and (r == 1 or r + BOSS_ACC < c.ac):
                    continue
                dmg = sum(rng.randint(1, 10) for _ in range(4 if crit else 2)) + 7
                if dr_left > 0:
                    dmg = max(0, dmg - (c.dr + c.extra_dr)); dr_left -= 1
                else:
                    dmg = max(0, dmg - c.dr)
                absorbed = min(temp, dmg); temp -= absorbed; dmg -= absorbed
                hp -= dmg
                if hp <= 0:
                    if survive_left > 0:
                        survive_left -= 1; hp = 1
                    else:
                        down = True; break
            if down:
                break
            if _rnd % 2 == 1:
                continue
            area = sum(rng.randint(1, 6) for _ in range(6))
            if c.save(rng) >= BOSS_SAVE_DC:
                area //= 2
            absorbed = min(temp, area); temp -= absorbed; area -= absorbed
            hp -= area
            if hp <= 0:
                if survive_left > 0:
                    survive_left -= 1; hp = 1
                else:
                    down = True; break
        if down:
            break
        cleared += 1

        # Hit Dice burned by the bloodline's own engine (Homunculus Core Flame)
        hd = max(0, hd - int(c.hd_burn * ROUNDS_PER_FIGHT))

        if fight == 2:
            # Repose: regain half your Hit Dice, then spend down to heal up
            hd = min(LEVEL, hd + max(1, LEVEL // 2) + c.hd_regain)
            temp += c.temp_hp_per_repose
            dr_left = c.dr_uses_per_recovery
            luck_left = c.luck_per_recovery
        if not c.cannot_heal:
            while hp < c.maxhp and hd > 0:
                hd -= 1
                hp = min(c.maxhp, hp + rng.randint(1, 10) + mod(c.con) + c.heal_bonus)
        else:
            # Tallian: needs a Repair Window (10 min, tool proficiency); one Hit Die
            # per window and the window then ends.
            if hd > 0:
                hd -= 1
                hp = min(c.maxhp, hp + rng.randint(1, 10) + mod(c.con))
    return cleared, hd


CHARS = [
    Char("Edaphite", con_bl=1, notes="Mind over Might 5 + Quick Hands 5"),
    Char("Empyrean", con_bl=0, notes="Soma 4 + Last Step 3 + Lucid Will 3 (rests in half time)"),
    Char("Tammeni", con_bl=1, luck_per_recovery=3,
         notes="Otherworldly Luck 5 + Cold of the Cave 4 + Hermeneutics 1"),
    Char("Pellervi", con_bl=1, floor_five=True, reroll_ones=True, heal_bonus_per_die=4,
         notes="Dependable 6 + Second Breakfast 2 (+CON per die, 3x/Repose) + Hard to Kill 2"),
    Char("Bilupine", con_bl=1, extra_dr=TB11, dr_uses_per_recovery=TB11,
         notes="Monady 5 + Immovable Frame 4 + Mountain Breaker 1"),
    Char("Edonian Giant", con_bl=2, ac_bonus=1,
         notes="Erudite 6 (Defense) + Mountain's Endurance 2 + Cragstep 2"),
    Char("Homunculus", con_bl=3, hd_burn_per_fight=0.75,
         notes="Core Flame Red 5 + Waxflow 3 + Reduced Caloric Outtake ... burns HD to fight"),
    Char("Silent One", con_bl=1, ac_bonus=1,
         notes="Reinforced Hide 4 + Undaunted Weaver 4 + Unnerving Mind 2"),
    Char("Sunborn", con_bl=2,
         notes="Warding chassis 6 (AC 16 unarmoured - no gain in chain mail) + Rugged 2 + Thick Hide 2"),
    Char("Tallian", con_bl=2, ac_bonus=1, crit_denial_per_repose=1,
         cannot_heal_normally=True, temp_hp_per_repose=0,
         notes="House of the Dead 4 + Primeval Plating 3 + Self Sufficiency 1 + 2x1 -- Repair Window"),
    Char("Vaarat", con_bl=0, notes="Dreams of Greatness 4 + Skirmisher's Exit 3 + Tide 2 + Prank 1"),
    Char("Etienn", con_bl=0, survive_per_repose=1,
         notes="Patchwork Persistence 3 + When You Gaze 4 + Swarm's Escape 2 + 1"),
]

if __name__ == "__main__":
    ITERS = 60000
    print("=" * 104)
    print("THE ATTRITION DAY  sword-and-board Warrior L11: 4 encounters, one Repose after the second")
    print("each encounter: 4 rounds. One PC's share of a boss: 1 attack/round at +11 for 2d10+7,\nplus a DC 19 Constitution save for 6d6 on alternate rounds")
    print("=" * 104)
    hdr = (f"{'bloodline':<15}{'CON':>4}{'AC':>4}{'HP':>6}"
           f"{'encounters cleared':>20}{'HD left':>10}{'idx':>7}")
    print(hdr); print("-" * len(hdr))
    rows = []
    for c in CHARS:
        rng = random.Random(7)
        tot_c = tot_hd = 0
        for _ in range(ITERS):
            a, b = run_day(c, rng)
            tot_c += a; tot_hd += b
        rows.append((c, tot_c / ITERS, tot_hd / ITERS))
    med = sorted(r[1] for r in rows)[len(rows) // 2]
    for c, cl, hd in sorted(rows, key=lambda r: -r[1]):
        print(f"{c.name:<15}{c.con:>4}{c.ac:>4}{c.maxhp:>6}{cl:>20.2f}{hd:>10.1f}{100*cl/med:>7.0f}")
    print()
    for c, cl, hd in rows:
        print(f"  {c.name:<15} {c.notes}")
