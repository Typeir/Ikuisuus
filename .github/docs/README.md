# Architecture Documentation

Comprehensive guides for the Library of Ikuisuus codebase. Each document provides deep technical details, code examples, and extension patterns for a specific architectural component.

## Quick Start

New to the codebase? Start here:

1. **[Copilot Instructions](../copilot-instructions.md)** - High-level overview and critical patterns
2. **[Build Pipeline](./build-pipeline.md)** - Understand the mandatory pre-init workflow
3. **[Content System](./content-system.md)** - Learn how MDX content and routing work

## ⚠️ Hard Rules (Read First)

Before contributing, understand these non-negotiable requirements:

| Topic            | Rule                                             | Documentation                             |
| ---------------- | ------------------------------------------------ | ----------------------------------------- |
| **JSDoc**        | Required on all declarations, no inline comments | [JSDoc Standards](./jsdoc.md)             |
| **Theme Tokens** | NO color literals outside globals.scss           | [SCSS Theme Rules](./scss-theme-rules.md) |
| **Testing**      | Zero act warnings, fake timers for notifications | [Testing Rules](./testing-rules.md)       |
| **Build**        | Always run `npm run pre-init` before dev/build   | [Build Pipeline](./build-pipeline.md)     |

## Document Index

### 📋 [JSDoc Standards](./jsdoc.md)

**When to read**: Before writing any code

JSDoc requirements for all TypeScript/JavaScript files.

**Key Topics**:

- File-level `@fileoverview` requirements
- Interface `@property` tags (no inline comments)
- Function documentation patterns
- React component `@component` tag

**Essential for**: All contributors

---

### 🎨 [SCSS Theme Rules](./scss-theme-rules.md)

**When to read**: Before writing any CSS/SCSS or inline styles

Strict color token requirements for theming.

**Key Topics**:

- **NO color literals** outside `globals.scss`
- Available token categories
- How to add new tokens
- Grep-based acceptance checks

**Essential for**: Any styling work

---

### 🧪 [Testing Rules](./testing-rules.md)

**When to read**: Before writing any tests

Vitest + React Testing Library patterns.

**Key Topics**:

- Act warning prevention
- Async userEvent patterns
- NotificationProvider wrapping
- Fake timers for notifications
- Mock patterns (portal, next-intl)

**Essential for**: Test authors

---

### ⚔️ [Encounter Module](./encounter-module.md)

**When to read**: When working with encounter planner or Play Mode

Combat runner and tracker system documentation.

**Key Topics**:

- Play Mode turn tracker
- Mechanics flags (`lair`, `stratagem`, `legendaryDeed`, `resist`)
- Round-start notifications
- Heroic Awakening system
- Testing patterns

**Essential for**: Encounter feature work

---

### 🔧 [Build Pipeline Architecture](./build-pipeline.md)

**When to read**: Before running dev server or making build-related changes

Complete documentation of the pre-initialization pipeline.

**Key Topics**:

- 6 pipeline stages
- Why `npm run pre-init` is mandatory
- Dependency graph and execution order
- Extension points

**Essential for**: Build issues, new pipeline stages

---

### 🗂️ [Metadata Generation System](./metadata-generation.md)

**When to read**: When working with monsters, heirlooms, spells, or creating new content types

Three-layer metadata extraction architecture.

**Key Topics**:

- Shared utilities pattern
- Monster, heirloom, and spell metadata schemas
- API route implementation
- Generic MetadataTable component

**Essential for**: Content type work

---

### 🎨 [Theme System Architecture](./theme-system.md)

**When to read**: When working with CSS or encountering theme-related issues

CSS-based theme system with FOUC prevention.

**Key Topics**:

- CSS cascade order
- FOUC prevention
- ThemeSelector implementation
- Prose typography overrides

**Essential for**: Theme debugging

---

### 📄 [Content System & Internationalization](./content-system.md)

**When to read**: When adding content, working with MDX, or implementing i18n features

MDX-based content system with filesystem routing.

**Key Topics**:

- Filesystem routing
- Locale fallback strategy
- MDX component registration
- Translation file merging

**Essential for**: Content work

---

### 🌌 [World Sim Module](./world-sim-module.md)

**When to read**: When working with the Three.js solar system, celestial renderers, or DOM overlays

Three.js-powered interactive solar system with mediator architecture.

**Key Topics**:

- Mediator pattern (subsystems never communicate directly)
- RenderLifecycle phase bus (PreUpdate → PostRender)
- Celestial renderer strategy pattern
- ProjectionBridge DOM overlay binding
- Camera follow system and command transitions

**Essential for**: World Sim feature work

---

### ⚙️ [Copilot Workflow System](./copilot-workflow-system.md)

**When to read**: When configuring agents, skills, prompts, or the health gate

Enforced A→B→C agentic task lifecycle.

**Key Topics**:

- Three-phase workflow (Analysis → Implementation + Health Gate → Completion)
- Agent roles and handoff protocol
- Skills, instructions, and prompt conventions
- Health check composite gate

**Essential for**: Workflow and CI customization

---

### 🏗️ [Metadata Table System](./metadata-table.md)

**When to read**: When adding new metadata table wrappers or modifying the generic table

Filterable, sortable table components for structured content.

**Key Topics**:

- Generic `MetadataTable` component API
- Type-specific wrappers (Monster, Heirloom, Spell)
- Column definitions with `getValue`, `render`, `compareValues`
- API data fetching pattern

**Essential for**: Table UI work

---

### 🗡️ [Phase Deeds System](./phase-deeds.md)

**When to read**: When working with HP-threshold mechanics or creature lifecycle tracking

Phase Deeds mechanic for combat encounters.

**Key Topics**:

- HP threshold phases (Wounded, Bloodied, Doomed)
- Phase marker display
- Integration with encounter planner

**Essential for**: Combat mechanics work

---

### 🔀 Multirepo Sync

Three related docs for the content submodule sync system:

- **[Setup Guide](./MULTIREPO_SETUP.md)** - Implementation summary and file inventory
- **[Quick Reference](./MULTIREPO_QUICKSTART.md)** - TL;DR usage commands
- **[Strategy Analysis](./multirepo-sync-analysis.md)** - Design rationale and option comparison

**When to read**: When committing changes that span both the main repo and `src/content` submodule

**Essential for**: Content sync workflows

---

## Cross-Document Navigation

```
Build Pipeline
    ├─> Metadata Generation (Stage 4: generate-all-metadata)
    ├─> Content System (Stage 2-3: kebabify, md-to-mdx)
    └─> Internationalization (Stage 5: merge-locales)

Metadata Generation
    ├─> Content System (reads .mdx files)
    └─> Uses shared-data.json for game constants

Testing Rules
    ├─> Encounter Module (Play Mode testing)
    └─> Theme System (notification testing)

SCSS Theme Rules
    └─> Theme System (token definitions)

World Sim Module
    ├─> RenderLifecycle (phase bus for frame events)
    ├─> ProjectionBridge (3D→2D, uses finalized camera matrix)
    └─> Content System (body/region deep-links to MDX content)
```

## File Reference Map

Quick reference for where key files are located:

**Build Scripts**:

- `scripts/assets/compressAssets.js` - Stage 1: Image compression
- `scripts/content/kebabifyContent.js` - Stage 2: Filename normalization
- `scripts/content/mdToMdx.js` - Stage 3: Extension conversion
- `scripts/metadata/generateMetadata.mjs` - Stage 4: Orchestrator
- `scripts/i18n/mergeMessages.js` - Stage 5: Translation merging
- `scripts/content/findReusableMdxOutliers.js` - Stage 6: Duplication analysis

**Metadata System**:

- `scripts/metadata/generateMonsterMetadata.mjs` - Monster stat block parser
- `scripts/metadata/generateHeirloomMetadata.mjs` - Heirloom item parser
- `scripts/metadata/generateSpellMetadata.mjs` - Spell parser (with casting time array)
- `scripts/core/shared-utils.mjs` - All shared utilities
- `scripts/core/shared-data.json` - Game data constants
- `src/app/api/monsters/route.ts` - Monster API endpoint
- `src/app/api/heirlooms/route.ts` - Heirloom API endpoint
- `src/app/api/spells/route.ts` - Spell API endpoint
- `src/lib/components/mdx/MetadataTable/` - Table components

**Theme System**:

- `src/app/[locale]/globals.scss` - CSS variables and cascade (single source for color literals)
- `src/lib/enums/themes.ts` - Theme enum and constants
- `src/lib/utils/themeScript.ts` - FOUC prevention script
- `src/app/[locale]/layout.tsx` - Root layout with inline script
- `src/lib/components/themeSelector/` - Theme toggle component
- `tailwind.config.ts` - Tailwind integration with CSS variables

**Encounter Module**:

- `src/lib/components/encounterPlanner/` - Main encounter planner components
- `src/lib/components/encounterPlanner/playMode/` - Play Mode turn tracker
- `src/lib/types/encounterPlanner.ts` - Core types (EncounterConfig, Combatant)
- `src/lib/types/inProgressCombat.ts` - Combat state types (CombatantMechanics)
- `src/lib/utils/encounterUtils.ts` - Tag-to-mechanics flag mapping

**World Sim Module**:

- `src/lib/components/worldSim/WorldSim.tsx` - Root entry point
- `src/lib/components/worldSim/WorldSimMediator.ts` - Central coordinator
- `src/lib/components/worldSim/canvas/RenderLifecycle.ts` - Phase-based frame events
- `src/lib/components/worldSim/canvas/SceneManager.ts` - Three.js lifecycle, owns `lifecycle` instance
- `src/lib/components/worldSim/bridge/ProjectionBridge.ts` - 3D→2D projection with direct DOM binding
- `src/lib/components/worldSim/bridge/SceneEventBus.ts` - Typed pub/sub events
- `src/lib/components/worldSim/camera/CameraController.ts` - Orbit + follow + command facade
- `src/lib/components/worldSim/celestials/interfaces.ts` - All type definitions
- `src/lib/components/worldSim/celestials/CelestialBodyFactory.ts` - Renderer strategy factory
- `src/lib/components/worldSim/data/blackCradleRegistry.json` - Solar system data
- `src/lib/components/worldSim/hooks/useWorldSimCanvas.ts` - React↔Three.js bridge hook
- `src/lib/components/worldSim/context/WorldSimContext.tsx` - React state (useReducer)

**Notifications**:

- `src/lib/components/pushNotification/` - NotificationProvider, useNotifications hook
- `src/lib/components/pushNotification/pushNotification.constants.ts` - Timing constants

**Testing**:

- `tests/setup/vitest.setup.ts` - Global test configuration
- `tests/setup/mocks/` - Portal, next-intl, and other mocks
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `vitest.config.mts` - Vitest configuration (ESM module)

**Content System**:

- `src/content/{locale}/` - All MDX content (en, es, fi)
- `src/app/[locale]/library/[...slug]/page.tsx` - Dynamic content route
- `src/lib/utils/resolveContentFilePath.ts` - Locale fallback resolver
- `src/lib/components/mdx/index.tsx` - MDX component registration
- `src/i18n/routing.ts` - Locale configuration
- `src/middleware.ts` - next-intl middleware
- `messages/{locale}/` - Translation files
- `scripts/linkifyMarkdown.mjs` - Auto-linking
- `scripts/scaffoldFromLinks.mjs` - Placeholder generation

## Common Workflows

### Adding a New Content Type

1. Read: [Metadata Generation § Extending the System](./metadata-generation.md#extending-the-system)
2. Read: [Content System § Adding New Content](./content-system.md#adding-new-content)
3. Update: `scripts/shared-utils.mjs` (add to `getContentDirectory()`)
4. Create: `scripts/generateMyContentMetadata.mjs`
5. Create: `src/app/api/my-content/route.ts`
6. Create: `src/lib/components/mdx/MetadataTable/myContentTableWrapper.tsx`
7. Register: `src/lib/components/mdx/index.tsx`

### Debugging Build Failures

1. Check: [Build Pipeline § Error Scenarios](./build-pipeline.md#error-scenarios)
2. Run: `npm run pre-init` (full pipeline)
3. Check: Console output for specific stage errors
4. Common issues:
   - Missing .mdx extension → Run `npm run md-to-mdx`
   - Non-kebab-case files → Run `npm run kebabify-content`
   - Missing images → Run `npm run compress-assets`
   - Missing metadata → Run `npm run generate-all-metadata`

### Fixing Theme Issues

1. Read: [Theme System § Common Issues](./theme-system.md#common-issues)
2. Check: CSS cascade order in `globals.scss` (theme vars → Tailwind → @layer base)
3. Verify: `data-theme` attribute on `<html>` element
4. Debug: Browser DevTools "Computed" tab for CSS variable values
5. Common issues:
   - FOUC → Script must be in `<head>` before content
   - Colors not updating → Wrong specificity (use `html[data-theme="..."]`)
   - Prose text wrong color → Override in `@layer base`

### Adding Translations

1. Read: [Content System § Translation Files](./content-system.md#translation-files)
2. Create: `messages/{locale}/my-feature.json`
3. Run: `npm run merge-locales`
4. Use: `const t = useTranslations('my-feature')`
5. Mirror: Create corresponding content in `src/content/{locale}/`

## Getting Help

**Can't find what you need?**

1. Check [copilot-instructions.md](../copilot-instructions.md) for high-level patterns
2. Search this docs folder for keywords
3. Grep the codebase: `npm run grep-search "pattern"`
4. Check related files in the reference map above

**Found an issue or want to improve docs?**

- Docs should be project-specific, not generic advice
- Include real code examples from the codebase
- Link to related documents for cross-cutting concerns
- Add to "Common Issues" sections when debugging something

## Document Conventions

All architecture documents follow these patterns:

**Structure**:

- **Purpose** statement at top
- **Overview** for context
- **Architecture** with diagrams
- **Usage** with code examples
- **Common Issues** with solutions
- **Extending** with templates
- **Related Documentation** links

**Code Examples**:

- Use actual code from the codebase
- Include file paths for reference
- Show both correct and incorrect patterns
- Explain _why_, not just _what_

**Cross-References**:

- Link to related documents
- Use relative paths (`./.github/docs/...`)
- Reference specific sections with anchors
