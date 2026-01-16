# Scripts Directory - Hexagonal Architecture

This directory contains all build, content processing, and utility scripts organized using hexagonal architecture principles (ports-and-adapters pattern). Each subdirectory represents a bounded context with specific responsibilities.

## Architecture Overview

```
scripts/
├── assets/          # Asset processing domain
├── build/           # Build-time operations domain
├── content/         # Content transformation domain
├── i18n/            # Internationalization domain
├── metadata/        # Metadata generation domain
├── core/            # Shared infrastructure layer
├── utils/           # Development utilities (not in build pipeline)
└── wip/             # Work-in-progress features
```

## Domain Directories

### 📦 assets/ - Asset Processing
**Concern**: Transform and optimize static assets for production

**Scripts**:
- `compressAssets.js` - Converts full-resolution images to WebP format (max 1600px width)

**npm run**: `compress-assets`

**Pipeline Stage**: 1 (first in pre-init)

**Dependencies**: Sharp (image processing library)

---

### 🔨 build/ - Build-Time Operations
**Concern**: Production build cleanup and optimization

**Scripts**:
- `cleanFullSize.js` - Environment-aware cleanup of `public/full-size/` (Vercel only)

**npm run**: `clean-fullsize`

**Pipeline Stage**: Post-build cleanup (not part of pre-init)

**Environment**: Vercel CI/CD only (checks `VERCEL` env var)

---

### 📝 content/ - Content Transformation
**Concern**: MDX content normalization, transformation, and linking

**Scripts**:
- `kebabifyContent.js` - Converts all filenames/folders to kebab-case
- `mdToMdx.js` - Renames `.md` files to `.mdx` (preserves `.sheet.mdx`)
- `findReusableMdxOutliers.js` - Identifies repeated patterns for componentization
- `linkifyRunner.mjs` - Auto-links terms to content pages (uses `core/links.json`)
- `scaffoldFromLinks.mjs` - Creates placeholder MDX files for broken links

**npm run**: 
- `kebabify-content`
- `md-to-mdx`
- `find-reusable-mdx-outliers`
- `linkify:world`, `linkify:world:dry`
- `scaffold:world`, `scaffold:world:dry`

**Pipeline Stage**: 2, 3, 6 (kebabify → md-to-mdx → find-reusable-mdx)

**Dependencies**: `core/links.json` for linkify/scaffold scripts

---

### 🌐 i18n/ - Internationalization
**Concern**: Translation file management and locale cleanup

**Scripts**:
- `mergeMessages.js` - Merges namespaced translation files into `index.json` per locale
- `cleanTranslations.js` - Removes unused translations (Vercel only, no-op locally)

**npm run**: 
- `merge-locales`
- `clean-translations`

**Pipeline Stage**: 5 (merge-locales)

**Dependencies**: `messages/{locale}/*.json` → `messages/{locale}/index.json`

---

### 🏷️ metadata/ - Metadata Generation
**Concern**: Extract structured data from MDX content for filtering/searching

**Scripts**:
- `generateMetadata.mjs` - **Orchestrator** (runs all generators)
- `generateMonsterMetadata.mjs` - Parses `.sheet.mdx` stat blocks
- `generateHeirloomMetadata.mjs` - Parses heirloom item properties
- `generateSpellMetadata.mjs` - Parses spell headers (level, school, quality)
- `generateTrinketMetadata.mjs` - Parses consumable item properties

**npm run**: 
- `generate-all-metadata` (orchestrator)
- `generate-monster-metadata`
- `generate-heirloom-metadata`
- `generate-spell-metadata`
- `generate-trinket-metadata`

**Pipeline Stage**: 4 (metadata generation)

**Output**: `.metadata.json` files alongside source MDX

**Dependencies**: `core/shared-utils.mjs`, `core/shared-data.json`

**API Integration**: Metadata consumed by `/api/monsters`, `/api/heirlooms`, `/api/spells`, `/api/trinkets`

