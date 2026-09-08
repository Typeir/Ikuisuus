"""
Expected ability scores per tier, four allocation profiles.

INPUTS, all from the corpus
    Standard array          15, 14, 13, 12, 10, 8, assigned freely
                            (optional "Standard Array +2": add +2 to one score)
    Bloodline modifiers     FIXED per bloodline, no floating stats.
                            Typical shape is +2 / +1 / +1, sometimes with a -1.
    Ability Score Improvement   repeatable feat, "+2 to one score, or +1 to two",
                            no maximum stated anywhere in the corpus
    Every other feat        a half-feat: +1 to one of the abilities it lists
    Tier feats              levels 4, 7, 10, 13, 16, 19, 22, 25, 28   (9 total)
    Vocation feats          most vocations 4, 8, 12, 16               (4 total)
                            Warrior 4, 6, 8, 12, 14, 16               (6)
                            Revenant / Tinker / Rogue                 (5)
                            Monk 8, 12, 16                            (3)
    Epic boons              20 and 30; the level-30 one replaces a feat.
                            Not modelled as ability points.

So the baseline character has 13 feats by level 30. A Warrior has 15, a Monk 12.

THE FOUR PROFILES  [CLAUDE] -- these are my archetypes, not corpus categories.
Every number below is a modelling choice; the rules only say "+2 or +1/+1".

    ALL IN        Bloodline chosen so its +2 lands on the primary. Every feat is
                  an Ability Score Improvement, every point into the primary.
                  This is the ceiling, and nothing in the rules forbids it.

    GOOD          Bloodline +2 on the primary. Three feats spent on build pieces
                  whose listed ability is the primary or Constitution (+1 each);
                  the rest ASI, split about 70% primary / 20% Constitution /
                  10% into the weakest save.

    GENERALIST    Bloodline +2 on the primary. Feats split roughly 35% primary,
                  20% Constitution, the remainder spread across the other four.
                  Takes +1/+1 ASIs rather than +2.

    POOR          Bloodline chosen for flavour, so its +2 lands somewhere the
                  character does not use. Build feats bump abilities the build
                  never rolls. Points scattered, dump stat kept at 8.

Modifier assumed to be (score - 10) // 2. [UNVERIFIED] -- I could not find the
rule text for this. If Damocles uses a different curve, every modifier column
here is wrong and the score columns are still right.
"""

TIER_FEATS = [4, 7, 10, 13, 16, 19, 22, 25, 28]
VOCATION_FEATS = [4, 8, 12, 16]          # the common case
CHECKPOINTS = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28]

STATS = ["PRI", "SEC", "CON", "d", "e", "f"]


def tb(level):
    return 1 + (level - 1) // 3


def feats_by(level):
    return sum(1 for f in TIER_FEATS + VOCATION_FEATS if f <= level)


def mod(score):
    return (score - 10) // 2


# base = standard array + a typical +2/+1/+1 bloodline
BASE = {
    "all_in":     dict(zip(STATS, [17, 14, 14, 12, 10, 8])),
    "good":       dict(zip(STATS, [17, 14, 14, 12, 10, 8])),
    "generalist": dict(zip(STATS, [17, 14, 14, 12, 10, 8])),
    # bloodline bonus lands off-primary: +2 on d, +1 on e, +1 on f
    "poor":       dict(zip(STATS, [15, 14, 13, 14, 11, 9])),
}

# how each profile spends its feat points. 2 points per feat (an ASI is +2, and
# a half-feat is +1 -- profiles that take build feats therefore convert fewer).
WEIGHTS = {
    "all_in":     {"PRI": 1.00, "SEC": 0.00, "CON": 0.00, "d": 0.00, "e": 0.00, "f": 0.00},
    "good":       {"PRI": 0.70, "SEC": 0.00, "CON": 0.20, "d": 0.10, "e": 0.00, "f": 0.00},
    "generalist": {"PRI": 0.35, "SEC": 0.15, "CON": 0.20, "d": 0.15, "e": 0.10, "f": 0.05},
    "poor":       {"PRI": 0.35, "SEC": 0.15, "CON": 0.10, "d": 0.20, "e": 0.15, "f": 0.05},
}

# points actually banked per feat: ASI gives 2, a build half-feat gives 1
POINTS_PER_FEAT = {"all_in": 2.0, "good": 1.85, "generalist": 1.7, "poor": 1.4}


def scores(profile, level):
    n = feats_by(level)
    pool = n * POINTS_PER_FEAT[profile]
    out = {}
    for s in STATS:
        gain = pool * WEIGHTS[profile][s]
        out[s] = BASE[profile][s] + int(round(gain / 2) * 2)   # scores move in 2s
    return out


