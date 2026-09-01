/**
 * @fileoverview Fetcher collapse sweep: one member per file, each converts its
 * file (and paired unit test) off getJson/postJson/raw fetch onto the canonical
 * fetcher at src/lib/fetch/fetcher.ts, preserving the file's existing failure
 * contract. Roster and contracts derive from
 * .ignore/reports/duplication-inventory.md cluster 1.
 *
 *   paw swarm run plans/fetcher-collapse.swarm.mjs --live
 */

const CANON = [
  'You are editing one TypeScript file, and its paired unit test, in place',
  'with your tools.',
  '',
  'Canonical HTTP client (already exists, do not modify it):',
  "  import { fetcher, FetchError } from '@/lib/fetch/fetcher';",
  '  fetcher<T>(input: string | [string, RequestInit?], init?: RequestInit): Promise<T>',
  '  Throws FetchError { status, statusText, body, url } on non-2xx.',
  '',
  'Mission: this file must stop using getJson/postJson from',
  "'@/lib/services/api/jsonClient' and stop hand-rolling raw fetch() +",
  'res.ok checks + res.json(). All JSON HTTP goes through fetcher.',
  '',
  '# Patterns',
  '* GET: getJson<T>(url) -> fetcher<T>(url)',
  '* POST: postJson<Req, Res>(url, body) -> fetcher<Res>(url, {',
  "    method: 'POST',",
  "    headers: { 'Content-Type': 'application/json' },",
  '    body: JSON.stringify(body),',
  '  })',
  '* Soft-fail raw fetch: wrap the fetcher call in try/catch (or .catch) and',
  '  return exactly the fallback value the file returns today. Never widen or',
  '  narrow exported function signatures.',
  '',
  '# Rules',
  '* JSDoc on exports only, 1-3 dry technical sentences. Never add inline',
  '  comments inside function bodies.',
  '* No new dependencies. No reformatting of untouched code. Exports and',
  '  identifiers stay stable unless the file instruction says otherwise.',
  '* Paired test: update mocks of jsonClient or global fetch to mock',
  "  '@/lib/fetch/fetcher' instead (vi.mock path must match the import you",
  '  introduced). Keep every test case and its intent; adjust only transport',
  '  mocking and assertions that named the old transport. Never delete the',
  '  test file.',
  '* This repo runs PAW quality gates on edits; if a gate reports a violation',
  '  on this file, fix it before finishing.',
  '',
  'Edit files in place with str_replace edits. Do not print files back.',
  'When done, reply with one short line naming what you changed.',
].join('\n');

