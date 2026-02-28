# Copilot Instructions for Library of Ikuisuus

> 📚 **For comprehensive technical details**, see [Architecture Documentation](./docs/README.md) - Deep-dive guides for each system component with code examples, extension patterns, and troubleshooting.

## ⚠️ Hard Rules (Non-Negotiable)

These rules are **strictly enforced**. Violations will cause build failures, test failures, or code review rejections.

| Rule                                          | Documentation                                  | Acceptance Check                                           |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| JSDoc on all declarations, no inline comments | [JSDoc Standards](./jsdoc.md)                  | `grep -rn "// " src/` finds no logic comments              |
| NO color literals outside `globals.scss`      | [SCSS Theme Rules](./docs/scss-theme-rules.md) | `grep -rn "#[0-9a-fA-F]" src/ --include="*.tsx"` returns 0 |
| Zero act() warnings in tests                  | [Testing Rules](./docs/testing-rules.md)       | `npm test` shows no warnings                               |
| Use NotificationProvider, not `alert()`       | [Testing Rules](./docs/testing-rules.md)       | `grep -rn "alert(" src/` returns 0                         |
| Run `npm run pre-init` before dev/build       | [Build Pipeline](./docs/build-pipeline.md)     | Build succeeds                                             |

## Recent Changes

Major architectural changes to be aware of:

### 2026

| Change                     | Impact                                                                                                                                    | Documentation                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **World Sim Module**       | Three.js solar system with phase-based render lifecycle, DOM overlay bridge, and celestial body renderers                                 | [World Sim Module](./docs/world-sim-module.md) |
| **RenderLifecycle System** | Unity-style phase bus (PreUpdate → Update → PostUpdate → PreRender → render → PostRender) replaces ad-hoc callback arrays in SceneManager | [World Sim Module](./docs/world-sim-module.md) |

### 2025

| Change                         | Impact                                                                        | Documentation                                  |
| ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| **Play Mode Turn Tracker**     | Encounter planner now has live combat tracking with round-start notifications | [Encounter Module](./docs/encounter-module.md) |
| **Push Notification Refactor** | Context-based notifications replace alerts; timing constants exported         | [Testing Rules](./docs/testing-rules.md)       |
| **Strict JSDoc Enforcement**   | No inline comments, `@property` tags required for interfaces                  | [JSDoc Standards](./jsdoc.md)                  |
| **SCSS Theme Token Rules**     | All colors via CSS variables only, grep checks in CI                          | [SCSS Theme Rules](./docs/scss-theme-rules.md) |
| **Act-Clean Testing**          | Fake timers required for notification tests, async userEvent patterns         | [Testing Rules](./docs/testing-rules.md)       |

## Project Overview

Next.js 15 internationalized D&D documentation site with filesystem-based MDX content, three-layer metadata extraction system, and build-time static generation. Features responsive navigation, custom theme system, and automated content processing pipeline.

## Critical Build Pipeline

> **📚 Deep Dive**: [Build Pipeline Architecture](./docs/build-pipeline.md) - Complete documentation of all pipeline stages, dependencies, and extension points

**ALWAYS run `npm run pre-init` before dev/build** - this is non-negotiable:

```bash
npm run pre-init  # compress-assets → kebabify-content → md-to-mdx → generate-all-metadata → merge-locales
npm run dev       # Auto-runs pre-init, then starts dev server
npm run build     # Clears .next/cache, runs pre-init, builds for production
```

**Why**: The build fails without pre-init because:

- Images in `public/full-size/` need WebP conversion to `public/library/`
- Content files must be kebab-case and have `.mdx` extensions
- `.metadata.json` files must exist for API routes (`/api/monsters`, `/api/heirlooms`, `/api/spells`)
- Translation JSONs must be merged into `messages/{locale}/index.json`

## Metadata Generation System (Recently Refactored)

> **📚 Deep Dive**: [Metadata Generation Architecture](./docs/metadata-generation.md) - Complete three-layer system documentation with schemas, parsing patterns, and extension guide

### Architecture: Shared Utilities Pattern

All metadata generators (monsters, heirlooms, spells) now use **shared-utils.mjs** to eliminate ~226 lines of duplication:

**Key Classes**:

- `MetadataGeneratorUtils` - Standardized orchestration via `runGenerator()` method
- `GameData` / `ItemData` - Single source of truth from `scripts/shared-data.json`
- `TextUtils` / `ParsingUtils` - Common parsing (title extraction, property parsing, numeric values)
- `FileUtils` - Safe file I/O with error handling
- `TaggingUtils` - Unified tag extraction (damage, conditions, mechanics, lore)
- `PerformanceUtils` - Timing and memory profiling

