# Metadata Generation System Architecture

**Purpose**: Complete documentation of the metadata extraction, storage, serving, and consumption pipeline for Damocles game content.

## System Overview

The metadata system extracts structured data from human-readable MDX content files and serves it in stages:

1. **Build-Time Generation**: Parse `.mdx` files → generate `.metadata.json` files (optionally persist to PostgreSQL with `--persist`)
2. **Domain Schema**: Typed record per content type in `src/lib/db/content/schemas/`
3. **Storage Adapters + Repositories**: `fs` and `pg` adapters behind one repository port per content type
4. **Runtime API Layer**: Next.js routes resolve the repository for the requested locale
5. **Table Layer**: `src/modules/metadata-tables/` fetches rows and renders `MetadataTable`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: BUILD-TIME GENERATION (Node.js)                    │
│                                                              │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │ .sheet.mdx   │──────parse────────▶│ .metadata.   │       │
│  │ (monsters)   │                    │ json         │       │
│  └──────────────┘                    └──────────────┘       │
│                                                              │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │ .mdx         │──────parse────────▶│ .metadata.   │       │
│  │ (heirlooms)  │                    │ json         │       │
│  └──────────────┘                    └──────────────┘       │
│                                                              │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │ .mdx         │──────parse────────▶│ .metadata.   │       │
│  │ (spells)     │                    │ json         │       │
│  └──────────────┘                    └──────────────┘       │
│                                                              │
│  Scripts: scripts/metadata/generateMonsterMetadata.ts,       │
│           scripts/metadata/generateHeirloomMetadata.ts,       │
│           scripts/metadata/generateSpellMetadata.ts,          │
│           scripts/metadata/generateTrinketMetadata.ts,        │
│           scripts/metadata/generateBloodlineMetadata.ts,      │
│           scripts/metadata/generateVocationMetadata.ts,       │
│           scripts/metadata/generateSpecializationMetadata.ts, │
│           scripts/metadata/generateFeatMetadata.ts,           │
│           scripts/metadata/generateWorldMetadata.ts,          │
│           scripts/metadata/generateRulesMetadata.ts           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: RUNTIME API (Next.js API Routes)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ GET /api/monsters?locale=en                      │       │
│  │ GET /api/heirlooms?locale=en                     │       │
│  │ GET /api/spells?locale=en                        │       │
│  │ GET /api/bloodlines?locale=en                    │       │
│  │ GET /api/trinkets?locale=en                      │       │
│  │ GET /api/vocations?locale=en                     │       │
│  │ GET /api/specializations?locale=en               │       │
│  └──────────────────────────────────────────────────┘       │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │ Repository port, backend from METADATA_BACKEND   │       │
│  │   fs -> fs{Type}Repository                       │       │
│  │   pg -> pg{Type}Repository                       │       │
│  │ Returns typed rows for the requested locale      │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  Files: src/app/api/monsters/route.ts                       │
│         src/app/api/heirlooms/route.ts                      │
│         src/app/api/spells/route.ts                         │
│         src/app/api/bloodlines/route.ts                     │
│         src/app/api/trinkets/route.ts                       │
│         src/app/api/vocations/route.ts                      │
│         src/app/api/specializations/route.ts                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: CLIENT COMPONENTS (React)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │ <MonsterTable />                                 │       │
│  │ <HeirloomTable />                                │       │
│  │ <SpellTable />                                   │       │
│  └──────────────────────────────────────────────────┘       │
│                        │                                     │
│                        ▼                                     │
│  ┌──────────────────────────────────────────────────┐       │
│  │ <MetadataTable                                   │       │
│  │   data={monsterData}                             │       │
│  │   columns={monsterColumns}                       │       │
│  │   getRowSlug={...}                               │       │
│  │   searchKeys={...}                               │       │
│  │ />                                               │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
│  Generic: src/lib/components/mdx/metadataTables/            │
│           metadataTable.tsx                                 │
│  Tables:  src/modules/metadata-tables/presentation/         │
│           {Type}Table/{Type}Table.tsx                       │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: Build-Time Generation

