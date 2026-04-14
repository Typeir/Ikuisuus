# Copilot Instructions for Library of Ikuisuus

> 📚 **For comprehensive technical details**, see [Architecture Documentation](.github/docs/README.md) - Deep-dive guides for each system component with code examples, extension patterns, and troubleshooting.

## ⚠️ Hard Rules (Non-Negotiable)

These rules are **strictly enforced**. Violations will cause build failures, test failures, or code review rejections.

| Rule                                                                               | Documentation                                                          | Acceptance Check                                                                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| If you are an agent, load PAW skill before any implementation. Load the full file. | [PAW Skill](.github/skills/paw/SKILL.md)                               | PAW SKILL.md read before first edit                                                                |
| JSDoc on all declarations, no inline comments                                      | [JSDoc Standards](.github/docs/jsdoc.md)                               | `grep -rn "// " src/` finds no logic comments                                                      |
| NO color literals outside `globals.scss`                                           | [SCSS Theme Rules](.github/docs/scss-theme-rules.md)                   | `grep -rn "#[0-9a-fA-F]" src/ --include="*.tsx"` returns 0                                         |
| Zero act() warnings in tests                                                       | [Testing Rules](.github/docs/testing-rules.md)                         | `npm test` shows no warnings                                                                       |
| Use NotificationProvider, not `alert()`                                            | [Testing Rules](.github/docs/testing-rules.md)                         | `grep -rn "alert(" src/` returns 0                                                                 |
| Explicit MikroORM decorator typing                                                 | [MikroORM Instructions](.github/instructions/mikroorm.instructions.md) | `rg "@PrimaryKey\(\{(?![^}]*type:)(?![^}]*entity:)[^}]*\}\)" src/lib/db/orm/entities -n` returns 0 |
| Run `npm run pre-init` before dev/build                                            | [Build Pipeline](.github/docs/build-pipeline.md)                       | Build succeeds                                                                                     |
| If you find "pre-existing errors" you must fix them anyway, no excuses             | [PAW Skill](.github/skills/paw/SKILL.md)                               | health:check 0 critical issues, npm run build:vercel clean                                         |

## ✅ Completion Gate (Mandatory)

Before an agent says a task is "done" or "all done", it MUST run:

```bash
npm run health:check
npm test
```

- `npm test` automatically runs `npm run test:enforce` via `pretest`.
- If either command fails, the agent must report blockers and must NOT mark completion.

## Recent Changes

Major architectural changes to be aware of:

### 2026

| Change                      | Impact                                                                                                                                    | Documentation                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Copilot Workflow System** | Enforced A→B→C task lifecycle: Analysis → Health Gate → Completion Reconciliation with agents, skills, hooks, and health-check scripts    | [Workflow System](.github/docs/copilot-workflow-system.md)                   |
| **MDX Format Health Check** | `check-mdx-format.ts` validates content structure, naming, components; integrated into composite health gate and post-edit lint hook      | [MDX Content Instructions](.github/instructions/mdx-content.instructions.md) |
| **World Sim Module**        | Three.js solar system with phase-based render lifecycle, DOM overlay bridge, and celestial body renderers                                 | [World Sim Module](.github/docs/world-sim-module.md)                         |
| **RenderLifecycle System**  | Unity-style phase bus (PreUpdate → Update → PostUpdate → PreRender → render → PostRender) replaces ad-hoc callback arrays in SceneManager | [World Sim Module](.github/docs/world-sim-module.md)                         |
| **Foundry VTT Module**      | Export pipeline: MonsterMetadata → dnd5e NPC Actor JSON with image bundling, token generation, and LevelDB pack compilation               | [Foundry Module](.github/docs/foundry-module.md)                             |

### 2025

| Change                         | Impact                                                                        | Documentation                                        |
| ------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Play Mode Turn Tracker**     | Encounter planner now has live combat tracking with round-start notifications | [Encounter Module](.github/docs/encounter-module.md) |
| **Push Notification Refactor** | Context-based notifications replace alerts; timing constants exported         | [Testing Rules](.github/docs/testing-rules.md)       |
| **Strict JSDoc Enforcement**   | No inline comments, `@property` tags required for interfaces                  | [JSDoc Standards](.github/docs/jsdoc.md)             |
| **SCSS Theme Token Rules**     | All colors via CSS variables only, grep checks in CI                          | [SCSS Theme Rules](.github/docs/scss-theme-rules.md) |
| **Act-Clean Testing**          | Fake timers required for notification tests, async userEvent patterns         | [Testing Rules](.github/docs/testing-rules.md)       |

## Project Overview

Next.js 15 internationalized D&D documentation site with filesystem-based MDX content, three-layer metadata extraction system, and build-time static generation. Features responsive navigation, custom theme system, and automated content processing pipeline.

## Critical Build Pipeline

> **📚 Deep Dive**: [Build Pipeline Architecture](.github/docs/build-pipeline.md) - Complete documentation of all pipeline stages, dependencies, and extension points

