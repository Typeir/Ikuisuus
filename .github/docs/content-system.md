# Content System & Internationalization

**Purpose**: Complete documentation of the MDX-based content system, filesystem routing, locale handling, and translation workflow.

## Overview

The content system combines:

- **Filesystem-based routing** - URLs map directly to `.mdx` file paths
- **Multi-locale support** - Content mirrored across `en`, `es`, `fi` locales
- **Static generation** - All routes pre-rendered at build time
- **MDX compilation** - Server-side rendering with client fallback
- **Custom components** - React components usable in markdown

## Directory Structure

```
src/content/
└── en/                           # English content (only locale with content)
    ├── character-creation/
    │   ├── main.mdx             # Index page (category overview)
    │   ├── bloodlines/
    │   │   ├── main.mdx
    │   │   └── [bloodline].bloodline.mdx
    │   ├── vocations/
    │   │   ├── main.mdx         # Vocation index (also parsed for metadata)
    │   │   └── [vocation]/
    │   │       └── main.mdx
    │   ├── specializations/
    │   │   └── [spec].mdx
    │   └── [other files]
    ├── games/
    ├── items/
    │   ├── heirlooms/
    │   │   ├── main.mdx
    │   │   └── [item].heirloom.mdx  # Individual heirloom files
    │   └── trinkets/
    │       ├── main.mdx
    │       └── [trinket].trinket.mdx
    ├── monsters/
    │   ├── main.mdx
    │   ├── [monster].sheet.mdx         # Special .sheet extension
    │   └── [monster].metadata.json
    ├── spells/
    │   ├── main.mdx
    │   ├── [spell].mdx
    │   └── [spell].metadata.json
    ├── world/
    │   ├── geography/
    │   ├── history/
    │   └── [other categories]
    └── rules/
        └── [rule files].mdx
```

**Note**: Currently, only English (`en`) content exists. Spanish (`es`) and Finnish (`fi`) locales are configured for future translation but have no content directories yet.

**Naming Conventions**:

- **Kebab-case only**: `character-creation`, `albedo-the-bleak-bloom`
- **Extensions**: `.mdx` (standard), `.sheet.mdx` (monster stat blocks), `.heirloom.mdx` (heirlooms), `.trinket.mdx` (trinkets), `.bloodline.mdx` (bloodlines)
- **Index files**: `main.mdx` (category overview, excluded from metadata)
- **Metadata**: `.metadata.json` (auto-generated, alongside source)

## Filesystem Routing

### Route Mapping

```
File Path                                    → URL
src/content/en/rules/[rule].mdx             → /en/library/rules/[rule]
src/content/en/items/heirlooms/[item].mdx   → /en/library/items/heirlooms/[item]
src/content/en/monsters/[monster].sheet.mdx → /en/library/monsters/[monster]
```

**Pattern**: `src/content/{locale}/{...path}.mdx` → `/{locale}/library/{...path}`

### Dynamic Route Configuration

**File**: `src/app/[locale]/library/[...slug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote-client/rsc';
import { mdxComponents } from '@/lib/components/mdx';
import { resolveContentFilePath } from '@/lib/utils/resolveContentFilePath';

interface PageProps {
  params: {
    locale: string;
    slug: string[];
  };
}

/**
 * Generate static params for all content pages at build time
 * Only scans English content directory
 */
export async function generateStaticParams(): Promise<
  Array<{ slug: string[] }>
> {
  const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content', 'en');
  const mdxFiles = await findAllMdxFiles(CONTENT_ROOT);

  return mdxFiles.map((filePath) => {
    const relativePath = path.relative(CONTENT_ROOT, filePath);
    const slug = relativePath.replace(/\.mdx$/, '').split(path.sep);
    return { slug };
  });
}

/**
 * Render MDX content page
 * Uses evaluate() for server-side compilation with client fallback
 */
export default async function ContentPage({ params }: PageProps) {
  const { locale, slug } = await params;

  // Get content folder for locale
  const contentFolder = getContentFolder(locale);
  const slugPath = slug.join(path.sep);

  // Resolve file path (checks .mdx, .sheet.mdx, .md variants)
  const filePath = await resolveContentFilePath(contentFolder, slugPath);

  if (!filePath) {
    notFound();
  }

  // Read MDX content
  const content = await fs.readFile(filePath, 'utf-8');

  try {
    // Compile and render MDX with evaluate()
    const { content: MDXContent } = await evaluate({
      source: content,
      components,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    });

    return (
      <article className={styles.content}>
        <MDXContent />
      </article>
    );
  } catch (error) {
    console.error('MDX compilation error:', error);
    // Fallback to ClientRenderer on server compilation error
    return <ClientRenderer source={content} />;
  }
}
```