### Overview

Metadata generators parse MDX content files during the build pipeline and output `.metadata.json` files alongside the source files. This happens before Next.js compilation.

### Shared Architecture (`scripts/metadata/`)

All generators import utilities from the `scripts/metadata` barrel as `from '.'`. `src/lib/metadata/` holds runtime helpers only (`contentHash`, `fnv1a32`, `syncMetadata`) and must not be used by generators.

**Key Functions**:

1. **`runGenerator(config: GeneratorConfig)`** - Standardized orchestration

   ```typescript
   // 1. Start performance timer
   // 2. Load shared data (via loadSharedData())
   // 3. Scan content directory for files matching pattern
   // 4. Process files in parallel with Promise.allSettled()
   // 5. Collect results, handle errors
   // 6. Write .metadata.json files (or persist to DB via --persist flag)
   // 7. Report statistics and timing
   ```

   Required keys: `name`, `contentType`, `filePattern`, `parseFile`, `processResult`. Optional keys: `contentDir`, `recursive`, `locale`, `storage`, `metadataVersion`. `processResult` returns `{ metadata, count }` and is what handles array-valued generators such as monsters.

2. **`GameData`** - Single source of truth for d20 data

   ```typescript
   GameData.getDamageTypes(sharedData); // ['acid', 'bludgeoning', ..., 'true']
   GameData.getConditions(sharedData); // ['blinded', 'charmed', ..., 'stunned']
   GameData.getAbilities(sharedData); // ['str', 'dex', 'con', 'wis', 'cha']
   GameData.getSizes(sharedData); // ['tiny', 'small', ..., 'gargantuan']
   GameData.getCreatureTypes(sharedData); // ['aberration', ..., 'undead']
   ```

3. **`ItemData`** - Equipment and item data

   ```typescript
   ItemData.getRarities(sharedData); // ['common', 'uncommon', ..., 'legendary']
   ItemData.getWeaponProperties(sharedData); // ['ammunition', 'finesse', 'unwieldy', ...]
   ItemData.getMasteryProperties(sharedData); // ['cleave', 'graze', 'nick', ...]
   ItemData.getSpellSchools(sharedData); // ['Abjuration', ..., 'Transmutation']
   ```

4. **Text utilities** (`clean`, `filePathToSlug`, `toKebabCase`)

   ```typescript
   clean(text); // Trim, normalize whitespace
   filePathToSlug(path); // Extract slug from file path
   ```

5. **Parsing utilities** (`parseTitle`, `parseProperties`, `parseNumericValue`, etc.)

   ```typescript
   parseTitle(content); // Extract first # heading
   parseKeyBullets(blockText); // Key-value pair extraction
   parseNumericValue(text); // '42', '3d6 + 10' → numbers
   parseCharges(text); // 'X charges (Y per day)'
   ```

6. **Tagging utilities** (`extractAllTags`, `extractDamageTags`, etc.)

   ```typescript
   extractAllTags(content, sharedData, options); // Combined tag extraction
   extractDamageTags(content, sharedData); // ['damage:fire', 'damage:necrotic']
   extractConditionTags(content, sharedData); // ['condition:stunned', ...]
   extractMonsterMechanicTags(abilityName, text); // ['mechanic:legendary-actions']
   ```

7. **File utilities** (`safeReadFile`, `safeWriteFile`, `getMatchingFiles`)

   ```typescript
   safeReadFile(filePath); // Returns content or null (no throw)
   safeWriteFile(filePath, data); // Creates dirs, handles errors
   getMatchingFiles(dir, pattern); // Recursive file search
   ```

8. **Performance utilities** (`startTimer`, `endTimer`)
   ```typescript
   startTimer(); // Begin measurement
   endTimer(startTime, label); // Log duration and memory delta
   ```

### Generator Implementation Pattern

All generators follow this TypeScript template:

```typescript
// scripts/metadata/generateMyContentMetadata.ts
import { promises as fs } from 'fs';
import { filePathToSlug, parseTitle } from '.';
import {
  runGenerator,
  runWithCli,
  type CliOptions,
  type SharedData,
} from '.';

/**
 * Parses one content file into metadata rows.
 *
 * @param {string} filePath - Absolute path to the .mdx file
 * @param {SharedData} sharedData - Loaded shared game data
 * @returns {Promise<object | object[] | null>} Metadata row, rows, or null to skip
 */
async function parseMyContentFile(
  filePath: string,
  sharedData: SharedData,
): Promise<object | null> {
  const content = await fs.readFile(filePath, 'utf-8');
  return { slug: filePathToSlug(filePath), title: parseTitle(content) };
}

/**
 * Runs the generator.
 *
 * @param {CliOptions} options - CLI options from runWithCli
 * @returns {Promise<void>}
 */
async function main(options: CliOptions = {}) {
  await runGenerator({
    name: 'My Content Metadata Generator',
    contentType: 'my-content',
    filePattern: /\.mdx$/,
    parseFile: parseMyContentFile,
    processResult: (result) =>
      result === null
        ? { metadata: null, count: 0 }
        : { metadata: result, count: 1 },
    fileFilter: options.fileFilter,
    storage: options.storage,
    recursive: true,
    metadataVersion: '1.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { main, parseMyContentFile };
```

The entrypoint guard is mandatory. Tests import generator modules; an unconditional `main()` call runs generation during the test suite.

### Monster Generator (`scripts/metadata/generateMonsterMetadata.ts`)

**Input**: `src/content/en/monsters/*.sheet.mdx`  
**Output**: `src/content/en/monsters/*.metadata.json`

**Special Handling**: Monster files can contain **multiple stat blocks** (arrays)

**Metadata Schema**:

```typescript
{
  slug: string;                    // 'albedo'
  subSlug: string;                 // 'albedo-the-bleak-bloom'
  title: string;                   // 'Albedo, the Bleak Bloom'
  file: string;                    // Relative path
  size: string;                    // 'gargantuan'
  creatureType: string;            // 'aberration'
  alignment: string;               // 'lawful evil'
  defence: {                       // Defence, with deflect and dodge as written
    value: number;                 // 20
    notes?: string;                // 'natural'
    raw: string;                   // '20 (natural)'
  };
  hp: {                            // Hit Points
    average: number;               // 780
    formula: string;               // '60d10 + 420'
    raw: string;                   // '780 (60d10 + 420)'
  };
  speed: {                         // Movement modes
    raw: string;                   // '40 ft., climb 30 ft., **swim 120 ft.**'
    modes: Record<string, number>; // { walk: 40, climb: 30, swim: 120 }
  };
  abilities: {                     // Ability scores with modifiers
    str: { score: number; mod: number };  // { score: 24, mod: 7 }
    dex: { score: number; mod: number };
    con: { score: number; mod: number };
    int: { score: number; mod: number };
    wis: { score: number; mod: number };
    cha: { score: number; mod: number };
  };
  savingThrows?: Record<string, number>;  // { con: 14, wis: 15 }
  skills?: string[];                      // ['Descry +15', 'Insight +15']
  damageResistances?: string[];           // ['Acid', 'Necrotic', 'Psychic']
  damageImmunities?: string[];            // ['Poison']
  conditionImmunities?: string[];         // ['Charmed', 'Frightened', 'Paralyzed']
  senses?: {                              // Senses with parsed values
    raw: string;                          // 'Truesight 120 ft., ...'
    passiveDescry?: number;               // 25
    passiveDiscern?: number;              // 25
    [key: string]: number | string;       // darkvision: 120, truesight: 120
  };
  languages?: string[];                   // ['Empyrean', 'telepathy 300 ft.']
  cr: string;                             // '23'
  proficiencyBonus?: number;              // 7
  tags: string[];                         // ['category:monsters', 'condition:charmed', ...]
}
```

