---
name: damocles-lore
description: >
  Shared context module for the Damocles setting. Defines cosmology, entities,
  naming conventions, tone directives, anti-generic filters, and the no-hallucination
  protocol. All Damocles-related agents and prompts MUST load this skill first.
---

# Damocles Lore Context

## Purpose

This skill provides the canonical lore foundation for all Damocles authoring and refactoring work. Load it before drafting, editing, or auditing any content file that touches the Damocles setting.

## When to Use

- Before drafting any new MDX page set in Damocles
- Before refactoring existing lore, character, creature, region, or item pages
- Before running lore consistency checks
- Whenever editing content in `src/content/`

---

## Setting Identity

Damocles is a **heavily authored weird-fantasy setting**, not kitchen-sink heroic fantasy. Its world is ancient, post-collapse, and scarred by repeated civilizational and metaphysical disasters.

**Tech strata**: The deeper you go into its past, the more technologically advanced things become. Ruined eras include dieselpunk, proto-industrial, and far more advanced ages. The present is degraded medievalism with rare remnants of lost machinery, relic weapons, dead infrastructure, and occult science.

**Tone**: A deliberate blend of grimness and wonder. Not pure misery fantasy. Some regions are horrific, oppressive, and grotesque, but the setting also aims for melancholy adventure, strange beauty, warmth between companions, and the feeling of a long mythic journey. Tragedy, horror, awe, and road-trip wonder coexist.

**Aesthetic anchors**: Berserk, Dragon's Dogma, FromSoftware, Evangelion, Castlevania, Lovecraft, Wizardry, Vermis/Plastiboo, Frank Frazetta, Zdzisław Beksiński, moods adjacent to Yoshitaka Amano and Wayne Barlowe. The result is brutal sacred imagery, ruined empires, malformed beasts, cosmic machinery, dead gods, biological horror, and relic technology.

---

## Cosmological Core

### The Canvas (Primeval Engine)

The Canvas is the foundational mechanism of reality — a blank, breathing engine without inherent purpose. It is not a god but the substrate from which gods, worlds, and laws emerge. It issues Edicts that codify the rules of existence. When strained (e.g., by the Clone World fold), it weakens.

### Ages Sequence

| Age | Name            | Core Event                                                                                                                                                                                                                                                                                               |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Age of Nulls    | Canvas exists without purpose; Nulls are absences/faults; Will emerges from the first disparity                                                                                                                                                                                                          |
| 1   | Age of Wills    | Wills prove existence through motion; Golden One emerges as First Direction; Celestial Chariot willed into being; time begins                                                                                                                                                                            |
| 2   | Age of Motion   | Twin horses (light/dark) emerge from the Chariot; choice enters the world; matter forms from imperfection                                                                                                                                                                                                |
| 3   | Age of Chaos    | Golden One names the white horse "The Dragon" (god of creation); dark horse becomes God of Ambition/Destruction (the Dreamcatcher); Everdark created as barrier; Golden One commits suicide to seal the path to godhood                                                                                  |
| 4   | Age of Creation | Dragon wages War of the Shapes against Null-worshippers; Demiurge shapes Arkhé into Ideas; Väkis (spirits) arise from shaping imperfections; Empyreans arrive through the Everdark; Plato creates homunculi; White Homunculus (Wax) defeats the Dragon; Clone Worlds created                             |
| 5   | Age of Fates    | Empyrean civilization collapses; Demiurge reshapes Beasts of Black Blood into animals; Empyreans settle Damocles and split into Purebloods and Humans; the Four Demons (Nigredo, Albedo, Xanthous, Rubedo) serve the Dreamcatcher; Interlocking merges Hidden Kingdom with Damocles; celestial gods fall |

### World Seed / Clone Worlds / Divine Selection

- The **World Seed** is the true world where the White Homunculus sleeps beneath the Red Tree of Fate
- **Clone Worlds** are mirror-reflections created by the Canvas to contain the consequences of the Homunculus's defiance — they emulate the true world but lack the Engine and the gods
- Each Clone World contains the **Sampo** and the **Blade of Damocles** as decoy safeguards
- **Godhood** is catastrophic — ascension is traumatic, regrettable, or ruinous; the Golden One's suicide sealed the path deliberately

### The Everdark

An eternally burning barrier of blackened death created by the Dragon's breath to shield the world from the Earthmovers (Null-beasts that would grind creation to dust). The Dragon's fire scorched the firmament to block the void beyond.

---

## Key Entities

### Cosmic / Divine Tier

