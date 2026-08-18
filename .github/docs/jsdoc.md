# JSDoc Standards

JSDoc is a technical manual entry. It states what a thing is and what it does. Nothing else.

---

## Tone: Dry Caveman. Nothing Else.

> **HARD RULE**: JSDoc is **dry, caveman-style technical description**. Nothing else. Nothing more.

**FORBIDDEN in all JSDoc**: philosophy, literary prose, poetry, poetic allegory, bible-style writing, storytelling, narrative flourish, metaphors, filler.

**Rule**: shortest description that says what the thing does, in code terms.
If caveman can't explain it, use **strict ASD-STE100** (Simplified Technical English: one meaning per word, short sentences, approved word list).

This is the spec `plans/caveman-jsdoc.swarm.mjs` rewrites files against. The sections below are how it is measured.

---

## Length Budget — Hard Limit

| Block           | Budget                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| `@fileoverview` | 1–3 sentences                                                                       |
| Function / hook | 1 sentence, plus `@param` / `@returns`                                              |
| Component       | 1 sentence, plus per-prop `@param` lines                                            |
| Interface       | 1 sentence, plus `@property` lines                                                  |
| Constant        | 1 sentence                                                                          |
| `@description`  | Do not author one. See [When @description Is Allowed](#when-description-is-allowed) |

Over budget is a review rejection. If a function description needs a third sentence, the code needs a better name or a smaller function.

Never leave a JSDoc block empty. One dry sentence is the floor.

Trimming an existing block rewrites the prose after a tag. It never deletes the tag line.

---

## Sentence Form

Write **"X is Y"** and **"Does Z"**. Declarative, present tense, no subject pronoun.

```typescript
/** Resolves a slug to its content path. Returns null when the slug is unknown. */
/** Registry of DM tools shown in the sidebar menu. */
/** True when the viewport is below the `lg` breakpoint. */
```

Banned openers: "This function...", "A utility that...", "Helper which...", "Responsible for...".

---

## Forbidden Content

Never appears in JSDoc:

| Forbidden                                        | Goes instead in               |
| ------------------------------------------------ | ----------------------------- |
| Rationale, "why we chose X"                      | `.ignore/tasks/`              |
| Trade-offs, alternatives weighed                 | `.ignore/tasks/`              |
| History, "used to be", "we moved from"           | git log                       |
| Bug war stories                                  | git log                       |
| Architecture essays                              | `.github/docs/`               |
| Philosophy, metaphor, prose, narrative           | nowhere                       |
| "not X, but Y" antithesis                        | nowhere — state it positively |
| "load-bearing", "the real trick is", "note that" | nowhere                       |

## Always Keep

Terse means fewer words, not fewer facts. These are caller-facing and stay in, however short the block gets:

- Units, ranges, and hard limits — "truncates at 1024 chars", "clamped to [0, 1]"
- Defaults for optional params
- Error conditions and what throws
- Side effects — writes to disk, mutates the argument, fires a request
- Null/empty return cases

**Exception**: a constraint that will be broken by the next person editing that exact line may carry one sentence, stated as an instruction.

```scss
/* Do not add :not(:disabled) here — it beats single-class component hovers. */
```

That is an instruction, not an explanation. It is one line. It is not a paragraph about the cascade.

---

## Enforcement

Three surfaces, one spec — this file.

| Surface                                | Enforces                                           |
| -------------------------------------- | -------------------------------------------------- |
| `.github/scripts/checkJsdocQuality.ts` | Mechanical rules below, via `npm run health:check` |
| `.paw/gates/jsdocQuality.gate.ts`      | Same rules, `severity: critical`, in real time     |
| `plans/caveman-jsdoc.swarm.mjs`        | Tone and length, one agent per tracked file        |

Mechanical rules:

| Rule                         | Check                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| File heading tags            | `@fileoverview`, `@module`, `@author`, `@version`, `@since` |
| No inline comments in bodies | `// ` inside a function → failure                           |
| Typed `@param` tags          | `@param {Type} name - desc`, never bare `@param name`       |
| No color literals            | Hex codes outside `globals.scss`                            |
| No browser dialogs           | `alert()`, `confirm()`, `prompt()`                          |

Exempt: `*.test.ts(x)`, `*.stories.ts(x)`, `*.d.ts`, `*.config.ts`.

Allowed inline prefixes: `eslint`, `@ts-`, `TODO:`, `FIXME:`, `HACK:`, `prettier-ignore`, `region`, a bare URL.

---

## Templates

### File heading

```typescript
/**
 * @fileoverview Resolves tool registry entries into locale-aware menu items.
 *
 * @module src/modules/tools-menu/application/hooks/useToolRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */
```

`@requires` is optional and takes one clause per dependency. Skip it unless the dependency is non-obvious.

### Function

```typescript
/**
 * Returns the tool menu items for the current locale.
 *
 * @function useToolRegistry
 * @returns {ToolMenuItem[]} Ordered menu items.
 */
```

### Component

Every prop gets a `@param` line. This is the one place exhaustiveness beats brevity — the lines are the contract, and they surface in IDE hover.

```tsx
/**
 * Dropdown menu of DM tools.
 *
 * @component
 * @param {ToolsMenuProps} props - Component props.
 * @param {ToolMenuItem[]} props.items - Items to display.
 * @param {(item: ToolMenuItem) => void} props.onSelect - Fires on selection.
 * @param {ReactNode} props.trigger - Trigger button content.
 * @param {string} [props.label] - Accessible name for the menu.
 * @returns {JSX.Element} Menu with trigger and dropdown.
 */
```

### Interface

`@property` tags only. Never inline `/** */` on members.

```typescript
/**
 * One item in the DM tools menu.
 *
 * @interface ToolMenuItem
 * @property {string} id - Stable identifier, used as React key.
 * @property {string} label - Translated display text.
 * @property {string} href - Locale-prefixed URL.
 */
```

### Constant

```typescript
/**
 * DM tools exposed in the sidebar, in display order.
 *
 * @constant TOOL_REGISTRY
 * @type {readonly ToolRegistryEntry[]}
 */
```

---

## ❌ / ✅

### Too long

```typescript
/**
 * ❌
 * Narrows TOOL_REGISTRY to the entries listable under the given build mode.
 * Entries flagged devOnly survive only when isDevelopment is true; the /labs
 * routes they point at return 404 outside development, so listing them in
 * production would hand the user a dead link. This keeps the menu honest
 * without needing a second registry.
 */

/**
 * ✅
 * Returns registry entries visible in the given build mode. Drops `devOnly`
 * entries outside development.
 */
```

### Editorializing

```typescript
/**
 * ❌
 * The `body` prefix is deliberate and load-bearing. _document.scss loads after
 * this file and resets border-color at (0,0,1) — the same specificity as a bare
 * button — so it won the tie on source order and repainted the outline grey.
 */

/**
 * ✅
 * Prefixed with `body` to outrank the `body *` border reset in _document.scss.
 */
```

### Prose

```typescript
/**
 * ❌
 * Aura of Stillness — like the hush before dawn, this aura weaves a tapestry
 * of silence over the battlefield.
 */

/**
 * ✅
 * Silences creatures within 30 ft.
 */
```

---

## When `@description` Is Allowed

Only for a parser, generator, or algorithm where the ordered steps are the contract and cannot be read off the signature. Bullets or a numbered list. No paragraphs. Never a restatement of the `@param` lines or a walkthrough of the code.

```typescript
/**
 * Parses casting time into action-economy types.
 *
 * @function parseCastingTimeToArray
 * @param {string} raw - Raw casting time text.
 * @returns {string[]} Action types.
 *
 * @description Priority, first match wins:
 * 1. Minor Action
 * 2. action
 * 3. reaction
 * 4. minute / hour / day
 */
```

`@example` follows the same rule: one input, one output, no commentary.

---

## Inline Comments

Prohibited inside function bodies. Extract a named helper and document that instead.

```typescript
// ❌
function processData(items: Item[]) {
  // Filter out inactive items
  const active = items.filter((i) => i.active);
}

// ✅
function processData(items: Item[]) {
  return limitResults(sortByPriority(filterActive(items)), 10);
}
```

SCSS stays near-silent. A section banner is fine. A paragraph is not.

---

## Tag Reference

`@fileoverview` `@module` `@version` `@author` `@since` `@requires` `@function` `@async` `@param` `@returns` `@throws` `@constant` `@type` `@default` `@interface` `@property` `@component` `@class` `@constructor` `@method` `@example` `@description`

Types: `{string}` `{string|number}` `{string[]}` `{Record<string, T>}` `{Promise<T>}` `{(v: T) => void}` `{Type} [optional]` `{Type} [optional=default]`

---

**Maintained by**: Typeir
