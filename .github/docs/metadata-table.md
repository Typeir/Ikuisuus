# Metadata Table System

A filterable, sortable table component for browsing large collections of structured content in the Library of Ikuisuus.

## Overview

The MetadataTable system provides an interactive interface for exploring collections of monsters, heirlooms, spells, and other structured content. It consists of:

1. **Build-time metadata generation** — Scripts parse `.mdx` files and create `.metadata.json` files
2. **Repositories** — `fs` and `pg` adapters behind one port per content type
3. **API routes** — Next.js endpoints serve metadata as JSON (`/api/monsters`, `/api/heirlooms`, …)
4. **Table module** — `src/modules/metadata-tables/` fetches rows and renders interactive tables

## Architecture

```
Build Time:        Storage:              Runtime:             Client:
┌──────────────┐   ┌──────────────────┐  ┌──────────────┐     ┌─────────────────┐
│ .mdx files   │ → │ .metadata.json   │→ │ Repository   │ →   │ {Type}Table     │
│ (content)    │   │ or pg tables     │  │ /api/...     │     │ + MetadataTable │
└──────────────┘   └──────────────────┘  └──────────────┘     └─────────────────┘
```

## Components

### Core Component: `MetadataTable`

**File**: `src/lib/components/mdx/metadataTables/metadataTable.tsx`

Generic client component providing filtering, sorting, and pagination.

**Props:**
- `data: MetadataRow[]` - Array of metadata objects to display
- `columns: ColumnConfig[]` - Column configuration defining what data to show and how
- `getRowSlug: (row) => string` - Function to generate URL slug from row data
- `searchKeys: string[]` - Row properties to search when the index cannot answer
- `searchScope?: SearchContentType` - Content type the rows belong to; scopes index-backed search
- `defaultSort?: { key: string; direction: 'asc' | 'desc' }` - Initial sort configuration
- `locale?: string` - Current locale for navigation
- `pageSize?: number` - Number of items per page (default: 50)
- `size?: 'md' | 's'` - Density variant for embedded contexts
- `onRowSelect?: (row) => void` - Renders rows as buttons instead of links
- `rowAction?: { label, icon?, onSelect }` - Trailing per-row action button

### Table Components

Tables live in `src/modules/metadata-tables/presentation/{Type}Table/` and are **client components** that fetch through `useMetadataTableData`.

#### `MonsterTable`

**API**: `GET /api/monsters?locale={locale}`  
**Search Scope**: `monsters`  
**Search Keys**: `title`, `creatureType`, `size`  
**Props**: `locale?: string`

**Columns:**
- Name (sortable)
- Size (sortable, filterable by select)
- Type (sortable, filterable by select)
- Lethality (sortable, filterable by range)
- AC (sortable, filterable by range)
- HP (sortable, filterable by range)
- Alignment (sortable, filterable by select)

#### `HeirloomTable`

**API**: `GET /api/heirlooms?locale={locale}`  
**Search Scope**: `heirlooms`  
**Search Keys**: `title`, `itemType`  
**Props**: `locale?: string`

**Columns:**
- Name (sortable)
- Rarity (sortable, filterable by select)
- Type (sortable, filterable by select)
- Subtype (sortable, filterable by select) - weaponType field
- Attunement (sortable, filterable by Yes/No select)

#### `SpellTable`

**API**: `GET /api/spells?locale={locale}`  
**Search Scope**: `spells`  
**Page Size**: 100

**Columns:**
- Name (sortable)
- Level (sortable, filterable by select) - Shows "Cantrip" for level 0
- School (sortable, filterable by select)
- Casting Time (sortable, filterable by select) - Displays as "Action", "Minor Action", etc.
- Concentration (sortable, filterable by Yes/No select)

## Usage in MDX

Tables are registered in `src/modules/library/presentation/components/index.tsx` and available in all `.mdx` files.

### Monster Table

```mdx
# Monsters

Browse all creatures in the bestiary.

<MonsterTable />
```

### Heirloom Table

```mdx
# Magical Items

Explore legendary artifacts and weapons.

<HeirloomTable />
```

### Spell Table

```mdx
# Spells

Browse all spells in the library.

<SpellTable />
```

### Locale Override

All tables accept an optional `locale` prop:

```mdx
<MonsterTable locale="es" />
<HeirloomTable locale="fi" />
<SpellTable locale="en" />
```

If not provided, locale is determined from the route parameters or defaults to `'en'`.

## Creating New Table Types

Adding a table type touches six files, in this order. Generator side lives in
[Metadata Generation](./metadata-generation.md).

### 1. Schema

`src/lib/db/content/schemas/{type}Metadata.d.ts` — interface extending
`BaseMetadata`, one `@property` per emitted field.

### 2. Adapters

