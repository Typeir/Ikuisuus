# Navigation Sidebar — Scaling

How the sidebar survives flat content folders, what was tried and rejected, and
why pagination is the next lever. Measured against 910 prerendered library pages.

## The problem

Content folders are flat by design — `spells/` holds 393 pages, `monsters/` 73,
`items/heirlooms/` 71. The walk pulled every leaf into the tree, and the tree
ships in **every** prerendered page.

Worse, it ships twice. The tree crosses into a client component at the root
layout (`ClientProviders`), so it appears once as DOM markup and again as
serialized RSC flight data in the same HTML file.

| | before |
| --- | --- |
| library `*.html` | 283.97 MB |
| library `*.rsc` | 212.79 MB |
| nodes per page | 499 |
| node-instances across corpus | 424,060 |

A spell page was 327 KB, of which ~118 KB was sidebar the reader never saw.

## What shipped

**Width-based stubbing.** `STUB_CHILD_THRESHOLD = 50` — a directory wider than
that becomes a stub regardless of depth, and its children are fetched from
`/api/content/walk` when opened.

| | after |
| --- | --- |
| library `*.html` | 181.57 MB |
| library `*.rsc` | 146.92 MB |
| nodes per page | 33 |
| **total** | **328 MB, −34%** |

Paired with `VIRTUALIZE_THRESHOLD = 50` so one sentence covers both: *a folder too
wide to prerender is exactly a folder the client renders as a window.*

`ITEM_ROW_HEIGHT = 24` is measured from the non-virtualized list — a leaf `li` is
20 px and `space-y-1` adds a 4 px gap. Virtualized rows are absolutely positioned
and never receive that margin, so the gap has to live in the pitch. It was 20
(the content height with the gap dropped), which butted every row against the
next.

## Rejected: contextual prerendering via a parallel route slot

**Idea.** Prerender the folder the open page lives in, stub everything else.

**Obstacle.** A layout receives only its own segment's params, so the root layout
can never know which library page is open. The walk had to move into a route
segment: `[locale]/@sidebar/library/[...slug]`, with the root layout taking the
slot as a prop.

**It worked, and it cost:** +172,719 nodes, **+95.2 MB**, plus **3,640 extra
`.rsc` files** — a parallel route emits its own flight payload per route, which no
node-count model predicts.

**What killed it — slots remount their whole subtree on every navigation:**

```
nav monsters/albedo -> monsters/main          (same folder, cheapest case)
  .sidebar-body   (root layout)  = KEPT
  slot <ul>                      = REPLACED
```

Moving the render from the slot's `page.tsx` into a `layout.tsx` **inside** the
slot changes nothing — tested, identical result. Only the root layout's own
subtree survives a navigation.

The consequence is not cosmetic: every `SidebarItem`'s `open` / `mounted` /
`isClosing` is destroyed, `SidebarShell` restarts at `mounted: false`, and every
accordion replays its `max-height` transition from zero. The sidebar visibly
rebuilds itself on each click. Stored expansion does not save it — the store
holds which paths are open, never the mount state, and mount state was what the
layout position was protecting.

> **Rule.** Never put client state that must survive navigation inside a parallel
> route slot. Slots are for route-dependent *content*, not persistent chrome.

## Rejected: more folders

Bucketing `spells/` into subfolders would make them stub at the depth cap with no
code change. It also breaks every existing URL, and it restructures content
folders to solve a rendering problem — folders are navigation, not taxonomy. It
needs human maintenance for as long as content keeps arriving.

## Next lever: pagination

Virtualization windows the **render**. Stubbing defers the **fetch**. Neither
bounds the **payload of a single expansion** — opening `spells` still transfers
393 nodes in one response.

The primitive already exists and is deliberately switched off:

```
listDirectory()                     accepts { limit, cursor, page, pageSize }
  src/lib/db/content/fileTreeService.ts   returns { entries, total, nextCursor }

repositoryWalk's adapter            calls it with { limit: 10000 }
  navigation/repositoryWalk.ts:66         and discards total + nextCursor
```

So this is wiring, not construction:

1. the walk adapter forwards `cursor`/`limit` instead of flattening to 10000
2. `/api/content/walk` accepts and returns a cursor
3. `useFetchStubChildren` appends pages; the stub's `childCount` already carries
   the total, so "showing 50 of 393" needs no new data

Unlike more folders it needs no content changes, no URL changes, and no ongoing
human effort, and it holds for any folder that grows past the threshold later.

## Prior art: MediaWiki, Docusaurus, Starlight

None of them uses a virtual list or infinite scroll for a sidebar.