**Creating New Generators**:

```javascript
// scripts/generateNewContentMetadata.mjs
import { MetadataGeneratorUtils } from './shared-utils.mjs';

async function main() {
  await MetadataGeneratorUtils.runGenerator({
    name: 'New Content Metadata Generator',
    contentType: 'new-content', // Add to MetadataGeneratorUtils.getContentDirectory()
    filePattern: /\.mdx$/,
    parseFile: parseNewContentFile,
    processResult: (result) => ({ metadata: result, count: 1 }), // Optional
  });
}

// Export main for orchestrator, run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
export { main, parseNewContentFile };
```

### Three-Layer Metadata Architecture

**Layer 1 (Build)**: `generateMonsterMetadata.mjs`, `generateHeirloomMetadata.mjs`, `generateSpellMetadata.mjs`

- Parse `.sheet.mdx` / `.mdx` files using regex
- Output `.metadata.json` alongside source files
- Monster files can contain **arrays** (multiple stat blocks per file)

**Layer 2 (Runtime)**: `src/app/api/monsters/route.ts`, `/api/heirlooms/route.ts`, `/api/spells/route.ts`

- Read `.metadata.json` files via `fs.readdirSync`
- Locale-aware: `?locale=en`
- Flatten arrays with `.flat()` for multi-variant monster files
- **Critical**: Use `getContentFolder(locale)` helper for paths

**Layer 3 (Client)**: Generic `MetadataTable` + specialized wrappers

- Generic component: `src/lib/components/mdx/MetadataTable/metadataTable.tsx`
- Wrappers: `monsterTableWrapper.tsx`, `heirloomTableWrapper.tsx`, `spellTableWrapper.tsx`
- Props: `data`, `columns` (with `getValue`, `render`, `compareValues`), `getRowSlug`, `searchKeys`
- Use in MDX: `<MonsterTable />` or `<MonsterTable locale="es" />`

## Content System

> **📚 Deep Dive**: [Content System & Internationalization](./docs/content-system.md) - Complete documentation of MDX architecture, filesystem routing, locale handling, and translation workflows

### File Organization (Enforced by Scripts)

- **Kebab-case only**: `albedo-the-bleak-bloom.sheet.mdx`, not `Albedo_The_Bleak_Bloom.md`
- **MDX extensions**: All content must be `.mdx` (use `npm run md-to-mdx` to convert)
- **Locale mirroring**: `src/content/en/items/armor.mdx` → `src/content/es/items/armor.mdx`
- **Special files**: `.sheet.mdx` = monster stat blocks, `main.mdx` = category index (excluded from metadata)

### Dynamic Routing & Static Generation

- **Route**: `src/app/[locale]/library/[...slug]/page.tsx` (catch-all segments)
- **Static Params**: `generateStaticParams()` crawls `src/content/en/` at build time
- **Content Resolution**: `resolveContentFilePath.ts` handles locale fallbacks
- **MDX Compilation**: `next-mdx-remote-client/rsc` for server-side, client fallback on error

### MDX Component Registration

Custom components in `src/lib/components/mdx/index.tsx`:

```typescript
const components = {
  MonsterTable: MonsterTableWrapper,
  HeirloomTable: HeirloomTableWrapper,
  SpellTable: SpellTableWrapper,
  BlendedImage: BlendedImage,
  // ... register here to use in .mdx files
};
```

## Theme System (CSS Architecture)

> **📚 Deep Dive**: [Theme System Architecture](./docs/theme-system.md) - Complete documentation of CSS variables, FOUC prevention, cascade order, and common pitfalls

**Critical CSS Cascade Order** (in `globals.scss`):

```scss
// 1. SCSS variables first
$transition-ease-springy: cubic-bezier(0.68, -0.6, 0.32, 1.6);

// 2. Theme color variables (BEFORE Tailwind)
:root {
  --color-bg: #111217; /* dark theme defaults */
}
html[data-theme='light'] {
  --color-bg: #ffffff;
}
html[data-theme='dark'] {
  --color-bg: #111217;
}

// 3. Tailwind imports
@tailwind base;
@tailwind components;
@tailwind utilities;

// 4. Base layer overrides (INCLUDING prose overrides)
@layer base {
  strong,
  b {
    font-weight: 700 !important;
  }
  .prose blockquote strong {
    color: var(--color-emphasis) !important;
  }
}
```

**Theme Persistence** (prevent FOUC):

- `src/lib/utils/themeScript.ts` generates inline script injected in `<head>`
- Runs before DOM render, reads localStorage, sets `data-theme` attribute
- Components access theme via CSS variables, not JS

