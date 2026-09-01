/**
 * @fileoverview Walker collapse sweep: one member per file, each replaces a
 * hand-rolled recursive directory walker with the canonical walker at
 * src/lib/utils/getMatchingFiles.ts. Behavior-identical conversions only.
 * Roster derives from .ignore/reports/duplication-inventory.md cluster 3.
 *
 *   paw swarm run plans/walker-collapse.swarm.mjs --live
 */

const CANON = [
  'You are editing one TypeScript file in place with your tools.',
  '',
  'Canonical directory walker (already exists — read it BEFORE editing, do',
  'not modify it): src/lib/utils/getMatchingFiles.ts',
  "  import { getMatchingFiles, walkDirectory } from '@/lib/utils/getMatchingFiles';",
  '  getMatchingFiles(dir, pattern, recursive?) -> Promise<string[]> of full paths',
  '    (non-recursive mode excludes main.mdx; recursive mode does not)',
  '  walkDirectory(dir, pattern, results) -> Promise<void>, recursive collector',
  '',
  'Mission: this file hand-rolls its own recursive directory walk. Replace it',
  'with the canonical walker, preserving the exact set of files the site',
  'processes today.',
  '',
  '# Rules',
  '* Behavior-identical or nothing: keep every extension filter, ignore-list,',
  '  and hidden-file rule by filtering the pattern argument or post-filtering',
  '  the returned paths. When the local walker does something the canonical',
  '  one cannot express by pattern + post-filter (collects directories,',
  '  yields structure, interleaves work per directory), change nothing and',
  '  reply saying why.',
  '* The canonical walker is async. If the surrounding call chain is sync and',
  '  making it async would ripple beyond this file, change nothing and reply',
  '  saying why.',
  '* JSDoc on exports only, 1-3 dry sentences; never add inline comments',
  '  inside function bodies.',
  '* Keep exported identifiers and signatures stable.',
  '* If tests/unit mirrors this path, keep the paired test in sync. Never',
  '  delete tests.',
  '* This repo runs PAW quality gates on edits; fix any violation a gate',
  '  reports on this file before finishing.',
  '',
  'Edit files in place with str_replace edits. Do not print files back.',
  'When done, reply with one short line naming what you changed or why you',
  'skipped.',
].join('\n');

const ROSTER = [
  { file: 'scripts/utils/precompileMdx.ts', hint: 'Local walker around line 75.' },
  { file: 'scripts/utils/mdxLottery.ts', hint: 'Local walker around line 72.' },
  { file: 'scripts/search/collectRecords.ts', hint: 'Local walker around line 171.' },
  { file: '.github/scripts/checkAnchors.ts', hint: 'Local walker around line 48.' },
  { file: '.github/scripts/checkMdxFormat.ts', hint: 'Local walker around line 329.' },
  {
    file: '.github/scripts/checkOrphanedMdxLinks.ts',
    hint: 'TWO local walkers, around lines 109 and 297 — convert both.',
  },
  { file: '.github/scripts/checkTestGaps.ts', hint: 'Local walker around line 110.' },
  { file: 'foundry/scripts/utils/generateArchTree.ts', hint: 'Local walker around line 61.' },
  {
    file: 'src/lib/content/reusable/reusableRegistry.ts',
    hint: 'Local listMdxFiles walker around line 67.',
  },
];

export default {
  name: 'walker-collapse-ikuisuus',
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
      a.roster[m].hint,
    ].join('\n'),
  expectFiles: (a, m) => a.roster[m].file,
  key: (a, m) => a.roster[m].file,
};
