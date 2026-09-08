# Damocles — mechanical brief for math work

Handoff document. Everything here is read from the corpus at
`ikuisuus/src/content/en/` unless a line is marked otherwise.

**Marking convention, and please respect it:**

- Unmarked = corpus text or a direct paraphrase of it.
- **[AUTHOR]** = David stated it in conversation; it is his ruling but is **not
  in the corpus yet**. Do not write it into anything downstream as though it were
  published.
- **[CLAUDE]** = my inference, measurement, or judgement. Not a rule. Do not
  execute against the corpus.
- **[UNVERIFIED]** = I believe this but did not find the rule text.

**The topic this brief exists for: Poise.** Dodge, Deflect and Poise are in
design and are deliberately excluded from everything below. The point of this
document is to describe the defensive maths *as it currently stands* so the Poise
conversation has a baseline. Do not model Poise from anything here — ask David.

---

## 1. Core resolution

- d20. Roll + ability modifier + tier bonus (if proficient) + other modifiers vs
  target's Armour Class. Equal or exceed = hit.
- **Natural 20** always hits and is a critical: doubles **all rolled dice** for
  that attack's damage. **Natural 1** always misses.
- Static damage bonuses are **not** doubled on a crit unless the granting feature
  says so.
- Ability modifier by attack type: melee → Strength; ranged → Dexterity; finesse
  or thrown → either; spell attacks → the spellcasting ability. Monsters use
  whatever their statblock says.
- [UNVERIFIED] modifier = (score − 10) ÷ 2, rounded down. I never located the
  rule text. Confirm before relying on it.

### Levels and Tier Bonus

Levels run **1–30**. Tier Bonus starts at **+1** and rises **+1 every 3 levels**:

| level | 1–3 | 4–6 | 7–9 | 10–12 | 13–15 | 16–18 | 19–21 | 22–24 | 25–27 | 28–30 |
|---|---|---|---|---|---|---|---|---|---|---|
| TB | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 |

### Ability scores are uncapped

There is no ceiling rule anywhere in the corpus. **Ability Score Improvement** is
a repeatable feat: "increase one ability score by 2, or two ability scores by 1
each," with no maximum. Local caps exist on specific features (e.g. Revenant's
Funeral Apex says "to a maximum of 24") but they are local.

This matters more than anything else in this document. See §7.

---

## 2. Action economy

**"Two actions, one reaction."** Two **Action Points** per turn, refreshed at the
start of your turn. The pool is explicitly **unbounded** and can grow or shrink
from features.

- **One Major Action per turn maximum**, unless a feature says otherwise.
- A Major Action costs 1 AP *and* consumes your Major Action for the turn.
- A Minor Action costs 1 AP and does not.
- So the default turn is one Major + one Minor, or two Minors.
- Attack, Cast, Dash, Disengage etc. are Major Actions.
- Movement is separate from Action Points: move up to your speed, breakable
  around actions.
- Dropping prone costs 1 stride of movement. Becoming **steady** costs all but
  1 stride of speed.
- One free object interaction per turn; a second costs a Minor Action.

Distances are in **strides**. Typical humanoid walk speed is **5–7 strides**.

### Space by size

| Tiny | Small | Medium | Large | Huge | Gargantuan | Colossal |
|---|---|---|---|---|---|---|
| ½ stride | 1 | 1 | 2 | 3 | 4 | 6 |

---

## 3. Armour Class — the part that matters for Poise

**AC does not scale with Tier Bonus.** It is a flat armour value plus, in some
categories, Dexterity.

| Light | AC | | Medium | AC | | Heavy | AC |
|---|---|---|---|---|---|---|---|
| Padded | 11 + Dex | | Hide | 12 + Dex (max 2) | | Ring Mail | 14 |
| Leather | 11 + Dex | | Chain Shirt | 13 + Dex (max 2) | | Chain Mail | 16 |
| Gambeson | 12 + Dex | | Scale Mail | 14 + Dex (max 2) | | Splint | 17 |
| | | | Breastplate | 14 + Dex (max 2) | | Plate | 18 |
| | | | Halfplate | 15 + Dex (max 2) | | | |

Shields: Buckler +1 (melee only, requires a reaction, −1 damage penalty while
benefiting); Shield +2; Greatshield +3 (disadvantage on Dex saves, speed −1
stride; as a Minor Action, plant it for three-quarters cover and lose the
penalties).

