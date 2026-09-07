"""
Archetype A: two-handed greataxe Warrior (Champion).

Held constant across every bloodline:
  base array 15/14/13/12/10/8 (STR/CON/DEX/WIS/INT/CHA)
  L1 Fighting Style: Great Weapon Fighting (granted, no ASI)
  L5  feats: Great Weapon Master (+1 STR), ASI (+2 STR)      -> 2 attacks
  L11 feats: Great Weapon Master (+1 STR), Power Attacker (+1 STR), 4x ASI (+8 STR) -> 3 attacks
  weapon: greataxe, Warrior Weapon Mastery spent on it (3 Masterful Blows / Repose)
  Champion: crit on 19-20

Two scenarios:
  MEDIUM  - everyone swings a Medium greataxe (1d12). Isolates stats + boons.
  LARGE   - a Large greataxe (2d12) is available. Large creatures swing it with no
            penalty; Medium creatures may swing it too (corpus: STR 18+ can wield a
            weapon one size larger) but at disadvantage.
"""
from engine import Build, Weapon, mean_damage, TB

BASE_STR = 15


def mod(score):
    return (score - 10) // 2


def greataxe(size_mult=1, bonus_acc=0, bonus_dmg=0):
    return Weapon("greataxe", 1, 12, size_mult=size_mult, mastery="cleave",
                  bonus_acc=bonus_acc, bonus_dmg=bonus_dmg, gwf=True)


# name, STR from bloodline, free Large?, 10 BP spend, kwargs
BLOODLINES = [
    ("Edaphite",      1, False, "Quick Hands 5 + Mind over Might 5", {}),
    ("Empyrean",      0, False, "Heavenpiercing Aim 5 + Masterful Swordplay 4 + Machinator 1",
     dict(crit_shift=1, flat_acc=1, bonus_dmg=1)),
    ("Tammeni",       1, False, "Heir of Great Sampsa 6 + Kinetic Leverage 3 + Hermeneutics 1",
     dict(topple_every_hit=True)),
    ("Pellervi",      0, False, "Dependable 6 + Hard to Kill 2 + Second Breakfast 2",
     dict(floor_five=True, reroll_ones=True)),
    ("Bilupine",      1, True,  "Monady 5 + Immovable Frame 4 + Mountain Breaker 1", {}),
    ("Edonian Giant", 2, True,  "Erudite (2nd fighting style) 6 + Boon of the Land Spirits 4",
     dict(per_turn_dice=[(1, 4)], first_turn_acc_die=4)),
    ("Homunculus",    0, False, "Core Flame Red 5 + Waxflow 3 + Chromatic Refinement 2",
     dict(hd_mode="red", hd_pool=99, hd_size=10, hd_reroll_low=True)),
    ("Silent One",    1, True,  "Large Frame 3 + Reinforced Hide 4 + Blades 3", {}),
    ("Sunborn",       2, True,  "Charging chassis 5 + Enormity 4 + Natural Athlete 1",
     dict(charge=True)),
    ("Tallian",       2, True,  "Trade Guilds 4 (+2 STR) + Disambiguator 4 + 2x 1 BP", {}),
    ("Vaarat",        0, "half", "BLOOD FOR THE BLOOD GOD 5 + Dreams of Greatness 4 + Prank 1",
     dict(adv_vs_bleeding=True, bleed_bonus_stacks=True, masterful_bleed=True)),
    ("Etienn",       -1, False, "Unfathomable Dread 5 + Skin Deep 4 + Unravelling Dread 1", {}),
]


