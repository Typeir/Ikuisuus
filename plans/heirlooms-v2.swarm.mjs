/**
 * @fileoverview Heirlooms v2 migration: one member per heirloom, each
 * rewriting its file in place into the v2 card format. Shared canon is the
 * migration guide plus the two rules pages the quality derivation reads. Each
 * member also gets its own survey answers, which already list that item's
 * header slots, blocks, flagged numbers and legacy phrasings. Resume keys are
 * the file paths.
 *
 * Requires four component changes before the output renders: `mastery` and
 * `deed` on FEATURE_SLOTS, a `<Pool>` block, and `saveDc` on HEIRLOOM_SLOTS.
 *
 * Set PAW_HEIRLOOM_FILES to a newline-separated roster to run a slice.
 *
 *   paw swarm run plans/heirlooms-v2.swarm.mjs --live
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ITEMS = 'src/content/en/items/heirlooms';
const ANSWERS = '.ignore/reports/heirlooms-v2/answers';

/**
 * The canon every member reads. The heirloom guide is the card's structure;
 * the spell migration guide is normative for every rules sentence; the two
 * rules pages are what the quality derivation cross-references; the fixture
 * is the worked example of a finished card.
 */
const CANON = [
  '.ignore/reports/heirlooms-v2/migration-guide.md',
  '.ignore/tasks/spell-migration-guide.md',
  'src/content/en/rules/arms-armour-and-burden/weapons-and-dice-levels.rule.mdx',
  'src/content/en/items/equipment/weapons.rule.mdx',
  'tests/fixtures/slots/alfanjon.mdx',
];

/**
 * Alfanjón is the worked example in CANON, so it is not also a member.
 */
const EXEMPLAR = 'alfanjon-of-the-crescent-moon.heirloom.mdx';

const LIST = process.env.PAW_HEIRLOOM_FILES;

const files = LIST
  ? readFileSync(LIST, 'utf8')
      .split(String.fromCharCode(10))
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  : readdirSync(ITEMS)
      .filter((name) => name.endsWith('.heirloom.mdx') && name !== EXEMPLAR)
      .sort()
      .map((name) => ITEMS + '/' + name);

/**
 * An item's slug, which is also the name of its survey answers file.
 *
 * @param {string} path - The heirloom's repo-relative path.
 * @returns {string} The slug.
 */
const slugOf = (path) =>
  path.split('/').pop().replace(/\.heirloom\.mdx$/, '');

/**
 * The item's survey answers, when the survey covered it.
 *
 * @param {string} path - The heirloom's repo-relative path.
 * @returns {string[]} Zero or one path.
 */
const answersFor = (path) => {
  const answers = ANSWERS + '/' + slugOf(path) + '.md';
  return existsSync(answers) ? [answers] : [];
};

const BRIEF = [
  'You are migrating one heirloom into the v2 card format, editing its file',
  'in place with your tools.',
  '',
  'Your context holds two guides. The heirloom migration guide governs the',
  "card's structure: the file shape, the brief slots, the quality derivation,",
  'the block kinds, the keyed constructs and the delete list. The spell',
  'migration guide is normative for every rules sentence you touch — its',
  '"Never write" list and its "Core rewrites" section apply to heirloom',
  'blocks unchanged. Read both before you write anything.',
  '',
  'Your context also holds a finished card, the Alfanjón fixture. That is the',
  'shape you are aiming at.',
  '',
  'Your context also holds a survey of this exact item, written earlier by a',
  'reader who was measuring it against the format. It already lists the',
  'header slots with the line each came from, the blocks and their slots, the',
  'numbers to leave alone, and the legacy phrasings to strip. Use it as a',
  'starting point and verify every claim against the file. Where the survey',
  'and the file disagree, the file wins.',
  '',
  '# The one rule that outranks the rest',
  '',
  'Never invent. No new mechanic, no new lore, no new quote, no new number,',
  'no new name. The mechanics that leave the file are the ones that entered',
  'it.',
  '',
  "Translating the author's rules text into the register they already use",
  'elsewhere is not invention — it is the job. Paraphrase freely to reach the',
  'forms the spell migration guide specifies. Rules text that arrives in',
  'legacy shape must leave in the Damocles register: no Failure/Success',
  'branches, no bulleted resolution, no "As a Major Action" when the cost slot',
  'already carries it, none of the banned spell-number terms. A file that',
  'keeps the old prose shape has failed even if every slot is right.',
  '',
  'Flavour is the exception and is verbatim: the primer, the quote, the H1,',
  'the frontmatter and the art components are untouched.',
  '',
  '# Never',
  '',
  '* Never retune a number. Damage, DCs, inline formulas, charge counts,',
  '  ranges and durations keep their values.',
  '* Never write a curly quote. JSX attributes take straight ASCII quotes.',
  '  A curly quote in an attribute is a compile error.',
  "* Never invent a block name. If a section has no name in the item's own",
  '  words, leave it as it is and flag it.',
  '* Never resolve a contradiction you find. Flag it.',
  '* Never guess a quality. Derive it by the guide, or leave it unset and',
  '  flag it.',
  '* Never touch the art components, the frontmatter, or the H1.',
  '',
  '# Scaling items',
  '',
  'An item whose header values change as it is used or levelled migrates its',
  'baseline into the header, leaves the progression as a table in a block,',
  'and says so in your flags. Do not try to encode the progression in slots.',
  '',
  '# Questions',
  '',
  'Write one questions file, always, at',
  '.ignore/reports/heirlooms-v2/questions/<slug>.questions.md, where <slug>',
  'is your item filename without .heirloom.mdx. Flat PASSAGE: / QUESTION:',
  'pairs, one per issue, no headings. Quote the item verbatim in PASSAGE.',
  'Write the file even with nothing to raise: a file containing only the word',
  'none is how you signal a clean finish. Leaving a passage alone and raising',
  'a pair always beats guessing.',
  '',
  '# Leave correct text alone',
  '',
  'Paraphrase only where a legacy form is actually present. Rules text already',
  "in the register keeps the author's words exactly, including typos. A",
  'misspelling is theirs to fix, and correcting it silently hides it.',
  '',
  '# Finishing',
  '',
  'Edit the item in place with str_replace edits. Do not print it back. End',
  'your reply with one short line naming what you changed.',
  '',
  '# Your item',
  '',
].join('\n');

export default {
  name: 'heirlooms-v2',
  role: 'edit.apply',
  args: { files, canon: CANON },
  members: (a) => a.files.length,
  availableTools: ['read', 'edit', 'write'],
  contextFiles: (a, m) => [...a.canon, a.files[m], ...answersFor(a.files[m])],
  expectFiles: (a, m) => a.files[m],
  key: (a, m) => a.files[m],
  brief: (a, m) => BRIEF + a.files[m],
};