**Key Points**:

- **`generateStaticParams()`**: Pre-renders all pages at build time
- **Catch-all route**: `[...slug]` captures any depth of path
- **MDXRemote**: Server-side compilation for performance
- **Custom components**: Registered in `mdxComponents` object

### Content Resolution with Locale Fallback

**File**: `src/lib/utils/resolveContentFilePath.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

/**
 * Attempts to resolve the correct content file path for a given slug.
 * Checks for `.mdx`, `.sheet.mdx`, and `.md` variants in the provided root directory.
 *
 * @param rootDir - The absolute path to the content root directory for the current locale
 * @param slugPath - The slug path joined into a single string (e.g., "items/heirlooms/sunblade")
 * @returns The resolved file path if found, otherwise null
 */
export const resolveContentFilePath = async (
  rootDir: string,
  slugPath: string,
): Promise<string | null> => {
  const variants = [
    `${slugPath}.mdx`,
    `${slugPath}.sheet.mdx`,
    `${slugPath}.md`,
  ];

  for (const variant of variants) {
    const fullPath = path.join(rootDir, variant);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      // Try next variant
    }
  }

  return null;
};
```

**File Resolution Strategy**:

1. Try `{rootDir}/{slugPath}.mdx` (standard content)
2. Try `{rootDir}/{slugPath}.sheet.mdx` (monster stat blocks)
3. Try `{rootDir}/{slugPath}.md` (legacy markdown)
4. Return null if not found (triggers 404)

**Note**: Locale handling is done via `getContentFolder(locale)` helper which returns the appropriate content directory path.

## MDX Component System

### Component Registration

**File**: `src/lib/components/mdx/index.tsx`

```typescript
import BlendedImage from './blendedImage';
import FlexRenderer from './flexRenderer';
import mdxComponents from './mdxComponents';
import MonsterTableWrapper from './MetadataTable/monsterTableWrapper';
import HeirloomTableWrapper from './MetadataTable/heirloomTableWrapper';

/**
 * Components available in all MDX files
 * Add new components here to make them globally accessible
 */
const components = {
  // Metadata tables
  MonsterTable: MonsterTableWrapper,
  HeirloomTable: HeirloomTableWrapper,

  // Media components
  BlendedImage,
  FlexRenderer,

  // Spread additional components from mdxComponents
  ...mdxComponents,

  // Table wrapper for responsive tables
  table: ({ children }: any) => (
    <div className='overflow-x-auto max-w-full'>
      <table>{children}</table>
    </div>
  ),
};

export default components;
```

**Why Centralized**:

- No imports needed in MDX files
- Consistent component availability
- Single place to update component mappings

### Usage in MDX

**Example**: `src/content/en/monsters/main.mdx`

```mdx
# Monsters

This bestiary contains information about the creatures from the _Vile and Beautiful lands of Damocles_.

<MonsterTable />
```

**Example**: `src/content/en/items/heirlooms/main.mdx`

```mdx
# Heirlooms

Browse all magical heirlooms in this campaign.

<HeirloomTable />
```

**Component Props**:

- **MonsterTable**: `locale?` (string) - Optional locale override, defaults to route param or 'en'
- **HeirloomTable**: `locale?` (string) - Optional locale override, defaults to route param or 'en'
- **BlendedImage**: `src` (string), `alt` (string), `priority?` (boolean), `width?` (number), `height?` (number)
- **FlexRenderer**: Custom render logic for dynamic content

