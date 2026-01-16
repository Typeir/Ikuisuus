# Build Pipeline Architecture

**Purpose**: Complete documentation of the pre-initialization and build pipeline that processes assets, content, and metadata before Next.js compilation.

## Overview

The build pipeline is a **critical dependency chain** that must run before any Next.js build or dev server start. It transforms raw assets and content into the structured format required by the application.

## Pipeline Stages

### Stage 1: Asset Compression (`compress-assets`)
**Script**: `scripts/compressAssets.js`  
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
- `scripts/compressAssets.js` - Main compression logic
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
**Script**: `scripts/kebabifyContent.js`  
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
- `scripts/kebabifyContent.js` - Renaming logic
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
**Script**: `scripts/mdToMdx.js`  
**Purpose**: Convert all `.md` files to `.mdx` extension

**Input**: `src/content/**/*.md`  
**Output**: `src/content/**/*.mdx`

**Process**:
1. Recursively finds all `.md` files
2. Renames to `.mdx` extension (preserves `.sheet.mdx` pattern)
3. No content transformation - only extension change
4. Reports converted files

**Key Files**:
- `scripts/mdToMdx.js` - Renaming logic

**Why Required**:
- Next.js MDX plugin only processes `.mdx` files
- MDX components only work in `.mdx` files

**Special Case**: `.sheet.md` → `.sheet.mdx` (preserves double extension)

### Stage 4: Metadata Generation (`generate-all-metadata`)
**Script**: `scripts/generateMetadata.mjs` (orchestrator)  
**Generators**: 
- `scripts/generateMonsterMetadata.mjs`
- `scripts/generateHeirloomMetadata.mjs`
- `scripts/generateSpellMetadata.mjs`

**Purpose**: Extract structured data from MDX content for search, filtering, and tables

**Input**: 
- `src/content/en/monsters/*.sheet.mdx`
- `src/content/en/items/heirlooms/*.mdx`
- `src/content/en/spells/*.mdx`

**Output**: `.metadata.json` files alongside source files

**Process**:
1. **Monster Generator**:
   - Parses D&D stat block format (italic lines, tables, blockquotes)
   - Extracts: AC, HP, CR, abilities, resistances, damage types
   - Handles multi-variant files (arrays of stat blocks)
   - Tags: creature type, size, legendary actions, spellcasting

2. **Heirloom Generator**:
   - Parses item properties (rarity, attunement, weapon stats)
   - Extracts: damage, range, properties, mastery
   - Tags: item type, weapon properties, magical effects

3. **Spell Generator**:
   - Parses spell header (level, school, quality)
   - Extracts: casting time (as array), components, concentration
   - Tags: damage types, conditions, spell school, mechanics

**Shared Architecture** (see `scripts/shared-utils.mjs`):
- `MetadataGeneratorUtils.runGenerator()` - Standardized orchestration
- `GameData` / `ItemData` - Access to `shared-data.json`
- `ParsingUtils` - Common extraction patterns
- `TaggingUtils` - Unified tag generation
- `PerformanceUtils` - Timing and profiling

**Key Files**:
- `scripts/shared-utils.mjs` - ~1500 lines of shared utilities
- `scripts/shared-data.json` - Single source of truth for game data
- `scripts/generateMetadata.mjs` - Orchestrator that runs all generators
- Individual generators in `scripts/`

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
    "mechanic:legendary-actions",
    "mechanic:multiattack"
  ]
}
```

**Why Required**:
- API routes (`/api/monsters`, `/api/heirlooms`, `/api/spells`) serve this data
- MetadataTable components require structured data for filtering/sorting
- Search functionality needs tags and structured fields

### Stage 5: Merge Locales (`merge-locales`)
**Script**: `scripts/mergeMessages.js`  
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
- `scripts/mergeMessages.js` - Merging logic
- `messages/{locale}/index.json` - Final merged files

**Why Required**:
- `next-intl` reads from `index.json` in production builds
- Namespace organization during development
- Single file simplifies deployment

### Stage 6: Find Reusable MDX Outliers (`find-reusable-mdx-outliers`)
**Script**: `scripts/findReusableMdxOutliers.js`  
**Purpose**: Analyze MDX content for repeated patterns that could be componentized

**Input**: `src/content/**/*.mdx`  
**Output**: Compiled mdx files componentized and exported in `./src/lib/components/mdx...`

**Process**:
1. Scans all MDX files for repeated structures
2. Identifies candidates for custom components
3. Reports frequency and examples
4. Compiles and exports within the component folder

**Example output**:
```bash
Deleted existing output file: ...\Ikuisuus\src\lib\components\mdx\mdxComponents.tsx
✅ LesserMooncleave: compiled and rendered from ...\Ikuisuus\src\content\en\spells\lesser-mooncleave.mdx
✅ FoldDeduplication: compiled and rendered from ...\Ikuisuus\src\content\en\spells\fold-deduplication.mdx

✨ Wrote compiled components to ...\Ikuisuus\src\lib\components\mdx\mdxComponents.tsx
```

**Why Required**: Certain Mdx components encapsulate others, importing reduces general file size.

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
npm run generate-all-metadata
npm run merge-locales
npm run find-reusable-mdx-outliers
```

## Dependency Graph

```
compress-assets (independent)
      ↓
kebabify-content (requires stable filenames)
      ↓
md-to-mdx (requires kebab-case names)
      ↓
generate-all-metadata (requires .mdx extension)
      ↓
merge-locales (independent but conventionally last)
      ↓
find-reusable-mdx-outliers
```

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
```javascript
// scripts/generateMyContentMetadata.mjs
import { MetadataGeneratorUtils } from './shared-utils.mjs';

async function parseMyContentFile(filePath, sharedData) {
  // Parse logic here
  return { slug, title, /* ... */ };
}

async function main() {
  await MetadataGeneratorUtils.runGenerator({
    name: 'My Content Metadata Generator',
    contentType: 'my-content',
    filePattern: /\.mdx$/,
    parseFile: parseMyContentFile
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => { console.error('❌ Fatal error:', error); process.exit(1); });
}
export { main, parseMyContentFile };
```

2. **Update Orchestrator**:
```javascript
// scripts/generateMetadata.mjs
const CONTENT_TYPES = {
  // ... existing types
  myContent: {
    dir: 'src/content/en/my-content',
    pattern: /\.mdx$/,
    generator: 'generateMyContentMetadata.mjs',
    contentType: 'my-content',
    subType: 'standard'
  }
};
```

3. **Add to Pre-Init**:
```json
// package.json
"scripts": {
  "generate-my-content-metadata": "node scripts/generateMyContentMetadata.mjs",
  "generate-all-metadata": "npm run generate-metadata"
}
```

4. **Extend Shared Utilities** (if needed):
```javascript
// scripts/shared-utils.mjs - MetadataGeneratorUtils.getContentDirectory()
static getContentDirectory(contentType) {
  const contentPaths = {
    'monsters': ['src', 'content', 'en', 'monsters'],
    'heirlooms': ['src', 'content', 'en', 'items', 'heirlooms'],
    'spells': ['src', 'content', 'en', 'spells'],
    'my-content': ['src', 'content', 'en', 'my-content']  // Add here
  };
  // ...
}
```

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
- [Content System Architecture](./content-system.md)