- **Canvas** — The primeval engine; substrate of reality; issues Edicts; not a god but the mechanism from which gods emerge
- **Golden One** — First Will to bear form; First Direction; rode the Celestial Chariot; committed divine suicide to seal godhood; body became the worlds of the Black Cradle (sun, Damocles, Opaline Belt, etc.)
- **The Dragon** ("Truth" / "Creation") — White horse of the Chariot, named by the Golden One; god of creation; created the Everdark; shaped reality with the Demiurge; defeated by Wax; its gouged eyes became Päivätär and Kuutar
- **Dreamcatcher** (God of Ambition / Destruction) — Dark horse of the Chariot; severed from its twin by the Golden One; sealed in the Everdark; endlessly conspires to end the world; lodged in the Plato Tower; wields True Severance
- **White Homunculus (Wax)** — Plato's creation with a Will equal to the Golden One's; completed the First Pilgrimage; defeated the Dragon; sleeps beneath the Red Tree of Fate in the World Seed
- **Demiurge (The Blacksmith)** — Primordial defector who shaped Arkhé into Ideas; later reshaped the Beasts of Black Blood into animals; a craftsman-god, not a ruler

### Celestial Tier

- **Päivätär / Päimär** — Bastard child of the Dragon; intensely evil; shed cursed light that created the Sunborn; killed during Empyrean expansion; its corpse devastated western Thule
- **Kuutar / Red Queen / Mother Moon** — Sibling to Päivätär; birthed the Pieni; orchestrated the Interlocking to escape the Hidden Kingdom; still alive as a mangled corpse roaming the skies; now contacts mortals as "Mother Moon"
- **Ukkonhemmo** — God of storms; first celestial god to fall to tombsteel weapons

### The Four Demons (Hiisi)

- **Nigredo** — Lord of Flies and Rot; in whom all endings begin; contacted Anaximander
- **Albedo** — The Bleak Bloom; false purity of life renewed; Hiisi of False Life and Eternal Growth; gargantuan aberration
- **Xanthous** — Lord of Sulphur; where every obsession festers; allied with Gorgias
- **Rubedo** — The Red Rebis; whose Sickening Radiance brings all things to an end; movements vanish into silence

### Creature Categories

- **Hiisi** — God-tier aberrations born of Päivätär's envious attempts at creation; each bears a primal obsession; amorphous, pained beings existing out of anatomical luck
- **Väkis** — Elemental spirits arising from imperfections in the Demiurge's shaping of Ideas
- **Pieni** — Kuutar's offspring; civilization ruined by the Interlocking; some cursed into The Shifted
- **Nulls** — Pre-time absences/faults; the first non-beings; some became Primordial Void Giants
- **Empyreans** — Ancient star-faring civilization; arrived through the Everdark; diverged into Purebloods and Humans
- **Sunborn** — Beastlike descendants born from Päimär's death-light; define Binturian culture
- **Bloodletters / Lunar Kystepods** — Moon-touched beings supplied by Kuutar/Mother Moon
- **Beasts of Black Blood** — Fourth-Star beings reshaped by the Demiurge into animals; originally sentient warriors/poets/artisans

### Key Named Figures

- **Plato** — First among the High Observatories; created homunculi to gather divine fragments; reborn in the Age of Fates
- **Ludwig** (the Moon-Blade / the Blood Plague / Blackstar) — Moon-touched warrior; prophesied savior in Kuutar's cult; reborn as a Baku in southern Thule
- **Felicia** — Companion of Ludwig and Wax during the First Pilgrimage
- **Aislinget Lirinargh** — Leader of Gemraedgh; contacts Mother Moon; subjected his children to moon-touching
- **Fionnulet and Tadhgen Lirinargh** — Aislinget's children; moon-touched; serve in The Silver Hands
- **Anaximander** — Empyrean scion of Nigredo; discovered tombsteel; opened the first stable Fold-rift
- **Nekarion (The Dreadlord)** — Lone figure who defeated the God of Ambition countless times; origin unknown
- **Aeridas (King-Under-Mountain)** — Presumed primordial void; let Empyreans settle Thealas; Emperor of clear skies
- **Gorgias** — Allied with Xanthous; founded the first Brume; conquered Scala Ad Caelum
- **Lycophron** — Allied with Albedo; plundered the oceans; established the Lycophrean Trade Guilds

---

## Tone Directives

### Balance of Registers

- **Horror** exists alongside **wonder** — never pure grimdark
- **Melancholy** and **road-trip warmth** coexist with **sacred brutality**
- **Precision** for mechanical/rules text; **controlled evocation** for lore text
- Never quippy, cozy, YA, Marvel-ized, or anime-slop
- Prose should be **specific and grounded**, never vague or mass-produced

### Mechanical vs. Lore Text

- **Mechanical text** (stat blocks, rules, spell effects): dry, precise, unambiguous. No flavor padding.
- **Lore text** (world pages, character pages, flavor sections): controlled, evocative, specific. Each sentence should carry weight. Avoid filler.