LABEL = {"all_in": "ALL IN", "good": "GOOD", "generalist": "GENERALIST", "poor": "POOR"}

if __name__ == "__main__":
    print("=" * 96)
    print("EXPECTED ABILITY SCORES PER TIER")
    print("PRI = the attack/casting stat. SEC = the second-most-used. d/e/f = the rest.")
    print("=" * 96)
    for p in ("all_in", "good", "generalist", "poor"):
        print()
        print(f"--- {LABEL[p]} " + "-" * (88 - len(LABEL[p])))
        hdr = (f"{'TB':>3}{'lvl':>5}{'feats':>7}   " + "".join(f"{s:>6}" for s in STATS)
               + f"{'PRI mod':>10}{'accuracy':>10}")
        print(hdr); print("-" * len(hdr))
        for lv in CHECKPOINTS:
            sc = scores(p, lv)
            t = tb(lv)
            row = "".join(f"{sc[s]:>6}" for s in STATS)
            print(f"{t:>3}{lv:>5}{feats_by(lv):>7}   {row}"
                  f"{mod(sc['PRI']):>+10}{t + mod(sc['PRI']):>+10}")

    print()
    print("=" * 96)
    print("THE SPREAD   primary modifier, and what it does to an attack roll")
    print("=" * 96)
    hdr = (f"{'TB':>3}{'lvl':>5}" + "".join(f"{LABEL[p]:>13}" for p in
           ("all_in", "good", "generalist", "poor")) + f"{'gap':>7}")
    print(hdr); print("-" * len(hdr))
    for lv in CHECKPOINTS:
        vals = [mod(scores(p, lv)["PRI"]) for p in ("all_in", "good", "generalist", "poor")]
        print(f"{tb(lv):>3}{lv:>5}" + "".join(f"{v:>+13}" for v in vals)
              + f"{vals[0]-vals[3]:>7}")
    print()
    print("Accuracy is tier bonus + this modifier. The band centre is 10 + 2 x TB.")
    print()
    hdr = (f"{'TB':>3}{'lvl':>5}{'band centre':>13}{'band top':>10}   "
           + "".join(f"{LABEL[p]:>13}" for p in ("all_in", "good", "generalist", "poor")))
    print(hdr); print("-" * len(hdr))
    for lv in CHECKPOINTS:
        t = tb(lv)
        c, top = 10 + 2 * t, 15 + 2 * t
        cells = []
        for p in ("all_in", "good", "generalist", "poor"):
            acc = t + mod(scores(p, lv)["PRI"])
            need = top - acc
            cells.append(f"{max(2, min(20, need))}+ vs top")
        print(f"{t:>3}{lv:>5}{c:>13}{top:>10}   " + "".join(f"{x:>13}" for x in cells))
    print()
    print("=" * 96)
    print("CONSTITUTION, which is the other half of any defensive maths")
    print("=" * 96)
    hdr = f"{'TB':>3}{'lvl':>5}" + "".join(f"{LABEL[p]:>13}" for p in
          ("all_in", "good", "generalist", "poor"))
    print(hdr); print("-" * len(hdr))
    for lv in CHECKPOINTS:
        vals = [mod(scores(p, lv)["CON"]) for p in ("all_in", "good", "generalist", "poor")]
        print(f"{tb(lv):>3}{lv:>5}" + "".join(f"{v:>+13}" for v in vals))
    print()
    print("Constitution is added to every Hit Die spent, so it prices the whole")
    print("healing economy as well as Constitution saves.")
    print()
    print("=" * 96)
    print("DEXTERITY-BASED ARMOUR CLASS, for the profiles that would use it")
    print("=" * 96)
    print("Light armour is 11-12 + Dex, UNCAPPED. Medium caps Dex at +2. Heavy has none.")
    print("Best mundane heavy: Plate 18 + Greatshield 3 = 21, flat, forever.")
    print()
    hdr = (f"{'TB':>3}{'lvl':>5}{'band centre':>13}{'gambeson 12+Dex, all-in Dex':>30}"
           f"{'medium (cap +2)':>18}{'plate + greatshield':>21}")
    print(hdr); print("-" * len(hdr))
    for lv in CHECKPOINTS:
        t = tb(lv)
        dexmod = mod(scores("all_in", lv)["PRI"])      # a Dex primary, all in
        print(f"{t:>3}{lv:>5}{10+2*t:>13}{12+dexmod:>30}{17:>18}{21:>21}")
    print()
    print("[CLAUDE] This is the shape I would put in front of the Poise conversation:")
    print("three different armour-class curves -- one flat at 21, one capped at 17, one")
    print("riding an uncapped stat -- against one band that scales with tier bonus, and")
    print("an accuracy line that scales with the same uncapped stat as the light-armour")
    print("curve does.")