**ALWAYS run `npm run pre-init` before dev/build** - this is non-negotiable:

```bash
npm run pre-init  # compress-assets → kebabify-content → md-to-mdx → generate-metadata → merge-locales → find-reusable-mdx-outliers
npm run dev       # Auto-runs pre-init, then starts dev server
npm run build     # Clears .next/cache, runs pre-init, builds for production
```

**Why**: The build fails without pre-init because:

- Images in `public/full-size/` need WebP conversion to `public/library/`
- Content files must be kebab-case and have `.mdx` extensions
- `.metadata.json` files must exist for API routes (`/api/monsters`, `/api/heirlooms`, `/api/spells`, `/api/bloodlines`, `/api/trinkets`, `/api/vocations`, `/api/specializations`)
- Translation JSONs must be merged into `messages/{locale}/index.json`

## Metadata Generation System (Recently Refactored)

> **📚 Deep Dive**: [Metadata Generation Architecture](.github/docs/metadata-generation.md) - Complete three-layer system documentation with schemas, parsing patterns, and extension guide

### Architecture: Shared Metadata Library

All metadata generators (monsters, heirlooms, spells, trinkets, bloodlines, vocations, specializations) are TypeScript files in `scripts/metadata/` and import utilities from the shared `src/lib/metadata/` module:

**Key Exports from `src/lib/metadata/`**:

- `runGenerator()` - Standardized orchestration via `GeneratorConfig`
- `GameData` / `ItemData` - Loaded from `scripts/core/shared-data.json`
- `textUtils` / `parsingUtils` functions - Title extraction, property parsing, numeric values
- `safeWriteFile()` / `safeReadFile()` - Safe file I/O with error handling
- `extractAllTags()` / tagging functions - Damage, conditions, mechanics, lore tag extraction
- `startTimer()` / `endTimer()` - Timing and memory profiling

**Creating New Generators**:

```typescript
// scripts/metadata/generateNewContentMetadata.ts
import {
  runGenerator,
  GameData,
  parseTitle,
  extractAllTags,
} from '@/lib/metadata';
import type { SharedData } from '@/lib/metadata';

async function parseNewContentFile(filePath: string, sharedData: SharedData) {
  // Parse logic here
  return { slug, title /* ... */ };
}

async function main() {
  await runGenerator({
    name: 'New Content Metadata Generator',
    contentType: 'new-content',
    filePattern: /\.mdx$/,
    parseFile: parseNewContentFile,
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { main, parseNewContentFile };
```

### Three-Layer Metadata Architecture

**Layer 1 (Build)**: `scripts/metadata/generateMonsterMetadata.ts`, `generateHeirloomMetadata.ts`, `generateSpellMetadata.ts`, `generateTrinketMetadata.ts`, `generateBloodlineMetadata.ts`, `generateVocationMetadata.ts`, `generateSpecializationMetadata.ts`

- Parse `.sheet.mdx` / `.mdx` files using TypeScript
- Output `.metadata.json` alongside source files
- Monster files can contain **arrays** (multiple stat blocks per file)
- Run `npm run generate-metadata` to execute the orchestrator

**Layer 2 (Runtime)**: `src/app/api/monsters/route.ts`, `/api/heirlooms/route.ts`, `/api/spells/route.ts`, `/api/bloodlines/route.ts`, `/api/trinkets/route.ts`, `/api/vocations/route.ts`, `/api/specializations/route.ts`

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

> **📚 Deep Dive**: [Content System & Internationalization](.github/docs/content-system.md) - Complete documentation of MDX architecture, filesystem routing, locale handling, and translation workflows

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

