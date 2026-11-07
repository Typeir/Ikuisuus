---
name: add-metadata-type
description: >
  Add a metadata content type end to end. Generator with entrypoint guard,
  CONTENT_TYPES registration, CLI flag, schema, fs and pg adapters, repository
  port, API route, i18n keys, table component, and both barrels.
---

# Add Metadata Type

## Purpose

Wires one content type from `.mdx` source to a rendered table. Nine touchpoints.
Missing any one leaves the type half-wired: generator runs but nothing serves it,
or the route serves but MDX cannot render the table.

Read first: [Metadata Generation](../../docs/metadata-generation.md) and
[Metadata Table](../../docs/metadata-table.md).

## 1. Source Layout

Files use a type suffix: `src/content/en/{dir}/*.{type}.mdx`.
Suffixes in use: `.sheet.mdx`, `.heirloom.mdx`, `.spell.mdx`, `.trinket.mdx`,
`.feat.mdx`, `.bloodline.mdx`, `.vocation.mdx`, `.specialization.mdx`,
`.lore.mdx`, `.rule.mdx`.

## 2. Generator

`scripts/metadata/generate{Type}Metadata.ts`

```typescript
import { promises as fs } from 'fs';
import { filePathToSlug, parseTitle, runGenerator, runWithCli } from '.';
import type { CliOptions, SharedData } from '.';

/**
 * Parses one file into metadata rows.
 *
 * @param {string} filePath - Absolute path to the .mdx file
 * @param {SharedData} sharedData - Loaded shared game data
 * @returns {Promise<object | object[] | null>} Metadata row, rows, or null
 */
async function parse{Type}File(
  filePath: string,
  sharedData: SharedData,
): Promise<object | null> {
  const content = await fs.readFile(filePath, 'utf-8');
  if (path.basename(filePath) === 'main.mdx') return null;
  return { slug: filePathToSlug(filePath), title: parseTitle(content) };
}

/**
 * Runs the generator.
 *
 * @param {CliOptions} options - CLI options from runWithCli
 * @returns {Promise<void>}
 */
async function main(options: CliOptions = {}) {
  await runGenerator({
    name: '{Type} Metadata Generator',
    contentType: '{type}',
    filePattern: /\.{type}\.mdx$/,
    parseFile: parse{Type}File,
    processResult: (result) =>
      result === null
        ? { metadata: null, count: 0 }
        : { metadata: result, count: 1 },
    fileFilter: options.fileFilter,
    storage: options.storage,
    recursive: true,
    metadataVersion: '1.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWithCli(main).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { main, parse{Type}File };
```

Imports come from `.`, never `@/lib/metadata`. The entrypoint guard is
mandatory: tests import generator modules and an unguarded `main()` runs
generation inside the test suite.

`processResult` is required. Return `{ metadata: result, count: 1 }` for one row
per file; return the array and `count: result.length` when one file emits many
rows (monsters). Return `{ metadata: null, count: 0 }` to skip.

## 3. Orchestrator Registration

`scripts/metadata/generateMetadata.ts`, two places:

```typescript
const CONTENT_TYPES: Record<string, ContentTypeConfig> = {
  {type}: {
    dir: 'src/content/en/{dir}',
    pattern: /\.{type}\.mdx$/,
    generator: 'generate{Type}Metadata.ts',
    contentType: '{type}',
    subType: '{subType}',
  },
  // ...
};
```

`parseArgs()` also hardcodes one flag per type:

```typescript
if (arg === '--{type}' || arg === '--{singular}') types.push('{type}');
```

Without the flag branch, `npm run generate-metadata -- --{type}` generates nothing
and exits clean.

## 4. Schema

`src/lib/db/content/schemas/{type}Metadata.d.ts` — interface extending
`BaseMetadata`, one `@property` per emitted field. Re-export from
`schemas/index.ts`.

## 5. Adapters

Filesystem adapter, `src/lib/db/content/adapters/fs/fs{Type}Repository.ts`:

```typescript
class Fs{Type}Repository
  extends FsMetadataRepository<{Type}Metadata>
  implements {Type}Repository
{
  constructor() {
    super(path.join('{dir}', '{type}')); // relative to src/content/{locale}
  }
}
```

Postgres adapter, `src/lib/db/content/adapters/pg/pg{Type}Repository.ts` —
MikroORM entity + row mapper, extending `PgMetadataRepository`. Add the entity to
`src/lib/db/orm/entities/index.ts` and export both adapters from their barrels.

Filesystem-only types can skip the pg adapter; the repository switch must then
throw on `METADATA_BACKEND=pg` rather than silently return empty rows.

## 6. Repository Port

`src/lib/db/content/repositories/{type}Repository.ts` — interface with
`list(locale)` and `getBySlug(locale, slug)`, plus a factory switching on
`process.env.METADATA_BACKEND` (`'fs'` default, `'pg'`). Export the instance from
`repositories/index.ts`. If the type is searchable, add it to
`REPOSITORIES_BY_TYPE` in `repositories/byContentType.ts` and to
`SearchContentType`.

## 7. API Route

`src/app/api/{type}/route.ts`

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const rows = await {type}Repository.list(locale);
    return NextResponse.json(rows);
  } catch (error) {
    log.error('Error loading {type} metadata', { locale, error });
    return NextResponse.json({ error: 'Failed to load {type}' }, { status: 500 });
  }
}
```

No `fs`, no `path`, no `getContentFolder` in routes.

## 8. i18n

`messages/{locale}/tables.json` needs a namespace per table:

```json
{
  "{type}": {
    "no{Type}s": "No {type} entries found.",
    "columns": { "name": "Name", "type": "Type" }
  }
}
```

Every locale directory under `messages/` gets the same keys.

## 9. Table Component

`src/modules/metadata-tables/presentation/{Type}Table/` — component, column
builder, barrel. Fetch helper goes in
`infrastructure/api-clients/metadataTableClient.ts`:

```typescript
export function fetch{Type}Metadata<T>(locale: string): Promise<T[]> {
  return fetcher<T[]>(`/api/{type}?locale=${locale}`);
}
```

Component rules: `'use client'`, locale from prop → `useParams()` → `'en'`,
`useMetadataTableData(fetch{Type}Metadata, locale, '{type}')`, skeleton while
loading, translated error and empty states, `build{Type}Columns(tColumns)` for
columns, `searchScope='{type}'` and `searchKeys` on `MetadataTable`. No
`useEffect` fetching, no local row state.

## 10. Registration

```typescript
// src/modules/metadata-tables/presentation/index.ts
export { {Type}Table } from './{Type}Table';

// src/modules/library/presentation/components/index.tsx
import { {Type}Table } from '@/modules/metadata-tables/presentation';
```

Add `{Type}Table` to the `components` map. Both barrels are required.

## 11. Verify

```bash
npm run generate-metadata -- --{type}
npm run dev        # GET /api/{type}?locale=en
npm run test:enforce
npm run health:check
```

Content renders in a page with `<{Type}Table />`. Any layer missing shows up as an
empty table, a 500, or a missing MDX component.