**Key Parsing Functions**:

```javascript
parseStatBlock(content); // Extract size/type from "Gargantuan aberration"
findDefenceHpSpeed(lines); // "| **Defence** | **Deflect** | **Dodge** | **Hit Points** | **Speed** |"
parseHitPoints(line); // "**Hit Points** 780 (60d10 + 420)"
parseSpeed(line); // "**Speed** 40 ft., fly 80 ft."
parseAbilities(tableRows); // Parse ability score table
parseLethality(line); // "**Lethality** 23 (50,000 XP)"
```

**Example** (from actual codebase):

```mdx
# Albedo, the Bleak Bloom

_Hiisi of False Life and Eternal Growth_

_Gargantuan Aberration (Hiisi), Lawful Evil_

| **Defence** | **Deflect** | **Dodge** | **Hit Points** | **Speed** |
| --------------- | ----------------- | -------------------------------------- |
| 20 (natural)    | 780 (60d10 + 420) | 40 ft., climb 30 ft., **swim 120 ft.** |

| STR     | DEX     | CON     | INT     | WIS     | CHA     |
| ------- | ------- | ------- | ------- | ------- | ------- |
| 24 (+7) | 14 (+2) | 24 (+7) | 20 (+5) | 26 (+8) | 28 (+9) |

- **Saving Throws**: Con +14, Wis +15, Cha +16
- **Skills**: Descry +15, Insight +15, Athletics +14
- **Damage Resistances**: Acid, Necrotic, Psychic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
- **Damage Immunities**: Poison
- **Condition Immunities**: Terrified, Paralyzed, Poisoned, Prone, Banishment
- **Senses**: Truesight 120 ft., Tremorsense 120 ft., passive Descry 25, passive Discern 25
- **Languages**: Empyrean; telepathy 300 ft.
- **Lethality**: 23 (32,000 XP)
- **Proficiency Bonus**: +7
```

**Generated Metadata** (partial):

```json
{
  "slug": "albedo",
  "subSlug": "albedo-the-bleak-bloom",
  "title": "Albedo, the Bleak Bloom",
  "file": "src/content/en/monsters/albedo.sheet.mdx",
  "size": "gargantuan",
  "creatureType": "aberration",
  "alignment": "lawful evil",
  "defence": { "value": 20, "deflect": "10", "dodge": "0", "notes": "natural", "raw": "20 (natural)" },
  "hp": { "average": 780, "formula": "60d10 + 420", "raw": "780 (60d10 + 420)" },
  "speed": {
    "raw": "40 ft., climb 30 ft., **swim 120 ft.**",
    "modes": { "walk": 40, "climb": 30, "swim": 120 }
  },
  "abilities": {
    "str": { "score": 24, "mod": 7 },
    "dex": { "score": 14, "mod": 2 },
    "con": { "score": 24, "mod": 7 },
    "int": { "score": 20, "mod": 5 },
    "wis": { "score": 26, "mod": 8 },
    "cha": { "score": 28, "mod": 9 }
  },
  "savingThrows": { "con": 14, "wis": 15, "cha": 16 },
  "skills": ["Descry +15", "Insight +15", "Athletics +14"],
  "damageResistances": ["Acid", "Necrotic", "Psychic"],
  "damageImmunities": ["Poison"],
  "conditionImmunities": ["Charmed", "Frightened", "Paralyzed", "Poisoned"],
  "senses": {
    "raw": "Truesight 120 ft., Tremorsense 120 ft., passive Descry 25, passive Discern 25",
    "passiveDescry": 25,
    "passiveDiscern": 25,
    "tremorsense": 120,
    "truesight": 120
  },
  "languages": ["Empyrean", "telepathy 300 ft."],
  "cr": "23",
  "proficiencyBonus": 7,
  "tags": ["category:monsters", "condition:charmed", "condition:frightened", ...]
}
```

**Multi-Variant Handling**:

