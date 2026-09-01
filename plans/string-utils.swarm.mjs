/**
 * @fileoverview String-utils consolidation sweep: one member per file, each
 * repoints hand-rolled string/dice/path/classname helpers onto the canonical
 * implementations. Only output-identical conversions, except two flagged
 * intended fixes (TrinketTable casing, vocation generator stripper). Roster
 * derives from .ignore/reports/duplication-inventory.md cluster 3.
 *
 *   paw swarm run plans/string-utils.swarm.mjs --live
 */

const CANON = [
  'You are editing one TypeScript file in place with your tools.',
  '',
  'Canonical helpers (already exist — read the ones your instruction names',
  'BEFORE editing, and do not modify them):',
  "  cn from '@/lib/utils/classNameMerge' — joins truthy class strings with a space",
  "  formatModifier from '@/lib/utils/formatModifier' — mod >= 0 ? `+${mod}` : `${mod}`",
  "  rollDie from '@/lib/utils/diceUtils' — rollDie(faces): 1..faces",
  "  capitalize from '@/modules/metadata-tables/domain/format' — first char upper, rest lower",
  "  toKebabCase from '@/lib/utils/toKebabCase'",
  "  getContentFolder from '@/lib/utils/getContentFolder' and getPublicFolder",
  "  from '@/lib/utils/getPublicFolder'",
  '',
  '# Rules',
  '* Conversions must be output-identical unless your instruction explicitly',
  '  says the behavior change is intended. When you cannot make the call',
  '  output-identical, change nothing and reply saying why.',
  '* For path conversions: open getContentFolder/getPublicFolder first; convert',
  '  only where the hand-rolled join resolves to the same path. A join rooted',
  '  in __dirname, or with segments the helper does not produce, stays as is.',
  '* JSDoc on exports only, 1-3 dry sentences; never add inline comments',
  '  inside function bodies.',
  '* Keep every exported identifier and signature stable unless told otherwise.',
  '* If tests/unit mirrors this file path, keep the paired test in sync with',
  '  any assertion that named the replaced internals. Never delete tests.',
  '* This repo runs PAW quality gates on edits; fix any violation a gate',
  '  reports on this file before finishing.',
  '',
  'Edit files in place with str_replace edits. Do not print files back.',
  'When done, reply with one short line naming what you changed or why you',
  'skipped.',
].join('\n');

const CN = (file, line) => ({
  file,
  tail: `Around line ${line} the file joins class names by hand ([...].filter(Boolean).join(' ') or equivalent). Replace with cn(...) passing the same values; drop the manual filtering.`,
});

const FORMAT_MOD = (file, hint) => ({
  file,
  tail: `${hint} Replace each inline \`x >= 0 ? \`+\${x}\` : \`\${x}\`\` (any local spelling) with formatModifier(x).`,
});

const PATHS = (file, hint) => ({
  file,
  tail: `${hint} Replace the hand-rolled content-root join (path.join(process.cwd(), 'src', 'content'[, locale, ...rest])) with getContentFolder(locale) (plus path.join for any remaining segments). Only if resolution is identical.`,
});