**Light armour's Dex is uncapped. Medium caps at +2. Heavy has none.**

Cover: half = **+2 AC and Dex saves**; three-quarters = **+5**; total = cannot be
targeted directly.

Wearing armour without proficiency: disadvantage on all Str/Dex checks, saves and
attack rolls, and you cannot cast.

### The AC band

**[AUTHOR]** design target, stated as current guidance and explicitly
pre-Dodge/Deflect/Poise: **AC ≈ 10 + 2 × TB, ± 5.**

| level | TB | band centre | band |
|---|---|---|---|
| 5 | 2 | 14 | 9–19 |
| 11 | 4 | 18 | 13–23 |
| 20 | 7 | 24 | 19–29 |
| 30 | 10 | 30 | 25–35 |

**[CLAUDE] The tension, stated as plainly as I can:** the band scales with TB;
player AC does not. Best mundane heavy AC is Plate 18 + Greatshield 3 = **21**,
frozen from the moment you can afford it. A light-armour character rides uncapped
Dex, so their AC *does* scale — 12 + Dex, which at a level-30 Dex build could be
26+. Medium sits between, capped at 17.

So the band describes monsters, and player AC either sits at a constant 18–21 or
scales entirely off one uncapped stat. That divergence is, I assume, the thing
Poise exists to address — but I have not modelled Poise and am not guessing at it.

---

## 4. Damage and dice

### The dice sequence

`1d4 → 1d6 → 1d8 → 1d10 → 1d12 → 2d8 → 2d10 → 2d12 → 4d8 → …`

After d12 the sequence **adds dice** rather than growing the die, to limit
variance. Effects that "advance a dice level" step along this sequence.

### Size multiplies the number of dice

| Small and smaller | Medium | Large | Huge | Gargantuan | Colossal | Titanic |
|---|---|---|---|---|---|---|
| ×1 | ×1 | ×2 | ×3 | ×4 | ×5 | ×6 |

- Weapons default to **Medium**. A weapon built for a creature smaller than
  Medium rolls the Medium dice — "lighter and shorter, not weaker."
- **Order of operations, stated in the corpus: quality first, then size.**
- STR 18 required to wield a weapon **one size larger** than you; you do so at
  **disadvantage**.
- Weapons **more than one size larger** require two hands regardless of type.
- Cannot wield more than **two sizes larger** unless a trait explicitly allows it.

### Bonus taxonomy

Three standard terms. Flat formulas (base AC, ability-mod damage, TB proficiency)
are **not** modifiers of this kind — they are part of the roll.

- **Accuracy bonus / penalty** — attack rolls. Can be scoped.
- **Damage bonus / penalty** — damage rolls. Static; **not doubled on a crit**
  unless stated.
- **Damage reduction** — subtracted from incoming damage before resistance or
  vulnerability. **Multiple sources add together.** Cannot go below 0 unless
  stated.

Resistance halves, vulnerability doubles, both applied **after** damage
reduction. Multiple instances of the same do not stack. **True damage** cannot be
resisted, reduced or avoided by anything.

### Mastery

Every weapon has a Mastery property. Characters who qualify perform **Masterful
Blows**: **1 per Repose**, **3 per Repose with mastery**, and one per target per
turn.

---

## 5. The rest and attrition economy

Three tiers. This is where most of the system's real constraints live.

| | duration | what it does |
|---|---|---|
| **Respite** | 30–60 min | Sustenance; refresh Respite-recharge features |
| **Repose** | 8 hours | Sustenance; **spend** Hit Dice to heal; refresh Repose-recharge features; −1 exhaustion |
| **Recovery** | **10 uninterrupted days** | All HP back; **recover half your total Hit Dice**; clear all exhaustion; restore spell slots and Recovery-recharge features |

**Critical: a Repose lets you SPEND Hit Dice, never regain them.** Hit Dice come
back only on a Recovery, at half your total. Spell slots refresh only on Recovery.

A Recovery interrupted by strenuous combat, levelled spellcasting or spending
Recovery-refreshed resources loses **half its progress, minimum two days**.

### Hit Dice

- Pool size = character level. **Die size comes from the vocation you took each
  level in**: Wizard d6, Bard d8, Warrior d10, Revenant d12, Berserker d12.
