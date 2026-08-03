# Build Pipeline Architecture

**Purpose**: Complete documentation of the pre-initialization and build pipeline that processes assets, content, and metadata before Next.js compilation.

## Overview

The build pipeline is a **critical dependency chain** that must run before any Next.js build or dev server start. It transforms raw assets and content into the structured format required by the application.

## Pipeline Stages

### Stage 1: Asset Compression (`compress-assets`)

**Script**: `scripts/assets/compressAssets.ts`  
**Purpose**: Convert full-resolution images to web-optimized WebP format

**Input**: `public/full-size/images/**/*`  
**Output**: `public/library/images/**/*.webp`

**Process**:

1. Scans `public/full-size/` recursively for image files (jpg, jpeg, png, webp)
2. Uses Sharp to convert to WebP format
3. Resizes to maximum 1600px width (maintains aspect ratio)
4. Mirrors folder structure in `public/library/`
5. Generates console report of processed files and compression ratio

**Key Files**:

- `scripts/assets/compressAssets.ts` - Main compression logic
- Uses `sharp` package for image processing

**Example Output**:

```
📦 Compressing assets...
🗂  Found 47 images in public/full-size

✓ Processed: map-of-damocles.jpg → map-of-damocles.webp (1920×1080 → 1600×900) (2.4 MB → 458 KB)
✓ Processed: character-sheet.png → character-sheet.webp (3000×2000 → 1600×1067) (5.1 MB → 892 KB)
↷ Skipped (already exists): icons/logo.png

✅ Compressed 45 images (23.5 MB → 8.2 MB, 65% reduction)
```

**Why Required**: MDX content references `/library/` paths. Without compression, images don't exist and Next.js Image component fails.

### Stage 2: Kebabify Content (`kebabify-content`)

**Script**: `scripts/content/kebabifyContent.ts`  
**Purpose**: Normalize all content file and folder names to kebab-case

**Input**: `src/content/**/*`  
**Output**: Same files with renamed paths

**Process**:

1. Recursively scans `src/content/` directory tree
2. Converts filenames and folder names to kebab-case:
   - `Albedo The Bleak Bloom.md` → `albedo-the-bleak-bloom.md`
   - `Character Creation/` → `character-creation/`
3. Updates internal references if needed
4. Reports renamed files

**Key Files**:

- `scripts/content/kebabifyContent.ts` - Renaming logic
- `src/lib/utils/toKebabCase.ts` - Conversion utility

**Why Required**:

- URL slugs are generated from filenames
- Consistency across file system and routing
- Prevents case-sensitivity issues on different OS

**Example**:

```
Before: src/content/en/monsters/Albedo_The_Bleak_Bloom.md
After:  src/content/en/monsters/albedo-the-bleak-bloom.md
URL:    /library/monsters/albedo-the-bleak-bloom
```

### Stage 3: MD to MDX Conversion (`md-to-mdx`)

**Script**: `scripts/content/mdToMdx.ts`  
**Purpose**: Convert all `.md` files to `.mdx` extension

**Input**: `src/content/**/*.md`  
**Output**: `src/content/**/*.mdx`

**Process**:

1. Recursively finds all `.md` files
2. Renames to `.mdx` extension (preserves `.sheet.mdx` pattern)
3. No content transformation - only extension change
4. Reports converted files

**Key Files**:

- `scripts/content/mdToMdx.ts` - Renaming logic

**Why Required**:

- Next.js MDX plugin only processes `.mdx` files
- MDX components only work in `.mdx` files

**Special Case**: `.sheet.md` → `.sheet.mdx` (preserves double extension)

### Stage 4: Metadata Generation (`generate-metadata`)

**Script**: `scripts/metadata/generateMetadata.ts` (orchestrator)  
**Generators**:

- `scripts/metadata/generateMonsterMetadata.ts`
- `scripts/metadata/generateHeirloomMetadata.ts`
- `scripts/metadata/generateSpellMetadata.ts`
- `scripts/metadata/generateTrinketMetadata.ts`
- `scripts/metadata/generateBloodlineMetadata.ts`
- `scripts/metadata/generateVocationMetadata.ts`
- `scripts/metadata/generateSpecializationMetadata.ts`

**Purpose**: Extract structured data from MDX content for search, filtering, and tables

**Input**:

- `src/content/en/monsters/*.sheet.mdx`
- `src/content/en/items/heirlooms/*.heirloom.mdx`
- `src/content/en/spells/*.mdx`
- `src/content/en/items/trinkets/*.trinket.mdx`
- `src/content/en/character-creation/bloodlines/*.bloodline.mdx`
- `src/content/en/character-creation/vocations/main.mdx`
- `src/content/en/character-creation/specializations/*.mdx`

**Output**: `.metadata.json` files alongside source files

**Process**:

1. **Monster Generator**:
   - Parses Damocles stat block format (italic lines, tables, blockquotes)
   - Extracts: AC, HP, CR, abilities, resistances, damage types
   - Handles multi-variant files (arrays of stat blocks)
   - Tags: creature type, size, legendary deeds, spellcasting