- `src/lib/db/content/adapters/fs/fs{Type}Repository.ts` — reads the generator output
- `src/lib/db/content/adapters/pg/pg{Type}Repository.ts` — MikroORM entity query

Both satisfy the same contract: `list(locale)` and `getBySlug(locale, slug)`.

### 3. Repository Port

`src/lib/db/content/repositories/{type}Repository.ts`:

```typescript
import 'server-only';

import { fsTrinketRepository } from '../adapters/fs/fsTrinketRepository';
import { pgTrinketRepository } from '../adapters/pg/pgTrinketRepository';
import type { TrinketMetadata } from '../schemas/trinketMetadata';

export interface TrinketRepository {
  list(locale: string): Promise<TrinketMetadata[]>;
  getBySlug(locale: string, slug: string): Promise<TrinketMetadata | null>;
}

const metadataBackend = process.env.METADATA_BACKEND || 'fs';

const createTrinketRepository = (): TrinketRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgTrinketRepository;
    case 'fs':
      return fsTrinketRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

export const trinketRepository = createTrinketRepository();
```

Export it from `repositories/index.ts`. If the type is searchable, add it to
`REPOSITORIES_BY_TYPE` in `repositories/byContentType.ts`.

### 4. API Route

`src/app/api/{type}/route.ts`:

```typescript
import { trinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Trinkets' });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const trinkets = await trinketRepository.list(locale);
    return NextResponse.json(trinkets);
  } catch (error) {
    log.error('Error loading trinket metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load trinkets' },
      { status: 500 },
    );
  }
}
```

### 5. Fetch Helper

`src/modules/metadata-tables/infrastructure/api-clients/metadataTableClient.ts`:

```typescript
export function fetchTrinketMetadata<T>(locale: string): Promise<T[]> {
  return fetcher<T[]>(`/api/trinkets?locale=${locale}`);
}
```

### 6. Table Component

`src/modules/metadata-tables/presentation/{Type}Table/` holds three files:

```
TrinketTable/
  TrinketTable.tsx
  TrinketTable.columns.tsx
  index.ts
```

```tsx
'use client';

import { REGEX_EXTENSION, stripContentSuffix } from '@/lib/constants/content';
import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import { useMetadataTableData } from '@/modules/metadata-tables/application/hooks/useMetadataTableData';
import { fetchTrinketMetadata } from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { buildTrinketColumns } from '@/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

type TrinketTableProps = { locale?: string };

export default function TrinketTable({
  locale: localeProp,
}: TrinketTableProps = {}) {
  const t = useTranslations('tables.trinkets');
  const tColumns = useTranslations('tables.trinkets.columns');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const { data, loading, error } = useMetadataTableData<TrinketMetadata>(
    fetchTrinketMetadata,
    locale,
    'trinkets',
  );

  if (loading) return <MetadataTableSkeleton rows={10} columns={6} />;
  if (error) return <p>{tCommon('error')}: {error}</p>;
  if (data.length === 0) return <p>{t('noTrinkets')}</p>;

  return (
    <MetadataTable
      searchScope='trinkets'
      data={data}
      columns={buildTrinketColumns(tColumns)}
      getRowSlug={(row) =>
        `/items/trinkets/${stripContentSuffix(row.slug.replace(REGEX_EXTENSION, ''))}`
      }
      searchKeys={['title', 'itemType']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
```

`useMetadataTableData` owns fetching, loading and error state. Do not fetch in
`useEffect` and do not keep rows in local state.

Add `tables.{type}` and `tables.{type}.columns` to every
`messages/{locale}/tables.json`.

### 7. Register

Two barrels, in order:

```typescript
// src/modules/metadata-tables/presentation/index.ts
export { TrinketTable } from './TrinketTable';

// src/modules/library/presentation/components/index.tsx
import { TrinketTable } from '@/modules/metadata-tables/presentation';

export const components = {
  TrinketTable,
  // ...
};
```

Then `<TrinketTable />` is available in all MDX files.

## Column Configuration

### ColumnConfig Type

```typescript
type ColumnConfig = {
  key: string;                    // Property key in metadata object
  label: string;                  // Column header label
  getValue?: (row: any) => any;   // Extract value from row (optional, defaults to row[key])
  sortable?: boolean;             // Enable sorting (default: true)
  filterable?: boolean;           // Show filter control (default: false)
  filterType?: 'text' | 'select' | 'multiselect' | 'range';
  render?: (value: any, row: any) => React.ReactNode;
  compareValues?: (a: any, b: any) => number;
  getFilterOptions?: (rows: any[]) => string[];
};
```

### Filter Types

- **text**: Free-text search within column values
- **select**: Dropdown with unique values from the dataset
- **multiselect**: Multiple selection (useful for tags/arrays)
- **range**: Min/max numeric inputs (for numbers like Lethality, HP, level)

