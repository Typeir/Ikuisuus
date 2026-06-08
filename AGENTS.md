# Copilot: Library of Ikuisuus

> [Architecture Documentation](.github/docs/README.md) — component deep-dives, examples, troubleshooting.

## Hard Rules — Enforced

Violations → build failure, test failure, review rejection.

| Rule                                                        | Documentation                                             | Acceptance Check                                     |
| ----------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| Caveman Speak — concise only, tokens cost. Technical focus. | [Caveman](.github/skills/caveman/SKILL.md.md)             | "I am caveman, will do — {caveman request}"          |
| Agent: load PAW skill fully before any edit.                | [PAW](.github/skills/paw/SKILL.md)                        | PAW SKILL.md read first.                             |
| JSDoc on exports only, no inline comments                   | [JSDoc](.github/docs/jsdoc.md)                            | `grep -rn "// " src/` → 0                            |
| No color literals outside `globals.scss`                    | [SCSS](.github/docs/scss-theme-rules.md)                  | `grep -rn "#[0-9a-fA-F]" src/ --include="*.tsx"` → 0 |
| Zero act() warnings in tests                                | [Testing](.github/docs/testing-rules.md)                  | `npm test` → no warnings                             |
| Use NotificationProvider, not `alert()`                     | [Testing](.github/docs/testing-rules.md)                  | `grep -rn "alert(" src/` → 0                         |
| MikroORM decorators explicit typed                          | [MikroORM](.github/instructions/mikroorm.instructions.md) | `@PrimaryKey()` has `type:` + `entity:`              |
| Run `npm run pre-init` before dev/build                     | [Build](.github/docs/build-pipeline.md)                   | Build succeeds                                       |
| Pre-existing errors? Fix anyway.                            | [PAW](.github/skills/paw/SKILL.md)                        | health:check 0 critical                              |

## Completion Gate

Before marking done, run:

```bash
npm run health:check
npm test
```

`npm test` runs `test:enforce` via `pretest`. Failure → no completion.

## Recent Changes

### 2026

| Change           | Details                                                                                          | Doc                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Copilot Workflow | A→B→C: Analyze → Gate → Reconcile. Agents, skills, hooks, checks.                                | [Workflow](.github/docs/copilot-workflow-system.md)     |
| MDX Format Check | Validates structure, naming, components. Composite gate + lint hook.                             | [MDX](.github/instructions/mdx-content.instructions.md) |
| World Sim        | Three.js system, phase render, DOM overlay, celestial renderers.                                 | [World Sim](.github/docs/world-sim-module.md)           |
| RenderLifecycle  | Phase bus replaces callbacks. PreUpdate → Update → PostUpdate → PreRender → render → PostRender. | [World Sim](.github/docs/world-sim-module.md)           |
| Foundry Export   | MonsterMetadata → d20 NPC JSON, images, tokens, LevelDB packs.                                   | [Foundry](.github/docs/foundry-module.md)               |
| tools-menu DDD   | Moved to `src/modules/tools-menu/`. Domain types, registry, hook, tests.                         | [tools-menu](src/modules/tools-menu/README.md)          |

### 2025

| Change        | Details                                                 | Doc                                           |
| ------------- | ------------------------------------------------------- | --------------------------------------------- |
| Turn Tracker  | Live combat, round-start notices.                       | [Encounter](.github/docs/encounter-module.md) |
| Notifications | Context-based, replaces alerts. Timing consts exported. | [Testing](.github/docs/testing-rules.md)      |
| JSDoc Strict  | No inline, `@property` on interfaces.                   | [JSDoc](.github/docs/jsdoc.md)                |
| SCSS Tokens   | Colors → CSS vars only. Grep checks in CI.              | [SCSS](.github/docs/scss-theme-rules.md)      |
| Act-Clean     | Fake timers, async userEvent patterns.                  | [Testing](.github/docs/testing-rules.md)      |

## Project: Next.js 15 D&D Site

Filesystem MDX, i18n, three-layer metadata, build-time static gen. Responsive nav, theme system, content pipeline.

---

## Delegated Subsystems

MUST read docs before touching. No guessing.

### 1. Build Pipeline

[Deep Dive](.github/docs/build-pipeline.md)

Run `npm run pre-init` before dev/build. Stages: asset compression, kebab-casing, MDX → metadata gen, locale merge.

### 2. Metadata System

[Deep Dive](.github/docs/metadata-generation.md)

Three-layer: Build → Runtime → Client. Shared utils in `src/lib/metadata/`. Schema, perf patterns. Generators must follow standards.

### 3. Content & i18n

[Deep Dive](.github/docs/content-system.md)

MDX org, kebab-casing strict, Next.js catch-alls, `next-intl` flows, component reg, CLI (`linkify:world`, `scaffold:world`).

### 4. Theme System

[Deep Dive](.github/docs/theme-system.md)

Cascade order strict, FOUC prevention active. CSS specificity, token vars, pitfalls in docs.

### 5. World Sim (Three.js)

[Deep Dive](.github/docs/world-sim-module.md)

Mediator Pattern, phase bus, Strategy (renderers), DOM bridge. Three.js owns canvas, React owns UI. Boundary strict.

---

## Documentation Rules

No markdown in root or `src/`. Docs → `.github/docs/` only. Test docs → `.ignore/tests/` only. Examples → JSDoc.

## Debug Namespace: `window.ik`

Live inspection in DevTools. Each subsystem registers short key.

| Key            | Registered             | Purpose                                     |
| -------------- | ---------------------- | ------------------------------------------- |
| `window.ik.ws` | `SceneManager.start()` | World Sim controls (removed in `dispose()`) |

### `window.ik.ws` Properties

| Prop              | R/W |                                                             |
| ----------------- | --- | ----------------------------------------------------------- |
| `deltaTimeCap`    | RW  | Max Δt (def 1/15). Stress test ↑, slow ↓. Clamp [1/120, 1]. |
| `fps`             | R   | Instantaneous FPS.                                          |
| `time`            | R   | Sim time (seconds). Δt × speed.                             |
| `running`         | R   | Loop active?                                                |
| `simulationSpeed` | RW  | Multiplier. 0=freeze, 100=fast. Default 1.                  |

Add module: Define in `src/lib/debug/ik.ts`. `registerIkModule('key', obj)` on mount, `unregisterIkModule('key')` on unmount.

---

## Reference Index

### Standards

- [JSDoc](.github/docs/jsdoc.md)
- [SCSS](.github/docs/scss-theme-rules.md)
- [Testing](.github/docs/testing-rules.md)
- [MDX](.github/instructions/mdx-content.instructions.md)

### Architecture

- [Build](.github/docs/build-pipeline.md)
- [Metadata](.github/docs/metadata-generation.md)
- [Theme](.github/docs/theme-system.md)
- [Content](.github/docs/content-system.md)
- [Encounter](.github/docs/encounter-module.md)
- [World Sim](.github/docs/world-sim-module.md)
- [Foundry](.github/docs/foundry-module.md)
- [Copilot Workflow](.github/docs/copilot-workflow-system.md)

### Workflow System

- [Agents](.github/agents/)
- [Skills](.github/skills/)
- [Instructions](.github/instructions/)
- [Prompts](.github/prompts/)
- [Hooks](.github/hooks/hooks.json)
- [Health](.github/scripts/health-check.ts)
- [Tasks](.ignore/tasks/)
- [Reports](.ignore/reports/)

### Data

- [Game Data](scripts/core/shared-data.json)
- [Celestial Registry](src/lib/components/worldSim/data/blackCradleRegistry.json)