## Internationalization (i18n)

### Locale Structure

- **Supported**: `en`, `es`, `fi` (in `src/i18n/routing.ts`)
- **Middleware**: `src/middleware.ts` handles routing via `next-intl`
- **Translations**: `messages/{locale}/*.json` → merged to `messages/{locale}/index.json`
- **Namespace**: `layout.json`, `search.json`, `common.json` etc. merged by `mergeMessages.js`

### Translation Workflow

```bash
# 1. Add translations to messages/en/my-feature.json
# 2. Merge into index.json
npm run merge-locales

# 3. Access in components
import { useTranslations } from 'next-intl';
const t = useTranslations('my-feature');
```

## Content Workflows

### Auto-Linking (World Content Only)

```bash
# Dry run first to see changes
npm run linkify:world:dry

# Apply with backup
npm run linkify:world  # Uses scripts/links.json, creates .backup files
```

**How it works**: Parses `scripts/links.json` for term→path mappings, converts text references to `[term](/path)` links in `src/content/en/world/**/*.mdx`

### Scaffolding Missing Content

```bash
npm run scaffold:world:dry  # Preview files that would be created
npm run scaffold:world      # Generate placeholder .mdx files for broken links
```

## Documentation and Examples

**IMPORTANT**: Do NOT create markdown files in the project root or inside src/.

- Documentation: Place in `.github/docs/` only (use existing markdown files)
- Test documentation: Place in `.ignore/tests/` if new markdown is needed
- Code examples: Embed in JSDoc comments within source files
- Configuration notes: Add inline comments or update existing `.github/docs/` files

This keeps the project clean and prevents documentation clutter.

## World Sim Module (Three.js)

> **📚 Deep Dive**: [World Sim Architecture](./docs/world-sim-module.md) - Full design document with data model, rendering pipeline, and interaction model

A Three.js-powered interactive solar system renderer. Three.js owns the 3D canvas, React owns all DOM UI, and a **Bridge Layer** projects 3D positions to 2D screen coordinates each frame.

### Architecture (Mediator Pattern)

`WorldSimMediator` is the single coordinator — subsystems never communicate directly:

```
SceneManager ← manages renderer, scene, camera, animation loop
CameraController ← orbit controls + follow system + command transitions
ProjectionBridge ← 3D→2D projection, direct DOM element binding
SceneEventBus ← typed pub/sub (body:click, body:hover, camera:transition:*)
CelestialRegistry ← static data query layer (from data/blackCradleRegistry.json)
```

### Render Lifecycle (Phase Bus)

The `RenderLifecycle` class in `canvas/RenderLifecycle.ts` provides Unity-style frame phases:

```
PreUpdate → Update → PostUpdate → PreRender → renderer.render() → PostRender
```

Subscribe with priority and label:

```typescript
sceneManager.lifecycle.on(
  RenderPhase.Update,
  (ctx: FrameContext) => {
    updateOrbits(ctx.time, ctx.deltaTime);
  },
  { priority: 10, label: 'orbits' },
);
```

The mediator registers: simulation in `Update`, camera in `PostUpdate`, DOM label projection in `PostRender` (after WebGL draw, so labels use the finalized camera matrix).

### Celestial Renderers (Strategy Pattern)

Each body type has a renderer in `celestials/`: `StarRenderer`, `PlanetRenderer`, `GasGiantRenderer`, `RingWorldRenderer`, `TowerWorldRenderer`, `AsteroidBeltRenderer`, `EverdarkRenderer`. All implement `ICelestialRenderer` (see `interfaces.ts`). `CelestialBodyFactory` instantiates them by discriminant.

### DOM Overlay Bridge

- `ProjectionBridge.bindElement(id, element)` — bridge directly sets `el.style.transform` each frame (no React re-renders)
- `CelestialLabel` uses `forwardRef` so the bridge mutates the DOM element at 60fps
- Labels are positioned in `PostRender` phase to avoid frame desync with the canvas
- `OverlayContainer` binds label refs to the bridge via `useWorldSimCanvas()` hook

### Camera System

- `CameraController` composes `CameraOrbitControls` (input) + `CameraFollowSystem` (body tracking) + `CameraCommand` (animated transitions)
- Follow delta only shifts the orbit center (`target`), camera position is always computed from `target + spherical offset` in a single write to prevent jitter
- Commands: `ZoomToBodyCommand`, `ZoomToRegionCommand`, `ResetViewCommand`

### Key Files

