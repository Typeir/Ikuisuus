"""
Saving throws and the Deed economy.

Save DC in Damocles is 10 + tier bonus + ability modifier, so a level 11 boss
imposes roughly DC 19. The release valve for a save you are not built for is
Grit: spend a Deed, declare before the d20, roll a DIFFERENT attribute + tier
bonus. It is not an auto-success, and once the party pool empties, further
spending is a Misdeed and the Deeds transfer to the Game Director.

So the question a bloodline answers is not "do I pass saves" but "how many
saves do I fail, and how much of the party's Deed pool do I burn covering it".
"""
import random

TB = 4
DC = 19
LEVEL = 11
HIT_DICE = LEVEL
PROFILES = [("proficient, +4 score mod", TB + 4, 8),
            ("no proficiency, +1", 1, 8),
            ("no proficiency, dumped -1", -1, 8)]
TRIALS = 200000


def sim(bonus, n_saves, floor_five=False, reroll_ones=False, adv=False,
        luck=0, hd_pool=0, hd_size=10, hd_cost=2, seed=5):
    """Return (pass rate, mean resources spent) over n_saves per Recovery."""
    rng = random.Random(seed)
    runs = TRIALS // n_saves
    passed = tot_saves = spent = 0
    for _ in range(runs):
        luck_left, hd_left = luck, hd_pool
        for _ in range(n_saves):
            tot_saves += 1
            r = rng.randint(1, 20)
            if adv:
                r = max(r, rng.randint(1, 20))
            if reroll_ones and r == 1:
                r = rng.randint(1, 20)
            if floor_five and r <= 4:
                r = 5
            if r + bonus < DC and luck_left > 0:
                alt = rng.randint(1, 20)
                if alt > r:
                    r = alt
                luck_left -= 1
                spent += 1
            # Hit Dice flame: spend after the roll, only if it can still get there
            if (r + bonus < DC <= r + bonus + hd_size) and hd_left >= hd_cost:
                r += rng.randint(1, hd_size)
                hd_left -= hd_cost
                spent += 1
            passed += (r + bonus >= DC)
    return passed / tot_saves, spent / runs


OPTIONS = [
    ("baseline (no bloodline save help)", dict()),
    ("Pellervi  Dependable + core Lucky", dict(floor_five=True, reroll_ones=True)),
    ("Selenic   Otherworldly Luck (3 pts)", dict(luck=3)),
    ("Bilupine  Monady (advantage, 3 conditions only)", dict(adv=True)),
    ("Homunculus Core Flame Green (2 HD -> 1d10)", dict(hd_pool=HIT_DICE, hd_size=10, hd_cost=2)),
    ("Homunculus Prismatic Wick, golden roll (1 HD -> 1d10)", dict(hd_pool=HIT_DICE, hd_size=10, hd_cost=1)),
]

if __name__ == "__main__":
    print("=" * 100)
    print(f"SAVE RELIABILITY   level {LEVEL}, tier bonus +{TB}, boss DC {DC}, 8 saves per Recovery")
    print("=" * 100)
    hdr = f"{'save help':<52}" + "".join(f"{p[0].split(',')[0][:9]:>13}" for p in PROFILES)
    print(f"{'':<52}{'proficient':>13}{'untrained':>13}{'dumped':>13}")
    print("-" * 91)
    for name, kw in OPTIONS:
        cells = []
        for _, bonus, n in PROFILES:
            rate, _ = sim(bonus, n, **kw)
            cells.append(f"{rate:>12.1%} ")
        print(f"{name:<52}" + "".join(cells))

    print()
    print("The floor is the point. Dependable turns a 1-4 into a 5. Against DC 19 a")
    print("proficient character needs an 11, an untrained one a 14, a dumped one a 16.")
    print("A floor of 5 clears none of those bars, so the most expensive boon on the")
    print("Pellervi list (6 BP) does almost nothing to saving throws. It is a competence")
    print("floor for skill checks, not a combat boon.")
    print()
    print("Where a floor of 5 DOES pay, by required roll:")
    hdr2 = f"{'needed on the d20':>20}{'baseline':>12}{'with floor of 5':>18}{'gain':>10}"
    print(hdr2); print("-" * len(hdr2))
    for need in (2, 3, 4, 5, 8, 11, 14, 16):
        base = (21 - need) / 20
        withf = 1.0 if need <= 5 else (21 - need) / 20
        print(f"{need:>20}{base:>12.1%}{withf:>18.1%}{withf-base:>+10.1%}")

    print()
    print("=" * 100)
    print("THE DEED BILL   expected failed saves per Recovery, and what it costs to cover them")
    print("=" * 100)
    print("24 imposed saves across a Recovery cycle: 8 proficient, 8 untrained, 8 dumped.")
    print("Every failure is a decision: eat it, or spend a Deed and Grit (a fresh d20 +")
    print("tier bonus with a different attribute -- about a 30% conversion at this DC).")
    print()
    hdr3 = f"{'save help':<52}{'failures / Recovery':>21}{'Deeds to halve them':>22}"
    print(hdr3); print("-" * len(hdr3))
    for name, kw in OPTIONS:
        fails = 0.0
        for _, bonus, n in PROFILES:
            rate, _ = sim(bonus, n, **kw)
            fails += n * (1 - rate)
        grit_conv = (21 - (DC - TB)) / 20      # grit: d20 + TB, no ability mod
        deeds = (fails / 2) / max(grit_conv, 0.05)
        print(f"{name:<52}{fails:>21.1f}{deeds:>22.1f}")
    print()
    print("Read the second column as pressure on the party pool. A bloodline that")
    print("removes failures removes Deed spend; a Deed the party does not spend is a")
    print("Deed the Game Director never receives, and the escalation loop never starts.")