**Note**: Both table components fetch data from API routes (`/api/monsters`, `/api/heirlooms`) and provide built-in search, filtering, sorting, and pagination. The tables automatically detect the current locale from the route unless overridden.

### Custom Component Example

**Creating a Callout Component**:

**File**: `src/lib/components/mdx/Callout/Callout.tsx`

```tsx
interface CalloutProps {
  type: 'info' | 'warning' | 'danger';
  children: React.ReactNode;
}

export function Callout({ type, children }: CalloutProps) {
  const styles = {
    info: 'bg-blue-100 border-blue-500 text-blue-900',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-900',
    danger: 'bg-red-100 border-red-500 text-red-900',
  };

  return <div className={`border-l-4 p-4 ${styles[type]}`}>{children}</div>;
}
```

**Register**:

```tsx
// src/lib/components/mdx/index.tsx
import { Callout } from './Callout/Callout';

const components = {
  // ... existing components
  Callout,
};

export default components;
```

**Use in MDX**:

```mdx
<Callout type='warning'>
  This spell is extremely powerful and may unbalance your campaign.
</Callout>
```

## Internationalization (i18n)

### Locale Configuration

**File**: `src/i18n/routing.ts`

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'fi'],
  defaultLocale: 'en',
  localePrefix: 'always', // Always include locale in URL
});

export type Locale = 'en' | 'es' | 'fi';
```

**Middleware Integration**:

**File**: `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except static files and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

**URL Behavior**:

- `/` → redirects to `/en`
- `/library/monsters` → redirects to `/en/library/monsters`
- `/es/library/monsters` → Spanish monsters page
- `/fi/library/rules/combat` → Finnish combat rules

### Translation Files

**Structure**:

```
messages/
├── en/
│   ├── layout.json
│   ├── search.json
│   ├── archive.json
│   └── index.json         # Merged file (auto-generated)
├── es/
│   ├── common.json        # Minimal translations only
│   └── index.json
└── fi/
    ├── common.json        # Minimal translations only
    └── index.json
```

**Note**: Spanish and Finnish locales currently have minimal translations (only `common.json`). Full translation of all namespaces is planned for future releases.

**Example**: `messages/en/layout.json`

```json
{
  "nav": {
    "home": "Home",
    "library": "Library",
    "search": "Search",
    "archive": "Archive"
  },
  "footer": {
    "copyright": "© 2024 Library of Ikuisuus",
    "license": "Content licensed under CC BY-NC-SA 4.0"
  }
}
```

**Note**: Spanish (`es`) and Finnish (`fi`) translations are currently limited to `common.json` with basic UI strings. Full translations are planned for future releases.

### Merging Translation Files

**Script**: `scripts/i18n/mergeMessages.ts`

```javascript
const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'es', 'fi'];
const MESSAGES_DIR = path.join(__dirname, '..', 'messages');

function mergeLocale(locale) {
  const localeDir = path.join(MESSAGES_DIR, locale);
  const files = fs
    .readdirSync(localeDir)
    .filter((f) => f.endsWith('.json') && f !== 'index.json');

  const merged = {};

  for (const file of files) {
    const namespace = file.replace('.json', '');
    const content = JSON.parse(
      fs.readFileSync(path.join(localeDir, file), 'utf-8'),
    );
    merged[namespace] = content;
  }

  // Write merged file
  fs.writeFileSync(
    path.join(localeDir, 'index.json'),
    JSON.stringify(merged, null, 2),
  );

  console.log(`✅ Merged ${files.length} files for locale: ${locale}`);
}

function main() {
  for (const locale of LOCALES) {
    mergeLocale(locale);
  }
}

main();
```

**Run**: `npm run merge-locales` (part of pre-init)

**Result**: `messages/en/index.json`

```json
{
  "common": {
    /* ... */
  },
  "layout": {
    /* ... */
  },
  "search": {
    /* ... */
  },
  "archive": {
    /* ... */
  }
}
```

### Using Translations in Components

**Server Component**:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('layout');

  return (
    <nav>
      <a href='/'>{t('nav.home')}</a>
      <a href='/library'>{t('nav.library')}</a>
    </nav>
  );
}
```

**Client Component**:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function ClientComponent() {
  const t = useTranslations('layout');

  return (
    <footer>
      <p>{t('footer.copyright')}</p>
    </footer>
  );
}
```

