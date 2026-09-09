/**
 * @fileoverview Heirloom analysis — reads each item against the settled sheet
 * format and reports only what it cannot express
 */

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';

const HEIRLOOMS = 'src/content/en/items/heirlooms';
const REPORTS = '.ignore/reports/heirloom-analysis';

/**
 * The canon every member reads, in the same order, so the shared prefix is one
 * cache entry rather than seventy.
 */
const CANON = [
  'src/content/en/items/heirlooms/alfanjon-of-the-crescent-moon.heirloom.mdx',
  'src/content/en/monsters/abandoned-old-war-machine.sheet.mdx',
  'src/modules/library/domain/slots.ts',
];

/**
 * The alfanjón is the golden heirloom in CANON, and `main.mdx` is the folder's
 * index page rather than an item.
 */
const EXEMPLARS = new Set(['alfanjon-of-the-crescent-moon.heirloom.mdx']);

/**
 * An heirloom's slug, which is also the name of its report.
 *
 * @param {string} name - The item's filename.
 * @returns {string} The slug.
 */
const slugOf = (name) => name.replace(/\.heirloom\.mdx$/, '');

const roster = readdirSync(HEIRLOOMS)
  .filter((name) => name.endsWith('.heirloom.mdx') && !EXEMPLARS.has(name))
  .map((name) => ({
    name,
    slug: slugOf(name),
    file: HEIRLOOMS + '/' + name,
    report: REPORTS + '/' + slugOf(name) + '.md',
  }))
  .filter((entry) => {
    /* A named few, for piloting the brief before the sweep. */
    const only = process.env.PAW_HEIRLOOM_ONLY;
    return only ? only.split(',').includes(entry.slug) : true;
  })
  .sort((a, b) => (a.file < b.file ? -1 : 1));

/* Every report exists before a single member runs, so no two agents race to
   create one and no run has to make a directory mid-flight. `wx` leaves a
   previous run's findings alone. Delete the folder to start over. */
mkdirSync(REPORTS, { recursive: true });
for (const entry of roster) {
  try {
    writeFileSync(entry.report, 'none\n', { flag: 'wx' });
  } catch {
    /* already there, from a run that found something */
  }
}

const BRIEF = [
  'You are reading one heirloom and reporting what the sheet format cannot',
  'express. You change nothing about the item. Your only write is your report.',
  '',
  'Your context holds the golden heirloom — the Alfanjón of the Crescent Moon',
  '— which is the shape every item is aiming at. It also holds a golden',
  'monster sheet, because the two share their blocks and their rules about',
  'them, and the slot schema, which is the authority on what slots exist.',
  '',
  'Most of this corpus is already right. Finding nothing is the normal result',
  'and a complete one.',
  '',
  '# The shape',
  '',
  'An heirloom opens with its `<Heirloom>` header, its art and its flavour.',
  'Then `## Attributes`, which is the item\'s stat block and stays above the',
  'tab bar. Then `<Sheet>`, holding the sections a reader tabs between, always',
  'in this order:',
  '',
  '   Grafting (monstrous grafts only) → Curses → Traits → Features → anything',
  '   else, such as Progression or Acquisition.',
  '',
  'A `<Trait>` is what is simply true of the item. A `<Feature>` is something',
  'it does, and carries what it costs. Each is named by a `####` heading.',
  '',
  '# What to report',
  '',
  'Report only these, and only where they are genuinely true:',
  '',
  '1. **A missing stat block.** The item is real gear — a weapon, armour, a',
  '   shield, a graft, a worn thing with a rating — and has no `## Attributes`',
  '   section. A bauble, an amulet, a scroll or a consumable may honestly have',
  '   none; do not report those.',
  '2. **A graft with no `## Grafting`.** The item is a monstrous graft and',
  '   never says how it is attached, or says so somewhere that is not that',
  '   section.',
  '3. **Rules stranded in prose.** A paragraph that states a trait or a feature',
  '   but sits outside any `<Trait>` or `<Feature>` block, so it carries no',
  '   slots and cannot be read as a block.',
  '4. **A slot that repeats another.** A `targets` that a `range` already',
  '   states, a recharge written into a heading rather than the `recharge`',
  '   slot, a cost said twice.',
  '5. **A rider that has earned a name, or a name it has not earned.** A rider',
  '   is an effect past the damage. One save with one consequence stays a',
  '   sentence in the block that applies it, with no heading of its own. A',
  '   rider earns a block only when it offers a choice, does several distinct',
  '   things, or runs long enough that prose buries it. A save that only',
  '   halves damage is the shape of the damage, not a rider.',
  '6. **A creature or a second item described inside this one.** It wants to be',
  '   a statlet in its own section, not prose in the middle of a feature.',
  '7. **A contradiction.** The header and the body disagree, a DC or a die is',
  '   stated two ways, a section refers to something the item does not have.',
  '',
  '# What is NOT a finding',
  '',
  '* **Second person.** An heirloom is written to whoever wields it, the way a',
  '  spell is written to whoever casts it. "You" is correct here. Never report',
  '  it and never suggest changing it.',
  '* Typos, grammar, and wording you would have phrased differently.',
  '* An item having only one section, or only one tab. That is fine.',
  '* Flavour prose, quotes, art, or the absence of any of them.',
  '* A number you think is too strong or too weak. Balance is not yours.',
  '* Anything already correct that you would merely reorganise.',
  '',
  '# Your report',
  '',
  'Your report file already exists and contains the word none. If you found',
  'nothing, leave it exactly as it is. Do not write a report saying you found',
  'nothing.',
  '',
  'If you did, overwrite it with flat triples, no headings, no preamble, one',
  'blank line between them:',
  '',
  'FINDING: <which of the seven, in three or four words>',
  "PASSAGE: <the item's own words, quoted verbatim>",
  'WHY: <what the format cannot carry, in one or two sentences>',
  '',
  'Quote rather than summarise: a passage that is not the sheet\'s own words',
  'cannot be checked. Raise rather than guess. If you are unsure whether',
  'something is a finding, it is not one.',
  '',
  '# Finishing',
  '',
  'Do not edit the heirloom. Do not print it back. End your reply with one',
  'short line naming how many findings you wrote, or the word none.',
  '',
  '# Your heirloom',
  '',
].join('\n');

export default {
  name: 'heirloom-analysis',
  role: 'review.graze',
  args: { roster, canon: CANON },
  members: (a) => a.roster.length,
  availableTools: ['read', 'edit'],
  contextFiles: (a, m) => [...a.canon, a.roster[m].file],
  expectFiles: (a, m) => a.roster[m].report,
  key: (a, m) => a.roster[m].file,
  brief: (a, m) =>
    BRIEF + a.roster[m].file + '\n\nYour report: ' + a.roster[m].report,
};
