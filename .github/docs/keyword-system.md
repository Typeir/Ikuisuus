# Keyword System

Inline references from any content file to a rules definition, resolved at compile time and
baked into the page.

`[# kw:condition;blinded #]` in a spell renders as a link to the `## Blinded` heading in
`conditions.rule.mdx`, and carries that section's prose with it so hover costs no network.

---

## Grammar

| Form                         | Meaning                                          |
| ---------------------------- | ------------------------------------------------ |
| `[# kw:condition;blinded #]` | Namespaced. `condition` names an index.          |
| `[# kw:accuracy #]`          | Bare. Resolved against the bare namespace.       |
| `[# kw:condition;Blinded #]` | Display casing preserved, lookup is slug-folded. |

The separator is `;`. Namespace and value are both required when `;` is present; a stray
semicolon in a bare reference is rejected rather than read as a term.

Values are matched by heading slug. `anchorSlug('Damage Bonus')` is `damage-bonus`, so the
defining heading must be `### Damage Bonus`.

Parsing lives in [`keywordExpressionParser.ts`](../../src/lib/md/keywordExpressionParser.ts) and
does no lookup. Resolution is the caller's job.

---

## Declaration

Namespaces are hand-authored in frontmatter. Nothing is implicit; the ContentType enum does not
create namespaces.

```yaml
---
keywordIndex: condition # every heading in this file joins the `condition` namespace
---
```

```yaml
---
keywords: # these named terms join the bare namespace
  - accuracy
  - damage bonus
---
```

`keywordIndex` is bulk: all headings, no list to maintain. `keywords` is explicit: only the
terms named; a declared term with no matching heading contributes nothing.

**Namespaces merge.** Several files may declare `keywordIndex: condition`; their keys combine.
Runtime resolution reads the `produces` arrays the generators stamp on metadata records: the
keyword graph maps a shard id to the file that defines it, and `resolveShardByRef` reads that
one file to extract the section.

---

## Module split

`keywordIndexRegistry` reads the filesystem. `remarkKeyword` reaches the client bundle through
`compileRuntime`, which is `'use client'`. The two must not be the same module.

| Module                                                            | Side   | Holds                                                          |
| ----------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| [`keywordIndex.ts`](../../src/lib/md/keywordIndex.ts)             | Either | `keywordTemplateId`, bare-namespace key                         |
| [`keywordIndexRegistry.ts`](../../src/lib/md/keywordIndexRegistry.ts) | Server | `extractProducedKeys`, frontmatter parsing, gray-matter          |
| [`resolveShardByRef.ts`](../../src/lib/md/resolveShardByRef.ts)   | Server | Graph lookup, section extraction, document keyword resolution    |

No re-export between the pure and server modules. Importing the wrong one puts `fs/promises` in
the browser bundle.

Graph loading is scoped to one locale. Namespaces merge across files, so mixing locales would
let a second locale contest every shared value.

---

## Pipeline

```
authored MDX
  → remarkKeyword                    resolves ref against the registry
      ├── no registry supplied       <Keyword term display>            (unlinked)
      ├── resolves                   <Keyword term display href>       (linked)
      └── malformed                  plain text, unchanged
  → rehypeSectionize
  → page HTML
```

The registry is passed as a plugin option by [`compileStatic`](../../src/modules/library/infrastructure/compile/compileStatic.ts)
and [`compileDynamic`](../../src/modules/library/infrastructure/compile/compileDynamic.ts).
`compileRuntime` is client-side, gets no registry, and renders keywords unlinked.

A well-formed reference always becomes a `<Keyword>` node. Source markup never reaches the
reader, even when the reference resolves to nothing.

---

## Consumer / producer map

The reason the map exists: prose is not stored alongside the index. The map says which page
needs which shard, so the bake knows what to inject and the invalidation knows what to rebuild.

| Column      | Direction | Populated by                                       |
| ----------- | --------- | -------------------------------------------------- |
| `consumes`  | Forward   | `stampSharedFields` via `extractKeywordRefs`        |
| `consumers` | Reverse   | Nothing yet                                         |