---

### 🔧 core/ - Shared Infrastructure
**Concern**: Common utilities, game data, and configuration

**Files**:
- `shared-utils.mjs` (~1500 lines) - Centralized utilities for metadata generators
  - `MetadataGeneratorUtils` - Orchestration utilities
  - `GameData` / `ItemData` - Access to shared game data
  - `TextUtils` - String manipulation (kebabCase, stripMarkdown, etc.)
  - `ParsingUtils` - Common extraction patterns (parseTitle, parseProperties, etc.)
  - `TaggingUtils` - Unified tag generation (damage, conditions, mechanics)
  - `FileUtils` - Safe file I/O with error handling
  - `PerformanceUtils` - Timing and profiling

- `shared-data.json` - **Single source of truth** for game constants
  - `gameData`: damage types, conditions, abilities, sizes, creature types, senses, movement types
  - `itemData`: rarities, item types, weapon properties, mastery properties
  - `spellData`: schools, spell qualities

- `links.json` - Term→path mappings for auto-linking world content

**npm run**: N/A (imported by other scripts)

**Usage**: `import { TextUtils, GameData } from '../core/shared-utils.mjs'`

---

### 🛠️ utils/ - Development Utilities
**Concern**: Developer tools and analysis scripts (not in build pipeline)

**Scripts**:
- `precompileMdx.js` - Pre-compiles MDX for debugging
- `mdxifyHeadingImages.js` - Converts heading images to MDX components
- `scrapWikidot.js` - Web scraping for content migration
- `treeSize.js` - Analyzes directory sizes
- `testMetadataSystem.mjs` - Tests metadata generator end-to-end
- `standardizeTraitHeadings.js` - UNUSED - Normalizes monster trait headings

**npm run**: Prefixed with `util:` (e.g., `util:tree-size`, `util:test-metadata`)

**Pipeline Stage**: Not part of build pipeline (dev tools only)

---

### 🚧 wip/ - Work in Progress
**Concern**: Features under development (not production-ready)

**Scripts**:
- `bundleMonsterMetadata.js` - WIP bundled API approach (replaced by file-based API)
- `bundleHeirloomMetadata.js` - WIP bundled API approach (replaced by file-based API)

**npm run**: `wip:bundle-metadata`

**Status**: Not used in production (superseded by per-file `.metadata.json` approach)

**Future**: May be revived for performance optimization if needed

---

## Build Pipeline (pre-init)

The `pre-init` script runs before Next.js dev/build to process assets and content:

```bash
npm run pre-init
```

**Execution Order**:
1. `compress-assets` - Convert images to WebP (assets/)
2. `kebabify-content` - Normalize filenames (content/)
3. `md-to-mdx` - Convert extensions (content/)
4. `generate-all-metadata` - Extract structured data (metadata/)
5. `merge-locales` - Combine translation files (i18n/)
6. `find-reusable-mdx-outliers` - Identify reusable patterns (content/)

**Total Time**: ~10-45 seconds (depending on content volume)

**Why Required**: Next.js build fails without pre-init because:
- Images referenced in MDX don't exist (`/library/` paths require compression)
- API routes expect `.metadata.json` files
- Translation system needs merged `index.json` files
- Content must have `.mdx` extensions for MDX compiler

---

## Development Workflows

### Fast Development (Skip Pre-Init)
```bash
npm run dev:raw
```
Starts Next.js dev server without running pre-init. Use when:
- Only editing existing MDX content (no new files)
- No image changes
- Testing UI/CSS changes

**Warning**: May fail if new images, metadata, or translations are needed.

---

### Full Development (With Pre-Init)
```bash
npm run dev
```
Runs full pre-init pipeline before starting dev server. Use when:
- Adding new content files
- Adding new images
- Changing metadata generators
- Updating translations

---

