# Metadata Table System

A filterable, sortable table component for browsing large collections of structured content in the Library of Ikuisuus.

## Overview

The MetadataTable system provides an interactive interface for exploring collections of monsters, heirlooms, spells, and other structured content. It consists of:

1. **Build-time metadata generation** - Scripts parse `.mdx` files and create `.metadata.json` files
2. **API routes** - Next.js API endpoints serve metadata as JSON (`/api/monsters`, `/api/heirlooms`, `/api/spells`)
3. **Client components** - React components fetch from APIs and render interactive tables

## Architecture

```
Build Time:           Runtime:              Client:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     
│ .mdx files   │ →   │ .metadata.   │ →   │ API routes   │ →   │ Table        │
│ (content)    │     │ json files   │     │ (/api/...)   │     │ components   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

## Components

### Core Component: `MetadataTable`

Generic client component providing filtering, sorting, and pagination.

**Props:**
- `data: MetadataRow[]` - Array of metadata objects to display
- `columns: ColumnConfig[]` - Column configuration defining what data to show and how
- `getRowSlug: (row) => string` - Function to generate URL slug from row data
- `searchKeys: string[]` - Row properties to search across (e.g., `['title', 'type']`)
- `defaultSort?: { key: string; direction: 'asc' | 'desc' }` - Initial sort configuration
- `locale?: string` - Current locale for navigation
- `pageSize?: number` - Number of items per page (default: 50)

### Wrapper Components

All wrappers are **client components** that fetch data from API routes.

#### `MonsterTableWrapper`

**API**: `GET /api/monsters?locale={locale}`  
**Search Keys**: `title`, `creatureType`, `size`  
**Props**: `locale?: string`

**Columns:**
- Name (sortable)
- Size (sortable, filterable by select)
- Type (sortable, filterable by select)
- CR (sortable, filterable by range)
- AC (sortable, filterable by range)
- HP (sortable, filterable by range)
- Alignment (sortable, filterable by select)

#### `HeirloomTableWrapper`

**API**: `GET /api/heirlooms?locale={locale}`  
**Search Keys**: `title`, `itemType`  
**Props**: `locale?: string`

**Columns:**
- Name (sortable)
- Rarity (sortable, filterable by select)
- Type (sortable, filterable by select)
- Subtype (sortable, filterable by select) - weaponType field
- Attunement (sortable, filterable by Yes/No select)

#### `SpellTableWrapper`

**API**: `GET /api/spells?locale={locale}`  
**Search Keys**: `title`, `school`, `castingTimeRaw`, `duration`, `range`  
**Props**: `locale?: string`

**Columns:**
- Name (sortable)
- Level (sortable, filterable by select) - Shows "Cantrip" for level 0
- School (sortable, filterable by select)
- Casting Time (sortable, filterable by select) - Displays as "Action", "Minor Action", etc.
- Concentration (sortable, filterable by Yes/No select)

## Usage in MDX

Tables are registered in `src/lib/components/mdx/index.tsx` and available in all `.mdx` files.

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

### 1. Create API Route

**File**: `src/app/api/yourtype/route.ts`

```typescript
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '../../../lib/utils/getContentFolder';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const yourTypeDir = path.join(contentDir, 'yourtype');
    const files = fs.readdirSync(yourTypeDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allData = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(yourTypeDir, file), 'utf-8');
      return JSON.parse(content);
    });

    return NextResponse.json(allData.flat());
  } catch (error) {
    console.error('Error loading metadata:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
```

### 2. Create Table Wrapper

**File**: `src/lib/components/mdx/MetadataTable/yourTypeTableWrapper.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MetadataTable, { type ColumnConfig } from './metadataTable';

/**
 * Props for YourTypeTableWrapper component.
 * @typedef {Object} YourTypeTableWrapperProps
 * @property {string} [locale] - Optional locale override
 */
type YourTypeTableWrapperProps = {
  locale?: string;
};

/**
 * Client-side wrapper for YourTypeTable that fetches locale-aware data via API.
 * 
 * @component
 * @param {YourTypeTableWrapperProps} props - Component props
 * @returns {JSX.Element} The rendered table with client-side data fetching
 */
export default function YourTypeTableWrapper({ locale: localeProp }: YourTypeTableWrapperProps = {}) {
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/yourtype?locale=${locale}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(items => {
        console.log('Loaded items:', items.length, items);
        setData(items);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load items:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [locale]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (data.length === 0) {
    return <div className="text-center py-8">No data found. Run <code>npm run generate-yourtype-metadata</code></div>;
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: 'Name',
      getValue: (row: any) => row.title,
      sortable: true,
    },
    // Add more columns...
  ];

  return (
    <MetadataTable
      data={data}
      columns={columns}
      getRowSlug={(row) => `yourtype/${row.slug}`}
      searchKeys={['title']}
      defaultSort={{ key: 'title', direction: 'asc' }}
      locale={locale}
    />
  );
}
```

### 3. Register Component

**File**: `src/lib/components/mdx/index.tsx`

```typescript
import YourTypeTableWrapper from './MetadataTable/yourTypeTableWrapper';

const components = {
  // ... existing components
  YourTypeTable: YourTypeTableWrapper,
};

export default components;
```

Now `<YourTypeTable />` is available in all MDX files.

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
- **range**: Min/max numeric inputs (for numbers like CR, HP, level)

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

Handle special sorting logic (e.g., CR fractions like "1/4"):

```typescript
{
  key: 'cr',
  label: 'CR',
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
   npm run generate-metadata       # All types
   # or individually:
   npm run generate-monster-metadata
   npm run generate-heirloom-metadata
   npm run generate-spell-metadata
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
- **API Routes**: Server-side metadata reading with filesystem access
- **Client Fetch**: Components fetch JSON from API routes on mount
- **React State**: Data stored in component state with loading/error handling
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