const ROSTER = [
  {
    file: 'src/modules/encounter-planner/infrastructure/services/encounterDataService.ts',
    tail: [
      'Replace every getJson/postJson call with fetcher; delete the jsonClient',
      'import. Also delete the local MonsterIndexEntry interface and import the',
      "canonical one: import type { MonsterIndexEntry } from '@/lib/db/content/schemas/monsterMetadata';",
      'If other files import MonsterIndexEntry from this module, keep',
      'export type { MonsterIndexEntry }; so the public surface is unchanged.',
    ].join('\n'),
  },
  {
    file: 'src/modules/metadata-tables/infrastructure/api-clients/metadataTableClient.ts',
    tail: 'Replace getJson with fetcher; delete the jsonClient import.',
  },
  {
    file: 'src/modules/metadata-tables/infrastructure/api-clients/spellSourceClient.ts',
    tail: 'Replace getJson with fetcher; delete the jsonClient import.',
  },
  {
    file: 'src/modules/mdx-editor/infrastructure/api-clients/draftEditorClient.ts',
    tail: [
      'Replace getJson/postJson with fetcher; delete the jsonClient import.',
      'Existing try/catch blocks keep their current fallback behavior exactly.',
    ].join('\n'),
  },
  {
    file: 'src/modules/mdx-editor/infrastructure/api-clients/metadataPreviewClient.ts',
    tail: 'Replace postJson with the fetcher POST pattern; delete the jsonClient import.',
  },
  {
    file: 'src/lib/services/api/searchService.ts',
    tail: [
      'Replace getJson with fetcher; delete the jsonClient import. Transport',
      'only: do NOT modify the RouteMatch interface or any type declarations.',
    ].join('\n'),
  },
  {
    file: 'src/lib/hooks/data/useVocationMetadata.ts',
    tail: [
      'Three inline fetch closures currently resolve res.ok ? res.json() : [].',
      'Replace each with a fetcher<T>(url) call that preserves the',
      'empty-array-on-failure contract via catch. Keep the SWR keys unchanged.',
    ].join('\n'),
  },
  {
    file: 'src/modules/encounter-planner/lib/utils/monsterCache.ts',
    tail: [
      'Keep the Map cache and in-flight promise map exactly as they are.',
      'Replace raw fetch + ok check + json parse with fetcher. Keep the',
      'log-and-return-fallback failure contracts ([] / null) exactly.',
      'Delete the local MonsterIndexEntry interface; import the canonical one',
      "from '@/lib/db/content/schemas/monsterMetadata'.",
    ].join('\n'),
  },
  {
    file: 'src/modules/encounter-planner/presentation/importer/useMonsterIndex.ts',
    tail: [
      'This file calls fetch().then(r => r.json()) with no ok check. Replace',
      'with fetcher<T>(url) and let errors propagate to SWR - surfacing non-2xx',
      'as an SWR error is the intended fix, not a regression. Delete the local',
      'MonsterIndexEntry interface; import the canonical one from',
      "'@/lib/db/content/schemas/monsterMetadata'.",
    ].join('\n'),
  },
  {
    file: 'src/modules/character-builder/presentation/tabs/abilities/importHelpers.ts',
    tail: [
      'Replace the hand-rolled POST with the fetcher POST pattern; preserve the',
      'undefined-on-failure contract via try/catch.',
    ].join('\n'),
  },
  {
    file: 'src/modules/character-builder/presentation/PagePreview/pagePreviewHost.tsx',
    tail: [
      'Replace the hand-rolled POST with the fetcher POST pattern. Keep the',
      'Map cache. Preserve the fallback-string-on-failure contract exactly.',
    ].join('\n'),
  },
  {
    file: 'src/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient.ts',
    tail: 'Replace raw fetch with fetcher; preserve the null-on-failure contract via catch.',
  },
  {
    file: 'src/modules/navigation-sidebar/application/api-clients/fetchStubChildren.ts',
    tail: 'Replace raw fetch with fetcher; preserve the empty-array-on-failure contract via catch.',
  },
  {
    file: 'src/modules/library/infrastructure/content/fetchSource.ts',
    tail: "Replace raw fetch with fetcher; preserve the empty-string-on-failure contract via catch.",
  },
  {
    file: 'src/modules/mdx-editor/application/use-cases/loadContentForEditing.ts',
    tail: [
      'Replace raw fetch with fetcher. In the catch, when the error is a',
      'FetchError, throw new Error with the same message shape the file builds',
      "today from the response body (body error field, falling back to 'HTTP'",
      '+ status). Rethrow anything else as today.',
    ].join('\n'),
  },
  {
    file: 'src/modules/mdx-editor/application/use-cases/submitEditFromClient.ts',
    tail: [
      'Replace raw fetch with fetcher. Preserve the exact { ok, status, error }',
      'result object shape: build the failure branch in a catch from',
      'FetchError.status and the parsed body, deriving the error text the same',
      'way the file does today.',
    ].join('\n'),
  },
  {
    file: 'src/modules/mdx-editor/application/hooks/useCorrectionsAuth.ts',
    tail: [
      'Replace the inline fetches with fetcher, passing the same Authorization',
      'header through the init argument. Preserve current failure behavior.',
    ].join('\n'),
  },
  {
    file: 'src/modules/search/presentation/FeaturedGrid/FeaturedGrid.tsx',
    tail: [
      'Replace the unchecked inline fetch with fetcher plus a catch that',
      'preserves current behavior: the component must render identically when',
      'the request fails.',
    ].join('\n'),
  },
  {
    file: 'src/lib/hooks/data/useSpellsForImport.ts',
    tail: [
      'This file already uses fetcher but hand-rolls the POST RequestInit',
      'inline. Rewrite that call as the canonical fetcher POST pattern. Change',
      'nothing else, including the SWR key.',
    ].join('\n'),
  },
  {
    file: 'src/lib/hooks/data/useHeirloomsForImport.ts',
    tail: [
      "Replace the ad-hoc ['heirlooms-import', locale] SWR key with the",
      "heirlooms key builder exported by '@/lib/fetch/swrKeys' (read that file",
      'and use the exact export) so the cache entry is shared with the',
      'metadata tables. Keep fetcher usage as is.',
    ].join('\n'),
  },
  {
    file: 'src/lib/hooks/data/useTrinketsForImport.ts',
    tail: [
      "Replace the ad-hoc ['trinkets-import', locale] SWR key with the",
      "trinkets key builder exported by '@/lib/fetch/swrKeys' (read that file",
      'and use the exact export) so the cache entry is shared with the',
      'metadata tables. Keep fetcher usage as is.',
    ].join('\n'),
  },
  {
    file: 'src/modules/metadata-tables/application/hooks/useMetadataTableData.ts',
    tail: [
      'The injected parameter named fetcher shadows the global fetcher',
      'identifier. If it is a positional parameter or a local binding, rename',
      'it to fetchRows throughout this file and its JSDoc. If it arrives as a',
      'named property callers pass in an options object, do NOT rename the',
      'property; destructure it as fetcher: fetchRows instead so the public',
      'surface is untouched. Also fix the stale @module tag that still claims',
      'lib/hooks/data. Do not change the SWR key construction.',
    ].join('\n'),
  },
];

export default {
  name: 'fetcher-collapse-ikuisuus',
  role: 'edit.apply',
  args: { roster: ROSTER },
  members: (a) => a.roster.length,
  availableTools: ['read', 'edit'],
  brief: (a, m) =>
    [
      CANON,
      '',
      '# This file',
      `Open ${a.roster[m].file} and read it fully.`,
      a.roster[m].tail,
      '',
      `Paired test: tests/unit/${a.roster[m].file.replace(/\.(tsx|ts)$/, '')}.test.ts`,
      'or the same path ending .test.tsx - open whichever exists.',
    ].join('\n'),
  expectFiles: (a, m) => a.roster[m].file,
  key: (a, m) => a.roster[m].file,
};
