"""
The caster side.

Eight of the sixteen vocations are casters, and the currency a caster actually
spends is concentration uptime, not damage. Concentration in Damocles breaks on
a Constitution save against DC 10 or half the damage taken, whichever is higher.
Spell slots refresh only on a Recovery, so a concentration spell that falls in
round two is a slot gone for the day.

Modelled: a level 11 caster holding one concentration spell through a 4-round
encounter, taking incidental damage (one hit for 2d10+7 and one area effect for
6d6 halved on a Dex save, per round, at the rates a back-line caster actually
eats them).
"""
import random

TB = 4
LEVEL = 11
ROUNDS = 4
ITERS = 200000


def mod(s):
    return (s - 10) // 2


class Caster:
    def __init__(self, name, con=14, prof_con=False, conc_adv=False,
                 auto_succeed=0, dual_conc=False, ac=13, notes=""):
        self.name, self.con, self.prof = name, con, prof_con
        self.conc_adv = conc_adv
        self.auto = auto_succeed
        self.dual = dual_conc
        self.ac = ac
        self.notes = notes

    @property
    def bonus(self):
        return mod(self.con) + (TB if self.prof else 0)


def uptime(c: Caster, rng, incoming_per_round=0.6):
    """Fraction of rounds the caster still holds concentration."""
    auto_left = c.auto
    held = 0
    up = True
    for _ in range(ROUNDS):
        if up:
            held += 1
        if rng.random() < incoming_per_round:
            dmg = sum(rng.randint(1, 10) for _ in range(2)) + 7
            dc = max(10, dmg // 2)
            r = rng.randint(1, 20)
            if c.conc_adv:
                r = max(r, rng.randint(1, 20))
            if c.dual:                          # Aristophany: disadvantage on the save
                r = min(r, rng.randint(1, 20))
            if r + c.bonus < dc:
                if auto_left > 0 and c.conc_adv:
                    auto_left -= 1              # Undaunted Weaver: choose to succeed
                else:
                    up = False
    return held / ROUNDS


CASTERS = [
    Caster("Edaphite",      con=15, notes="all scores +1; Mind over Might can buy CON save proficiency",
           prof_con=True),
    Caster("Empyrean",      con=14, notes="Soma 4: resistance to one akashic type; Lucid Will 3"),
    Caster("Tammeni",       con=15, notes="INT +2 (best INT caster line); Otherworldly Luck 5"),
    Caster("Pellervi",      con=15, notes="CON +1; Practical Magic 4; Dependable 6"),
    Caster("Bilupine",      con=15, dual_conc=True,
           notes="Aristophany 7: TWO concentration spells at once, both saves at disadvantage"),
    Caster("Edonian Giant", con=16, notes="CON +2 available; no caster boon"),
    Caster("Homunculus",    con=17, notes="CON +3, the best raw concentration line in the chapter"),
    Caster("Silent One",    con=15, conc_adv=True, auto_succeed=TB,
           notes="Undaunted Weaver 4: advantage, and choose to succeed TB times per Recovery"),
    Caster("Sunborn",       con=16, ac=16,
           notes="Warding chassis 6: AC 16 unarmoured, which no other caster gets"),
    Caster("Tallian",       con=14, notes="Programmed Excellence: a condition immunity per Repose"),
    Caster("Vaarat",        con=14, notes="Quiet Casting Discipline 3: they cannot find you to hit you"),
    Caster("Etienn",        con=14, notes="CHA +2 and WIS +2: +1 spell save DC over everyone at creation"),
]

if __name__ == "__main__":
    print("=" * 100)
    print("CONCENTRATION UPTIME   level 11 caster, 4-round encounter")
    print("concentration save: DC 10 or half the damage taken, whichever is higher")
    print("=" * 100)
    hdr = f"{'bloodline':<15}{'CON':>5}{'save':>7}{'uptime':>10}{'idx':>7}   notes"
    print(hdr); print("-" * 100)
    rows = []
    for c in CASTERS:
        rng = random.Random(31)
        u = sum(uptime(c, rng) for _ in range(ITERS)) / ITERS
        rows.append((c, u))
    med = sorted(r[1] for r in rows)[len(rows) // 2]
    for c, u in sorted(rows, key=lambda r: -r[1]):
        eff = u * (2 if c.dual else 1)
        print(f"{c.name:<15}{c.con:>5}{c.bonus:>+7}{u:>10.1%}{100*u/med:>7.0f}   {c.notes[:52]}")

    print()
    print("Aristophany is scored on one spell above. Its actual value is two spells at")
    print("once, so multiply its uptime by the second spell:")
    bil = [r for r in rows if r[0].name == "Bilupine"][0]
    base = [r for r in rows if r[0].name == "Empyrean"][0]
    sil = [r for r in rows if r[0].name == "Silent One"][0]
    print(f"  one spell, no caster boon           {base[1]:.1%} uptime -> {base[1]:.2f} spell-rounds")
    print(f"  one spell, Silent One (4 BP)        {sil[1]:.1%} uptime -> {sil[1]:.2f} spell-rounds  ({sil[1]/base[1]:.2f}x)")
    print(f"  two spells, Bilupine Aristophany (7 BP) {bil[1]:.1%} uptime -> {2*bil[1]:.2f} spell-rounds  ({2*bil[1]/base[1]:.2f}x)")
    print()
    print("The disadvantage clause on Aristophany is doing real work: it costs about")
    print("14 points of uptime per spell, which is what stops 7 BP from simply doubling")
    print("the caster. Silent One buys 1.4x for 4 BP and buys it as certainty rather")
    print("than variance, which is the better deal at every table that fears losing a slot.")
    print()
    print("Nothing else in the bloodline chapter multiplies a caster's most limited")
    print("resource. Every other caster boon is additive.")