2. **Heirloom Generator**:
   - Parses item properties (rarity, attunement, weapon stats)
   - Extracts: damage, range, properties, mastery
   - Tags: item type, weapon properties, magical effects

3. **Spell Generator**:
   - Parses spell header (level, school, quality)
   - Extracts: casting time (as array), components, concentration
   - Tags: damage types, conditions, spell school, mechanics

**Shared Architecture** (see `src/lib/metadata/`):

- `runGenerator()` - Standardized orchestration via `GeneratorConfig`
- `GameData` / `ItemData` - Access to `scripts/core/shared-data.json`
- `parsingUtils` functions - Common extraction patterns
- `taggingUtils` functions - Unified tag generation
- `startTimer()` / `endTimer()` - Timing and profiling

**Key Files**:

- `src/lib/metadata/` - Shared generator utilities module
- `scripts/core/shared-data.json` - Single source of truth for game data
- `scripts/metadata/generateMetadata.ts` - Orchestrator that runs all generators
- Individual generators in `scripts/metadata/`

**Example Metadata** (Monster):

```json
{
  "slug": "albedo-the-bleak-bloom",
  "title": "Albedo, the Bleak Bloom",
  "file": "src/content/en/monsters/albedo.sheet.mdx",
  "size": "gargantuan",
  "creatureType": "aberration",
  "ac": { "value": 20, "notes": "natural armor" },
  "hp": { "average": 780, "formula": "60d10 + 420" },
  "cr": "23",
  "tags": [
    "creature:aberration",
    "size:gargantuan",
    "damage:necrotic",
    "mechanic:legendary-deeds",
    "mechanic:multiattack"
  ]
}
```

**Why Required**:

- API routes (`/api/monsters`, `/api/heirlooms`, `/api/spells`, `/api/bloodlines`, `/api/trinkets`, `/api/vocations`, `/api/specializations`) serve this data
- MetadataTable components require structured data for filtering/sorting
- Search functionality needs tags and structured fields

### Stage 5: Merge Locales (`merge-locales`)

**Script**: `scripts/i18n/mergeMessages.ts`  
**Purpose**: Combine namespaced translation files into single index file per locale

**Input**: `messages/{locale}/*.json` (multiple namespace files)  
**Output**: `messages/{locale}/index.json` (merged)

**Process**:

1. Scans each locale folder (`en`, `es`, `fi`)
2. Reads all `.json` files except `index.json`
3. Merges into single object with namespace keys
4. Writes to `index.json`

**Example**:

```
Input:
  messages/en/layout.json: { "title": "Library" }
  messages/en/search.json: { "placeholder": "Search..." }

Output:
  messages/en/index.json: {
    "layout": { "title": "Library" },
    "search": { "placeholder": "Search..." }
  }
```

**Key Files**:

- `scripts/i18n/mergeMessages.ts` - Merging logic
- `messages/{locale}/index.json` - Final merged files

**Why Required**:

- `next-intl` reads from `index.json` in production builds
- Namespace organization during development
- Single file simplifies deployment

### Stage 6: Bundle MDX Plugins (`bundle-mdx-plugins`)

**Script**: `scripts/build/bundleMdxPlugins.ts`  
**Purpose**: Compile local remark plugins to plain ESM for the `@next/mdx` loader

**Input**: `src/lib/md/remark*.ts`  
**Output**: `.mdx-plugins/*.mjs` (generated, gitignored)

**Why Required**: Turbopack runs loaders in a Rust host and cannot receive JavaScript
functions, so plugins must be named as resolvable path strings. `next.config.ts` points at
these bundles, so this stage must run before `next build`.

Register a new plugin in the `PLUGINS` array, then reference its `.mjs` path in
`next.config.ts`.

## Reusable Content Regions

Reuse is **no longer a build stage**. A content file opts in with `reusable: true` in its
frontmatter and optionally marks named regions with paired `reusable:start <name>` and
`reusable:end` MDX comments. Regions are spliced into their host at source level by
`resolveReusableSource`, which both MDX compilers call before evaluating.

This replaced a scanner that compiled every MDX file to discover reuse, then froze the result
to static HTML. That approach left interactive components dead — `DiceRoll` buttons rendered
as inert markup with CSS module hashes baked into content — and matched components by
filename, which collided with real components such as `Image`.

**Relevant modules**: `src/lib/content/reusable/`

## Pipeline Execution

### Development Server

```bash
npm run dev
# Internally runs: npm run pre-init && next dev
```

### Production Build

```bash
npm run build
# Internally runs: rm -rf .next/cache && npm run pre-init && next build
```

### Manual Pre-Init

```bash
npm run pre-init
# Runs all stages in sequence
```

### Individual Stages

```bash
npm run compress-assets
npm run kebabify-content
npm run md-to-mdx
npm run generate-metadata
npm run merge-locales
npm run bundle-mdx-plugins
```

## Dependency Graph