### Production Build
```bash
npm run build
```
Clears Next.js cache, runs pre-init, then builds. Always use for deployments.

---

## Adding New Scripts

### 1. Determine Domain
Choose the appropriate folder based on the script's concern:
- **assets/** - If processing images, fonts, or other static assets
- **build/** - If performing build-time cleanup or optimization
- **content/** - If transforming MDX files or content structure
- **i18n/** - If managing translations or locales
- **metadata/** - If extracting data from content files
- **utils/** - If creating dev tools (not part of build pipeline)
- **wip/** - If experimental/not production-ready

### 2. Follow JSDoc Standards
See `.github/jsdoc.md` for comprehensive documentation guidelines.

Required tags:
- `@fileoverview` - Brief description
- `@module` - Module name
- `@version` - Version number
- `@param` / `@returns` - For all functions
- `@example` - Usage examples

### 3. Update package.json
Add script with appropriate prefix:
- No prefix: Build pipeline scripts
- `util:` - Development utilities
- `wip:` - Work-in-progress features

Example:
```json
"my-new-script": "node scripts/content/myNewScript.js"
```

### 4. Update This README
Add entry to appropriate domain section with:
- Script name and purpose
- npm run command
- Pipeline stage (if applicable)
- Dependencies
- Example usage

---

## Path Conventions

All scripts should use **project root relative paths** for consistency:

### JavaScript (CommonJS)
```javascript
const path = require('path');
const PROJECT_ROOT = path.join(__dirname, '..', '..'); // Go up from scripts/domain/
const contentPath = path.join(PROJECT_ROOT, 'src', 'content', 'en');
```

### JavaScript (ESM)
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..'); // Go up from scripts/domain/
```

### Shared Utilities Import
```javascript
// From metadata generators
import { TextUtils, GameData } from '../core/shared-utils.mjs';

// From content scripts
import { TextUtils } from '../core/shared-utils.mjs';
```

---

## Testing Scripts

### Individual Script
```bash
npm run generate-monster-metadata
```

### Full Pipeline
```bash
npm run pre-init
```

### Utility Scripts
```bash
npm run util:test-metadata
npm run util:tree-size
```

### WIP Features
```bash
npm run wip:bundle-metadata
```

---

## Troubleshooting

### "Module not found" errors
- Check import paths use correct `../` levels
- Verify `shared-utils.mjs` imports use `../core/`
- Ensure `shared-data.json` is in `scripts/core/`

### "ENOENT: no such file or directory"
- Check `PROJECT_ROOT` calculation goes up enough levels
- Verify `process.cwd()` is used for project-relative paths
- For `__dirname` paths: `path.resolve(__dirname, '..', '..')` from `scripts/domain/`

### Pre-init fails
- Run individual stages to isolate issue
- Check console output for specific error
- Verify all dependencies installed (`npm install`)

### Metadata not updating
- Delete existing `.metadata.json` files: `find src/content -name "*.metadata.json" -delete`
- Run `npm run generate-all-metadata`
- Check generator console output for parsing errors

---

## Performance Metrics

**Typical pre-init execution times**:
- compress-assets: ~5-30s (depends on image count)
- kebabify-content: <1s
- md-to-mdx: <1s
- generate-all-metadata: ~50-150ms (parallel processing)
  - Monsters (48 files): ~50ms
  - Heirlooms (50 files): ~40ms
  - Spells (16 files): ~10ms
  - Trinkets (14 files): ~10ms
- merge-locales: <1s
- find-reusable-mdx-outliers: ~1-3s

**Total**: ~10-45 seconds

**Memory**: Heap delta typically <5MB per generator

---

## Related Documentation

- [Build Pipeline Architecture](../.github/docs/build-pipeline.md)
- [Metadata Generation System](../.github/docs/metadata-generation.md)
- [Content System & i18n](../.github/docs/content-system.md)
- [JSDoc Standards](../.github/jsdoc.md)