**With Parameters**:

```json
{
  "search": {
    "results": "Found {count} results"
  }
}
```

```tsx
const t = useTranslations('search');
<p>{t('results', { count: 42 })}</p>; // "Found 42 results"
```

## Content Workflows

### Auto-Linking World Content

**Script**: `scripts/linkifyMarkdown.mjs`

**Purpose**: Convert text references to markdown links based on mapping file

**Mapping File**: `scripts/links.json`

```json
{
  "terms": [
    {
      "text": "Damocles",
      "path": "/world/geography/damocles",
      "caseSensitive": true
    },
    {
      "text": "the Silent One",
      "path": "/world/deities/silent-one",
      "caseSensitive": false
    },
    {
      "text": "Hunt Oath",
      "path": "/spells/hunt-oath",
      "caseSensitive": true
    }
  ]
}
```

**Process**:

1. Reads all `.mdx` files in `src/content/en/world/`
2. For each term in `links.json`:
   - Finds text matches (respects case sensitivity)
   - Excludes matches already in links
   - Excludes matches in code blocks
   - Converts to `[text](path)`
3. Creates `.backup` files before modifying
4. Reports changes

**Usage**:

```bash
# Dry run (preview changes)
npm run linkify:world:dry

# Apply changes (with backups)
npm run linkify:world
```

**Example**:

**Before**:

```mdx
The city of Damocles is protected by the Silent One, who taught mortals the Hunt Oath.
```

**After**:

```mdx
The city of [Damocles](/world/geography/damocles) is protected by [the Silent One](/world/deities/silent-one), who taught mortals the [Hunt Oath](/spells/hunt-oath).
```

**Runner Script**: `scripts/linkifyRunner.mjs`

```javascript
import { linkifyMarkdown } from './linkifyMarkdown.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  await linkifyMarkdown({
    contentDir: 'src/content/en/world',
    linksFile: 'scripts/links.json',
    dryRun,
    createBackups: !dryRun,
  });
}

main();
```

### Scaffolding Missing Content

**Script**: `scripts/scaffoldFromLinks.mjs`

**Purpose**: Create placeholder MDX files for broken links

**Process**:

1. Scans all `.mdx` files for markdown links
2. Extracts link paths (e.g., `/world/factions/crimson-order`)
3. Checks if corresponding `.mdx` file exists
4. Creates placeholder file if missing

**Template**:

```mdx
# {Title from Path}

_This page is a placeholder and needs content._

## Overview

TODO: Add content here

## Related Content

- [Back to {Category}](./)
```

**Usage**:

```bash
# Dry run (show what would be created)
npm run scaffold:world:dry

# Create placeholder files
npm run scaffold:world
```

**Example**:

**Broken Link in**: `src/content/en/world/geography/damocles.mdx`

```mdx
The [Forlorn](/world/factions/forlorn) inhabit the brine pits.
```

**Creates**: `src/content/en/world/factions/crimson-order.mdx`

```mdx
# Forlorn

_This page is a placeholder and needs content._

## Overview

TODO: Add content here

## Related Content

- [Back to Factions](../factions/)
```

### Adding New Content

**Workflow**:

1. **Create MDX File** (kebab-case, `.mdx` extension):

   ```bash
   src/content/en/items/heirlooms/flaming-greatsword.mdx
   ```

2. **Write Content** (MDX format):

   ```mdx
   # Flaming Greatsword

   _Weapon (greatsword), rare (requires attunement)_

   This magical greatsword bursts into flames when drawn.

   **Damage:** 2d6 + 1d6 fire
   **Properties:** Heavy, Two-Handed
   **Weight:** 6 lb.

   ## Special Abilities

   When you hit with this weapon, the target takes an extra 1d6 fire damage.
   ```

3. **Generate Metadata** (if applicable):

   ```bash
   npm run generate-heirloom-metadata
   ```