def make(name, sb, kw, level, size_mult, oversized_disadv):
    if level == 5:
        score = BASE_STR + sb + 1 + 2
        attacks = 2
    elif level == 11:
        score = BASE_STR + sb + 1 + 1 + 8
        attacks = 3
    else:  # level 20: 6 vocation feats + 6 tier feats
        score = BASE_STR + sb + 1 + 1 + 16
        attacks = 4
    b = Build(
        label=f"{name} L{level}", bloodline=name, level=level,
        ability_mod=mod(score),
        weapon=greataxe(size_mult, kw.get("flat_acc", 0), kw.get("bonus_dmg", 0)),
        attacks=attacks,
        crit_on=(18 if level >= 15 else 19) - kw.get("crit_shift", 0),
        flat_dmg=TB(level),                      # Great Weapon Master: Grand Blows
        per_turn_dice=kw.get("per_turn_dice", []),
        topple_every_hit=kw.get("topple_every_hit", False),
        adv_vs_bleeding=kw.get("adv_vs_bleeding", False),
        bleed_bonus_stacks=kw.get("bleed_bonus_stacks", False),
        masterful_bleed=kw.get("masterful_bleed", False),
        first_turn_acc_die=kw.get("first_turn_acc_die", 0),
        hd_mode=kw.get("hd_mode"), hd_pool=kw.get("hd_pool", 0),
        hd_size=kw.get("hd_size", 10), hd_reroll_low=kw.get("hd_reroll_low", False),
        floor_five=kw.get("floor_five", False), reroll_ones=kw.get("reroll_ones", False),
        charge_bonus=TB(level) if kw.get("charge") else 0,
        oversized_disadv=oversized_disadv,
    )
    b.str_score = score
    return b


def score_bloodline(name, sb, large, kw, level, acs, con_save, scenario):
    """Returns (list of mean damage per AC, size label)."""
    def run(sm, od):
        return [mean_damage(make(name, sb, kw, level, sm, od), ac, con_save) for ac in acs]

    if scenario == "MEDIUM":
        return run(1, False), "Med"
    # LARGE scenario
    if large is True:
        return run(2, False), "Large"
    if large == "half":
        med = run(1, False)              # Small/Medium repose: medium weapon
        big = run(2, False)              # Medium repose + Dreams of Greatness -> Large
        return [0.5 * a + 0.5 * b for a, b in zip(med, big)], "M/L"
    # Medium creature, oversized weapon at disadvantage; take the better option
    flat = run(1, False)
    over = run(2, True)
    best = [max(a, b) for a, b in zip(flat, over)]
    picked = "Med+" if sum(over) > sum(flat) else "Med"
    return best, picked


def ac_band(level):
    """Damocles AC band: 10 + 2*TB, plus or minus 5."""
    c = 10 + 2 * TB(level)
    return [c - 5, c, c + 5]


if __name__ == "__main__":
    for scenario in ("MEDIUM", "LARGE"):
        for level in (5, 11, 20):
            ACS = ac_band(level)
            con_save = {5: 4, 11: 7, 20: 11}[level]
            print(f"\n{'='*96}")
            title = ("Medium weapons only" if scenario == "MEDIUM"
                     else "Large greataxe available (Medium creatures swing it at disadvantage)")
            print(f"ARCHETYPE A  two-handed greataxe Warrior (Champion), L{level}, 4-round fight")
            print(f"target AC band 10+2xTB+-5 -> {ACS}")
            print(f"scenario: {title}")
            print("="*96)
            hdr = f"{'bloodline':<15}{'STR':>4}{'mod':>5}{'wpn':>7}" + "".join(f"{'AC'+str(a):>9}" for a in ACS) + f"{'mean':>9}{'idx':>7}"
            print(hdr); print("-"*len(hdr))
            rows = []
            for (name, sb, large, spend, kw) in BLOODLINES:
                vals, sz = score_bloodline(name, sb, large, kw, level, ACS, con_save, scenario)
                b = make(name, sb, kw, level, 1, False)
                rows.append((name, b.str_score, b.ability_mod, sz, vals, sum(vals)/len(vals)))
            med = sorted(r[5] for r in rows)[len(rows)//2]
            for r in sorted(rows, key=lambda x: -x[5]):
                print(f"{r[0]:<15}{r[1]:>4}{r[2]:>+5}{r[3]:>7}" +
                      "".join(f"{v:>9.1f}" for v in r[4]) + f"{r[5]:>9.1f}{100*r[5]/med:>7.0f}")
