/**
 * @fileoverview Repair for the sheets holding several creatures, whose traits
 * and names an older migration moved onto the wrong creature.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const SHEETS = 'src/content/en/monsters';
const REFERENCE = '.ignore/reports/monster-repair/main';
const QUESTIONS = '.ignore/reports/monster-repair/questions';

/**
 * The canon every member reads, in the same order, so the shared prefix is one
 * cache entry rather than ten.
 */
const CANON = [
  'src/content/en/monsters/abandoned-old-war-machine.sheet.mdx',
  'src/content/en/monsters/sulphurous-husks.sheet.mdx',
  'src/modules/library/domain/slots.ts',
];

/**
 * A sheet's slug, which is also the name of its questions file.
 *
 * @param {string} name - The sheet's filename.
 * @returns {string} The slug.
 */
const slugOf = (name) => name.replace(/\.sheet\.mdx$/, '');

/* Only sheets an older copy exists for: the repair is reading who owned what
   before the migration moved it, and without that copy there is nothing to
   read. */
const roster = readdirSync(REFERENCE)
  .filter((name) => name.endsWith('.sheet.mdx'))
  .map((name) => ({
    name,
    slug: slugOf(name),
    file: SHEETS + '/' + name,
    before: REFERENCE + '/' + name,
    questions: QUESTIONS + '/' + slugOf(name) + '.questions.md',
  }))
  .filter((entry) => {
    const only = process.env.PAW_MONSTER_REPAIR_ONLY;
    if (only) return only.split(',').includes(entry.slug);
    return readFileSync(entry.file, 'utf8').length > 0;
  })
  .sort((a, b) => (a.file < b.file ? -1 : 1));

/* Every questions file exists before a single member runs, so no two agents
   race to create one. `wx` leaves a previous run's answers alone. */
mkdirSync(QUESTIONS, { recursive: true });
for (const entry of roster) {
  try {
    writeFileSync(entry.questions, 'none\n', { flag: 'wx' });
  } catch {
    /* already there, from a run that had something to raise */
  }
}

const BRIEF = [
  'You are repairing one monster sheet that holds several creatures, editing',
  'it in place with your tools.',
  '',
  'An older migration moved things onto the wrong creature in these files. It',
  'hoisted traits that belong to the second and third creatures into the',
  'first, and it pushed each creature’s name heading out of place, often into',
  'the gap between two creatures or to the very end of the file. Your job is',
  'to put them back and finish the shape.',
  '',
  '# What you are given',
  '',
  'Your context holds four files:',
  '',
  '1. The golden sheet, the Abandoned Old War Machine, for the shape of one',
  '   creature.',
  '2. The Husks of Xanthosis, a sheet of this exact kind already repaired. It',
  '   is the closest thing to a worked answer you have — read it carefully.',
  '3. The slot schema, the authority on what slots exist.',
  '4. **The older copy of your own sheet**, from before the migration. This is',
  '   the authority on WHO OWNED WHAT. It is not the authority on shape: it',
  '   predates every slot and component in use now.',
  '',
  '# Reading the older copy',
  '',
  'In the older copy each creature is a heading followed by its own traits and',
  'actions. That tells you which creature each trait, each action and each',
  'name belongs to. Use it for exactly that and nothing else.',
  '',
  'Never copy its formatting forward. Its stat tables, its bulleted',
  '"Accuracy +8, reach 1 stride, one creature" attack lines and its',
  '"- **Saving Throws**:" lists were all replaced by the `<Monster>` header and',
  'the `<Attack>` block long ago. The current file is right about those.',
  '',
  '# What to repair',
  '',
  '1. **Ownership.** A `<Trait>`, `<Action>` or `<Feature>` that the older copy',
  '   puts under a different creature moves into that creature, inside its own',
  '   `<Monster>`. Move the whole block, with its heading and its words',
  '   unchanged.',
  '2. **Names.** Each creature is named by a `# ` heading of its own, on the',
  '   line before its `<Monster>`. Take the name from the older copy. A name',
  '   heading stranded between two creatures, or sitting after the last',
  '   `</Monster>`, is deleted once its creature carries it.',
  '3. **Shape.** Then give each creature the ordinary shape, exactly as the',
  '   Husks of Xanthosis has it: `<Sheet>` before its first `##` section and',
  '   `</Sheet>` before its own `</Monster>`; `## Traits` holding `<Trait>`',
  '   blocks with `####` names; `## Features` holding `### Actions` and',
  '   `### Attacks`; `## Deeds` for deeds. One `<Sheet>` pair per creature,',
  '   never one pair around several.',
  '4. **Attacks.** An `<Attack>` never lives inside the `<Action>` that holds',
  '   Multiattack. Move each one to that creature’s `### Attacks`, heading at',
  '   `#####`. An attack Multiattack chooses from carries no `cost`; one it',
  '   cannot choose keeps the shell’s `cost`. A `recharge` moves onto the',
  '   `<Attack>` as `recharge="5–6"`, never into the heading text.',
  '5. **Duplicates.** The migration sometimes left a sentence twice in a row.',
  '   Where the same sentence appears twice with nothing between, keep one.',
  '',
  '# Never',
  '',
  '* Never reword anything. You move blocks and change heading levels.',
  '* Never give a creature something the older copy gives to another.',
  '* Never invent a trait, a name, a number or a section. If the older copy is',
  '  silent about who owns something, leave it and raise it.',
  '* Never retune a number.',
  '* Never write a curly quote in a JSX attribute. It is a compile error.',
  '* Never touch the frontmatter, the page’s own first H1, the art components,',
  '  or any `<Monster>` header attributes.',
  '* Never edit the older copy. It is read-only reference.',
  '',
  '# Questions',
  '',
  'Your questions file already exists and contains the word none. If you have',
  'nothing to raise, leave it exactly as it is. Otherwise overwrite it with',
  'flat pairs, no headings, no preamble:',
  '',
  "PASSAGE: <the sheet's own words, quoted verbatim>",
  'QUESTION: <what you could not decide, in one or two sentences>',
  '',
  '# Finishing',
  '',
  'Edit the sheet in place. Do not print it back. End your reply with one',
  'short line naming what you changed, or the word none.',
  '',
  '# Your sheet',
  '',
].join('\n');

export default {
  name: 'monster-repair',
  role: 'edit.apply',
  args: { roster, canon: CANON },
  members: (a) => a.roster.length,
  availableTools: ['read', 'edit'],
  contextFiles: (a, m) => [...a.canon, a.roster[m].file, a.roster[m].before],
  expectFiles: (a, m) => a.roster[m].file,
  key: (a, m) => a.roster[m].file,
  brief: (a, m) =>
    BRIEF +
    a.roster[m].file +
    '\n\nThe older copy: ' +
    a.roster[m].before +
    '\n\nYour questions: ' +
    a.roster[m].questions,
};
