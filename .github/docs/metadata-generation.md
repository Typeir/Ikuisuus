# Metadata Generation System Architecture

**Purpose**: Complete documentation of the three-layer metadata extraction, serving, and consumption system for Damocles game content.

## System Overview

The metadata system extracts structured data from human-readable MDX content files and makes it available through a three-layer architecture:

1. **Build-Time Layer**: Parse `.mdx` files → generate `.metadata.json` files
2. **Runtime API Layer**: Serve metadata via Next.js API routes
3. **Client Component Layer**: Consume metadata in filterable/sortable tables

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
│           scripts/metadata/generateSpecializationMetadata.ts  │
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
│  │ fs.readdirSync(contentFolder)                    │       │
│  │ Filter .metadata.json files                      │       │
│  │ JSON.parse() each file                           │       │
│  │ .flat() for arrays (monsters)                    │       │
│  │ Return JSON array                                │       │
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
│  Generic: src/lib/components/mdx/MetadataTable/             │
│           metadataTable.tsx                                 │
│  Wrappers: monsterTableWrapper.tsx,                         │
│            heirloomTableWrapper.tsx,                        │
│            spellTableWrapper.tsx                            │
└─────────────────────────────────────────────────────────────┘
```

## Layer 1: Build-Time Generation

### Overview

Metadata generators parse MDX content files during the build pipeline and output `.metadata.json` files alongside the source files. This happens before Next.js compilation.

### Shared Architecture (`src/lib/metadata/`)

All generators import utilities from the shared `src/lib/metadata/` TypeScript module:

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

2. **`GameData`** - Single source of truth for d20 data

   ```typescript
   GameData.getDamageTypes(sharedData); // ['acid', 'bludgeoning', ..., 'true']
   GameData.getConditions(sharedData); // ['blinded', 'charmed', ..., 'stunned']
   GameData.getAbilities(sharedData); // ['str', 'dex', 'con', 'int', 'wis', 'cha']
   GameData.getSizes(sharedData); // ['tiny', 'small', ..., 'gargantuan']
   GameData.getCreatureTypes(sharedData); // ['aberration', ..., 'undead']
   ```

3. **`ItemData`** - Equipment and item data

   ```typescript
   ItemData.getRarities(sharedData); // ['common', 'uncommon', ..., 'legendary']
   ItemData.getWeaponProperties(sharedData); // ['ammunition', 'finesse', 'heavy', ...]
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
import {
  runGenerator,
  GameData,
  parseTitle,
  extractAllTags,
} from '@/lib/metadata';
import type { SharedData } from '@/lib/metadata';

/**
 * Parse a single content file and extract metadata.
 *
 * @param {string} filePath - Absolute path to .mdx file
 * @param {SharedData} sharedData - Loaded shared game data
 * @returns {object | null} Metadata object or null on error
 */
async function parseMyContentFile(filePath: string, sharedData: SharedData) {
  // Content-specific parsing logic here
  return {
    slug,
    title,
    file: filePath,
    tags: extractAllTags(content, sharedData, { contentType: 'my-content' }),
  };
}