```javascript
// File: ancient-dragons.sheet.mdx contains 3 dragon variants
// Output: ancient-dragons.metadata.json is an ARRAY
[
  { slug: "ancient-red-dragon", title: "Ancient Red Dragon", ... },
  { slug: "ancient-blue-dragon", title: "Ancient Blue Dragon", ... },
  { slug: "ancient-green-dragon", title: "Ancient Green Dragon", ... }
]
```

### Heirloom Generator (`scripts/metadata/generateHeirloomMetadata.ts`)

**Input**: `src/content/en/items/heirlooms/*.mdx`  
**Output**: `src/content/en/items/heirlooms/*.metadata.json`

**Special Handling**: Single object per file (not arrays)

**Metadata Schema**:

```typescript
{
  slug: string;                    // 'blackbone-crusher'
  title: string;                   // 'Blackbone Crusher'
  file: string;                    // Relative path
  rarity: string;                  // 'mythic artifact', 'rare', 'legendary'
  itemType: string;                // 'weapon', 'armor', 'wondrous item'
  weaponType?: string;             // 'greatsword', 'longsword' (from the pattern slot)
  chassis?: string;                // 'hilted' (first term of a built base)
  finish?: string;                 // 'edged' (second term of a built base)
  art?: string;                    // 'vexing' (third term of a built base)
  catalyst?: string[];             // ['fold', 'key'] (from Catalyst (…) in the attributes slot)
  requiresAttunement: boolean;     // true/false
  weaponProperties?: string[];     // ['unwieldy', 'two-handed', 'magical']
  mastery?: string[];              // ['push', 'enhanced sunder']
  weaponDamage?: {                 // Weapon damage info
    damage: string;                // '4d8'
    damageType: string;            // 'bludgeoning'
  };
  hitModifier?: number;            // +4
  range?: string;                  // '25 ft' (string, not object)
  weight?: string;                 // '45 lbs' (string, not number)
  savingThrowTypes?: string[];     // ['Dexterity', 'Strength']
  armorType?: string;              // 'light', 'medium', 'heavy', 'shield'
  deflect?: string;                // For armor, its Deflect
  maxDodge?: string;               // For armor, the cap on Dexterity's part of Dodge
  charges?: {                      // For items with limited uses
    max: number;
    recharge: string;
  };
  tags: string[];                  // ['category:heirlooms', 'item:weapon', ...]
}
```

**Key Parsing Functions**:

```javascript
parseRarityAndAttunement(italicLine); // "*Weapon (longsword), rare (requires attunement)*"
parseWeaponProperties(content); // Extract damage, range, properties
parseMasteryProperties(content); // Extract weapon mastery
parseCharges(content); // "X charges (recharge Y)"
```

**Example** (from actual codebase):

```mdx
# Blackbone Crusher

_Mythic Artifact (requires attunement)_  
_Greatsword +4 (Two-Handed, Large, Unwieldy, Magical, Mastery: Push, Enhanced Sunder)_

## Item Properties

- **Type**: Greatsword (Two-Handed, Large, Unwieldy)
- **Damage**: 4d8 bludgeoning + 4
- **Range**: 25 ft. (extended whip-like reach)
- **Weight**: 45 lbs
  ...
```

**Generated Metadata** (partial):

```json
{
  "slug": "blackbone-crusher",
  "title": "Blackbone Crusher",
  "file": "src/content/en/items/heirlooms/blackbone-crusher.mdx",
  "rarity": "mythic artifact",
  "itemType": "weapon",
  "weaponType": "greatsword",
  "chassis": "hilted",
  "finish": "blunt",
  "art": "vexing",
  "requiresAttunement": true,
  "weaponProperties": ["two-handed", "unwieldy"],
  "mastery": ["enhanced sunder", "push"],
  "weaponDamage": {
    "damage": "4d8",
    "damageType": "bludgeoning"
  },
  "hitModifier": 4,
  "range": "25 ft",
  "weight": "45 lbs",
  "savingThrowTypes": ["Dexterity", "Strength"],
  "tags": ["category:heirlooms", "item:weapon", "damage:bludgeoning", ...]
}
```