> **📚 Deep Dive**: [Theme System Architecture](.github/docs/theme-system.md) - Complete documentation of CSS variables, FOUC prevention, cascade order, and common pitfalls

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
  **Namespace**: `layout.json`, `search.json`, `common.json` etc. merged by `scripts/i18n/mergeMessages.ts`

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
npm run linkify:world  # Uses scripts/core/links.json, creates .backup files
```

**How it works**: Parses `scripts/core/links.json` for term→path mappings, converts text references to `[term](/path)` links in `src/content/en/world/**/*.mdx`

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

> **📚 Deep Dive**: [World Sim Architecture](.github/docs/world-sim-module.md) - Full design document with data model, rendering pipeline, and interaction model

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

1. Update parsing logic in `scripts/metadata/generate*Metadata.ts`
2. If adding shared logic, add to the appropriate module in `src/lib/metadata/`
3. Run `npm run generate-metadata` to test
4. Check `.metadata.json` files for correctness
5. Update API route if schema changes

### Module Exports (Generators)

**Pattern for TypeScript generators**:

```typescript
// Generators run unconditionally (tsx always executes top-level code)
async function main() {
  /* ... */
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { main, parseFile }; // Export for orchestrator
```

### Asset Processing

- **Never commit** `public/full-size/` images (git-ignored)
- Sharp converts to WebP max 1600px width in `public/library/`
- Use `<BlendedImage src="/library/images/map.webp" />` in MDX, not `/full-size/`

## Performance Patterns

### Metadata Generators

- Load `scripts/core/shared-data.json` once via `loadSharedData()` (cached) from `@/lib/metadata`
- Use `Promise.allSettled()` for parallel file processing
- Use `safeWriteFile()` from `@/lib/metadata` for error handling
- Monitor with `startTimer()` / `endTimer()` from `@/lib/metadata`

### Component Boundaries

- **Server Components**: Default, use for data fetching
- **Client Components**: `'use client'` only for interactivity (theme selector, search, tables)
- **Hydration**: Minimize client JS, prefer CSS-only solutions

## Reference Files

### Hard Rules (Read First)

- **JSDoc Standards**: `.github/docs/jsdoc.md` - Required formatting, inline comment ban, interface @property tags
- **SCSS Theme Rules**: `.github/docs/scss-theme-rules.md` - NO color literals outside globals.scss, token categories, grep checks
- **Testing Rules**: `.github/docs/testing-rules.md` - Act warning prevention, NotificationProvider wrapping, fake timers

### Architecture Documentation

- **Build Pipeline**: `.github/docs/build-pipeline.md` - Complete pipeline architecture with all stages, dependencies, performance metrics, and extension points
- **Metadata System**: `.github/docs/metadata-generation.md` - Three-layer architecture (build → API → client) with schemas, parsing patterns, and extension guide
- **Theme System**: `.github/docs/theme-system.md` - CSS variables, FOUC prevention, cascade order, specificity patterns, and common pitfalls
- **Content System**: `.github/docs/content-system.md` - MDX architecture, filesystem routing, locale handling, translation workflows, and auto-linking
- **Encounter Module**: `.github/docs/encounter-module.md` - Play Mode turn tracker, mechanics flags (lair, stratagem, legendaryDeed), round-start notifications
- **World Sim Module**: `.github/docs/world-sim-module.md` - Three.js solar system, mediator pattern, render lifecycle, celestial renderers, DOM overlay bridge
- **Foundry Module**: `.github/docs/foundry-module.md` - Export pipeline, monster transformer, deterministic IDs, MDX→HTML, dnd5e maps, token generation, LevelDB compilation
- **Copilot Workflow**: `.github/docs/copilot-workflow-system.md` - Enforced A→B→C task lifecycle, agents, skills, hooks, health checks, reconciliation

### Copilot Workflow System

- **Agents**: `.github/agents/` — Analyzer, Implementer, HealthReviewer, CompletionAuditor, DamoclesDrafter, DamoclesRefactor
- **Skills**: `.github/skills/` — task-lifecycle, damocles-lore, damocles-page-types, mdx-format
- **Instructions**: `.github/instructions/` — jsdoc-standards, mdx-content, metadata-generators, scss-theme, testing, world-sim, damocles-authoring, encounter-module, i18n, build-pipeline
- **Prompts**: `.github/prompts/` — `/start-task`, `/run-health`, `/reconcile-completion`, `/full-workflow`, `/draft-damocles-page`, `/refactor-damocles-mdx`, `/check-damocles-lore-consistency`, `/convert-notes-to-damocles-mdx`, `/add-component`, `/add-test`, `/fix-health`, `/add-metadata-type`
- **Hooks**: `.github/hooks/hooks.json` — PreToolUse violation gate + PostToolUse enforcement + SessionEnd health gates
- **Health Scripts**: `.github/scripts/health-check.ts` — Composite gate (file-length, duplicate-css, jsdoc, antipatterns, test-gaps, mdx-format)
- **Task Artifacts**: `.ignore/tasks/` — Timestamped agile task summaries
- **Reports**: `.ignore/reports/` — Timestamped completion reports

### Key Source Files

- **Shared Data**: `scripts/core/shared-data.json` - Single source of truth for game data (damage types, conditions, abilities, item rarities, spell schools)
- **Metadata Library**: `src/lib/metadata/` - All common generator utilities (`runGenerator`, `GameData`, text/parsing/tagging/file utilities, `startTimer`/`endTimer`)
- **Theme Tokens**: `src/app/[locale]/globals.scss` - All CSS color variables (the ONLY place for color literals)
- **Notification Constants**: `src/lib/components/pushNotification/pushNotification.constants.ts` - Timing constants for tests
- **World Sim Mediator**: `src/lib/components/worldSim/WorldSimMediator.ts` - Central coordinator for the Three.js module
- **Render Lifecycle**: `src/lib/components/worldSim/canvas/RenderLifecycle.ts` - Phase-based frame event system (PreUpdate → PostRender)
- **Celestial Registry**: `src/lib/components/worldSim/data/blackCradleRegistry.json` - Solar system data definitions