async function main() {
  await runGenerator({
    name: 'My Content Metadata Generator',
    contentType: 'my-content',
    filePattern: /\.mdx$/,
    parseFile: parseMyContentFile,
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { main, parseMyContentFile };
```

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
  ac: {                            // Armor Class
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
  skills?: string[];                      // ['Perception +15', 'Insight +15']
  damageResistances?: string[];           // ['Acid', 'Necrotic', 'Psychic']
  damageImmunities?: string[];            // ['Poison']
  conditionImmunities?: string[];         // ['Charmed', 'Frightened', 'Paralyzed']
  senses?: {                              // Senses with parsed values
    raw: string;                          // 'Truesight 120 ft., ...'
    passivePerception?: number;           // 25
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
parseArmorClass(line); // "**Armor Class** 20 (natural armor)"
parseHitPoints(line); // "**Hit Points** 780 (60d10 + 420)"
parseSpeed(line); // "**Speed** 40 ft., fly 80 ft."
parseAbilities(tableRows); // Parse ability score table
parseChallengeRating(line); // "**Challenge** 23 (50,000 XP)"
```

**Example** (from actual codebase):

```mdx
# Albedo, the Bleak Bloom

_Hiisi of False Life and Eternal Growth_

_Gargantuan Aberration (Hiisi), Lawful Evil_

| **Armor Class** | **Hit Points**    | **Speed**                              |
| --------------- | ----------------- | -------------------------------------- |
| 20 (natural)    | 780 (60d10 + 420) | 40 ft., climb 30 ft., **swim 120 ft.** |

| STR     | DEX     | CON     | INT     | WIS     | CHA     |
| ------- | ------- | ------- | ------- | ------- | ------- |
| 24 (+7) | 14 (+2) | 24 (+7) | 20 (+5) | 26 (+8) | 28 (+9) |

- **Saving Throws**: Con +14, Wis +15, Cha +16
- **Skills**: Perception +15, Insight +15, Athletics +14
- **Damage Resistances**: Acid, Necrotic, Psychic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
- **Damage Immunities**: Poison
- **Condition Immunities**: Terrified, Paralyzed, Poisoned, Prone, Banishment
- **Senses**: Truesight 120 ft., Tremorsense 120 ft., passive Perception 25
- **Languages**: Empyrean; telepathy 300 ft.
- **Challenge**: 23 (32,000 XP)
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
  "ac": { "value": 20, "notes": "natural", "raw": "20 (natural)" },
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
  "skills": ["Perception +15", "Insight +15", "Athletics +14"],
  "damageResistances": ["Acid", "Necrotic", "Psychic"],
  "damageImmunities": ["Poison"],
  "conditionImmunities": ["Charmed", "Frightened", "Paralyzed", "Poisoned"],
  "senses": {
    "raw": "Truesight 120 ft., Tremorsense 120 ft., passive Perception 25",
    "passivePerception": 25,
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
  weaponType?: string;             // 'greatsword', 'longsword'
  requiresAttunement: boolean;     // true/false
  weaponProperties?: string[];     // ['heavy', 'two-handed', 'magical']
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
  ac?: number;                     // For armor
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
_Greatsword +4 (Two-Handed, Large, Heavy, Magical, Mastery: Push, Enhanced Sunder)_

## Item Properties

- **Type**: Greatsword (Two-Handed, Large, Heavy)
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
  "requiresAttunement": true,
  "weaponProperties": ["heavy", "large", "magical", "two-handed"],
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

All generators reference a single source of truth for game data, loaded via `loadSharedData()` from `@/lib/metadata`:

```typescript
import { loadSharedData, GameData, ItemData } from '@/lib/metadata';

const sharedData = await loadSharedData();
const damageTypes = GameData.getDamageTypes(sharedData);
const rarities = ItemData.getRarities(sharedData);
const schools = ItemData.getSpellSchools(sharedData);
```

### Execution

**Orchestrator** (`scripts/metadata/generateMetadata.ts`):

```typescript
// Dynamically imports each .ts generator and calls main()
// Supports --type flag to run a single generator
// Supports --persist flag to also write to PostgreSQL
```

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

Next.js API routes read `.metadata.json` files from the filesystem and serve them as JSON. This happens at runtime (server-side) during both dev and production.

### Monster API (src/app/api/monsters/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getContentFolder } from '@/lib/utils/getContentFolder';

export async function GET(request: NextRequest) {
  try {
    // Get locale from query params (default: 'en')
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Get content folder for locale
    const contentFolder = getContentFolder(locale, 'monsters');

    // Read all files in directory
    const files = fs.readdirSync(contentFolder);

    // Filter for .metadata.json files
    const metadataFiles = files.filter((file) =>
      file.endsWith('.metadata.json'),
    );

    // Read and parse each file
    const metadata = metadataFiles.map((file) => {
      const filePath = path.join(contentFolder, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    });

    // CRITICAL: Flatten arrays (monster files can have multiple stat blocks)
    const flattenedMetadata = metadata.flat();

    return NextResponse.json(flattenedMetadata);
  } catch (error) {
    console.error('Error loading monster metadata:', error);
    return NextResponse.json(
      { error: 'Failed to load metadata' },
      { status: 500 },
    );
  }
}
```

**Key Points**:

- Uses `getContentFolder(locale, contentType)` helper for consistent path resolution
- **Must use `.flat()`** because monster files can contain arrays
- Locale-aware: `/api/monsters?locale=es` reads from `src/content/es/monsters/`
- Runs on server-side (has access to `fs` module)

### Heirloom API (src/app/api/heirlooms/route.ts)

```typescript
// Nearly identical to monsters route, with exceptions:
// 1. Uses getContentFolder(locale, 'heirlooms')
// 2. Still uses .flat() for consistency, but heirlooms are single objects
```

### Spell API (src/app/api/spells/route.ts)

```typescript
// Nearly identical to monsters route
// Uses getContentFolder(locale, 'spells')
```

### Helper: getContentFolder

**File**: `src/lib/utils/getContentFolder.ts`

```typescript
import path from 'path';

export function getContentFolder(
  locale: string,
  contentType: 'monsters' | 'heirlooms' | 'spells',
): string {
  const basePath = path.join(process.cwd(), 'src', 'content', locale);

  const paths = {
    monsters: path.join(basePath, 'monsters'),
    heirlooms: path.join(basePath, 'items', 'heirlooms'),
    spells: path.join(basePath, 'spells'),
  };

  return paths[contentType];
}
```

**Why Centralized**:

- Prevents path inconsistencies between API routes
- Makes locale switching trivial
- Single place to update if folder structure changes

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

React components fetch metadata from API routes and render filterable/sortable tables. Uses generic `MetadataTable` component with content-specific wrappers.

### Generic MetadataTable Component

**File**: `src/lib/components/mdx/MetadataTable/metadataTable.tsx`

**Features**:

- Client-side search across specified keys
- Column sorting with custom comparators
- Filter dropdowns for enumerated values
- Responsive table with horizontal scroll
- Links to content pages via slug
- Loading states and error handling

### Implementation:

#### Monster Table Wrapper

**File**: `src/lib/components/mdx/MetadataTable/monsterTableWrapper.tsx`

**Usage in MDX**:

```mdx
# Monster Compendium

Browse all monsters in the library:

<MonsterTable />

Or view Spanish monsters:

<MonsterTable locale='es' />
```

#### Heirloom Table Wrapper

**File**: `src/lib/components/mdx/MetadataTable/heirloomTableWrapper.tsx`

**Key Differences**:

- Fetches from `/api/heirlooms`
- Columns: title, rarity, itemType, weaponType
- Custom rarity sorting (common < uncommon < rare < very rare < legendary < artifact)
- Search keys: title, rarity, itemType, weaponType

#### Spell Table Wrapper

**File**: `src/lib/components/mdx/MetadataTable/spellTableWrapper.tsx`

**Key Differences**:

- Fetches from `/api/spells`
- Columns: title, level, school, castingTime, concentration
- Level sorting: 0 (cantrip) → 9
- Search keys: title, school, castingTime (searches array)

### Component Registration

**File**: `src/modules/library/presentation/components/index.tsx`

```typescript
import { MonsterTableWrapper } from './MetadataTable/monsterTableWrapper';
import { HeirloomTableWrapper } from './MetadataTable/heirloomTableWrapper';
import { SpellTableWrapper } from './MetadataTable/spellTableWrapper';
import { BlendedImage } from './BlendedImage';

// Register all MDX components here
export const components = {
  MonsterTable: MonsterTableWrapper,
  HeirloomTable: HeirloomTableWrapper,
  SpellTable: SpellTableWrapper,
  BlendedImage: BlendedImage,
  // Add more custom components as needed
};
```

**Why Centralized**: Components need to be passed to the mdx compiler for pre-rendering.

## Related Documentation

- [Build Pipeline](./build-pipeline.md) - Pre-init stages and dependencies
- [Metadata Library](../../../src/lib/metadata/index.ts) - `runGenerator`, `GameData`, parsing/tagging/file utilities
- [Content System](./content-system.md) - MDX structure and routing
- [Metadata Table](./metadata-table.md) - Metadata-based table system
