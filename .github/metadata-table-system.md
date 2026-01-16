# Metadata Table System

## Overview
The Metadata Table System provides filterable, sortable, paginated tables for displaying structured content (monsters, heirlooms, etc.) in MDX pages. It uses a three-layer architecture separating data generation, API serving, and client-side rendering.

## Architecture

### Layer 1: Metadata Generation (Build Time)
**Scripts**: `generateMonsterMetadata.mjs`, `generateHeirloomMetadata.mjs`

- Runs during `npm run pre-init` before build/dev
- Parses `.sheet.mdx` files using regex to extract structured data
- Outputs `.metadata.json` files alongside source files
- Example: `albedo.sheet.mdx` → `albedo.metadata.json`

**Monster Metadata Structure**:
```json
[
  {
    "slug": "albedo",
    "subSlug": "albedo-the-bleak-bloom",
    "title": "Albedo, the Bleak Bloom",
    "file": "src/content/en/monsters/albedo.sheet.mdx",
    "size": "gargantuan",
    "creatureType": "Aberration",
    "alignment": "Lawful Evil",
    "ac": { "value": 20, "notes": "natural" },
    "hp": { "average": 780, "formula": "60d10 + 420" },
    "cr": "23"
  }
]
```

**Heirloom Metadata Structure**:
```json
{
  "slug": "alfanjon-of-the-crescent-moon.mdx",
  "title": "Alfanjón of the Crescent Moon",
  "rarity": "very rare",
  "itemType": "weapon",
  "requiresAttunement": true
}
```

**Key Differences**:
- Monster files may contain **arrays** (multiple variants in one file)
- Heirlooms are single objects
- Monsters use `subSlug` for variants, heirlooms don't

### Layer 2: API Routes (Runtime)
**Files**: `src/app/api/monsters/route.ts`, `src/app/api/heirlooms/route.ts`

**Purpose**: Serve metadata to client components without bundling large JSON

**Key Features**:
- Locale-aware: `GET /api/monsters?locale=en`
- Reads `.metadata.json` files from filesystem using `fs.readdirSync`
- Uses `getContentFolder(locale)` helper for path resolution
- Flattens arrays with `.flat()` to handle multi-variant files

**Code Pattern**:
```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  const contentDir = getContentFolder(locale);
  const monstersDir = path.join(contentDir, 'monsters');
  const files = fs.readdirSync(monstersDir);
  const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

  const allMonsters = metadataFiles.map((file: string) => {
    const content = fs.readFileSync(path.join(monstersDir, file), 'utf-8');
    return JSON.parse(content);
  });

  const monsters = allMonsters.flat(); // Handle arrays
  return NextResponse.json(monsters);
}
```

### Layer 3: Client Components
**Architecture**: Generic `MetadataTable` + specialized wrappers

#### 3.1 Core Component: `MetadataTable`
**File**: `src/lib/components/mdx/MetadataTable/metadataTable.tsx`

**Purpose**: Data-agnostic table with filtering, sorting, pagination

**Key Props**:
- `data: MetadataRow[]` - Array of objects to display
- `columns: ColumnConfig[]` - Column definitions with extraction logic
- `getRowSlug: (row) => string` - Function to generate navigation URLs
- `searchKeys: string[]` - Fields to search across
- `defaultSort: {key, direction}` - Initial sort state

**ColumnConfig Structure**:
```typescript
{
  key: string;               // Unique identifier
  label: string;             // Display header
  sortable?: boolean;        // Enable sorting
  filterable?: boolean;      // Show filter UI
  filterType?: 'text' | 'select' | 'range' | 'multiselect';
  getValue: (row) => any;    // Extract value (handles nested data)
  compareValues?: (a, b) => number;  // Custom sort logic
  render?: (value, row) => ReactNode; // Custom display
}
```

**State Management**:
- Search: Text input across searchKeys
- Filters: Per-column via filterType
- Sort: Click headers, custom compareValues
- Pagination: Controlled by pageSize prop

#### 3.2 Wrapper Components
**Files**: `monsterTableWrapper.tsx`, `heirloomTableWrapper.tsx`

**Purpose**: 
- Fetch data from API routes
- Configure columns for specific data types
- Provide MDX-ready component interface

**Locale Resolution Priority**:
1. Props: `<MonsterTable locale="es" />`
2. Route params: `useParams().locale`
3. Default: `'en'`

**MonsterTable Column Mapping**:
```typescript
{
  key: 'title',        // Display name
  key: 'size',         // Small, Medium, Large, etc.
  key: 'creatureType', // Aberration, Beast, etc.
  key: 'cr',           // Challenge Rating (parsed as number)
  key: 'ac',           // Armor Class (extracts ac.value)
  key: 'hp',           // Hit Points (extracts hp.average)
  key: 'alignment'     // Lawful Good, Chaotic Evil, etc.
}
```

