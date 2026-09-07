"""
How much damage is one application of Bleeding worth?

Corpus rule (rules/steel-and-strife/conditions#bleeding):
  At the start of each of the sufferer's turns it takes (counter)d4 damage,
  then the counter decreases by 1. The counter has no upper limit.

So N stacks, left alone, deal N + (N-1) + ... + 1 = N(N+1)/2 dice of d4,
i.e. 1.25 * N * (N+1) expected damage. The condition is QUADRATIC in stacks.
"""

SOURCES = [
    ("Hemorrhaging Masterful Blow (dagger/greataxe/morningstar/dart)", "1d4", 2.5),
    ("Hemorrhaging + Vaarat BLOOD FOR THE BLOOD GOD", "2d4", 5.0),
    ("Anima Warrior - Severing Strike (Con save)", "1 (condition only)", 1.0),
    ("Filigree - Seamline Reprise", "7 flat", 7.0),
    ("Filigree - Seamline Reprise on a critical hit", "14 flat", 14.0),
    ("Filigree + BLOOD FOR THE BLOOD GOD, on a crit", "14 + 2d4", 19.0),
]


def total_damage(stacks: float) -> float:
    """Expected total damage from `stacks`, decaying one per turn, uninterrupted."""
    n = stacks
    return 2.5 * n * (n + 1) / 2


print(f"{'source':<52}{'stacks':>10}{'dice rolled':>14}{'exp. total':>12}{'rounds':>9}")
print("-" * 97)
for label, notation, stacks in SOURCES:
    dice = stacks * (stacks + 1) / 2
    print(f"{label:<52}{notation:>10}{dice:>14.1f}{total_damage(stacks):>12.1f}{stacks:>9.0f}")

print()
print("For reference, a level 11 Warrior's whole 3-attack greataxe turn averages")
print("roughly 60-70 damage against AC 18. One Filigree critical Seamline Reprise")
print("puts out more than that, spread over the following 14 rounds, for one")
print("Masterful Blow charge and no further action spend.")
print()
print("Counter-pressures the corpus already has:")
print("  - Major Action + DC (10 + stacks) Wisdom (Medicine) check reduces by")
print("    Medicine modifier + 1d4")
print("  - any magical healing reduces the counter by the healer's spellcasting")
print("    modifier, minimum 1")
print("  - fights rarely last 14 rounds, so the tail is mostly theoretical against")
print("    a boss and entirely real against a creature that has to keep fighting")
print()
print("Stack-count -> expected damage, if the fight lasts long enough:")
for n in (1, 2, 3, 5, 7, 10, 14, 20):
    print(f"  {n:>3} stacks -> {total_damage(n):>7.1f} damage over {n} rounds")
