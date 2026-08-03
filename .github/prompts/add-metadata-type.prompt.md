---
description: 'Add a new metadata content type — generator, API route, table wrapper, and MDX registration'
agent: 'agent'
---

# Add Metadata Type

Scaffold all three layers for a new metadata content type (e.g., trinkets, feats, races).

## Step 1: Gather Requirements

From the user's request, determine:

- **Content type name** (kebab-case, e.g., `trinkets`)
- **Source directory** (e.g., `src/content/en/items/trinkets/`)
- **File extension** (`.mdx` or `.sheet.mdx`)
- **Key metadata fields** to extract

## Step 2: Read Architecture Docs

1. Read `.github/docs/metadata-generation.md` for the three-layer architecture.
2. Skim `src/lib/metadata/index.ts` for the shared utilities API (`runGenerator`, `GameData`, `ItemData`, parsing/tagging functions).
3. Read an existing generator for reference (e.g., `scripts/metadata/generateHeirloomMetadata.ts`).

## Step 3: Layer 1 — Build Script

Create `scripts/metadata/generate{Type}Metadata.ts`:

1. Import from `@/lib/metadata`
2. Implement `parse{Type}File(filePath: string, sharedData: SharedData)` function
3. Use `runGenerator()` for orchestration
4. Export `main` and the parse function
5. Call `main().catch(...)` unconditionally (tsx always executes top-level code)

Register the new generator in the orchestrator (`scripts/metadata/generateMetadata.ts`).

## Step 4: Layer 2 — API Route

Create `src/app/api/{type}/route.ts`:

1. Use `getContentFolder(locale)` for path resolution
2. Read `.metadata.json` files with `fs.readdirSync`
3. Flatten with `.flat()` if files can contain arrays
4. Return JSON response

## Step 5: Layer 3 — Client Components

1. Create `src/lib/components/mdx/MetadataTable/{type}TableWrapper.tsx`:
   - Define columns with `getValue`, `render`, `compareValues`
   - Define `searchKeys` for the search bar
   - Use the generic `MetadataTable` component

2. Register in `src/modules/library/presentation/components/index.tsx` component map

## Step 6: Update Shared Data (If Needed)

If new game data constants are required (e.g., new item rarities, schools), add them to `scripts/core/shared-data.json`.

## Step 7: Verify

1. Run `npm run generate-metadata` — verify `.metadata.json` files are created
2. Run `npm run dev` — verify the API route returns data at `/api/{type}?locale=en`
3. Verify the table renders in an MDX page with `<{Type}Table />`
4. Run `npm run health:check` — no critical findings