- A mixed character holds a mixed pool and chooses which die to spend.
- Spending: roll the die, add Constitution modifier, regain that many HP.
- Hit Dice are **the only non-magical healing in the system**.
- They are also the **only** way to reduce **Grievous Wounds** — lasting max-HP
  reductions that magic cannot touch.

### Meals

- **Standard** — nothing.
- **Hearty** — removes 1 level of exhaustion.
- **Lavish** — **restores a single spent Hit Die of the character's choosing.**
- Both Hearty and Lavish count as "Fulfilling meals" for features that check.
- **[AUTHOR]** Lavish Meals require produce. The rules do not currently state
  this clearly, and **there is no economy in Damocles yet**, so there is no price
  and none should be invented. Treat Lavish Meal availability as a **campaign
  parameter**, not a constant.
- **Chef** feat: as Sustenance during a Respite *or* a Repose, prepare Lavish
  Meals in portions equal to your Tier Bonus, once per Repose. Also makes TB
  "Bolstering Treats" granting TB temporary HP, once per Repose per creature.

Silent Ones and Bilupines have unusual Sustenance requirements and gain nothing
from meals not accommodated to them.

### Encounter budget

**[AUTHOR]:** roughly **8 encounters per Recovery**; at least **2 medium
encounters per Repose**; **3 of the 8 are usually deadly**, and **one of those is
deadly+++**.

**[CLAUDE]** that implies ~4 Reposes per Recovery. I used 3 rounds per encounter
as a working figure; it is an assumption, not a rule.

---

## 6. Deeds, Grit and Misdeeds

- The **party** holds a Deed pool. **[AUTHOR]** pool size = lowest TB in the party
  + number of party members (so 8 for a level-11 party of four).
- The GM awards +1 Deed for exceptional roleplay.
- **Grit:** spend 1 Deed, **declared before the d20**, and roll a **different
  attribute + TB** instead. It is not auto-success, and the Deed is spent whether
  the roll succeeds or fails.
- Overspending produces a **Misdeed**, and the GM gains it.

---

## 7. Feats

**Every feat is a half-feat** — each carries "+1 to a listed ability score" and
names which abilities are eligible.

- **Tier feats** at levels **4, 7, 10, 13, 16, 19, 22, 25, 28** — one per TB step.
- **Vocation feats** additionally, at vocation-specific levels (Revenant 4, 8, 12,
  16, 19; Druid 4, 8, 12, 16).
- **Epic boon** at 20; a second at 30 in place of a feat.
- **[CLAUDE]** roughly **14 feats by level 30** for a Revenant, so a
  single-stat build can convert ~11 of them into Ability Score Improvements.

### The consequence, which is the central scaling fact

**[CLAUDE], and this is the observation I would most want checked:**

- **Accuracy scales additively**: TB + ability modifier. TB gains +1 per 3 levels;
  the modifier gains +1 per +2 score.
- **Ability scores gain +2 per feat**, and feats arrive faster than 1 per 3
  levels near the top of the table.
- **Damage scales multiplicatively**: dice count × weapon size × dice level, with
  size alone doubling or tripling.
- **AC is flat** (§3) except through uncapped Dex on light armour.

A single-stat build starting at 17 reaches roughly a **+14 modifier by level 30**,
so accuracy is around **+24** against a static heavy AC of 18–21. Any additive
defensive answer has to grow at that rate to stay relevant.

---

## 8. Corpus monster data

Parsed from 123 statblocks in `.meta/en/monsters/*.metadata.json`; 97 have a
usable CR + AC + HP. Grouped by the Tier Bonus each statblock carries.

| TB | n | HP median | HP max | AC median | AC max | band centre (10+2·TB) |
|---|---|---|---|---|---|---|
| 1 | 14 | 37 | 78 | 14 | 19 | 12 |
| 2 | 14 | 76 | 178 | 13 | 19 | 14 |
| 3 | 23 | 125 | 850 | 17 | 23 | 16 |
| 4 | 14 | 170 | 235 | 17 | 35 | 18 |
| 5 | 8 | 267 | 500 | 18 | 24 | 20 |
| 6 | 4 | 262 | 292 | 20 | 22 | 22 |
| 7 | 1 | 455 | 455 | 22 | 22 | 24 |
| 8 | 11 | 352 | 780 | 21 | 26 | 26 |
| 10 | 5 | 680 | 999 | 24 | 28 | 30 |
| 11 | 2 | 850 | 1020 | 24 | 28 | 32 |
| 12 | 1 | 1640 | 1640 | 35 | 35 | 34 |