| Project | Strategy |
| --- | --- |
| **MediaWiki** | Sidebar is a hand-curated wiki page (`MediaWiki:Sidebar`), rendered HTML cached behind `$wgEnableSidebarCache`. Pagination exists in its category/list views, not the sidebar. |
| **Docusaurus** | Collapsed children are not rendered — server or client — until expanded ([issue #4753](https://github.com/facebook/docusaurus/issues/4753)). Prompted by a user who cut 12 minutes of build time by not rendering the sidebar server-side at all. |
| **Starlight** | Caches the finished sidebar per locale ([PR #2252](https://github.com/withastro/starlight/pull/2252)) instead of rebuilding it per page. On Cloudflare Docs (~4,000 pages): **363 s → 230 s**. |

### Where we already align

- **Starlight's caching, one layer down** — `listDirectory` sits behind an LRU
  (5-minute TTL, 1000 entries), so the walk does not re-read the filesystem 910
  times.
- **Docusaurus's lazy expansion** — `SidebarItem` mounts children only when
  `open` is true, and a stub carries no children at all until fetched.

### Where we diverge, and why prior art is not a drop-in

**1. Build time vs artifact size.** Starlight's 363 s → 230 s is wall-clock; the
HTML they emit is unchanged. Our problem was 497 MB of output — 466 leaves ×
910 pages = 424,060 node-instances, 169 MB of it sidebar. Same symptom, different
failure mode, so their fix does not address ours.

**2. We render collapsed folders server-side; Docusaurus does not.** `StaticItem`
renders children unconditionally — `open` only toggles a CSS `max-height`. Every
page ships the whole tree regardless of what is open. Stubbing cut that from 466
nodes to 33, so the residual cost of this divergence is roughly **6 MB across the
corpus**, against the 169 MB it was before. Adopting the Docusaurus rule would
reclaim most of that 6 MB; it is not currently worth the change.

**3. Double payload — nobody else has it.** Our tree crosses into a client
component at `ClientProviders`, so it appears as DOM **and** as serialized RSC
flight data in the same file. Docusaurus keeps sidebar data in the JS bundle,
Starlight is static Astro, MediaWiki is server-rendered HTML. This is why RSC
(147 MB) and HTML (182 MB) are the same order of magnitude.

### Considered and measured: per-locale tree memo — NOT WORTH IT

Starlight caches the **finished sidebar**; we cache **directory listings**.
`repositoryShallowWalk(locale)` is deterministic per locale — identical output for
all 910 pages — yet it re-walks on every one, including `countDescendants`
recursing all 393 spells just to compute a stub's `childCount`. Memoising the
finished tree would turn 910 walks into 1.

Measured before building it:

```
tree                     33 nodes, 3.7 KB of JSON
deterministic per locale true
cold walk (first)        36.5 ms
warm walks (909)         1151 ms  →  1.27 ms each

total saving             1.15 s per build worker
```

**Rejected.** The LRU already does what Starlight's cache does, one layer down.
Their 133 s saving across ~4,000 pages is **33 ms per page**; ours is **1.27 ms
per page** — roughly 26× cheaper — because `listDirectory` is memoised and
stubbing left only 33 nodes to walk. A memo would recover ~1.1 s of a build
measured in minutes, at the cost of a second cache needing a TTL aligned with the
LRU so runtime revalidation still sees content changes.

Do not revisit without a reason the tree has grown: the figure to re-check is
**ms per warm walk**, not the walk count.

## Our actual new ground

Not "wiki sidebar UX" — that framing overclaims. Two narrower things, neither of
which the prior art has to deal with:

- **A sidebar auto-generated from a flat filesystem.** MediaWiki curates by hand;
  Docusaurus and Starlight consume authored, nested doc trees. None of them ever
  meets a 393-item flat section, so none of them needs virtualisation. They do not
  have the problem rather than having solved it better.
- **Layout-level data crossing an RSC client boundary in a statically generated
  App Router site.** This is what produces the double payload, and what made the
  parallel-route slot look like the only way to get per-route params into the
  sidebar — a path that dead-ends on remounting.

The constraint is technical, not a UX preference. That is why prior art reads as
adjacent rather than applicable.

## Constants

| Constant | Value | Home |
| --- | --- | --- |
| `SHALLOW_WALK_DEPTH` | 2 | `navigation/walkShallow.ts` |
| `STUB_CHILD_THRESHOLD` | 50 | `navigation/walkShallow.ts` |
| `VIRTUALIZE_THRESHOLD` | 50 | `presentation/components/VirtualizedSidebar.tsx` |
| `ITEM_ROW_HEIGHT` | 24 | `presentation/components/VirtualizedSidebar.tsx` |
| `BASE_HEIGHT` | 52 | `domain/constants.ts` — sizes `--expanded-height`, **not** a row |

`BASE_HEIGHT` and `ITEM_ROW_HEIGHT` are unrelated. An earlier comment claimed they
had to match, which is how the virtualizer ended up sizing rows at 20 px.

## Sorting

`calculateHeights` sorts leaves before folders. Folder status must read `isStub`
as well as child count — a stub carries `children: []` until its contents arrive,
so counting only children sorted stubs into the leaf group **and** moved them
across the boundary the moment their children loaded, reordering the tree under
the pointer that had just expanded it.