- **Entry point**: `src/lib/components/worldSim/WorldSim.tsx`
- **Mediator**: `WorldSimMediator.ts` — central coordinator
- **Lifecycle**: `canvas/RenderLifecycle.ts` — phase-based frame events
- **Scene**: `canvas/SceneManager.ts` — Three.js lifecycle, owns `lifecycle` instance
- **Projection**: `bridge/ProjectionBridge.ts` — 3D→2D with direct DOM binding
- **Hook**: `hooks/useWorldSimCanvas.ts` — React↔Three.js bridge
- **Data**: `data/blackCradleRegistry.json` — celestial body definitions
- **Context**: `context/WorldSimContext.tsx` — React state (useReducer)

## Common Pitfalls

### CSS Specificity Issues

**Wrong**: Adding color to blockquote overrides child elements

```scss
.prose blockquote {
  color: var(--color-text);
} // ❌ Breaks bold/heading colors
```

**Right**: Let children inherit, use `!important` for explicit overrides

```scss
.prose blockquote strong {
  color: var(--color-emphasis) !important;
} // ✅
```

### Metadata Generator Changes

**When modifying generators**:

1. Update parsing logic in `scripts/generate*Metadata.mjs`
2. If adding shared logic, put in `scripts/shared-utils.mjs` classes
3. Run `npm run generate-all-metadata` to test
4. Check `.metadata.json` files for correctness
5. Update API route if schema changes

### Module Exports (Generators)

**Pattern for generators callable by orchestrator**:

```javascript
async function main() {
  /* ... */
}

// Only run if executed directly (not via import)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { main, parseFile }; // Export for orchestrator
```

### Asset Processing

- **Never commit** `public/full-size/` images (git-ignored)
- Sharp converts to WebP max 1600px width in `public/library/`
- Use `<BlendedImage src="/library/images/map.webp" />` in MDX, not `/full-size/`

## Performance Patterns

### Metadata Generators

- Load `shared-data.json` once via `loadSharedData()` (cached)
- Use `Promise.allSettled()` for parallel file processing
- Use `FileUtils.safeWriteFile()` for error handling
- Monitor with `PerformanceUtils.startTimer()` / `endTimer()`

### Component Boundaries

- **Server Components**: Default, use for data fetching
- **Client Components**: `'use client'` only for interactivity (theme selector, search, tables)
- **Hydration**: Minimize client JS, prefer CSS-only solutions

## Reference Files

### Hard Rules (Read First)

- **JSDoc Standards**: `./jsdoc.md` - Required formatting, inline comment ban, interface @property tags
- **SCSS Theme Rules**: `./docs/scss-theme-rules.md` - NO color literals outside globals.scss, token categories, grep checks
- **Testing Rules**: `./docs/testing-rules.md` - Act warning prevention, NotificationProvider wrapping, fake timers

### Architecture Documentation

- **Build Pipeline**: `./docs/build-pipeline.md` - Complete pipeline architecture with all stages, dependencies, performance metrics, and extension points
- **Metadata System**: `./docs/metadata-generation.md` - Three-layer architecture (build → API → client) with schemas, parsing patterns, and extension guide
- **Theme System**: `./docs/theme-system.md` - CSS variables, FOUC prevention, cascade order, specificity patterns, and common pitfalls
- **Content System**: `./docs/content-system.md` - MDX architecture, filesystem routing, locale handling, translation workflows, and auto-linking
- **Encounter Module**: `./docs/encounter-module.md` - Play Mode turn tracker, mechanics flags (lair, stratagem, legendaryDeed), round-start notifications
- **World Sim Module**: `./docs/world-sim-module.md` - Three.js solar system, mediator pattern, render lifecycle, celestial renderers, DOM overlay bridge

### Key Source Files

- **Shared Data**: `scripts/core/shared-data.json` - Single source of truth for game data (damage types, conditions, abilities, item rarities, spell schools)
- **Shared Utils**: `scripts/core/shared-utils.mjs` - All common generator utilities (MetadataGeneratorUtils, GameData, TextUtils, ParsingUtils, FileUtils, etc.)
- **Theme Tokens**: `src/app/[locale]/globals.scss` - All CSS color variables (the ONLY place for color literals)
- **Notification Constants**: `src/lib/components/pushNotification/pushNotification.constants.ts` - Timing constants for tests
- **World Sim Mediator**: `src/lib/components/worldSim/WorldSimMediator.ts` - Central coordinator for the Three.js module
- **Render Lifecycle**: `src/lib/components/worldSim/canvas/RenderLifecycle.ts` - Phase-based frame event system (PreUpdate → PostRender)
- **Celestial Registry**: `src/lib/components/worldSim/data/blackCradleRegistry.json` - Solar system data definitions