Also at TB 4: Constitution save median **+7**, best save median **+10**.

**[CLAUDE] observation:** authored monsters track the band within ±2 up to TB 7,
then fall below it — TB 8 is 5 under, TB 10 is 6 under, TB 11 is 8 under. Whether
that drift is deliberate is an open question David has not answered.

The parsed data is in `monsters.json` (fields: `name, cr, tb, ac, hp, saves,
scores, size`).

---

## 9. Conditions relevant to damage math

**Bleeding.** At the start of the sufferer's turn they take **(counter)d4**, then
the counter drops by 1.

- **[CLAUDE]** N stacks left to run deal 1.25·N·(N+1) total — quadratic.
- **Stanching:** a Major Action, DC 10 + current stacks, Wisdom (Medicine).
- Any magical healing reduces the counter by the healer's spellcasting modifier.
- **[CLAUDE]** stanching gets *harder* as stacks rise but removes more when it
  lands; magical healing removes a flat amount regardless of counter size. So at
  high stacks the stanch check carries the entire brake.

**Prone.** Standing costs 1 stride of movement.

Other conditions in `rules/steel-and-strife/conditions.rule.mdx` — I did not
survey them systematically.

---

## 10. Character construction

- **12 bloodlines.** Each has **fixed** ability score modifiers (no floating
  stats), core features, and a menu of **Boons**.
- **10 Boon Points**, spent **once at character creation**, never refunded.
- Some bloodlines choose a size at creation (Bilupine: Medium or Large; a Large
  creature uses Large weapons without disadvantage and Huge at disadvantage).
- Vocations, each with specializations; mixing gives you the mixed vocation's
  **real Hit Die** and its level-1 features. Spell slot progression for mixed
  characters is in `rules/arcana-and-the-fold/mixing-spellcasting`.

---

## 11. Things I got wrong in a previous pass — do not repeat them

**[CLAUDE]** listed so the next agent does not rebuild the same errors.

1. **Modelling allies as a flat damage constant.** Any effect that helps the
   party rather than the character is then invisible *by construction*. Model
   allies as attack rolls.
2. **Refilling Hit Dice on a Repose.** They refill on a **Recovery**, at half
   your total.
3. **Measuring damage against unbounded HP.** Overkill and unrealised
   damage-over-time both inflate. Use bounded HP with the PC inside a party.
4. **Ignoring uptime.** A zone effect's magnitude is not its value; a
   2-stride-radius circle that repositions 2 strides per Minor Action cannot
   chase a 5–7-stride creature. **[AUTHOR]** observed uptime in play: one
   placement and two benefiting rolls across ten rounds.
5. **Treating silence in the text as zero.** Unstated refill rates and unstated
   costs both got filled in as "none," in opposite directions.
6. **Reading an escalating restriction as lapsing.** If a rule imposes a cost at
   one step and does not restate it at a larger step, the cost carries. Do not
   build findings on the absence of a restatement.
7. **Party HP quantisation.** Against a party of four, encounter HP totals round
   rounds-to-clear into a small number of integers and hide real differences.
   Measure solo as well.

---

## 12. Open questions David has not ruled on

Do **not** resolve these; they are his.

1. Whether the TB 8+ AC drift below the band is deliberate.
2. Whether Colossal Weaponmaster's advantage clause permits a per-attack choice
   between discarding advantage for +2/+2 and letting it cancel disadvantage.
3. Whether Lunar Blessing's Drain and Strengthen share one Tier-Bonus pool or
   hold one each.
4. Whether Ghastly Aim's total → three-quarters conversion stacks with
   Sharpshooter's one-step cover reduction.
5. Whether Power Attacker and the Tammeni boon "Through the Branches" — identical
   −5 accuracy / +10 damage — are intended to stack.

---

## 13. Working files

In `/home/claude/dmx/`, all delivered as attachments:

`engine.py` (shared resolver), `grounded.py` (corpus-grounded encounters),
`ttk.py` (rounds-to-kill), `recovery.py` (8-encounter Recovery clocks),
`unbounded.py` (uncapped stat curve), `homunculus.py`, `mistreaver.py`,
`mistreaver2.py`, `missile.py`, `lunar.py`, `uptime.py`, `paivatar.py`,
`validate.py`, and `monsters.json`.

Treat every number in them as provisional — several were produced before the
corrections in §11.