const ROSTER = [
  CN('src/lib/components/ui/detachableTooltip/DetachableTooltip.tsx', 264),
  CN('src/lib/components/ui/textInput/textInput.tsx', 72),
  CN('src/lib/components/ui/textArea/textArea.tsx', 73),
  CN('src/lib/components/ui/resizablePane/resizablePane.tsx', 240),
  CN('src/lib/components/ui/draggable/Draggable.tsx', 116),
  CN('src/modules/character-builder/presentation/builder/vocationEntryBlock.tsx', 134),
  CN('src/modules/encounter-planner/presentation/utils/heroicAwakeningStyles.ts', 174),
  {
    file: 'src/modules/encounter-planner/presentation/utils/statEditing.ts',
    tail: 'getModifierString computes floor((score-10)/2) then formats inline. Keep the export and its signature; compute the modifier, then return formatModifier(mod).',
  },
  FORMAT_MOD('src/modules/character-builder/presentation/stats/toolsTable.tsx', 'One inline signed-modifier format around line 89.'),
  FORMAT_MOD('src/modules/character-builder/presentation/stats/skillsTable.tsx', 'One inline signed-modifier format around line 104.'),
  FORMAT_MOD('src/modules/character-builder/presentation/stats/combatStatChips.tsx', 'One inline signed-modifier format around line 61.'),
  FORMAT_MOD('src/modules/character-builder/presentation/stats/abilityScoreBlock.tsx', 'Two inline signed-modifier formats around lines 83 and 86.'),
  {
    file: 'src/modules/encounter-planner/domain/shared/utils.ts',
    tail: [
      'Two changes. 1) rollInitiative inlines Math.floor(Math.random()*20)+1;',
      'use rollDie(20) instead. 2) Add and export an affixSlug helper:',
      "  export function affixSlug(name: string): string { return name.toLowerCase().replace(/\\s+/g, '-'); }",
      'with terse JSDoc — two other files will import it. Extend the paired',
      'unit test with an affixSlug case and keep the rollInitiative cases green',
      '(mock or range-assert the die).',
    ].join('\n'),
  },
  {
    file: 'src/modules/encounter-planner/domain/heroic/heroicAwakeningApply.ts',
    tail: [
      'Two changes. 1) rollFateDie inlines a d20; keep the export, delegate to',
      "rollDie(20). 2) The inline name.toLowerCase().replace(/\\s+/g,'-') slug",
      "around line 76 becomes affixSlug(name) imported from '../shared/utils'",
      '(another member is adding it there — import it regardless).',
    ].join('\n'),
  },
  {
    file: 'src/modules/encounter-planner/domain/mechanics/combatMechanics.ts',
    tail: [
      'Two changes. 1) rollAffix inlines a d10; delegate to rollDie(10), keeping',
      'the export. 2) The two inline lowercase/whitespace-to-hyphen slug sites',
      "(around lines 92 and 222) become affixSlug(...) imported from",
      "'../shared/utils' (another member is adding it there — import it",
      'regardless).',
    ].join('\n'),
  },
  {
    file: 'src/modules/character-builder/lib/utils/characterStorage.ts',
    tail: 'The 4d6-drop-lowest roll inlines Math.floor(Math.random()*6)+1 around line 176; use rollDie(6). Distribution is identical.',
  },
  {
    file: 'src/modules/metadata-tables/presentation/HeirloomTable/HeirloomTable.columns.ts',
    tail: 'Three inline charAt(0).toUpperCase()+slice(1).toLowerCase() cell formatters (around lines 40, 55, 68). Replace with capitalize(...).',
  },
  {
    file: 'src/modules/metadata-tables/presentation/MonsterTable/MonsterTable.columns.ts',
    tail: 'Three inline charAt(0).toUpperCase()+slice(1).toLowerCase() cell formatters (around lines 72, 86, 140). Replace with capitalize(...).',
  },
  {
    file: 'src/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns.tsx',
    tail: [
      'Three inline capitalizers (around lines 39, 76, 94) that today skip the',
      '.toLowerCase() their two sibling tables apply. Replace with',
      'capitalize(...) — gaining the lowercase is the INTENDED fix, aligning',
      'trinket cells with monster and heirloom rendering.',
    ].join('\n'),
  },
  {
    file: 'src/modules/library/application/use-cases/findNearestRoute.ts',
    tail: "buildTitle inlines a split('-')/capitalize/join(' ') identical to slugSegmentToTitle in the sibling file buildLibraryMetadata.ts. Import slugSegmentToTitle from './buildLibraryMetadata' and delete the inline logic.",
  },
  {
    file: '.github/scripts/checkAspects.ts',
    tail: "The inline trim().toLowerCase().replace(/\\s+/g,'-') around line 92 is byte-identical to toAspectValue in scripts/metadata/sharedData.ts. Import toAspectValue (relative path from .github/scripts) and use it.",
  },
  {
    file: '.github/scripts/checkMdxFormat.ts',
    tail: [
      'Two changes. 1) The local kebab function around line 72 validates',
      'filenames against a convention produced by @/lib/utils/toKebabCase but',
      'implements different semantics — replace it with an import of',
      'toKebabCase (use the @/ alias; fall back to a relative path if the',
      'alias does not resolve from .github/scripts). Aligning the validator',
      'with the producer is the INTENDED fix for false positives. 2) The',
      'hand-rolled content-root join around line 423 becomes',
      'getContentFolder(...) per the path rule.',
    ].join('\n'),
  },
  {
    file: 'scripts/metadata/generateVocationMetadata.ts',
    tail: [
      'This generator imports stripInlineMarkdown from @/lib/utils while every',
      "sibling generator uses stripMarkdown from './textUtils'. Swap the import",
      'and the call sites to stripMarkdown — matching the siblings is the',
      "INTENDED fix (they differ on '_italic_' handling). Regenerating metadata",
      'afterwards will produce diffs in vocation sidecars; that is expected.',
    ].join('\n'),
  },
  PATHS('scripts/metadata/generatorUtils.ts', 'Hand-rolled joins around lines 76-83.'),
  PATHS('scripts/metadata/applySchoolAspects.ts', 'Join around line 15.'),
  PATHS('scripts/metadata/applyFormLedger.ts', 'Join around line 17.'),
  PATHS('scripts/metadata/stripSpellSchools.ts', 'Join around line 14.'),
  PATHS('scripts/metadata/cleanMetadata.ts', 'Join around line 54.'),
  PATHS('scripts/metadata/generateWorldMetadata.ts', 'Join around line 32.'),
  PATHS('scripts/metadata/generateRulesMetadata.ts', 'Join around line 35.'),
  PATHS('scripts/search/collectRecords.ts', 'Join around line 408.'),
  PATHS('scripts/build/fetchContent.ts', 'Join around line 30.'),
  PATHS('scripts/utils/precompileMdx.ts', 'Join around line 95.'),
  PATHS('scripts/content/kebabifyContent.ts', 'Join around line 109.'),
  PATHS('scripts/content/mdToMdx.ts', 'Join around line 55.'),
  PATHS('scripts/content/updateContentLinks.ts', 'Join around line 27.'),
  PATHS('scripts/content/addContentSuffixes.ts', 'Join around line 39.'),
  PATHS('scripts/dev/generateSpellLists.ts', 'Join around line 34.'),
  PATHS('src/app/sitemap.ts', 'Join around line 23.'),
  PATHS('src/lib/content/reusable/resolveReusableSource.ts', 'Join around line 18.'),
  PATHS('src/modules/library/application/use-cases/generateStaticParams.ts', 'Join around line 20.'),
  PATHS('.github/scripts/checkAnchors.ts', 'Join around line 156.'),
  PATHS('.github/scripts/checkOrphanedMdxLinks.ts', 'Join around line 140.'),
  {
    file: 'scripts/build/cleanFullSize.ts',
    tail: "The hand-rolled public-folder join around line 22 becomes getPublicFolder() from '@/lib/utils/getPublicFolder', per the path rule.",
  },
];

export default {
  name: 'string-utils-ikuisuus',
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
    ].join('\n'),
  expectFiles: (a, m) => a.roster[m].file,
  key: (a, m) => a.roster[m].file,
};