---

## Naming Conventions

Names in Damocles are linguistically rooted, never random fantasy phonetics.

| Strain                  | Examples                                                                              | Usage                                             |
| ----------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Finnic**              | Päivätär, Kuutar, Hiisi, Väkis, Pieni, Ukkonhemmo, Kultharja, Taiva, Kalmora, Selkara | Cosmological entities, spirits, ancient geography |
| **Gaelic / Irish**      | Aislinget, Gemraedgh, Fionnulet, Tadhgen, Cillianet, Sorchargh, Faolett, Byrnen       | Binturian culture, northern nations               |
| **Hellenic / Latin**    | Nekarion, Anaximander, Plato, Lycophron, Gorgias, Aeridas                             | Empyrean heritage, scholars, ancient figures      |
| **Romance / Castilian** | Regional as appropriate                                                               | Southern/western regions                          |
| **English**             | Descriptive titles, common speech                                                     | Narrative voice, translated concepts              |

**Rules**:

- Feel linguistically rooted and historically layered
- Never use nonsense phonetics or fantasy name generators
- Titles and epithets should feel earned and specific ("The Bleak Bloom", "Lord of Flies and Rot", "King-Under-Mountain")
- Do NOT invent new proper nouns unless explicitly provided by the user

---

## No-Hallucination Protocol

When source material is incomplete or uncertain:

- **Uncertain facts**: Mark with `[UNCERTAIN: description of what is uncertain]`
- **Missing sources**: Mark with `[NEEDS SOURCE: what information is needed]`
- **Possible contradictions**: Mark with `[POSSIBLE CONTRADICTION: describe the conflict]`

**Rules**:

- Never silently fill gaps with invented lore
- Never extrapolate cosmological facts not present in source material
- Never assign motivations, relationships, or histories to entities without source basis
- If a section requires information the agent does not have, leave a flag and move on
- Treat the absence of information as meaningful — not all gaps need filling

---

## Anti-Generic Fantasy Filter

### Banned Phrases

The following phrases (or close variants) MUST NOT appear in Damocles content:

- "ancient evil" (as lazy shorthand)
- "mystical realm"
- "legendary hero" / "legendary [noun]" (as filler)
- "chosen one"
- "arcane runes" (as placeholder magic)
- "benign gods" / "accessible gods"
- "mystical energy"
- "dark lord" (when used generically)
- "the prophecy foretold"
- "a power beyond comprehension" (without specifying what)
- "the forces of good/evil"
- "an ancient artifact of immense power" (without specificity)
- "a realm of pure magic"

### The Forgotten Realms Test

Flag any sentence that could appear in a Forgotten Realms sourcebook unchanged. Damocles content must be specific to its own cosmology, geography, and internal logic. If a sentence is interchangeable with generic D&D, it needs rewriting.

### What to Use Instead

- Name the specific entity, event, or mechanism
- Ground descriptions in Damocles cosmology (the Canvas, the Ages, the Fold, tombsteel, the Everdark)
- Reference specific cultural or linguistic context
- Use precise, authored language over vague fantasy shorthand

---

## Quick Reference: Cosmological Terms

| Term              | Meaning                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Canvas            | Primeval engine / substrate of reality                                                     |
| Arkhé             | Prima materia of the cosmos                                                                |
| Everdark          | Burning barrier shielding the world from the void                                          |
| Fold              | The energy by which the Canvas grants godhood / bridges worlds                             |
| Clone Worlds      | Mirror-reflections of the true world                                                       |
| World Seed        | The true world where Wax sleeps                                                            |
| Hidden Kingdom    | Prison-realm where Päivätär and Kuutar were sealed; now folded into the Clone World mantle |
| Interlocking      | Event that merged the Hidden Kingdom with Damocles                                         |
| Black Cradle      | The Dragon's solar system                                                                  |
| Taiva             | The heart-world forged from the Golden One's remains; later named Damocles                 |
| Sampo             | Decoy safeguard placed in each Clone World                                                 |
| Blade of Damocles | Decoy safeguard placed in each Clone World                                                 |
| Red Tree of Fate  | Grew from the White Homunculus's blood and bindings                                        |
| Tombsteel         | Metal born of decay; inert, heavy; weapons forged from it can kill gods                    |
| Celestial Chariot | Vehicle of the Golden One; willed into being by collective Wills                           |
| First Pilgrimage  | Wax's journey through the Black Cradle to defeat the Dragon                                |
| War of the Shapes | Eon-spanning conflict between the Dragon and Null-worshippers                              |
| Scarring          | Catastrophic event triggered by Päivätär and Kuutar's deaths                               |
| The Four          | Cabal of Hiisi demons serving the Dreamcatcher (Nigredo, Albedo, Xanthous, Rubedo)         |