**HeirloomTable Column Mapping**:
```typescript
{
  key: 'title',              // Display name
  key: 'rarity',             // Common, Uncommon, Rare, etc.
  key: 'itemType',           // Weapon, Armor, Wondrous, etc.
  key: 'requiresAttunement'  // Boolean → "Yes"/"No"
}
```

**URL Generation**:
- **Monsters**: `/monsters/{slug}#{subSlug}` (subSlug used as anchor)
- **Heirlooms**: `/items/heirlooms/{slug}` (strips .mdx extension)

#### 3.3 MDX Integration
**File**: `src/lib/components/mdx/index.tsx`

Wrappers are registered in the global MDX components object:
```typescript
const components = {
  MonsterTable: MonsterTableWrapper,
  HeirloomTable: HeirloomTableWrapper,
  // ... other components
};
```

**Usage in MDX**:
```mdx
# Monsters

Browse all creatures in the bestiary.

<MonsterTable />

<!-- Or with explicit locale -->
<MonsterTable locale="es" />
```

## Build Pipeline Integration

**package.json scripts order**:
```json
"pre-init": "compress-assets && kebabify-content && md-to-mdx && generate-all-metadata && merge-locales && find-reusable-mdx-outliers"
```

**Critical**: `generate-all-metadata` must run:
1. After `md-to-mdx` (needs .mdx extension)
2. Before Next.js build (API routes need existing .metadata.json files)

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Build Time: Generate Metadata                               │
│ .sheet.mdx → [Script] → .metadata.json                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Runtime: API Routes Serve Data                              │
│ .metadata.json → [fs.readFileSync] → JSON Response          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Client: Wrappers Fetch & Configure                          │
│ fetch('/api/monsters?locale=en') → Configure Columns        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ MetadataTable: Interactive Display                          │
│ Search → Filter → Sort → Paginate → Navigate                │
└─────────────────────────────────────────────────────────────┘
```

## Extending the System

### Adding a New Table Type (e.g., Spells)

1. **Create metadata generation script**:
   - Parse spell .sheet.mdx files
   - Extract level, school, components, etc.
   - Output .metadata.json files

2. **Create API route**:
   ```typescript
   // src/app/api/spells/route.ts
   export async function GET(req: Request) {
     const locale = new URL(req.url).searchParams.get('locale') || 'en';
     const contentDir = getContentFolder(locale);
     const spellsDir = path.join(contentDir, 'spells');
     // ... read and return metadata
   }
   ```

3. **Create wrapper component**:
   ```typescript
   // src/lib/components/mdx/MetadataTable/spellTableWrapper.tsx
   const columns: ColumnConfig[] = [
     { key: 'title', label: 'Name', getValue: (row) => row.title },
     { key: 'level', label: 'Level', getValue: (row) => row.level },
     { key: 'school', label: 'School', getValue: (row) => row.school },
   ];
   ```

4. **Register in MDX components**:
   ```typescript
   // src/lib/components/mdx/index.tsx
   import SpellTableWrapper from './MetadataTable/spellTableWrapper';
   
   const components = {
     SpellTable: SpellTableWrapper,
     // ...
   };
   ```

## Common Issues & Solutions

### Issue: Table is empty
**Cause**: Metadata files not generated before build
**Solution**: Ensure `generate-all-metadata` in pre-init, run manually if needed

### Issue: Wrong field names
**Cause**: Column config doesn't match actual metadata structure
**Solution**: Check .metadata.json structure, update getValue functions

### Issue: Navigation broken
**Cause**: getRowSlug generates incorrect paths
**Solution**: Verify slug format, strip file extensions, use correct base path

### Issue: Variants not showing
**Cause**: API not flattening arrays
**Solution**: Ensure `.flat()` called after parsing JSON

### Issue: Locale not working
**Cause**: API not receiving locale parameter
**Solution**: Check useParams() works in wrapper, API reads searchParams

## File Reference

### Core Files
- `src/lib/components/mdx/MetadataTable/metadataTable.tsx` - Generic table
- `src/lib/components/mdx/MetadataTable/metadataTable.module.scss` - Styles
- `src/lib/components/mdx/MetadataTable/index.tsx` - Exports

### Specialized Components
- `src/lib/components/mdx/MetadataTable/monsterTableWrapper.tsx` - D&D monsters
- `src/lib/components/mdx/MetadataTable/heirloomTableWrapper.tsx` - Magic items

### API Routes
- `src/app/api/monsters/route.ts` - Monster data endpoint
- `src/app/api/heirlooms/route.ts` - Heirloom data endpoint

### Metadata Generation
- `scripts/generateMonsterMetadata.mjs` - Parse monster sheets
- `scripts/generateHeirloomMetadata.mjs` - Parse heirloom sheets

### Content Files
- `src/content/en/monsters/main.mdx` - Monster index with table
- `src/content/en/items/heirlooms/main.mdx` - Heirloom index with table