```
compress-assets (independent)
      ↓
kebabify-content (requires stable filenames)
      ↓
md-to-mdx (requires kebab-case names)
      ↓
fix-metadata (requires .mdx extension)
      ↓
merge-locales (independent but conventionally last)
      ↓
bundle-mdx-plugins (must precede next build)
      ↓
search:index
```

`pre-init` runs `fix-metadata` rather than `generate-metadata` alone. `generate-metadata`
writes sidecars but never removes them, so a renamed or deleted content file left its
`.metadata.json` orphaned indefinitely. `fix-metadata` cleans first, regenerates, then
rebuilds the spell lists.

## Error Scenarios

### Missing Pre-Init

**Symptom**: Next.js build fails with:

- "Module not found: Can't resolve '/library/images/map.webp'"
- "No .metadata.json files found"
- "Translation key not found"

**Solution**: Run `npm run pre-init` before `next dev` or `next build`

### Partial Pre-Init

**Symptom**: Some images work, others don't; some metadata tables empty

**Solution**: Run full `npm run pre-init` (not individual scripts out of order)

### Asset Cleanup Issues

**Symptom**: Vercel build exceeds size limit

**Solution**: `public/full-size/` is git-ignored after compression. Use `npm run clean-fullsize` in build environment.

## Performance Considerations

### Asset Compression

- **Time**: ~5-30 seconds depending on image count
- **Optimization**: Sharp uses native bindings (fast)
- **Caching**: No caching - always regenerates (ensures freshness)

### Metadata Generation

- **Time**: ~50ms for 48 monster files, ~40ms for 50 heirloom files, ~10ms for 14 spell files
- **Optimization**: Parallel processing with `Promise.allSettled()`
- **Memory**: Heap delta typically < 3MB per generator

### Total Pipeline

- **Development**: ~10-45 seconds (includes all stages)
- **CI/CD**: ~15-60 seconds (cold start, no caching)

## Extension Points

### Adding New Metadata Generators

1. **Create Generator Script**:

```typescript
// scripts/metadata/generateMyContentMetadata.ts
import {
  runGenerator,
  GameData,
  parseTitle,
  extractAllTags,
} from '@/lib/metadata';
import type { SharedData } from '@/lib/metadata';

async function parseMyContentFile(filePath: string, sharedData: SharedData) {
  // Parse logic here
  return { slug, title /* ... */ };
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

2. **Update Orchestrator**:

```typescript
// scripts/metadata/generateMetadata.ts
const CONTENT_TYPES = {
  // ... existing types
  myContent: {
    dir: 'src/content/en/my-content',
    pattern: /\.mdx$/,
    generator: 'generateMyContentMetadata.ts',
    contentType: 'my-content',
    subType: 'standard',
  },
};
```

3. **Add to Pre-Init** (if needed as standalone command):

```json
// package.json
"scripts": {
  "generate-my-content-metadata": "npx tsx --tsconfig tsconfig.scripts.json scripts/metadata/generateMyContentMetadata.ts"
}
```

4. **Add shared utilities** (if needed) to `src/lib/metadata/` and re-export from `src/lib/metadata/index.ts`.

### Adding Pipeline Stages

To add a new stage to the pipeline:

1. Create script in `scripts/`
2. Add npm script in `package.json`
3. Add to `pre-init` script in dependency order
4. Document in this guide

## Troubleshooting

### Pipeline Hangs

**Cause**: Sharp processing very large images  
**Solution**: Limit source image size, or increase timeout

### Metadata Generation Errors

**Cause**: Malformed MDX content (missing stat block table, invalid format)  
**Solution**: Check console output for specific file and line number. Generators report warnings for missing fields.

### Translation Merge Conflicts

**Cause**: Duplicate keys in namespace files  
**Solution**: Ensure unique keys per namespace, check merge output

## Related Documentation

- [Metadata Generation System](./metadata-generation.md)
- [Foundry VTT Module](./foundry-module.md) — downstream consumer of `.metadata.json` output

## Foundry VTT Build (`foundry:build`)

The Foundry VTT export pipeline is **separate from `pre-init`** and must be run independently. It consumes the `.metadata.json` output produced by Stage 4 of `pre-init`.

```bash
npm run foundry:build
# Runs: foundry:export && foundry:pack
```

**Dependency**: Requires `npm run pre-init` (or at minimum `npm run generate-metadata`) to have been run first so `.metadata.json` files exist.

**What it does**:

1. `foundry:export` — Reads `.metadata.json` + `.sheet.mdx` files, transforms to d20 NPC Actor JSON, bundles portrait images, generates circular token images
2. `foundry:pack` — Compiles JSON source files in `foundry/packs/_source/` to LevelDB packs via `@foundryvtt/foundryvtt-cli`

**Output directories**:

- `foundry/packs/_source/monsters/` — one JSON file per exported actor
- `foundry/packs/monsters/` — compiled LevelDB (committed to git)
- `foundry/assets/images/` — bundled portrait WebPs
- `foundry/assets/tokens/` — generated circular token WebPs

For full pipeline documentation see [Foundry VTT Module](./foundry-module.md).

- [Content System Architecture](./content-system.md)