### Spell Generator (`scripts/metadata/generateSpellMetadata.ts`)

**Input**: `src/content/en/spells/*.mdx`  
**Output**: `src/content/en/spells/*.metadata.json`

**Special Handling**: Casting time parsed as array + raw text

**Metadata Schema**:

```typescript
{
  slug: string;                    // 'forbidden-sun'
  title: string;                   // 'Forbidden Sun'
  file: string;                    // Absolute path
  level: number;                   // 5 (0 = cantrip)
  school: string;                  // 'Evocation'
  quality?: string;                // 'Legendary', 'Epic', 'Mythic'
  castingTimeRaw: string;          // '1 action' or '1 action or reaction (trigger: ...)'
  castingTime: string[];           // ['action'] or ['action', 'reaction']
  range: string;                   // '120 feet' (string, not object)
  concentration: boolean;          // true if requires concentration
  duration: string;                // 'up to 1 minute' or 'Instantaneous'
  verbal: boolean;                 // V component (flat, not nested)
  somatic: boolean;                // S component
  material: boolean;               // M component
  materialDescription?: string;    // Only if material is true
  tags: string[];                  // ['level:5', 'school:evocation', 'quality:legendary', ...]
}
```

**Key Parsing Functions**:

```javascript
parseSpellHeader(content); // Extract level, school, quality from italic line
parseCastingTimeToArray(text); // NEW: Extract action economy keywords
parseComponents(line); // "**Components:** V, S, M (bat guano)"
parseDuration(line); // Check for 'Concentration'
```

**Casting Time Priority** (parseCastingTimeToArray):

1. **Minor Action** - Highest priority
2. **Major Action** - Second priority
3. **Reaction** - Third priority
4. **Time Durations** - 'minute', 'hour', 'day' etc.
5. **Ritual** - If 'ritual' mentioned

**Example** (from actual codebase):

```mdx
# Forbidden Sun

This spell is not innate to any class...

> **Forbidden Sun**  
> _5th-Level Legendary Evocation_  
> **Casting Time**: 1 action or reaction (trigger: a creature within 120 feet casts a spell or uses a magic item)  
> **Range**: 120 feet  
> **Components**: S  
> **Duration**: Concentration, up to 1 minute
>
> You summon a miniature sun that hovers in the air...
```

**Generated Metadata**:

```json
{
  "slug": "forbidden-sun",
  "title": "Forbidden Sun",
  "file": "C:\\Users\\david\\OneDrive\\Desktop\\Ikuisuus\\src\\content\\en\\spells\\forbidden-sun.mdx",
  "level": 5,
  "school": "Evocation",
  "quality": "Legendary",
  "castingTimeRaw": "1 action or reaction (trigger: a creature within 120 feet casts a spell or uses a magic item)",
  "castingTime": ["action", "reaction"],
  "range": "120 feet",
  "concentration": true,
  "duration": "up to 1 minute",
  "verbal": false,
  "somatic": true,
  "material": false,
  "tags": [
    "level:5",
    "school:evocation",
    "quality:legendary",
    "mechanic:concentration",
    "component:somatic",
    "damage:fire",
    "damage:true",
    "condition:stunned",
    "mechanic:reaction",
    "mechanic:area-of-effect",
    "save:con"
  ]
}
```

**Dual Casting Time Example**:

```mdx
**Casting Time:** 1 action or reaction (when you are hit by an attack)
```

**Generated**:

```json
{
  "castingTime": ["action", "reaction"],
  "castingTimeRaw": "1 action or reaction (when you are hit by an attack)"
}
```

### Shared Data Source (`scripts/core/shared-data.json`)

All generators reference a single source of truth for game data, loaded via `loadSharedData()` from the `scripts/metadata` barrel:

