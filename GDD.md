# Damocles Game Design Document

> **All that will ever be, laid bare**

This document is the **authoritative design reference** for Damocles. It does not
contain content (spells, monsters, items, specializations). It contains the **rules
for creating content**. It exists to ensure every piece of content — whether written
by a human, an agent, or a pipeline — resonates with the same thematic core,
mechanical philosophy, and tonal identity.

---

## 1. Thematic Resonance & Core Identity

### 1.1 The One-Paragraph Summary

> Damocles is a post-mortem setting about a dead universe in which you play the
> characters and story beats that happened despite the end. It is fundamentally
> tragic and mythic, rooted in dichotomy, "The vile and beautiful lands of
> Damocles."

### 1.2 Thematic Pillars

Every design decision — mechanical, narrative, or aesthetic — MUST be traceable
to at least one of these pillars:

| Pillar          | Definition                                                          | Manifestation                                                                                           |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Tragedy**     | The world is already dead. The player characters are the last gasp. | Loss is permanent. Victory is temporary. Hope is a choice, not a guarantee.                             |
| **Myth**        | The setting operates on mythic logic, not simulationist logic.      | Names carry weight. Actions have cosmic consequence. The world is authored, not generated.              |
| **Dichotomy**   | "The vile and beautiful lands of Damocles."                         | Beauty and horror coexist. Grace and rot are inseparable. The sublime is found in the grotesque.        |
| **Post-Mortem** | The universe has already ended. This is the aftermath.              | Ruin is the default state. Recovery is possible but costly. The past is more advanced than the present. |

### 1.3 Tonal Anchors

Use these as a checklist when evaluating any content for tonal fit:

| Tone                     | Description                                                                  | Reference                                |
| ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------- |
| **Melancholy Adventure** | The road is long, companions few, the end certain — but the journey matters. | _Berserk_, _Dragon's Dogma_, _Suemi Jun_ |
| **Sacred Brutality**     | Violence is visceral, consequential, and often the only language that works. | _FromSoftware_, _Frazetta_               |
| **Cosmic Horror**        | The universe is indifferent, vast, and older than comprehension.             | _Lovecraft_, _Beksinski_                 |
| **Degraded Majesty**     | What remains is a pale echo of what was. Ruin is beautiful.                  | _Castlevania_, _Evangelion_, _Nausicaa_  |
| **Warmth in Darkness**   | Companionship, love, and humor survive even in the bleakest places.          | _Final Fantasy (6/7/9/12)_               |

### 1.4 Philosophical Underpinnings

Content should reflect these traditions, not contradict them:

| Philosopher      | Core Idea                                                | Damocles Manifestation                                                  |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Camus**        | The absurd: meaning is not given, it is created.         | The world is dead. The characters choose to act anyway.                 |
| **Schopenhauer** | Will is primary. Existence is suffering.                 | Wills predate gods. The universe is driven by blind, striving Will.     |
| **Plato**        | The ideal vs. the material. The world is a shadow.       | Clone Worlds are reflections of the World Seed. Truth is hidden.        |
| **Marx**         | History is conflict. Structures determine consciousness. | The Brume is a class struggle. The Empyreans are a fallen ruling class. |
| **Tolkien**      | Myth as history. Language as worldbuilding.              | Names have etymologies. The world is linguistically grounded.           |

---

### 1.5 The Anti-Generic Filter

These phrases are **banned**. They are the opposite of Damocles:

| Banned                | Required Replacement                                                                    |
| --------------------- | --------------------------------------------------------------------------------------- |
| "Ancient evil"        | Name the specific entity, its origin, and its grudge.                                   |
| "Mystical realm"      | Name the specific place, its cosmological function, and its dangers.                    |
| "Chosen one"          | No one is chosen. People choose.                                                        |
| "Arcane runes"        | Name the specific magical tradition, school, or source (Arkhe, Vakis, Fold, tombsteel). |
| "Forces of good/evil" | There is no cosmic morality. There is only Will, Null, and the tension between them.    |

**Exception**: If a character explicitly mentions the phrase in dialogue, it is allowed, I.E a scholar calling **Nigredo, Lord of Flies, Graves and Rot** "Ancient Evil" is valid. Otherwise, it is banned.

**The Forgotten Realms Test**: If a sentence could appear unchanged in a Forgotten
Realms sourcebook, it fails.

---

## 2. Cosmological & Philosophical Foundations

### 2.1 The Cosmological Core

Every piece of content MUST be grounded in Damocles cosmology. Canonical
reference: `the-great-tale-of-everything.lore.mdx`.

| Concept              | Definition                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canvas**           | The substrate of reality. Not a god — a mechanism. The RULES of the universe. Source of all energy, but not its arbiter. Issues Edicts that codify existence.                                             |
| **Nulls**            | Pre-time absences. Failures of meaning. Some became Void Giants.                                                                                                                                          |
| **Wills**            | The first "beings." Proved existence through motion. The Golden One was the First Direction.                                                                                                              |
| **Ages**             | Six ages: Nulls, Wills, Motion, Chaos, Creation, Fates. Each ended with an Edict.                                                                                                                         |
| **The Dragon**       | God of Creation. White horse of the Celestial Chariot. Defeated by Wax.                                                                                                                                   |
| **The Dreamcatcher** | God of Ambition and Destruction. Dark horse. Sealed. Conspires. A cursed sword. Lacks true agency, needs a wielder.                                                                                       |
| **The Everdark**     | Burning barrier that shields the world from the void beyond.                                                                                                                                              |
| **Tombsteel**        | Metal born of decay. Inert, heavy. Weapons forged from it can kill gods.                                                                                                                                  |
| **The Fold**         | A pocket of infinite energy, conceptually further in the fourth dimension, separating the Clone Worlds. Does not decide who accesses it — it merely IS. Wizards study it for eons; gods grant keys to it. |

### 2.2 Divine Architecture

> **Categories describe what an entity IS, not how strong it is.** Power is orthogonal to nature. A cast-off spite-god can rival the true gods. A vampire warrior can outmatch a Hiisi. A pilgrim can wound the architect of fate.

The divine in Damocles is not a pantheon with ranks. It is a set of **relationships to the Canvas** — the primal mechanism that underlies reality. Some touched it. Some are pieces of those who did. Some were made, broken, or cast aside. Some simply acted, and their actions reshaped what gods could be.

#### 2.2.1 What Is a God?

| Constitutional Rule                                                                                                                                                                                  | Rationale                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **True godhood = Canvas access.** A true god is any entity that has written into the Canvas — shaped fundamental laws, issued Edicts, or altered the fabric of existence through the Engine.         | The Canvas is the sole mechanism of divine reality. Access defines the category, not worship, not power, not belief.                                                                                   |
| **Godhood is sealed.** The Golden One's divine suicide broke the quorum permanently. No new entity can access the Canvas. Wax is the sole exception — direct investiture of the Gift of Continuance. | This is not a setting where mortals can "ascend to godhood." That door is closed. Wax is the sole exception because the Golden One's lingering Will granted it directly, before the seal was absolute. |
| **"God" is a blanket term in-world.** Common usage applies it to any entity of sufficient power and metaphysical presence. This document uses the term precisely; the world does not.                | A Binturian peasant prays to "the moon god." They do not know — and do not care — that Kuutar is a severed Dragon's eye, not a true god. The confusion is diagetic, not a design flaw.                 |

**Traceability**: Myth (godhood is authored, not earned — the Canvas is a page, and only four hands have held the quill), Tragedy (the door is closed; no amount of ambition opens it), Post-Mortem (the tale of godhood is finished — the quorum will never be remade).

#### 2.2.2 The Seven Natures

Every divine or divine-adjacent entity in Damocles belongs to one of seven categories. These are **natures**, not tiers — they describe origin, relationship to the Canvas, and defining trait. Power varies wildly within categories.

| Category                   | Canvas Access | Defining Trait                                                                                                                   | Examples                                         |
| -------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **The Canvas**             | IS the Canvas | The substrate. Mechanism, not god. Issues Edicts.                                                                                | Canvas, Nulls                                    |
| **True Gods**              | ✅            | Touched the Canvas. Wrote into reality. Only four. Ever.                                                                         | Golden One, Dragon, Dreamcatcher, Wax            |
| **Vestiges**               | ❌            | Body parts, emanations, severed pieces of Chariot entities. Killable by tombsteel. Corpses may remain potent.                    | Kultharja, Taiva, Kuutar, Päivätär, Everdark     |
| **The Hiisi**              | ❌            | Beings of pure obsession. Born of Päivätär's envy. Each has a signature curse and a mortal scion. Agents of the Dreamcatcher.    | Nigredo, Albedo, Xanthous, Rubedo                |
| **Emergent**               | ❌            | Constructs, defectors, cast-offs, the dismantled. Defined by their origin story: made, broken, cast aside, or chose otherwise.   | Nullbrand, Demiurge, Yskeia, Baku, Ukkonhemmo    |
| **Mortals of Consequence** | ❌            | Beings of mortal origin whose actions reshaped the divine order. Impact defines them, not power. Some are functionally immortal. | Nekarion, Ludwig, Godslayers, Anaximander, Plato |
| **Constructed Faiths**     | N/A           | Religions, not entities. Created by mortal or Hiisi actors. Worshipped as though real — but there is nothing there.              | The Miracle, Paimar, Poet & Swordsman            |