4. **Translate Content** (create in other locales):

   ```bash
   src/content/es/items/heirlooms/flaming-greatsword.mdx
   src/content/fi/items/heirlooms/flaming-greatsword.mdx
   ```

5. **Test Locally**:

   ```bash
   npm run dev
   # Visit: http://localhost:3000/en/library/items/heirlooms/flaming-greatsword
   ```

6. **Build and Deploy**:
   ```bash
   npm run build  # Runs pre-init automatically
   ```

## Special File Types

### Monster Stat Blocks (`.sheet.mdx`)

**File**: `src/content/en/monsters/albedo.sheet.mdx`

**Format**: d20 stat block

```mdx
# Albedo, the Bleak Bloom

_Hiisi of False Life and Eternal Growth_

<BlendedImage src='/library/images/Albedo.webp' alt='Albedo, the Bleak Bloom' />

_Gargantuan Aberration (Hiisi), Lawful Evil_

| **Armor Class** | **Hit Points**    | **Speed**                              |
| --------------- | ----------------- | -------------------------------------- |
| 20 (natural)    | 780 (60d10 + 420) | 40 ft., climb 30 ft., **swim 120 ft.** |

| STR     | DEX     | CON     | INT     | WIS     | CHA     |
| ------- | ------- | ------- | ------- | ------- | ------- |
| 24 (+7) | 14 (+2) | 24 (+7) | 20 (+5) | 26 (+8) | 28 (+9) |

- **Saving Throws**: Con +14, Wis +15, Cha +16
- **Skills**: Perception +15, Insight +15, Athletics +14
- **Damage Resistances**: Acid, Necrotic, Psychic; Bludgeoning, Piercing, and Slashing from Nonmagical Attacks
- **Damage Immunities**: Poison
- **Condition Immunities**: Terrified, Paralyzed, Poisoned, Prone, Banishment
- **Senses**: Truesight 120 ft., Tremorsense 120 ft., passive Perception 25
- **Languages**: Empyrean; telepathy 300 ft.
- **Challenge**: 23 (32,000 XP)
- **Proficiency Bonus**: +7

---

## Traits

#### Titanic Godmass

The listed statistics represent **Albedo’s control nucleus** (roughly horse-sized), extruded from a miles-wide quasi-liquid body. Only the nucleus can be targeted. The rest of Albedo functions as terrain and sources of spawns created by her abilities.

- The nucleus can’t be grappled or knocked prone.
- If the nucleus would be pushed or pulled, Albedo may instead shift the ground beneath her and remain in place.

...
```

**Metadata Generation**: Produces `albedo.metadata.json` with structured data

**URL**: `/en/library/monsters/albedo` (`.sheet` removed from URL)

### Category Index Files (`main.mdx`)

**File**: `src/content/en/monsters/main.mdx`

**Purpose**: Overview page for category, excluded from metadata generation

```mdx
# Monster Compendium

This section contains stat blocks for all creatures in the campaign.

## Browse Monsters

<MonsterTable />
```

**URL**: `/en/library/monsters` (maps to `main.mdx`)

**Exclusion**: `main.mdx` files are skipped by metadata generators (not included in tables)

## Performance Optimization

### Static Generation

All content pages are pre-rendered at build time via `generateStaticParams()`:

**Benefits**:

- **Fast page loads**: No server-side rendering on request
- **CDN-friendly**: Static HTML can be cached globally
- **SEO-friendly**: Full HTML in initial response

**Build Time**:

- ~150 pages: 10-20 seconds
- ~500 pages: 30-60 seconds

### MDX Compilation

**Server-Side** (default):

- `next-mdx-remote-client/rsc` compiles MDX on server
- Sends pre-rendered HTML to client
- Faster initial load, smaller client bundle

**Client-Side** (fallback):

- Used if server compilation fails
- `next-mdx-remote-client/csr` compiles in browser
- Slower initial load, larger bundle

## Related Documentation

- [Metadata Generation](./.github/docs/metadata-generation.md) - Three-layer metadata system
- [Build Pipeline](./.github/docs/build-pipeline.md) - Pre-init stages and asset processing
- [Theme System](./.github/docs/theme-system.md) - CSS variables and theming