```typescript
import { loadSharedData, GameData, ItemData } from '.';

const sharedData = await loadSharedData();
const damageTypes = GameData.getDamageTypes(sharedData);
const rarities = ItemData.getRarities(sharedData);
const schools = ItemData.getSpellSchools(sharedData);
```

### Execution

**Orchestrator** (`scripts/metadata/generateMetadata.ts`):

```typescript
// CONTENT_TYPES map: key -> { dir, pattern, generator, contentType, subType }
// Each entry names a content directory, the file pattern it owns, and the
// generator module that parses it. Adding a content type means adding an entry.
// Supports --type flag to run a single generator
// Supports --persist flag to also write to PostgreSQL
```

The orchestrator discovers nothing. Registration is the `CONTENT_TYPES` entry; a generator without one is never run by `npm run generate-metadata`.

**Package.json Scripts**:

```json
{
  "scripts": {
    "generate-metadata": "npx tsx --tsconfig tsconfig.scripts.json scripts/metadata/generateMetadata.ts"
  }
}
```

## Layer 2: Runtime API Routes

### Overview

API routes resolve a repository port and return its rows. The factory in `src/lib/db/content/repositories/<type>Repository.ts` picks the adapter from `METADATA_BACKEND`: `fs` reads `.metadata.json` files, `pg` reads PostgreSQL through MikroORM. Routes never touch `fs` or `path`.

### Monster API (src/app/api/monsters/route.ts)

```typescript
/**
 * @fileoverview Serves monster metadata as JSON.
 *
 * @module src/app/api/monsters/route
 */
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Monsters' });

/**
 * GET /api/monsters
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of monster objects
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const monsters = await monsterRepository.list(locale);
    return NextResponse.json(monsters);
  } catch (error) {
    log.error('Error loading monster metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load monsters' },
      { status: 500 },
    );
  }
}
```

**Key Points**:

- The repository flattens array-valued generators (monsters emit one row per stat block), so routes return a flat array
- Locale-aware: `/api/monsters?locale=es` reads Spanish records
- Runs on server-side: the repository module is `server-only`
- Errors are logged through `logger`, never `console.error`

### Other Routes

Every content type has the same route shape, differing only in the repository:

```typescript
// src/app/api/{type}/route.ts
const rows = await {type}Repository.list(locale);
```

Routes: `monsters`, `heirlooms`, `spells`, `trinkets`, `feats`, `bloodlines`, `vocations`, `specializations`.

### Backend Selection

**File**: `src/lib/db/content/repositories/{type}Repository.ts`

```typescript
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

const createTrinketRepository = (): TrinketRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgTrinketRepository;
    case 'fs':
      return fsTrinketRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

export const trinketRepository = createTrinketRepository();
```

**Why a Port**:

- One contract (`list`, `getBySlug`) shared by both adapters
- API routes stay free of storage detail
- Switching backend is an env change, not a code change
- `byContentType.ts` maps each searchable content type to its repository for card-level reads

### Request/Response Examples

**Request**: `GET /api/monsters?locale=en`

**Response**:

```json
[
  {
    "slug": "albedo-the-bleak-bloom",
    "title": "Albedo, the Bleak Bloom",
    "cr": "23",
    "size": "gargantuan",
    "creatureType": "aberration",
    ...
  },
  {
    "slug": "ancient-red-dragon",
    "title": "Ancient Red Dragon",
    "cr": "24",
    "size": "gargantuan",
    "creatureType": "dragon",
    ...
  },
  ...
]
```

**Request**: `GET /api/spells?locale=es`

**Response** (from `src/content/es/spells/*.metadata.json`):

```json
[
  {
    "slug": "bola-de-fuego",
    "title": "Bola de Fuego",
    "level": 3,
    "school": "Evocación",
    ...
  },
  ...
]
```

## Layer 3: Client Components

### Overview

Tables live in the `metadata-tables` module. Each table is a client component that resolves the locale, calls a fetch helper, and hands rows plus column config to the generic `MetadataTable`.