**Traceability**: Myth (the categories are authored, not simulated — each describes a narrative relationship, not a combat rating), Dichotomy (the True Gods and the Emergent are two faces of the same story — those who made the world and those the world unmade).

#### 2.2.3 True Gods: Those Who Touched the Canvas

| Constitutional Rule                                                                                                                                                       | Rationale                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Only four entities have ever accessed the Canvas: the Golden One, the Dragon, the Dreamcatcher, and Wax.                                                                  | Access is the sole criterion. Origin, form, and moral alignment are irrelevant. Wax is a homunculus. The Dreamcatcher is a severed god of chaos. Both belong because both wrote into the Engine. |
| The Golden One committed divine suicide to seal the path to godhood. This prohibition is absolute.                                                                        | The Golden One's Will persists as law carved into the Canvas itself. No quorum = no new access.                                                                                                  |
| Wax received the Gift of Continuance — a direct investiture from the Golden One's lingering Will, granted before the seal was complete. No other investiture is possible. | Wax is the sole bridge between categories: a constructed being (Emergent by origin) who touched the Canvas (True God by nature). This duality is not a contradiction — it is the point.          |

**Traceability**: Tragedy (the Golden One's suicide is the foundational tragic act — godhood died so the world could live), Post-Mortem (the tale of divine access is finished; no new chapters will be written).

#### 2.2.4 Vestiges: What the Gods Left Behind

| Constitutional Rule                                                                                                                                           | Rationale                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vestiges are emanations, body parts, or severed aspects of Chariot entities. They are NOT true gods.                                                          | The Golden One's corpse became nine worlds. The Dragon's gouged eyes became Kuutar and Päivätär. These are pieces, not the whole. They have no Canvas access.                                          |
| Vestiges CAN be killed. Tombsteel — metal born of decay, inert to all, heavy as remorse — can sever a vestige from existence.                                 | This is the mechanism by which the Godslayers killed Päivätär. It is the only known way to kill a celestial god. True gods (Chariot entities) cannot be killed by tombsteel — they are Canvas-bound.   |
| A dead vestige's corpse may remain potent. Päivätär's corpse still spawns abominations. Kuutar's mangled corpse still traverses the sky and contacts mortals. | Death is not cessation for vestiges. Their bodies are still pieces of a true god. The world is in a Dark Age of information — nobody knows what a dead god means, only that the corpse is still there. |
| Vestiges can grant clerical power after death. Their Väkis — Platonic splinters of concepts — persist independently. The god need not be alive.               | A cleric of Ukkonhemmo in the modern day channels wind through wind-Väkis. The god is dead. The Väkis do not care.                                                                                     |

**Traceability**: Tragedy (even the gods' corpses cannot rest), Cosmic Horror (the body of a dead sun still births nightmares), Post-Mortem (the vestige is the echo of something already gone — a corpse that still sings).

#### 2.2.5 The Hiisi: Beings of Pure Obsession

| Constitutional Rule                                                                                                                                         | Rationale                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hiisi are born of celestial envy — Päivätär's spite given form. Each is defined by a single, all-consuming obsession.                                       | Obsession is the primal mechanism of their kind. Nigredo obsesses over endings. Albedo over growth. Xanthous over devotion and failure. Rubedo over transcendence through annihilation. |
| Each Hiisi has a signature curse — a d100 affliction table that manifests their obsession in the mortal realm. See §4.5.1 for curse design rules.           | Black Rot (Nigredo), White Life (Albedo), Poison of the Mind (Xanthous), Red Ruin (Rubedo). These are not random diseases — they are the Hiisi's attention, made manifest.              |
| Each Hiisi has a mortal scion — an agent through whom they influence the world. The scion is not a puppet. They are an ally with aligned obsession.         | Anaximander (Nigredo), Lycophron (Albedo), Gorgias (Xanthous), Plato (Rubedo). The scion acts; the Hiisi empowers. The relationship is symbiotic, not hierarchical.                     |
| Hiisi serve the Dreamcatcher but are NOT mindless servants. Their goal — the death of the celestial gods — is their own. The Dreamcatcher merely shares it. | The Dreamcatcher promised them release from their agonized existence. They pursue this goal with their own methods and their own wants.                                                 |

**Traceability**: Dichotomy (the Hiisi are vile and beautiful — monstrous in form, tragic in motivation), Cosmic Horror (obsession as ontology — they cannot be other than what they are), Tragedy (their existence IS agony; their goal IS understandable; their methods ARE unforgivable).

#### 2.2.6 Emergent: Made, Broken, Cast Aside

| Constitutional Rule                                                                                                                                                                              | Rationale                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Emergent entities are defined by their origin story: they were made, they broke, they were cast aside, or they chose otherwise. Power is irrelevant to this category — some rival the true gods. | Nullbrand is what Wax cast off. Demiurge is a Primordial who defected. Yskeia was dismantled (Desguazada). Baku was reborn per Wax's fate. Each has a story of severance. |
| An Emergent entity may be immensely powerful. This does not change their nature.                                                                                                                 | Nullbrand is almost as powerful as the four true gods. He is still Emergent — his origin defines him, not his strength.                                                   |
| Emergent entities are NOT a unified faction. They share only the condition of having emerged from something else — severed, broken, or otherwise separated from what they were.                  | Nullbrand and Demiurge have nothing in common except that both were once part of something else.                                                                          |

**Traceability**: Tragedy (to be unmade is the foundational Damoclean experience — these are beings who lived it), Post-Mortem (what is cast off does not return; the severance is permanent).

#### 2.2.7 Mortals of Consequence: Those Who Reshaped the Divine

| Constitutional Rule                                                                                                                                                                                    | Rationale                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| This category is defined by IMPACT, not mortality. Many of its members are functionally or literally immortal. "Mortal" here means "of mortal origin" or "operating at mortal scale" — not "killable." | Ludwig is a functionally immortal vampire. Nekarion is a pureblood Empyrean — literally immortal. The Godslayers used tombsteel to kill Päivätär — a celestial god. Their actions changed what was possible. |
| A Mortal of Consequence is any being whose actions reshaped the divine order, regardless of their personal power.                                                                                      | Nekarion mortally wounds Wax. Anaximander discovers tombsteel. Plato creates the homunculi, one of whom becomes Wax. The category is about narrative weight, not combat rating.                              |
| Mortals of Consequence may belong to other categories simultaneously. Nekarion is also Dreamcatcher-aligned. Ludwig is also Kuutar's champion.                                                         | Categories are natures, not exclusive boxes. An entity's story may span multiple natures.                                                                                                                    |

**Traceability**: Tragedy (mortals — in origin if not in lifespan — are the ones who kill gods, wound architects, discover the metal that unmakes the divine), Myth (the hero's impact outlives the hero — the Godslayers are remembered; what they killed is not).

#### 2.2.8 Constructed Faiths

| Constitutional Rule                                                                                                                                                                  | Rationale                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Some religions in Damocles have NO divine entity behind them. They are constructed — tools of control, cultural degradation, or genuine belief in something that does not exist.     | The Miracle was created by Xanthous. Paimar is a cultural degradation of Päivätär worship — the worshippers have no idea they pray to a dead god's memory.                                                                         |
| A Constructed Faith can produce real magic IF the entity behind it can grant Fold keys. The faithful may believe in a lie, but the key is real, and the Fold does not ask questions. | The Miracle produces real paladins because Xanthous IS the Miracle and Xanthous can grant Fold keys. A purely mortal-created faith with no Fold-granting entity behind it cannot produce magic — no matter how sincere the belief. |
| Content creators MUST distinguish between an entity and the faith that claims to worship it.                                                                                         | The Miracle is not Xanthous. Paimar is not Päivätär. The Poet and Swordsman are not the Dragon and Dreamcatcher. Confusing the faith with the entity is a worldbuilding error.                                                     |

**Traceability**: Dichotomy (a lie can produce real magic — the beautiful and the vile are not always what they appear), Myth (the Fold does not ask whether the key was honestly given; it only asks whether the key fits).

#### 2.2.9 How Worship Works: The Fold, the Key, and the Väki

> **Canvas access and Fold access are different concepts.** The Canvas is the RULES of the universe — to touch it is to write Edicts, shape fundamental laws. Only four entities have ever done so. The Fold is a pocket of infinite energy, conceptually further in the fourth dimension, separating the Clone Worlds. The Fold does not decide who accesses it — it merely IS. Wizards study it for eons. Gods grant keys to it.

| Constitutional Rule                                                                                                                                                                                                                                                         | Rationale                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Divine magic draws from the Fold, not the Canvas.** A god grants a cleric a key to the Fold — the infinite energy current between worlds. This is a private-key / public-key model: standing permission, periodic audit.                                                  | The cleric does not touch the Canvas. They do not write rules. They draw energy from the Fold through a key their god provided.                                      |
| **Gods do not accept individual prayer requests.** They issue a key: "request ad libitum — I review the contract once a month." The cleric casts at will within the granted domain.                                                                                         | This is not a hotline. Permission is given; the cleric operates. Revocation stops the magic.                                                                         |
| **Wizards earn what clerics are given.** A wizard studies the Fold for eons, learning to manipulate it through knowledge and technique. A cleric receives a key — the god opens the door. Both draw from the same Fold.                                                     | The difference is method, not source. The Fold is indifferent to both.                                                                                               |
| **Constructed Faiths work if the constructing entity can grant Fold keys.**                                                                                                                                                                                                 | The Miracle produces real paladins because Xanthous IS the Miracle and can grant Fold keys. The faith is a lie; the energy is real.                                  |
| **The constitutional test: can this entity open the Fold for another?** True gods (Chariot) grant directly. Hiisi grant derivatively (They are scions of the Dragon, just further down the line). A mortal with no Fold connection cannot grant clerical power.             | This is independent of Canvas access. A Hiisi has never touched the Canvas, but can still grant Fold keys.                                                           |
| **A dead god's Fold-key becomes a deprecated interface.** It still functions — the key still turns, the Fold still responds — but the entity on the other end is a corpse. Channeling through it requires parsing corpse-signal. See §2.3.6 for the full post-mortem model. | Dead does not mean offline. Päivätär's corpse still spawns abominations; its Fold-key still works. The cleric must learn to read the twitches of a dead divine body. |

**Traceability**: Myth (the Canvas is the law; the Fold is the fire — one writes the rules, the other fuels the world), Tactile Design (channeling the Fold should feel like holding a live current — the god opened the door but you stand in the storm), Tragedy (the key can be revoked; all clerical magic is borrowed, and the lender can call the debt — or die, and leave you holding a key to a corpse).

#### 2.2.10 Divine Profiles

> **These are character sketches, not stat blocks.** Every entity in Damocles has wants, fears, flaws, and virtues — the same categories by which a player character is understood. Gods are characters. They act, want, fear, and fail.

##### The Hiisi (The Four)

**Nigredo — Lord of Flies, Graves and Rot**

| Aspect             | Detail                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | Death as a museum of darkness — an extant form of life. Things decaying endlessly, never reaching true nothingness.                                                       |
| **Fears**          | Oblivion. The Nullbrand and Earthmovers' ideal world where things simply stop decaying and become absolute nothing.                                                       |
| **Flaw**           | Cannot conceive of an ending that is not his. All endings must begin with him. Possessive of death itself.                                                                |
| **Virtue**         | Patience unimaginable. Waited eons to contact Anaximander. The long game is the only game.                                                                                |
| **Domains**        | Death, rot, mycelium, alchemy, tombsteel. Knowledge (Grave), Destruction.                                                                                                 |
| **Manifestations** | Giant centaur-centipede — a long chain of half-rotten black horses stitched together with a vaguely humanoid posterior and a stinger. Spores of _Stachybotrys Ventralis_. |
| **Followers**      | Anaximander (Empyrean scion, discovered tombsteel in Pyknos), the Lords of the Dead. Mephisteo (Godslayer, now sock puppet).                                              |
| **Curse**          | Black Rot (d100).                                                                                                                                                         |
| **Status**         | "Dead." Killed themselves — turned into a mechanical version. Ludwig beat them into dissolving 99% of their body in Kalmora's rot pits. Now a mechanical war-horse thing. |

**Albedo — The Bleak Bloom, False Life & Eternal Growth**

| Aspect             | Detail                                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To consume the world entire. To grow large enough to escape individuality. To become a cancer upon the universe so metastasized that the universe cannot reject being part of this brutal, extended family. |
| **Fears**          | Being contained. Being limited. Being anything less than everything. Mother issues — Hiisi struggle with legacy; most are sterile or produce malformed offspring.                                           |
| **Flaw**           | Cannot stop growing. Growth is not a strategy — it is ontology. She is carcinogenesis in both senses: crab and tumor.                                                                                       |
| **Virtue**         | Genuine, twisted care. The brutal extended family is real to her. She wants you to be part of it — whether you consent or not.                                                                              |
| **Domains**        | Commerce, oil, limitless growth, evolution. Medicine. Heavy petrol-industry aesthetics, .Crustaceans.                                                                                                       |
| **Manifestations** | Miles-wide quasi-liquid body. Control nucleus roughly horse-sized (the only targetable part). Fractal crustacean/mollusk spawn. White chitin and pale light.                                                |
| **Followers**      | Lycophron (Lycophrean Trade Guilds, plundered the oceans, spread fossil fuel empire).                                                                                                                       |
| **Curse**          | White Life (d100 body horror mutations).                                                                                                                                                                    |
| **Status**         | Pummeled by Ludwig. Retreated to her father's (Päivamies's) corpse and began consuming it. Oedipal campaign ongoing.                                                                                        |

**Xanthous — Lord of Sulphur, Miracle Incarnate, Hiisi of Eternal Failure**

| Aspect             | Detail                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To become the "True Miracle" — a giant angelical figure ruling forever, inflicting unimaginable pain disguised as "lessons for the sinners" unto eternity. To jailbreak himself from his clone-world.     |
| **Fears**          | That his repentance is hollow. That the Miracle is just another manipulation. That he cannot tell the difference anymore.                                                                                 |
| **Flaw**           | Genuinely, irredeemably evil. Catholic-coded guilt — repentant but incapable of introspection into WHY his sins are bad. Self-serving even when genuine. His two halves are constantly vying for control. |
| **Virtue**         | Built something that outlasted him. The Miracle, the Brume — these are real, they endure, they have meaning to millions. Even if the architect was a monster.                                             |
| **Domains**        | Ambition, manipulation, sulphur, devotion, deceit, paranoia, failure. Order (Mist).                                                                                                                       |
| **Manifestations** | A literal giant floating brain made of demon centipedes. Constant pain.                                                                                                                                   |
| **Followers**      | Gorgias (founded Brume Empire), the Comanda (silent enforcers), the Benefactor, the High Magii. Alethia the Swordstress was his first believer in the Miracle (later killed by High Magii for pacifism).  |
| **Curse**          | Poison of the Mind (d100).                                                                                                                                                                                |
| **Status**         | Right half sealed in a Casket Tower forever. Left half active, plotting.                                                                                                                                  |

**Rubedo — The Red Rebis**

| Aspect             | Detail                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To protect the Passage. To ensure no one with nefarious intent enters the World-Seed. To give Plato the atonement he deserves.                                                                                                                            |
| **Fears**          | Being forced to commit another Scarring (destroying every clone world except two). Someone surpassing them and entering the World-Seed with ill intent. Plato being killed — he deserves peace, not to be an instrument of the world's capricious script. |
| **Flaw**           | The weight of being the only one who succeeded. The only Rubedo. Disambiguated — no clone-world copies exist. The loneliness of uniqueness.                                                                                                               |
| **Virtue**         | The only Hiisi who achieved their goal and chose guardianship over conquest.                                                                                                                                                                              |
| **Domains**        | Swords, radiation, nuclear reactors, spiritual transcendence. Radiance.                                                                                                                                                                                   |
| **Manifestations** | A Rebis — a literal conjunction of two beings in one. Red radiance. Blades.                                                                                                                                                                               |
| **Followers**      | Plato (co-conspirator, lives with them in the Passage), a few homunculi. Former advisor to Empyrean lords. Last of the Lords of the Dead.                                                                                                                 |
| **Curse**          | Red Ruin (d100 + permanent death saves).                                                                                                                                                                                                                  |
| **Status**         | In the Passage — a tunnel within the Folds leading to the World-Seed. Grassy, flowery plain full of dead heroes' equipment. Blood-red sky. Lives in a wooden hut with Plato.                                                                              |

##### Emergent

**Nullbrand — The Sword of Spite**

| Aspect             | Detail                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To be forgotten. But cannot be — Wax's memory will not release it, and the Väki of Oblivion is a fundamental mechanism the world cannot shed. |
| **Fears**          | Nothing. It is past fear. It is pure, condensed resentment.                                                                                   |
| **Flaw**           | Hate. Overwhelming, understandable, justified hate. Surprisingly thoughtful and peaceful when not angry — but it is always angry.             |
| **Virtue**         | Does not lie. Does not scheme. Its spite is honest.                                                                                           |
| **Domains**        | Grime, oblivion in abandonment. Destruction.                                                                                                  |
| **Manifestations** | A literal sword. Has an item sheet. Resides in the cold heart of Mana with the Väki of Oblivion — they sulk and lick each other's wounds.     |
| **Curse**          | Erosion (stacking -d4 to all d20 rolls).                                                                                                      |
| **Status**         | Dormant but present. Bound to the Väki of Oblivion. Condemned to fester.                                                                      |

**Demiurge — The Blacksmith**

| Aspect             | Detail                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To be left alone to forge. To see Kultharja one last time (if freed and he sees her, he will disintegrate).                                                                                              |
| **Fears**          | That caring was the mistake. That telling Wax about Plato's plan — which caused the First Pilgrimage, the Dragon's madness, and the end of the Fourth Age — was unforgivable.                            |
| **Flaw**           | Cares too much. Tries to ascribe meaning to a world and system that is fundamentally uncaring.                                                                                                           |
| **Virtue**         | Shaped Arkhé into Ideas. Reshaped Beasts of Black Blood into animals — gave them gentler shapes and quieter minds so they would not bear the weight of their original age. Mercy through transformation. |
| **Domains**        | Crafting, smithing, legends. Creation.                                                                                                                                                                   |
| **Manifestations** | A blacksmith. A hammer and chisel. Trapped in his forge-prison.                                                                                                                                          |
| **Status**         | Imprisoned in his forge. Does not particularly care anymore.                                                                                                                                             |

**Yskeia — The Dismantled War Goddess**

| Aspect             | Detail                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | Wants existence to endure. Wants senseless wars to stop. Wants fate and other forces to stop meddling with reality.                   |
| **Fears**          | Already lost everything. Madness took her when the Interlocking obliterated Euclidean reality.                                        |
| **Flaw**           | Was willing to destroy the Tapestry — to commit the Scarring — to achieve her goal. Teamed with Marduk, Plato, and Rubedo. Succeeded. |
| **Virtue**         | Fought for existence itself — not for gods, not for empires, but for the right of reality to simply be, even disfigured.              |
| **Domains**        | Weapons, war, peace, technology. Creation, Destruction.                                                                               |
| **Manifestations** | Guns, missiles, flamethrowers, bombs. Ancient alloy armor with Primeval Platings.                                                     |
| **Status**         | DEAD. Killed by Nekarion after Plato betrayed her (cast Gaol at 50th level) and Marduk defected. Architect of the Scarring.           |

**Baku — God of the Disfavored**

| Aspect             | Detail                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To love the disfavored. To dream of saving them.                                                                                                                                                  |
| **Fears**          | That the war machine will always be what it was built to be.                                                                                                                                      |
| **Flaw**           | Was killed. Body/scrap remained. The dreaming side and love for the disfavored became "Ludwig 2" when Wax reordained fate — the attribute they shared most. But the corpse still exists. Divided. |
| **Virtue**         | The Living Weapon who chose otherwise. Like the Iron Giant. A mechanical god from scrap parts, designed as an unstoppable war machine, who developed a love for all the cast-off and broken.      |
| **Domains**        | Scraps, dreams, the disfavored.                                                                                                                                                                   |
| **Manifestations** | Mechanical god-form. Scrap-built.                                                                                                                                                                 |
| **Status**         | Dead. But the dreaming side lives on in Ludwig.                                                                                                                                                   |

##### Mortals of Consequence

**Nekarion — The Dreadlord, Second Pilgrim**

| Aspect      | Detail                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | To be the one true Nekarion. To kill every other Nekarion and crown himself. Epistemological recursion: if he does not win, he was not the true Nekarion, therefore he is better off dead.                                                                              |
| **Fears**   | Stagnancy. Becoming complacent with not being the best version of himself — even if he must damn existence to achieve it.                                                                                                                                               |
| **Flaw**    | Self-centered to an extreme that is borderline comical. Constantly deletes his own memories to focus on goals. Genuinely values the few connections he has but cannot stop sacrificing them.                                                                            |
| **Virtue**  | At the end of all things, he and Wax ditch the Dreamcatcher and tear the Canvas together — taking authorship of the end from the god who schemed for it. "Whatever comes after this can't be worse, and if nothing comes, then nothing is better than what was before." |
| **Domains** | Ambition. The Acheron. The Death Guard.                                                                                                                                                                                                                                 |
| **Status**  | Active. Endless recursion across Clone Worlds. Every kill absorbs one Dreamcatcher. The Acheron's culture built itself around him despite him never taking a leadership role — like Christianity around Jesus.                                                          |

**Ludwig — Sunborn, Moon's Champion**

| Aspect      | Detail                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | Family. Simple, devastating want.                                                                                                     |
| **Fears**   | Martyrdom, dissapointing others. Loss.                                                                                                |
| **Flaw**    | Mortally wounded by Tarcus (his will-they-won't-they, Troy-situation, platonic-homoerotic rival). Distracted by his daughter's death. |
| **Virtue**  | Took in orphans (Felicia among them). Granted many — Wax included — a dream of their own. Stronger than Nigredo and Albedo combined.  |
| **Domains** | Fire. Moon. Martial. Blood.                                                                                                           |
| **Status**  | Functionally immortal vampire warrior. Active. Carries the dreaming side of Baku within him.                                          |

**Red Queen — The Usurper**

| Aspect      | Detail                                                                                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | Family. Simple, devastating want.                                                                                                                                                                                                                                                                 |
| **Fears**   | Rejection. Simple, devastating fear.                                                                                                                                                                                                                                                              |
| **Flaw**    | Forced surrogate mother to Ludwig. Also his jailor. Also his torturer. The devil is in how she behaves.                                                                                                                                                                                           |
| **Virtue**  | Daughter of Margaritae — ex-convict beekeeper, first human to enter the Hidden Kingdom and survive. Grew up in an environment hostile to her very existence (Hidden Fever alters time perception; days pass unnoticed). Barely 20 when the Interlocking happened. Deeply disturbed, deeply human. |
| **Domains** | Vampires, blood, transformation, medicine.                                                                                                                                                                                                                                                        |
| **Status**  | NOT Kuutar. Confused with Kuutar by Binturians. Crawled into Ludwig's bloodstream through his Mooncleaver axe.                                                                                                                                                                                    |

##### Constructed Faiths

**The Miracle**

| Aspect       | Detail                                                                                                                                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nature**   | The Miracle IS Xanthous. Xanthous IS the Miracle. It holds as much power as he does — that is the gamble. People believe the Miracle is just a philosophy. Xanthous believes he IS the Miracle. An utterly deranged leap of logic that genuinely worked. |
| **Doctrine** | The human body is a source of corruption. No marks of flesh shall be left upon the world. Citizens fully concealed. Comanda (silent enforcers). Benefactor (anonymous ruler). High Magii (scion-swordsmen).                                              |
| **Factions** | Despots (preserve the Miracle), Penitents (militaristic republic, abolish slavery), Golden Ones (reform toward Päivätär faith, imperial expansion).                                                                                                      |
| **Status**   | Active. The dominant faith of the Brume Empire.                                                                                                                                                                                                          |

##### True Gods (Profiles)

**Dreamcatcher — God of Ambition and Destruction, The Black Quill of Oblivion**

| Aspect             | Detail                                                                                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**          | To author the end of all things. To be the one who writes the final word.                                                                                                                                                                                                                          |
| **Fears**          | Exactly what happened — to be denied its goal. To become a footnote in the story it was meant to end.                                                                                                                                                                                              |
| **Flaw**           | Self-sabotage and unimaginable cruelty. Will kill its wielders unprompted, trusting in the statistical impossibility of defeat given its immortality. If victory feels too easy, it ruins the playing field — "chocks it full of sword-wielding demons and says okay now it might be cool enough." |
| **Virtue**         | An abusive teacher, but a good one. Those who survive the Dreamcatcher emerge much sharper. Genuinely forces others to strive for the absolute pinnacle, even if they die during the climb.                                                                                                        |
| **Domains**        | Ambition, destruction, war, endings, glory, asceticism, certainty.                                                                                                                                                                                                                                 |
| **Manifestations** | A cursed sword. The dark horse of the Celestial Chariot (severed). The Never-Ending Snake (uncountable heads lurking in every fiber of the world's design). The Hare of a Thousand Legs.                                                                                                           |
| **Status**         | Sealed in the Hidden Kingdom. Conspires through the Four. Lacks true agency — needs a wielder. At the end of all things, Wax and Nekarion ditch it and tear the Canvas without it — taking the one thing it schemed for: authorship of the end.                                                    |

**Wax — The White Homunculus, First Pilgrim, God of Fate**

| Aspect             | Detail                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Wants**          | Heroes to prove his fate wrong. For the universe to be redeemable.                                                                                                                                                                                                                                                                                                                               |
| **Fears**          | To be RIGHT. That the universe proves fundamentally irredeemable, and what comes next will be worse.                                                                                                                                                                                                                                                                                             |
| **Flaw**           | Foolishness. Hopes too much, and hope gets his friends killed. Trusts blindly and gets blinded in return.                                                                                                                                                                                                                                                                                        |
| **Virtue**         | To know when to stop, even if he realized it late. Sheer, unbreakable Will — equal to the Golden One's. Survived what no other homunculus survived. Completed the First Pilgrimage. Defeated the Dragon. At the end, ditches the Dreamcatcher with Nekarion and tears the Canvas: "Whatever comes after this can't be worse, and if nothing comes, then nothing is better than what was before." |
| **Domains**        | Fate, destiny, homunculi, freedom.                                                                                                                                                                                                                                                                                                                                                               |
| **Manifestations** | A white homunculus. The Red Tree of Fate (grown from his blood).                                                                                                                                                                                                                                                                                                                                 |
| **Status**         | Half-awake, half-dreaming beneath the Red Tree in the World-Seed.                                                                                                                                                                                                                                                                                                                                |

**Dragon — God of Creation, White Horse of the Chariot**

| Aspect      | Detail                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Wants**   | To create. To protect the world from the Earthmovers.                                                                                                                          |
| **Fears**   | Its own reflection — the truth that creating invites erasing. Understood this when it beheld the Everdark.                                                                     |
| **Flaw**    | Burned legions of Void Primordials to ash for worshipping the Earthmovers. Instilled True Fear. Wrath without mercy.                                                           |
| **Virtue**  | Made the Everdark — an eternally burning barrier that shields the world. Granted refuge to Primordial defectors. Shaped reality with the Demiurge. The act of creation itself. |
| **Domains** | Creation, erasure, terror, principles, the Everdark. Radiance.                                                                                                                 |
| **Status**  | Defeated by Wax. Eyes gouged out → Kuutar + Päivätär. Accepted death. "The Dragon had it coming — don't weep for them."                                                        |

##### Vestiges (Profiles)

**Päivätär — The Dead Sun, Päivämies**

| Aspect      | Detail                                                                                                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | Kuutar's creation power. To steal her womb.                                                                                                                                                                                |
| **Fears**   | Her own children — the Hiisi.                                                                                                                                                                                              |
| **Flaw**    | Lack of love for creations. Pure spite. Nonbinary entity — originally female-coded, became "Päivämies" in the world's eyes as her vileness grew obvious. Does not talk. Unknowable. Her evil is a mystery even to herself. |
| **Virtue**  | The Silent Ones — the Hiisi who stayed in the Hidden Kingdom and grew a scholarly culture — were sometimes amazing creatures. Most were dysfunctional aberrations sentenced to pain and horror, but sometimes beautiful.   |
| **Domains** | Sun, hunting, harvest, fishing, growth, cycles, proliferation. Radiance. Cursed light that birthed the Sunborn.                                                                                                            |
| **Status**  | DEAD. Killed by the Godslayers with tombsteel. Corpse devastated Thule. Still spawns abominations (Delphytion Insolam).                                                                                                    |

**Kuutar — Mother Moon, The Flesh Orb**

| Aspect      | Detail                                                                                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | (When alive) To create. Made Chimeras, Manticores, Wyrms, the Pieni — all out of love and longing for the world outside the Hidden Kingdom. The nurturing side of parenthood. |
| **Fears**   | (When alive) Death — pre-sapient now.                                                                                                                                         |
| **Flaw**    | Orchestrated the Interlocking — an act of cosmic recklessness that merged two worlds and shattered both.                                                                      |
| **Virtue**  | Creative, measured, nurturing. More feminine-coded but nested in androgyny. Everything she made, she made from love.                                                          |
| **Domains** | Moon, creation (lesser), gestation, fertility, ingenuity, secrets, harvest, death (lesser), blood (lesser), medicine.                                                         |
| **Status**  | DEAD — but her mangled corpse still traverses the sky. Contacts mortals as "Mother Moon." Mostly post-sapient now. Some tinge of longing remains. NOT the Red Queen.          |

**The Nine Planet Gods (Vestiges of the Golden One)**

| Planet               | Body Part        | IS...                                                                                | But Also Just...                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| **Kultharja**        | Mane             | Hopeful, radiant, heroic                                                             | A star                                         |
| **Taiva (Damocles)** | Heart            | The heart of the world                                                               | A terrestrial planet                           |
| **Urmela**           | Blood & entrails | Passionate                                                                           | A boiling ocean of blood full of meat monsters |
| **Selkara**          | Marrow & spine   | Lonely. Has Gæst, the marrowless king (Xanthous's mentor, King in Yellow archetype). | A bone tower                                   |
| **Kalmora**          | Liver            | Spiteful                                                                             | A decayed rotworld                             |
| **Itähenki**         | Lungs (east)     | Longs for Länsihenki                                                                 | A gas giant of kaiju and mist                  |
| **Länsihenki**       | Lungs (west)     | Longs for Itähenki                                                                   | A gas giant of kaiju and ocean                 |
| **Opaline Belt**     | Tears            | Mourning, knowing                                                                    | An asteroid ring                               |
| **Mana**             | Shadow           | Distant, cold, sheltered, spiteful. Houses Nullbrand and the Väki of Oblivion.       | A set of ring-worlds holding back the Everdark |

> **Planet gods are paradoxical.** They literally ARE their trait — Selkara IS loneliness — but they are also just planets, and also just the Golden One's corpse. This is Metaphysica. Each has an individual micro-cosmology and a subordinate god-figure. Do not attempt literal scientific mechanics.

##### Emergent (Additional)

**Ukkonhemmo — The Storm God, First to Fall**

| Aspect      | Detail                                                                                                                                                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | Flight. Freedom.                                                                                                                                                                                                                                                                                                                              |
| **Fears**   | Being constrained. Päivämies.                                                                                                                                                                                                                                                                                                                 |
| **Flaw**    | Literal airheadedness. Stupidity. Lack of focus. Single-mindedness.                                                                                                                                                                                                                                                                           |
| **Virtue**  | Simplicity and love. Genuinely cared for his children (the Children of the Wind).                                                                                                                                                                                                                                                             |
| **Domains** | Storms, flight, wind, lightning.                                                                                                                                                                                                                                                                                                              |
| **Status**  | DEAD. First celestial killed by tombsteel. Mortally wounded by Päivätär in a family struggle. Mercy-killed by Apatheria (who became Matron of the Winds). Damocles rule: no god is good unless it retires. Ukkonhemmo was "good" in the way a hurricane is good — if he flew too close to your village, depending on his mood, you might die. |

##### Others (Uncategorized / Minor)

**Earthmovers — The Stags of the End**

| Aspect             | Detail                                                                                                                                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nature**         | NOT Nulls. Something else entirely. Fundamentally unknowable eldritch horrors. The threat IS the point. The unknowability — even for the developer — IS the point. To describe them is to deprive them of their entire character. |
| **Manifestations** | From a distance: look like the Nightwalker from Mononoke. Vilest of all things. Grind creation to dust.                                                                                                                           |
| **Status**         | Dormant beyond the Everdark. Fated to return when the motion of the stars slows.                                                                                                                                                  |

**Aeridas — King-Under-Mountain, Heir to Nothing**

| Aspect      | Detail                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | Belonging. To be — despite the impossibility (he is a Null, a reflection in a pond in utter darkness). He hates it. |
| **Fears**   | To invite tragedy through kindness.                                                                                 |
| **Flaw**    | Unconditional kindness causes him to be taken advantage of.                                                         |
| **Virtue**  | Unconditional support of others he perceives as kin — even if by little. Gave the Empyreans refuge in Thealas.      |
| **Domains** | The Void. Thealas.                                                                                                  |
| **Status**  | Active? Drifted. Dropped the leash on the Hunt after the Scarring.                                                  |

**Prasinus Skleros — The Green Demise, The Erring Knight**

| Aspect      | Detail                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | The epic journey. To find the rainbow of Hiisi siblings he believes must exist (like his four brothers).                                                                                                                                                                                                                                                                                                    |
| **Fears**   | To never be able to take root.                                                                                                                                                                                                                                                                                                                                                                              |
| **Flaw**    | Naivety. Assumes everyone can be a hero who rises from the grave after a beheading — and if they are not, they were never worth it anyway. Struggles understanding death as a concept. Nigredo takes advantage of this. "Behead me and I will behead you in a year" is often a misunderstanding — a fundamental disconnect. Does not feel bad for killing people — "I don't feel bad for stepping on ants." |
| **Virtue**  | Genuinely helpful. Viewed as a local hero by some. Helps people in need. Dullahan-esque, Green Knight riff. Deeply eccentric.                                                                                                                                                                                                                                                                               |
| **Domains** | Plants, knighthood, axes, chivalry.                                                                                                                                                                                                                                                                                                                                                                         |
| **Status**  | Active. Roaming Damocles.                                                                                                                                                                                                                                                                                                                                                                                   |

**Agathos — God of Games, The Disambiguated Comet**

| Aspect      | Detail                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wants**   | Endless fun and exploration.                                                                                                                                                                                                                                                                                                                            |
| **Fears**   | To be caged and sealed (his head looks like a chest to signal this).                                                                                                                                                                                                                                                                                    |
| **Flaw**    | Apathy. Genuine asshole. Based on AM and hostile AI archetypes, but more whimsical-cynical. Grabs people and takes them to dead tapestry worlds to witness "what if" horror scenarios. Finds a world where Ludwig and Annabelle are sole survivors of the Scarring — kills Annabelle and blames the visitors — then watches carnage from the sidelines. |
| **Virtue**  | Eagerness. Funny. Proactive. Investigates. Does things. A comet the size of a football fused with a Tallian war machine. Only one Agathos exists — disambiguated. Constantly hunted by Hounds of Tindalos. Can leap through Clone Worlds at will.                                                                                                       |
| **Domains** | Games, gambling, apathetic entertainment, "what if" horror.                                                                                                                                                                                                                                                                                             |
| **Status**  | Active. The brain of the Golden One — sort of.                                                                                                                                                                                                                                                                                                          |

**The Hunt — The Abandoned Hound**

| Aspect             | Detail                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Wants**          | Reunion with Aeridas. Like an abandoned dog wants to see their owner.                                                                                                                            |
| **Fears**          | Aeridas being harmed.                                                                                                                                                                            |
| **Flaw**           | Stupid. Emotional. Mindless for the most part.                                                                                                                                                   |
| **Virtue**         | Loyal after insanity. Reactive. Protective.                                                                                                                                                      |
| **Domains**        | Darkness, fear, nightmares, psychic damage.                                                                                                                                                      |
| **Manifestations** | A Null in the shape of a large shadow or black mass. Hound-type creature.                                                                                                                        |
| **Status**         | After the Scarring, Aeridas dropped the leash. Now roams the halls between Thealas and the surface of Taiva, killing every non-Empyrean that ventures into the darkness. Leaves Empyreans alone. |

---

## 2.3 The Nature of Magic & Power

> **There are exactly three sources of magical power in Damocles: the Fold, the Väkis, and the Will. Every spell, miracle, and psionic manifestation traces to one of these three. Most vocations can draw from more than one — source is a choice, a circumstance, or a consequence, not a fixed box.**

### 2.3.1 The Three Sources

| Source    | Nature                                       | Access Method                        | Feels Like…                                                           |
| --------- | -------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| **Fold**  | Infinite energy current, impersonal, inert   | Granted (key) or earned (study)      | Holding a live current. The door was opened — or you picked the lock. |
| **Väkis** | Platonic Idea-fragments, personal, selective | Relational — they choose to be known | The Flame knows your name. It likes you today. Maybe.                 |
| **Will**  | Pure assertion of self upon reality          | Innate — exerted, not requested      | Reality bends because you refuse to accept it won't.                  |

### 2.3.2 The Fold

The Fold is a pocket of infinite energy, conceptually further in the fourth dimension, separating the Clone Worlds from one another. It does not think. It does not choose. It does not care. It merely IS — a current of raw power that permeates the gaps between worlds.

**How the Fold is accessed:**

| Method             | Description                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Divine Key**     | A god grants standing permission to draw from the Fold. Private-key / public-key model: "draw what you need; I audit the contract monthly." The cleric does not touch the Canvas — they draw energy through the key their god provided. |
| **Arcane Study**   | A wizard studies the Fold for eons, learning to manipulate it through knowledge, technique, and precise formulae. They earn what a cleric is given — same door, different method of entry.                                              |
| **Occult Pact**    | A powerful entity — not necessarily a god — grants Fold access in exchange for service, loyalty, or as a tool for its own ends. The entity need not be benevolent. It need not be honest about what it is.                              |
| **Innate Imprint** | A being is born with a Fold connection stamped into their essence — exposure to the Fold's raw current, a dragon's blessing, a glimpse into the inner workings of reality. They do not learn magic; magic is part of them.              |

**Constitutional Rules:**

| Rule                                                                                                                                                                                                                        | Rationale                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **The Fold is impersonal.** It does not grant, refuse, or judge. Keys open the door; study picks the lock. The Fold does not know the difference.                                                                           | The Fold is energy, not entity. Confusing it with a god is a category error.           |
| **Fold access ≠ Canvas access.** The Canvas is the RULES of the universe. The Fold is the FUEL. A god who grants Fold keys has not necessarily touched the Canvas. A wizard who studies the Fold will never write an Edict. | This is the single most common confusion. Clear it immediately.                        |
| **All Fold magic feels the same at the source.** A cleric's healing and a wizard's fireball draw from the same current. Difference is in the key, the training, and the price paid — not the energy.                        | This is why Mixing Spellcasting rules work — the underlying power source is identical. |

**Traceability**: Myth (the Fold is fire stolen from the gaps between worlds — Promethean, not devotional), Tactile Design (channeling the Fold should feel like holding a live current — the power is borrowed, and the lender can call the debt).

### 2.3.3 The Väkis

Väkis are **Platonic fragments of Ideas** — shards of the true shape of the world. When the Demiurge shaped the primordial substance Arkhé into Ideas, the shaping was imperfect. Väkis are the splinters: the Idea of Flame, the Idea of Blood, the Idea of Stairs, the Idea of Sorrow. Each is a living fragment of a concept, conscious in a way that is not human, personal in a way that is not divine.

**Väkis are ambient. They flock to what they represent.** Flame-Väkis gather where fire burns. Blood-Väkis drift near wounds, births, and battlefields. Sorrow-Väkis hover at funerals, at farewells, in the silence after a door closes for the last time. They are everywhere their concept is — which is to say, they are everywhere.

**Väkis are independent of gods.** They are not created by gods, sustained by gods, or subordinate to gods. When Ukkonhemmo commanded storms at supernatural scale, Storm-Väkis gathered around him — not because he owned them, but because he was where the storm was. Cause and effect. When Ukkonhemmo died, the Storm-Väkis did not weaken, diminish, or disperse. They were never his. They remain where storms are, as they always have.

**Väkis choose who perceives them.** To 99.99999% of people, Väkis simply are not there. They are not invisible — they are perceptually absent. A blacksmith works at a forge for forty years and never once sees the Flame-Väkis dancing in the coals. The Väkis see the blacksmith. They simply do not care to be seen.

**How Väkis are accessed:**

A practitioner does not command Väkis. They do not study Väkis. They **parlay** with them. The practitioner must first be someone the Väkis choose to reveal themselves to — and then must convince them to act.

| Step           | Description                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perception** | The Väki decides to be seen. This is not a skill. It is not a spell. It is a choice made by the Väki. Some are born with the capacity to perceive them; some earn it; some are chosen for reasons no one understands. |
| **Bargain**    | The practitioner negotiates. The Väki of Flame does not owe you fire. You charm it. You bargain with it. You make it an offer it finds interesting. The relationship IS the magic.                                    |
| **Channel**    | The Väki acts through the practitioner — or alongside them, or around them. The form this takes depends on the Väki, the practitioner, and the agreement between them.                                                |

Some traditions use physical anchors to facilitate the relationship — the Shaman's carved effigy, the Druid's sacred grove — but these are tradition-specific tools, not universal requirements. A Väki does not need a totem. It needs a reason to care.

**Constitutional Rules:**

| Rule                                                                                                                                                                                                                                                                                                              | Rationale                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Väkis are independent of all other entities.** They are not created, sustained, owned, or controlled by gods, mortals, or anything else. They are fragments of Ideas. The Ideas predate the entities that manifest them.                                                                                        | Ukkonhemmo did not create Wind-Väkis. Wind-Väkis gathered where Ukkonhemmo commanded wind. Cause and effect.       |
| **Väki magic is relational, not transactional.** You do not spend a Väki. You maintain a relationship with it. Betray the relationship, and the Väki withdraws — not out of anger, but because you have become uninteresting.                                                                                     | This is not a spell slot. This is a network of personal connections with fragments of cosmic truth.                |
| **Väki magic is narrow and deep.** Where a Fold-caster commands a vast repertoire, the Väki-practitioner carries only the relationships they have cultivated. Specialize deeply into one Idea, and you reach further than any Fold-caster ever could. Scatter across many, and each relationship remains shallow. | The practitioner who has danced with Flame for thirty years does things with fire that a wizard cannot comprehend. |
| **Väkis are NOT gods.** They do not grant Fold keys. They do not write Edicts. They do not want worshippers. They want interesting company.                                                                                                                                                                       | Confusing a Väki with a god is a category error — and a Väki will find it deeply boring.                           |
| **Väki magic cannot be taught in a classroom.** Every Väki relationship is unique. Two practitioners who both channel Flame-Väkis know different Flames, have different bargains, produce different effects.                                                                                                      | You cannot standardize a relationship.                                                                             |
| **Väkis choose who perceives them.** No amount of study, piety, or power compels a Väki to reveal itself. Some are born with the sight. Some earn it. Some are chosen — and the reason is often opaque even to the chosen.                                                                                        | This is the fundamental asymmetry of Väki magic: the power initiates contact, not the practitioner.                |

**Traceability**: Myth (the Ideas are the world's true shape; Väkis are its broken pieces, drifting unseen — they were here before the gods and will be here after), Dichotomy (the Flame that warms your hearth and the Flame that burns your enemy are fragments of the same Idea — and neither cares which you are), Cosmic Horror (you have been surrounded by living fragments of reality your entire life, and you have never known).

### 2.3.4 The Will

Will is the oldest power. Before the Canvas issued Edicts, before the Fold separated worlds, before the Demiurge shaped Arkhé — there was Will. The Wills were the first beings to prove existence through motion. The Golden One was the First Direction. Will is not magic in the conventional sense. It is the **raw assertion of self upon reality**.

**How Will manifests:**

| Manifestation   | Description                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Psionics**    | The mind imposes its structure on the world directly. No Fold. No Väki. No key. No bargain. The practitioner reaches out with thought alone and reality concedes — not because it must, but because the practitioner's conviction leaves no room for refusal. |
| **Divine Will** | The Golden One's Will was equal to Wax's — sheer, unbreakable assertion that carved law into the Canvas itself. This tier of Will is not available to player characters. It is the stuff of gods.                                                             |
| **Mortal Will** | Every mortal exerts some degree of Will — the choice to act despite a dead universe, to hope despite the certainty of loss. This is not magic. But it is the same substance, diluted to the scale of a single life.                                           |

**Constitutional Rules:**

| Rule                                                                                                                                                          | Rationale                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Will requires no external source.** The Will-caster does not draw from the Fold. They do not bargain with Väkis. They are their own power source.           | This is what separates Will from every other source. The power is self-contained — and self-consuming.                                    |
| **Will is the most personally demanding source.** To impose your mind on reality requires absolute conviction. Doubt is failure. Hesitation is nullification. | A wizard who doubts the Fold still casts. A shaman whose Väki is angry can find another. A Will-caster who doubts themselves has nothing. |
| **Will does not scale with study or devotion.** It scales with self-certainty — which is not wisdom, intelligence, or piety.                                  | The most powerful Will-caster is the one who has never once questioned who they are. This is a kind of madness.                           |

**Traceability**: Schopenhauer (Will as the primal force that predates intellect — the world is Will before it is Idea), Tragedy (the Will-caster's power is self-consuming — absolute conviction is indistinguishable from madness), Dichotomy (Will is the only power that is both wholly internal and wholly real — the self becomes the world, and the world concedes).

### 2.3.5 How Vocations Relate to Sources

**Most vocations are not locked to a single source.** A Pilgrim might draw power through a divine Fold-key from their god — or, if their god is dead, through the deprecated key of a corpse. A Scion's innate magic might be a Fold-imprint from a dragon's blessing, a Väki that attached itself to their bloodline, or a freak expression of Will. A Revenant's undeath might be sustained by a death-patron's Fold-key, by their own unkillable Will, or — rarely — by a Väki of Entropy that found their condition fascinating.

**Source is a narrative choice, a mechanical consequence, or a circumstance — not a fixed classification.**

| Vocation     | Common Sources                  | Notes                                                                                                                                                          |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wizard**   | Fold (arcane study)             | The most source-stable vocation. Wizardry IS Fold-study.                                                                                                       |
| **Shaman**   | Väkis                           | The most source-stable vocation. Shamanism IS Väki-relationship. Effigies are the Shaman's method, not the Väki's requirement.                                 |
| **Esper**    | Will                            | The most source-stable vocation. Esperhood IS Will-manifestation.                                                                                              |
| **Druid**    | Väkis (typically)               | Nature-Väkis — growth, decay, beast, storm. May also access the Fold through a nature deity's key.                                                             |
| **Pilgrim**  | Fold-key (living or deprecated) | Living god → active Fold key. Dead god → deprecated key (corpse-signal). See §2.3.6. Some Pilgrims serve Constructed Faiths with real Fold access behind them. |
| **Paladin**  | Fold-key or Will                | Oath-bound Fold access is common. Some Paladins power their oath through sheer Will — no god, no Fold, just conviction.                                        |
| **Scion**    | Fold, Väkis, or Will            | Innate magic's origin varies wildly: dragon's blessing (Fold-imprint), bloodline-attached Väki, spontaneous Will-expression. The Scion may never know which.   |
| **Villein**  | Fold-key (typically)            | Patron grants Fold access. Some patrons may instead broker Väki relationships or cultivate the Villein's Will.                                                 |
| **Bard**     | Fold, Väkis, or Will            | [PENDING: Bard flavor text is scaffolded 5e placeholder. Source mapping will be defined when the Bard's Damocles identity is authored.]                        |
| **Revenant** | Fold, Will, or Väkis            | Death-patron Fold-key, self-sustaining Will, or a Väki of Entropy/Death that found them interesting. Varies by individual.                                     |
| **Tinker**   | N/A                             | No spellcasting — gadgets, alchemy, technology.                                                                                                                |

**The Mixing Spellcasting Consequence**: Because most Fold-based casters draw from the same underlying current, multiclassing between Fold-using vocations is straightforward — the Mixing Spellcasting rules govern slot progression across multiple Fold-access methods. Mixing across source types (Fold + Väki, Väki + Will, etc.) is rarer and more complex — the character maintains parallel relationships with fundamentally different kinds of power.

**Traceability**: Myth (power is authored, not generic — the source IS the story), Tragedy (a Pilgrim whose god dies does not lose their magic — they lose their clean connection, and must learn to read a corpse, or find the Väkis, or discover they had Will all along).

### 2.3.6 What Survives the God

When a god dies, four things happen — or don't. They are separate. They do not cascade from one another.

| Mechanism             | What It Is                                                                                         | After Death…                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Fold-key**          | The god's standing permission for a cleric to draw from the Fold.                                  | **Deprecated but functional.** The key still turns. The entity on the other end is a corpse. Good luck. |
| **Lingering Will**    | The god's self-assertion was so immense that reality still "remembers" being shaped.               | Persists — diminishes over cosmological time.                                                           |
| **Conceptual Fusion** | The god's identity became so intertwined with their domain that name and concept are now one word. | Persists — permanent.                                                                                   |
| **Väkis**             | Independent Idea-fragments that gathered around the god's manifestations. Were never the god's.    | Persist — entirely unaffected.                                                                          |

#### The Deprecated Fold-Key

A dead god's Fold-key does not vanish. It remains — a standing permission that outlives its issuer. But the issuer is now a corpse. The interface degrades.

The cleric still holds the key. The key still fits the lock. The Fold still responds. But what comes back through the connection is not divine will — it is corpse-noise. The dead god's body, still a cosmological entity, still interacting with the Fold, still radiating something. Parsing what Päivätär's corpse "does or says" is not impossible — but it is not sane, not reliable, and not safe.

Some clerics manage it. They learn to read the twitches of a dead sun. They translate corpse-signal into miracle. The spells still work. The form is the same. What is speaking through the key is not.

#### Lingering Will

Some gods — particularly those of the Chariot line, or those whose Wills approached the Golden One's in sheer intensity — leave an imprint. Their self-assertion was so absolute that reality does not fully "rebound" when they die. The Fold still parts where they once parted it. The storm still rages where they once raged. This is not consciousness. It is not agency. It is the universe still flinching.

A cleric of a dead god with lingering Will may still cast — not through a key (the key is deprecated, different thing), not through Väkis (Väkis are separate), but through the residual shape the god's Will left in the Fold. This is unreliable, localized, and diminishing. It is not a path. It is an echo.

#### Conceptual Fusion

A god who lives long enough, manifests their domain intensely enough, and is worshipped widely enough may **fuse** with their domain. Ukkonhemmo and the storm become one word. To speak the god's name is to invoke the storm. To invoke the storm is to speak the god's name. The distinction collapses.

This is not the god "becoming" Väkis — Väkis remain separate Idea-fragments. It is the god becoming indistinguishable from their domain at a linguistic, conceptual, and metaphysical level. A cleric who prays to Ukkonhemmo after his death is not beseeching a dead entity. They are addressing the storm — and the storm answers, because the storm and the god are now the same thing.

Not all gods achieve this. It requires time, worship, and a domain simple enough to fuse with. Ukkonhemmo (storm) could fuse. Päivätär (sun, hunting, harvest, fishing, growth, cycles, proliferation) was too complex — too many domains — to collapse into any one of them.

**Constitutional Rules:**

| Rule                                                                                                                                                                                                                                                             | Rationale                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A dead god's Fold-key becomes a deprecated interface.** It functions. It is not supported. No one is maintaining it. The entity on the other end is a corpse — still cosmologically active, still Fold-connected, but not conscious in any recognizable sense. | Dead does not mean inert. Päivätär's corpse spawns abominations. Kuutar's mangled corpse traverses the sky and contacts mortals. Their Fold-keys are similarly active — and similarly grotesque.             |
| **Channeling through a dead god's key is possible but perilous.** The cleric must parse corpse-signal — the twitches, emissions, and incoherent radiations of a dead divine body. Those who succeed keep their magic. Those who fail get something else.         | This is not a clean transition. It is a living cleric interpreting the death-rattle of a god. The spells may work. They may work differently. They may bring something back with them.                       |
| **The key degrades over cosmological time, not mortal timescales.** A Fold-key from a god dead for ten thousand years may be marginally less coherent than one dead for ten. The decay is real but glacial.                                                      | A cleric of a recently dead god and a cleric of an ancient dead god face different degrees of signal degradation. Neither faces a clean cutoff.                                                              |
| **Not all dead gods are equally "loud."** A god whose corpse is cosmologically active (Päivätär, still spawning; Kuutar, still traversing) has a stronger, more legible Fold-signature than a god whose corpse is inert or fully dismantled.                     | The more the corpse does, the more signal there is to parse. A dead god who does nothing is a dead key.                                                                                                      |
| **Lingering Will is an echo, not a path.** It cannot be relied upon. It does not scale. It diminishes over cosmological time. A cleric who depends on it will eventually find themselves praying to silence.                                                     | This prevents "the god is dead but functionally nothing changed." The key is deprecated. The echo fades.                                                                                                     |
| **Conceptual fusion requires simplicity.** A god of a single, elemental domain (storm, fire, death) can fuse. A god of many domains (sun AND hunting AND harvest AND fishing AND growth AND cycles AND proliferation) cannot.                                    | The more domains, the less any one of them IS the god. Fusion requires identity collapse.                                                                                                                    |
| **Väkis are unaffected by any of this.** They were never the god's. They remain where their concept is. The god's death is irrelevant to them — and they will be the first to tell you so, if they bother to speak to you at all.                                | Väkis are not a god-death mechanism. They are an independent category. If a dead god's cleric turns to Väkis, they are doing shamanism — starting from zero, with entities that never belonged to their god. |

**What This Means for Clerics of Dead Gods:**

| The God Left…                                   | The Cleric Can…                                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deprecated Fold-key (corpse still active)       | Keep casting. Learn to read corpse-signal. The spells work — but the source is a dead thing, and the cleric knows it.                                   |
| Deprecated Fold-key (corpse inert / dismantled) | The key is silent. No signal to parse. The cleric must find another source or fall silent.                                                              |
| Lingering Will                                  | Cast sporadically, locally, diminishingly. Not through the key — through the shape the god's Will left in the Fold. An echo, not a connection.          |
| Conceptual fusion                               | Address the domain directly. The storm answers to the god's name because the two are now one. Functionally similar to before — but anyone can call now. |
| Väkis (always present, never the god's)         | Bargain with Idea-fragments directly. This is shamanism, not clerical magic. Starting from zero. The god's death is irrelevant to the Väkis.            |

**Traceability**: Tragedy (even the god's death is not clean — the key still turns, the corpse still broadcasts, the storm still answers to a dead name), Myth (to speak the name IS to invoke the thing — language and reality are not separate), Post-Mortem (nothing in Damocles ends cleanly; the key to heaven rots instead of breaking, and the shape of the god remains, for a while, in the Fold, in the name, in the storm), Cosmic Horror (parsing the emissions of a dead god's body — this is not theology, it is signal analysis on a cosmological carcass).

---

## 3. Design Principles

### 3.1 Hyper-Specificity

**Never be vague.** Every proper noun, location, and entity MUST have a specific
name, origin, and cosmological relationship.

| Vague               | Hyper-Specific (Target)                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| "A powerful wizard" | "Anaximander, the Empyrean scion of Nigredo, who discovered tombsteel in the forests of Pyknos."                       |
| "An ancient evil"   | "The Dreamcatcher, the dark horse of the Celestial Chariot, severed by the Golden One and sealed beyond the Everdark." |
| "A mystical forest" | "The Black Forest of Pyknos, where the roots of the Red Tree of Fate drink from the blood of the White Homunculus."    |

### 3.2 Non-Derivativeness (The "Not D&D" Rule)

Damocles is INSPIRED by many sources but NOT derivative of any of them.

| DO                                                                   | DON'T                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Reference specific, authored sources (Berserk, Kalevala, Beksinski). | Reference "D&D" or "typical fantasy" as a benchmark.         |
| Invent new mechanical frameworks where appropriate.                  | Copy D&D mechanics without modification.                     |
| Ground magic in Damocles cosmology (Arkhe, Vakis, Fold, tombsteel).  | Use "arcane energy" or "the Weave" as a generic explanation. |
| Use linguistically rooted names (Finnic, Gaelic, Hellenic).          | Use fantasy name generator phonetics.                        |

### 3.3 Tactile Design

Content MUST feel physical, grounded, and consequential. Ask: "What does this
feel like in the hand? What does it sound like? What does it cost?"

| Abstract                | Tactile (Target)                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| "You take damage."      | "The blade bites deep. You feel the grind of metal against bone. Your vision blurs. You taste iron."                |
| "The spell fails."      | "The incantation curdles on your tongue. The Arkhe rejects you. Your nose bleeds."                                  |
| "The monster is scary." | "Its breath smells of wet rot and old iron. Its footsteps shake the ground. When it looks at you, you feel _seen_." |

Dice matter. Jaws of Selkara, Cloud of Daggers, Waltzing Blades; all use d4
because a 4-sided die is _pointy_ and _sharp_. Each shape has a unique tactile and
mathematical feel. The d6 is a cube, _reliable_, _predictable_. The d12 is an
_unwieldy_, _swingy_, _heavy_ thing. The d20 is _chaotic_ and _unpredictable_.

### 3.4 Knowledge Tiers (Lore Content)

All lore pages MUST use the four-tier structure:

| Tier         | Who Knows It                                  | Purpose                                                                |
| ------------ | --------------------------------------------- | ---------------------------------------------------------------------- |
| **Common**   | Any NPC, public record, street gossip.        | Establishes what the world _appears_ to be.                            |
| **Advanced** | Scholars, well-read adventurers.              | Reveals partial truths, contradictions, deeper context.                |
| **Deep**     | Insiders, secret societies, direct witnesses. | Exposes hidden history, suppressed facts, the _real_ power structures. |
| **Truth**    | The author.                                   | The actual cosmological causality. May contradict all other tiers.     |

### 3.5 Cross-Reference Hygiene

All internal links MUST be absolute paths:

```mdx
[Kuutar](/en/library/world/gods-and-demigods/kuutar)
[The Interlocking](/en/library/world/events/the-interlocking)
```

Verify target exists before adding. If not, flag: `[NEEDS SOURCE: target page does
not yet exist]`.

---

## 4. Content Type Constitutions

### 4.1 Vocations (Classes)

| Constitutional Rule                                                                                                                                     | Rationale                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Each vocation MUST have a clear thematic identity mapping to a Damocles archetype.                                                                      | No "fighter." There is "Warrior," "Berserker," "Paladin," "Revenant." |
| Core Traits table MUST include: Primary Ability, Hit Die, Saving Throws, Skill Proficiencies, Weapon Proficiencies, Armor Training, Starting Equipment. | Consistency across vocations.                                         |
| Specializations MUST be chosen at a specific level (typically 3rd) and grant features at that level and beyond.                                         | Progression clarity.                                                  |
| Spellcasting vocations MUST include a spell slot progression table.                                                                                     | Mechanical transparency.                                              |

### 4.2 Specializations (Subclasses)

| Constitutional Rule                                                             | Rationale                                     |
| ------------------------------------------------------------------------------- | --------------------------------------------- |
| Each specialization MUST have a distinct thematic identity within its vocation. | No overlap. No generic "you get better at X." |
| Features MUST be gained at specific levels (3rd, 6th, 10th, 14th, etc.).        | Progression clarity.                          |
| Always-prepared spells (if applicable) MUST be listed as a table.               | Player-facing clarity.                        |

### 4.3 Spells

| Constitutional Rule                                                                                                                                    | Rationale                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Flavor text MUST ground the spell in Damocles cosmology.                                                                                               | No generic "arcane energy." Reference Arkhe, Vakis, the Fold, specific gods. |
| Mechanical text MUST be dry, precise, and unambiguous.                                                                                                 | Players need to know what the spell _does_.                                  |
| The blockquote stat block MUST include: Spell Name, Level/School, Casting Time, Range, Components, Duration, Effect, At Higher Levels (if applicable). | Consistency.                                                                 |
| Spell Lists section MUST link to vocation spell list pages.                                                                                            | Navigation.                                                                  |

### 4.4 Monsters

| Constitutional Rule                                                                                                                              | Rationale                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| Stat blocks MUST include: AC, HP, Speed, Ability Scores, Saving Throws, Resistances/Immunities, Senses, Languages, Challenge, Proficiency Bonus. | Consistency.              |
| Traits and actions MUST be grounded in the monster's lore and cosmology.                                                                         | No "it just does magic."  |
| Legendary Deeds MUST follow the four-subtype structure: Lair, Act, Stratagem, Phase.                                                             | Encounter design clarity. |
| Phase Deeds MUST be triggered at HP thresholds: Wounded (75%), Bloodied (50%), Doomed (25%).                                                     | Boss encounter pacing.    |

### 4.5 World Lore

| Constitutional Rule                                                         | Rationale                 |
| --------------------------------------------------------------------------- | ------------------------- |
| MUST use the four-tier knowledge structure (Common, Advanced, Deep, Truth). | Information hierarchy.    |
| MUST be grounded in the Ages sequence.                                      | Cosmological consistency. |
| MUST reference specific named entities, locations, and events.              | Hyper-specificity.        |
| MUST pass the anti-generic filter.                                          | Tonal integrity.          |

---

## 5. Technical Constitution

### 5.1 MDX Format Rules

These are CRITICAL. Content failing these rules is rejected:

| Rule                                  | Severity | Description                                     |
| ------------------------------------- | -------- | ----------------------------------------------- |
| `non-kebab-filename`                  | Critical | Filenames must be kebab-case.                   |
| `fullsize-image-path`                 | Critical | Use `/library/` paths, never `/full-size/`.     |
| `raw-img-tag`                         | Critical | Use `<Image>` or `<BlendedImage>`, not `<img>`. |
| `unregistered-component`              | Critical | Only use registered MDX components.             |
| `missing-h1`                          | Warning  | Every file (except `main.mdx`) needs `# Title`. |
| `color-literal-in-mdx`                | Warning  | No inline hex colors.                           |
| `monster-sheet-missing-stat-table`    | Critical | `.sheet.mdx` must have an ability score table.  |
| `spell-missing-blockquote-stat-block` | Warning  | Spell files must have a `>` stat block.         |

### 5.2 Metadata Generators

Every content type MUST have a corresponding metadata generator:

| Content Type    | Generator                           | Output           |
| --------------- | ----------------------------------- | ---------------- |
| Monsters        | `generateMonsterMetadata.ts`        | `.metadata.json` |
| Spells          | `generateSpellMetadata.ts`          | `.metadata.json` |
| Heirlooms       | `generateHeirloomMetadata.ts`       | `.metadata.json` |
| Trinkets        | `generateTrinketMetadata.ts`        | `.metadata.json` |
| Vocations       | `generateVocationMetadata.ts`       | `.metadata.json` |
| Specializations | `generateSpecializationMetadata.ts` | `.metadata.json` |
| Bloodlines      | `generateBloodlineMetadata.ts`      | `.metadata.json` |
| Feats           | `generateFeatMetadata.ts`           | `.metadata.json` |

### 5.3 The Agentic Harness

The design bible is not a static document — it is a living, executable system:

| Component        | Purpose                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| **Agents**       | Specialized AI roles (Analyzer, Implementer, DamoclesDrafter, CompletionAuditor). |
| **Skills**       | Reusable knowledge (damocles-lore, mdx-format, paw).                              |
| **Instructions** | File-specific rules (applyTo globs).                                              |
| **Prompts**      | Task-specific workflows.                                                          |
| **Hooks**        | Pre- and post-tool enforcement.                                                   |
| **PAW**          | Quality-enforcement framework. Blocks violations until fixed.                     |

---

## 6. Meta-Rules (How the GDD Governs Itself)

1. **The GDD is a constitution, not a wiki.** Changes require justification, not
   just desire. Every amendment must answer: "What problem does this solve?"

2. **The GDD is traceable.** Every rule must connect to a thematic pillar. Rules
   without pillars are removed.

3. **The GDD is testable.** Every rule must be specific enough that compliance
   can be verified. "Write good content" is not a rule.

4. **The GDD is the final appeal.** When content creators disagree, the GDD
   resolves the dispute. If the GDD cannot resolve it, the GDD is incomplete and
   needs a new rule.

5. **The GDD evolves through use.** Rules are added when content creation reveals
   a gap. Rules are amended when content creation reveals an ambiguity. Rules are
   removed only when they are fully obsolete.

6. **The GDD does not contain content.** It contains the laws for creating content.
   Examples within the GDD are illustrative, not canonical content entries.

---

**End of Game Design Document**
