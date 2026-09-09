/**
 * @fileoverview Trinket analysis — reads each item's single run of prose and
 * reports whether it separates into colour and blocks
 */

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';

const TRINKETS = 'src/content/en/items/trinkets';
const REPORTS = '.ignore/reports/trinket-split';

/**
 * The canon every member reads, in the same order, so the shared prefix is one
 * cache entry rather than forty.
 */
const CANON = [
  'src/content/en/items/heirlooms/alfanjon-of-the-crescent-moon.heirloom.mdx',
  'src/modules/library/domain/slots.ts',
];

/**
 * A trinket's slug, which is also the name of its report.
 *
 * @param {string} name - The item's filename.
 * @returns {string} The slug.
 */
const slugOf = (name) => name.replace(/\.trinket\.mdx$/, '');

const roster = readdirSync(TRINKETS)
  .filter((name) => name.endsWith('.trinket.mdx'))
  .map((name) => ({
    name,
    slug: slugOf(name),
    file: TRINKETS + '/' + name,
    report: REPORTS + '/' + slugOf(name) + '.md',
  }))
  .filter((entry) => {
    /* A named few, for piloting the brief before the sweep. */
    const only = process.env.PAW_TRINKET_ONLY;
    return only ? only.split(',').includes(entry.slug) : true;
  })
  .sort((a, b) => (a.file < b.file ? -1 : 1));

/* Every report exists before a single member runs, so no two agents race to
   create one. `wx` leaves a previous run's answers alone. */
mkdirSync(REPORTS, { recursive: true });
for (const entry of roster) {
  try {
    writeFileSync(entry.report, 'none\n', { flag: 'wx' });
  } catch {
    /* already there, from a run that had something to say */
  }
}

const BRIEF = [
  'You are reading one trinket and answering a single question about it. You',
  'change nothing about the item. Your only write is your report.',
  '',
  'A trinket is mundane gear. It carries a `<Trinket>` header of slots and',
  'then one run of prose, with no sections and no blocks. That is how all of',
  'them are written today.',
  '',
  'Your context holds a golden heirloom, which shows what a block looks like',
  'when an item does have them, and the slot schema, which is the authority on',
  'what slots exist.',
  '',
  '# The question',
  '',
  'Does this trinket\'s prose separate cleanly into colour and mechanics?',
  '',
  'It separates when the prose contains something that would fill a slot the',
  'schema already has:',
  '',
  '* An action it costs to use — `cost`.',
  '* A save, a DC, or an accuracy — `saveDc`, `accuracy`.',
  '* A limit on how often — `charges`, `recharge`.',
  '* A set of targets, a range or a reach the header does not already carry.',
  '',
  'Where that is true, the mechanics become a `<Feature>` carrying those',
  'slots, and whatever is left — what the thing looks like, what it is made',
  'of, what it was for — stays as prose above it.',
  '',
  '# When the answer is no',
  '',
  'Say no, and say it plainly, when:',
  '',
  '* The prose is one description with no rule in it at all.',
  '* The only rule is what the header already states in its own slots, so a',
  '  block would repeat it.',
  '* The rule is inseparable from the description — pulling it out would leave',
  '  either half saying less than the whole did.',
  '',
  'A trinket that stays one run of prose is a normal and complete answer. Most',
  'of them will be. Do not invent a reason to split one.',
  '',
  '# Never',
  '',
  '* Never edit the trinket.',
  '* Never invent a cost, a DC, a duration or a limit the prose does not',
  '  state. If a rule needs a number the item never gives, that is a reason to',
  '  say no and note it.',
  '* Never report second person. A trinket is written to whoever carries it,',
  '  the way a spell is written to whoever casts it. "You" is correct.',
  '* Never report typos, grammar, or wording you would have phrased',
  '  differently.',
  '* Never report balance.',
  '',
  '# Your report',
  '',
  'Your report file already exists and contains the word none. If the answer',
  'is no, leave it exactly as it is.',
  '',
  'If the answer is yes, overwrite it with this and nothing else:',
  '',
  'SPLIT: <how many features it separates into>',
  'PROSE: <the words that would stay as prose, quoted verbatim>',
  'FEATURE: <the name you would give it> | <slots you would set, as',
  'name="value" pairs> | <the words that would move into it, quoted verbatim>',
  '',
  'Repeat the FEATURE line once per feature. Name it from what the trinket',
  'calls it; if the trinket names nothing, use a plain description of the act',
  'and say so by ending the name with a question mark.',
  '',
  '# Finishing',
  '',
  'Do not edit the trinket. Do not print it back. End your reply with the word',
  'yes or the word no.',
  '',
  '# Your trinket',
  '',
].join('\n');

export default {
  name: 'trinket-split',
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