### Custom Render Functions

Use `render` to customize how cell values are displayed:

```typescript
{
  key: 'rarity',
  label: 'Rarity',
  render: (value: any) => {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
```

### Custom Value Extraction

Use `getValue` for nested properties or computed values:

```typescript
{
  key: 'ac',
  label: 'AC',
  getValue: (row: any) => row.ac?.value ?? row.ac, // Handle both formats
  sortable: true,
  filterable: true,
  filterType: 'range',
}
```

### Custom Filter Options

Provide explicit filter options instead of auto-generating from data:

```typescript
{
  key: 'concentration',
  label: 'Concentration',
  getValue: (row: any) => row.concentration ? 'Yes' : 'No',
  filterable: true,
  filterType: 'select',
  // No getFilterOptions needed - auto-generates ['No', 'Yes'] from data
}
```

### Custom Sort Comparison

Handle special sorting logic (e.g., Lethality fractions like "1/4"):

```typescript
{
  key: 'cr',
  label: 'Lethality',
  getValue: (row: any) => row.cr,
  compareValues: (a: any, b: any) => {
    const numA = typeof a === 'string' ? parseFloat(a) || 0 : a;
    const numB = typeof b === 'string' ? parseFloat(b) || 0 : b;
    return numA - numB;
  },
  sortable: true,
  filterable: true,
  filterType: 'range',
}
```

## Features

### Search
Global search bar filters across configured `searchKeys` (e.g., `['title', 'type', 'description']`).

### Sorting
Click any sortable column header to cycle through:
- **Ascending** (A→Z, 0→9)
- **Descending** (Z→A, 9→0)
- **Unsorted** (original order)

### Filtering
Columns with `filterable: true` show filter controls:
- **Text**: Free-text input
- **Select**: Dropdown with unique values
- **Multiselect**: Multiple selection checkboxes
- **Range**: Min/max numeric inputs

### Pagination
Results are paginated with configurable `pageSize` (default: 50 items per page).

### Navigation
Clicking a row's title navigates to the content page using the slug from `getRowSlug()`.

## Styling

The component uses CSS modules (`metadataTable.module.scss`) with theme-aware variables from `globals.scss`:

- `--color-bg` - Background color
- `--color-text` - Primary text color
- `--color-secondary` - Border color
- `--color-accent` - Accent/link color
- `--color-hover` - Row hover background

Tables automatically respond to light/dark theme changes via `html[data-theme="..."]` attribute.

## Workflow

1. **Generate Metadata**: Run metadata generation during build
   ```bash
   npm run generate-metadata                              # All types
   npx tsx --tsconfig tsconfig.scripts.json scripts/metadata/generateMonsterMetadata.ts --file ancient-dragon.sheet.mdx
   ```

2. **Create main.mdx**: Add index file with table component
   ```mdx
   # Monsters
   
   Browse all creatures in the bestiary.
   
   <MonsterTable />
   ```

3. **Navigate**: Visit `/en/library/monsters` (or your locale)

4. **Browse**: Use search, filters, and sorting to explore content

## Data Requirements

Your metadata files should include:
- `slug`: URL identifier (required)
- `title`: Display name (required)
- `file`: Source file path (required)
- Additional properties as needed for your columns

Example metadata structure:
```json
{
  "slug": "ancient-dragon",
  "title": "Ancient Red Dragon",
  "file": "src/content/en/monsters/ancient-dragon.sheet.mdx",
  "cr": "24",
  "size": "gargantuan",
  "creatureType": "dragon",
  "ac": { "value": 22 },
  "hp": { "average": 546 }
}
```

## Responsive Design

The table automatically adapts to smaller screens:
- Horizontal scrolling for wide tables
- Stacked filters on mobile
- Responsive font sizes and spacing

## Performance

### Client-Side Architecture
- **API Routes**: Repository-backed reads, locale passed as a query param
- **Client Fetch**: `useMetadataTableData` fetches JSON through `fetcher`
- **React State**: Hook-owned loading/error/data, no per-component fetching
- **Memoization**: `useMemo` prevents unnecessary filtering/sorting recalculations
- **Pagination**: Keeps DOM size manageable for large datasets

### Optimization Strategies
- Metadata files are small (typically < 1KB each)
- API routes serve all metadata in one request
- Filtering and sorting happen client-side (no re-fetch)
- Column configurations are defined once (no re-creation on render)

### Trade-offs
- Initial fetch overhead (typically 100-500ms for 50-150 items)
- Client-side bundle includes table logic (~15-20KB gzipped)
- Benefit: Instant filtering/sorting after initial load
- Benefit: Works with Next.js middleware for locale routing