| Layer | Path |
| --- | --- |
| Generic table | `src/lib/components/mdx/metadataTables/metadataTable.tsx` |
| Data hook | `src/modules/metadata-tables/application/hooks/useMetadataTableData.ts` |
| Fetch helpers | `src/modules/metadata-tables/infrastructure/api-clients/metadataTableClient.ts` |
| Table components | `src/modules/metadata-tables/presentation/{Type}Table/` |
| Module barrel | `src/modules/metadata-tables/presentation/index.ts` |

### Generic MetadataTable Component

**File**: `src/lib/components/mdx/metadataTables/metadataTable.tsx`

**Props**: `data`, `columns`, `getRowSlug`, `searchKeys`, `searchScope`, `defaultSort`, `pageSize`, `locale`, `size`, `onRowSelect`, `rowAction`.

**Features**:

- Index-backed search scoped by `searchScope`, with `searchKeys` as the fallback
- Column sorting with custom comparators
- Filter dropdowns for enumerated values
- Responsive table with horizontal scroll
- Links to content pages via slug
- Loading skeleton and error states

### Table Component Shape

Each `{Type}Table` folder holds the component, its column builder, and a barrel:

```
src/modules/metadata-tables/presentation/TrinketTable/
  TrinketTable.tsx
  TrinketTable.columns.tsx
  index.ts
```

The component:

1. Declares `'use client'`
2. Resolves locale from the `locale` prop, then `useParams()`, then `'en'`
3. Calls `useMetadataTableData(fetch{Type}Metadata, locale, '{type}')`
4. Renders `MetadataTableSkeleton` while loading, translated error text on failure
5. Builds columns with `build{Type}Columns(tColumns)`
6. Returns `<MetadataTable searchScope='{type}' ... />`

Translation keys come from `messages/{locale}/tables.json` under `tables.{type}` and `tables.{type}.columns`.

### Component Registration

Two barrels, in order:

```typescript
// src/modules/metadata-tables/presentation/index.ts
export { TrinketTable } from './TrinketTable';

// src/modules/library/presentation/components/index.tsx
import { TrinketTable } from '@/modules/metadata-tables/presentation';

export const components = {
  TrinketTable,
  // ...
};
```

**Why Centralized**: `components` is passed to the MDX compiler. A table exported from only one barrel is unavailable in content.

## Aspect Rows (in-page pills)

Aspects render inside library pages as pill rows placed by the compile pipeline, keyed by anchor.

| Step | Where | Output |
| --- | --- | --- |
| Extract | generators (`features`, `boons`, …) | shard `name`, optional `heading` (rendered text when it differs, e.g. deed cost suffixes), `tags` |
| Index | `loadArticleMetadata` → `aspectIndexOf` | `sections[]` keyed `anchorSlug(toPlainMeasure(heading ?? name))`, both bare and `record/anchor`; `records[]` = stat block title anchors |
| Section | `rehypeSectionize` | `<section data-anchor>` / `<article data-anchor>`, bare slug on `node.data.slug` |
| Place | `rehypeAspects` | `<Aspects section=key />` after headings, after entry labels, after Collapsible summaries; record-first key resolution (`record/slug`, then `slug`) |
| Render | `Aspects` + `ArticleMetadataContext` | `aspectsFor(key)` |

Records: a level-1 heading or a quoted heading (statlet) whose slug is in `records` starts a record scope that holds for following siblings; a quote's records end with the quote. Authored `aspects:` / `denyAspects:` frontmatter targets a feature via `{ anchor: [aspects] }` entries; bare `group:value` entries target the sheet.

## Related Documentation

- [Build Pipeline](./build-pipeline.md) - Pre-init stages and dependencies
- [Metadata Library](../../scripts/metadata/index.ts) - `runGenerator`, `GameData`, parsing/tagging/file utilities
- [Content System](./content-system.md) - MDX structure and routing
- [Metadata Table](./metadata-table.md) - Metadata-based table system