`consumes` is stamped into the `.meta/` sidecar at generation time and synced to Postgres.
Migration `027_keyword_consumption` adds both as `text[] NOT NULL DEFAULT '{}'` across the ten
file-level tables, with a GIN index on `consumes`.

`consumers` must never be written from a sidecar. No sidecar carries the key, so a sync that
included it would clear the reverse index on every run. It is seeded `[]` on insert only.

**Current contents are raw references**, e.g. `['resist']`, not resolved pointers. The schema
comment in [`baseMetadata.d.ts`](../../src/lib/db/content/schemas/baseMetadata.d.ts) says
`file#anchor`. One of the two is wrong; see Open decisions.

---

## The bake (designed, not built)

Shards are baked into the consuming page at ISR time, using the shard scaffolding that already
exists. No fetch on hover.

1. A page's `consumes` names the references it needs.
2. Each reference resolves to `filePath` + `anchor`.
3. `resolveShards` extracts that section from the defining file, the same call the
   `/api/content-shards/[type]/[slug]` routes make.
4. The section compiles and is emitted once per distinct reference into an inert
   [`<template>`](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots).
5. `<Keyword>` clones the template's `DocumentFragment` into its floating container on hover.

Template content is inert: not rendered, no image loads, no script execution, no layout cost
until cloned. The prose ships in the static HTML, so hover is a `cloneNode` and nothing else.

Baked prose is rendered, not flattened. Nested links, emphasis and lists inside a condition
definition survive into the tooltip.

**Invalidation** is the reverse direction. When `conditions.rule.mdx` changes, `consumers` names
every page holding a baked copy, and those paths are revalidated through
[`/api/revalidate`](../../src/app/api/revalidate/route.ts). Without `consumers` populated, edits
to a rules page leave stale prose baked into every consumer.

---

## State

| Piece                                       | State                                            |
| ------------------------------------------- | ------------------------------------------------ |
| Grammar, parser, `extractKeywordRefs`       | Built                                            |
| `keywordIndex` / `keywords` declaration     | Built                                            |
| Registry discovery, merge, collisions       | Built                                            |
| `remarkKeyword` resolution to `href`        | Built, wired into both server compile paths      |
| `consumes` stamping                         | Built. 838 sidecars carry the key, 70 non-empty  |
| Migration 027 columns and GIN index         | Built                                            |
| `consumers` reverse index                   | Declared everywhere, populated nowhere           |
| Shard bake into `<template>`                | Not built                                        |
| `<Keyword>` hover reading the template      | Not built. Renders a flat string from a hardcoded map |
| Rule sections for the four bare terms       | Not written. Drafts in `.ignore/tasks/`          |

`condition` is the only declared namespace: 24 values, 0 collisions, and **0 references**.
All 100 references in the corpus are bare terms that no file declares, so nothing resolves today.

122 plain markdown links already point at `conditions#anchor`. Those are the migration candidates
that would make `condition` load-bearing without waiting on new rules prose.

---

## Open decisions

**What `consumes` stores.** The raw reference (`resist`) or the resolved pointer
(`rules/steel-and-strife/checks-and-rolls.rule.mdx#resist`). The pointer makes the reverse index
a direct match and survives a term being redefined elsewhere; the raw reference survives the
defining file moving. Current data holds the raw reference.

**Where the four bare terms are defined.** `accuracy`, `damage bonus`, `resist` and `briefly` have
no defining heading anywhere. `resist` covers 41 of the 100 references on its own. Nothing in the
rules currently slugs to any of these four, so there is no conflict to resolve, only prose to
write.

**Whether a converted keyword keeps its emphasis.** Conversion trades `**blinded**` for a link
styled with accent colour and a dotted underline. Across 122 sites that changes how spell blocks
read. One rule in [`Keyword.module.scss`](../../src/modules/library/presentation/components/Keyword/Keyword.module.scss).

**`cursor: help` is unconditional** on `.keyword`, but the tooltip only appears when there is
something to show. A keyword with no baked shard currently shows a help cursor over nothing.
