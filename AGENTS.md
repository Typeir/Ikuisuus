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

| Change                      | Impact                                                                                                                                      | Documentation                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Copilot Workflow System** | Enforced A→B→C task lifecycle: Analysis → Health Gate → Completion Reconciliation with agents, skills, hooks, and health-check scripts      | [Workflow System](.github/docs/copilot-workflow-system.md)                   |
| **MDX Format Health Check** | `check-mdx-format.ts` validates content structure, naming, components; integrated into composite health gate and post-edit lint hook        | [MDX Content Instructions](.github/instructions/mdx-content.instructions.md) |
| **World Sim Module**        | Three.js solar system with phase-based render lifecycle, DOM overlay bridge, and celestial body renderers                                   | [World Sim Module](.github/docs/world-sim-module.md)                         |
| **RenderLifecycle System**  | Unity-style phase bus (PreUpdate → Update → PostUpdate → PreRender → render → PostRender) replaces ad-hoc callback arrays in SceneManager   | [World Sim Module](.github/docs/world-sim-module.md)                         |
| **Foundry VTT Module**      | Export pipeline: MonsterMetadata → d20 NPC Actor JSON with image bundling, token generation, and LevelDB pack compilation                   | [Foundry Module](.github/docs/foundry-module.md)                             |
| **tools-menu DDD Module**   | `src/lib/components/toolsMenu/` → `src/modules/tools-menu/` with domain types, registry config, `useToolRegistry()` hook, and test coverage | [tools-menu README](src/modules/tools-menu/README.md)                        |

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

---

## Delegated Subsystems

> **⚠️ ATTENTION AGENTS**: Do NOT guess implementations for the following subsystems. You MUST read the associated canonical documentation link before modifying related code.

### 1. Critical Build Pipeline

> **📚 Deep Dive**: [Build Pipeline Architecture](.github/docs/build-pipeline.md)

**ALWAYS run `npm run pre-init` before dev/build** - this is non-negotiable. Consult the deep dive to understand the required build stages (asset compression, kebab-casing, MDX conversion, metadata generation, and locale merging).

### 2. Metadata Generation System

> **📚 Deep Dive**: [Metadata Generation Architecture](.github/docs/metadata-generation.md)

Consult the documentation for the Three-Layer Metadata Architecture (Build → Runtime → Client), shared utilities (`src/lib/metadata/`), schema structures, and performance patterns. All new generators must follow the established standards documented there.

### 3. Content System & Internationalization

> **📚 Deep Dive**: [Content System & Internationalization](.github/docs/content-system.md)

Refer to the documentation for MDX file organization rules, strict kebab-casing, Next.js dynamic routing catch-alls, `next-intl` translation workflows, MDX component registration, and CLI content workflows (`linkify:world`, `scaffold:world`).

### 4. Theme System (CSS Architecture)

> **📚 Deep Dive**: [Theme System Architecture](.github/docs/theme-system.md)

Strict cascade orders and FOUC prevention mechanisms are in place. Consult the documentation for CSS specificity rules, theme token variables, and common pitfalls before altering `globals.scss` or component styles.

### 5. World Sim Module (Three.js)

> **📚 Deep Dive**: [World Sim Architecture](.github/docs/world-sim-module.md)

Consult the documentation for the Mediator Pattern (`WorldSimMediator`), Render Lifecycle phase bus, Strategy Pattern for celestial renderers, and the DOM Overlay Bridge. Three.js owns the canvas, React owns the UI; do not cross these boundaries without referring to the documentation.

---

## Documentation and Examples

**IMPORTANT**: Do NOT create markdown files in the project root or inside `src/`.

- Documentation: Place in `.github/docs/` only.
- Test documentation: Place in `.ignore/tests/` if new markdown is needed.
- Code examples: Embed in JSDoc comments within source files.

## Runtime Debug Namespace — `window.ik`

The project exposes a structured debug namespace at `window.ik` for live inspection and tuning in DevTools. Each subsystem registers a module under a short key.

| Key            | Registered by          | Purpose                                     |
| -------------- | ---------------------- | ------------------------------------------- |
| `window.ik.ws` | `SceneManager.start()` | World Sim controls — removed in `dispose()` |

### World Sim module (`window.ik.ws`)

| Property          | R/W     | Description                                                                                                                             |
| ----------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `deltaTimeCap`    | **R/W** | Max frame delta in seconds before clamping (default `1/15`). Set higher to stress-test, lower to slow physics. Clamped to `[1/120, 1]`. |
| `fps`             | R       | Instantaneous FPS of the last frame (before clamping).                                                                                  |
| `time`            | R       | Accumulated simulation time in seconds since loop start (advances at `deltaTime × simulationSpeed`).                                    |
| `running`         | R       | Whether the animation loop is active.                                                                                                   |
| `simulationSpeed` | **R/W** | Simulation speed multiplier. Default `1` (real-time). `0` = freeze, `100` = fast-forward. Scales orbital positions and mesh rotations.  |

**Adding a new module**: Define your debug interface in `src/lib/debug/ik.ts` under `IkModules`, call `registerIkModule('key', obj)` on mount, and `unregisterIkModule('key')` on unmount.

---

## Reference Files Index

_Use these paths to access specific operational knowledge:_

### Hard Rules & Standards

- **JSDoc Standards**: [.github/docs/jsdoc.md](.github/docs/jsdoc.md)
- **SCSS Theme Rules**: [.github/docs/scss-theme-rules.md](.github/docs/scss-theme-rules.md)
- **Testing Rules**: [.github/docs/testing-rules.md](.github/docs/testing-rules.md)
- **MDX Content Rules**: [.github/instructions/mdx-content.instructions.md](.github/instructions/mdx-content.instructions.md)

### Architecture & Subsystems

- **Build Pipeline**: [.github/docs/build-pipeline.md](.github/docs/build-pipeline.md)
- **Metadata System**: [.github/docs/metadata-generation.md](.github/docs/metadata-generation.md)
- **Theme System**: [.github/docs/theme-system.md](.github/docs/theme-system.md)
- **Content System**: [.github/docs/content-system.md](.github/docs/content-system.md)
- **Encounter Module**: [.github/docs/encounter-module.md](.github/docs/encounter-module.md)
- **World Sim Module**: [.github/docs/world-sim-module.md](.github/docs/world-sim-module.md)
- **Foundry Module**: [.github/docs/foundry-module.md](.github/docs/foundry-module.md)
- **Copilot Workflow**: [.github/docs/copilot-workflow-system.md](.github/docs/copilot-workflow-system.md)

### Copilot Workflow System

- **Agents**: [.github/agents/](.github/agents/)
- **Skills**: [.github/skills/](.github/skills/)
- **Instructions**: [.github/instructions/](.github/instructions/)
- **Prompts**: [.github/prompts/](.github/prompts/)
- **Hooks**: [.github/hooks/hooks.json](.github/hooks/hooks.json)
- **Health Scripts**: [.github/scripts/health-check.ts](.github/scripts/health-check.ts)
- **Task Artifacts**: [.ignore/tasks/](.ignore/tasks/)
- **Reports**: [.ignore/reports/](.ignore/reports/)

### Key Data Sources

- **Shared Game Data**: [scripts/core/shared-data.json](scripts/core/shared-data.json)
- **Celestial Registry**: [src/lib/components/worldSim/data/blackCradleRegistry.json](src/lib/components/worldSim/data/blackCradleRegistry.json)
