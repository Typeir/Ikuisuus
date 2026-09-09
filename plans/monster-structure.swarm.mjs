/**
 * @fileoverview Structure migration — attacks move into their own section, and
 * an effect that is always true becomes a trait.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const SHEETS = 'src/content/en/monsters';
const QUESTIONS = '.ignore/reports/monster-structure/questions';

/**
 * The canon every member reads, in the same order, so the shared prefix is one
 * cache entry rather than sixty.
 */
const CANON = [
  'src/content/en/monsters/abandoned-old-war-machine.sheet.mdx',
  'src/modules/library/domain/slots.ts',
];

/**
 * The war machine is the golden sheet in CANON, and the two prototypes are
 * copies of it.
 */
const EXEMPLARS = new Set([
  'abandoned-old-war-machine.sheet.mdx',
  'abandoned-old-war-machine-rows.sheet.mdx',
  'abandoned-old-war-machine-pages.sheet.mdx',
]);

/**
 * A sheet's slug, which is also the name of its questions file.
 *
 * @param {string} name - The sheet's filename.
 * @returns {string} The slug.
 */
const slugOf = (name) => name.replace(/\.sheet\.mdx$/, '');

/* Only sheets already wrapped in `<Sheet>` are in scope: the unwrapped ones
   hold several creatures each and wait for the swapper, and moving a heading
   across a `<Monster>` boundary has broken those sheets before. A sheet with
   no attack at all has nothing to move. */
const roster = readdirSync(SHEETS)
  .filter((name) => name.endsWith('.sheet.mdx') && !EXEMPLARS.has(name))
  .map((name) => ({
    name,
    slug: slugOf(name),
    file: SHEETS + '/' + name,
    questions: QUESTIONS + '/' + slugOf(name) + '.questions.md',
  }))
  .filter((entry) => {
    /* A named few, for piloting the brief before the sweep. */
    const only = process.env.PAW_MONSTER_STRUCTURE_ONLY;
    if (only) return only.split(',').includes(entry.slug);
    const text = readFileSync(entry.file, 'utf8');
    /* The sheets holding several creatures, which waited for the shape to
       settle before anything was moved inside them. */
    if (process.env.PAW_MONSTER_STRUCTURE_REST) {
      return !/^<Sheet\b/m.test(text) && /^<Attack\b/m.test(text);
    }
    if ((text.match(/^<Monster/gm) ?? []).length !== 1) return false;
    if (!/^<Sheet\b/m.test(text)) return false;
    return /^<Attack\b/m.test(text);
  })
  .sort((a, b) => (a.file < b.file ? -1 : 1));

/* Every questions file exists before a single member runs, so no two agents
   race to create one. `wx` leaves a previous run's answers alone — reading
   this plan is not the same as running it, and `paw swarm doctor` imports it
   too. Delete the folder to start over. */
mkdirSync(QUESTIONS, { recursive: true });
for (const entry of roster) {
  try {
    writeFileSync(entry.questions, 'none\n', { flag: 'wx' });
  } catch {
    /* already there, from a run that had something to raise */
  }
}

const BRIEF = [
  'You are restructuring one monster sheet, editing it in place with your',
  'tools. You are moving things, not rewriting them.',
  '',
  'Your context holds the golden sheet — the Abandoned Old War Machine — which',
  'is already in the shape you are aiming at. Read it before you write',
  'anything. It also holds the slot schema, which is the authority on what',
  'slots exist.',
  '',
  '# Attacks get their own section',
  '',
  'Under `## Features`, the golden sheet has two sibling sections:',
  '',
  '* `### Actions` holds Multiattack, and anything else that spends an action',
  '  and is not an attack.',
  '* `### Attacks` holds the attacks, as bare `<Attack>` blocks.',
  '',
  'Most sheets instead wrap each attack in an `<Action>` shell and leave it',
  'under `### Actions`. Unwrap it:',
  '',
  '   <Action cost="1 Major Action">',
  '',
  '   #### Throwing Dagger',
  '',
  '   <Attack accuracy="+7" range="[= 4 stride =]">',
  '',
  '   On a hit, 9 ([% 1d10 +4 piercing %]).',
  '',
  '   </Attack>',
  '',
  '   </Action>',
  '',
  'becomes, under `### Attacks`:',
  '',
  '   <Attack accuracy="+7" range="[= 4 stride =]">',
  '',
  '   ##### Throwing Dagger',
  '',
  '   On a hit, 9 ([% 1d10 +4 piercing %]).',
  '',
  '   </Attack>',
  '',
  'The `<Action>` shell goes, along with the `---` rule that separated it from',
  'the next one. The name heading moves inside the `<Attack>` and drops one',
  'level, to `#####`. The body is untouched.',
  '',
  'An `<Attack>` carries `cost` and `recharge` of its own, so nothing about the',
  'shell is lost by unwrapping it:',
  '',
  '* An attack Multiattack chooses from spends no action of its own. Drop the',
  '  shell’s `cost` entirely.',
  '* An attack Multiattack cannot choose — one whose own words say so, or one',
  '  the Multiattack line never names — keeps what it costs. Carry the shell’s',
  '  `cost` onto the `<Attack>`.',
  '* A recharge always moves onto the `<Attack>` as `recharge="5–6"`. It is',
  '  never written into the heading text, and never dropped. If a heading you',
  '  move still reads "(Recharge 5–6)", take it out of the heading and make it',
  '  the slot.',
  '',
  '# Attacks written inside the Multiattack',
  '',
  'Some sheets put every `<Attack>` inside the one `<Action>` that holds the',
  'Multiattack description. Those attacks come out too: the Multiattack',
  '`<Action>` keeps only its own heading and its own sentence, and each',
  '`<Attack>` moves to `### Attacks` with its `#####` heading, exactly as',
  'above. An attack is never a child of the Multiattack that names it.',
  '',
  'Keep the attacks in the order the sheet already had them. Add the',
  '`### Attacks` heading directly after the last thing in `### Actions`. If a',
  'sheet has no Multiattack, or only one attack, it still gets the section.',
  '',
  'An `<Action>` that is not an attack — no `<Attack>` inside it — stays',
  'exactly where it is, under `### Actions`.',
  '',
  '# An effect that is always true is a trait',
  '',
  'A `<Trait>` under `## Traits` is for what is simply true of the creature: no',
  'trigger, no cost, nothing spent, always on. If the sheet states one of those',
  'somewhere else, move it into `## Traits` as a `<Trait>` with a `####` name.',
  '',
  'An effect that only exists as part of one attack or action is NOT a trait,',
  'however passive it reads. It is appended to that effect and it stays inside',
  'it, where the sheet already has it. Moving it out would strand it from the',
  'thing that causes it.',
  '',
  'A reaction is not a trait either. It has a trigger and it costs a reaction,',
  'so it stays where the sheet puts it.',
  '',
  '# A sheet holding several creatures',
  '',
  'Some sheets hold more than one `<Monster>`. Each is a creature of its own',
  'and everything above applies to it separately, inside its own `<Monster>`.',
  '',
  '* Never move a heading, a block, or a sentence from one `<Monster>` into',
  '  another, and never out of one into the space between them. A creature',
  '  cannot borrow another creature\'s attack, and this is how these sheets',
  '  have broken before.',
  '* A creature whose body is not already wrapped in `<Sheet>` gets its own:',
  '  `<Sheet>` on the line before that creature\'s first `##` section, and',
  '  `</Sheet>` on the line before its own `</Monster>`. One pair per',
  '  `<Monster>`, never one pair around several.',
  '* A creature whose sections are named for it — `## Borderlander Gunner`,',
  '  `## Sun Catcher Cub` — keeps that name as its H1-level identity and gets',
  '  the ordinary `## Traits`, `## Features` and `## Deeds` beneath. Do not',
  '  rename a section to match another creature\'s.',
  '* If a creature has no sections at all, leave it and raise it. Inventing a',
  '  section is authoring, not moving.',
  '',
  '# Deeds are a section of their own',
  '',
  'A sheet’s deeds live under a top-level `## Deeds`, a sibling of `## Traits`',
  'and `## Features` — never nested inside either. If you find them under some',
  'other heading, move the heading, not the deeds.',
  '',
  'The reader sees that section on its own, with the traits out of sight. So it',
  'opens by restating the Legendary Deeds trait: how many deeds per round, and',
  'how they come back. Take those words from the trait itself and leave the',
  'trait in place — this is a restatement, not a move. The golden sheet shows',
  'the shape:',
  '',
  '   ## Deeds',
  '',
  '   The Abandoned Old War Machine has **3 legendary deeds per round**, and',
  '   regains all expended deeds at the start of its turn. It can expend deeds',
  '   to use the options below. Only one deed can be used at a time and only at',
  '   the end of another creature’s turn.',
  '',
  'The restatement goes directly under `## Deeds`, above everything else in the',
  'section. A `#### Act`, `#### Phase` or similar heading below it groups the',
  'deeds by when they are spent — it is not a deed, and the lead does not',
  'belong under it. If the section opens with its boilerplate trapped under one',
  'of those headings, lift the boilerplate above it.',
  '',
  'If the sheet has no Legendary Deeds trait to restate, leave its lead alone',
  'and raise it. If the section names no deeds at all, say so in your questions',
  'and change nothing else about it — a missing deed is not yours to write.',
  '',
  '# Never',
  '',
  '* Never reword anything. You are moving blocks and changing heading levels.',
  '  Every sentence survives verbatim, typos included.',
  '* Never invent a slot, a value, a name, or a section the sheet does not have',
  '  content for.',
  '* Never retune a number.',
  '* Never write a curly quote in a JSX attribute. It is a compile error.',
  '* Never touch the frontmatter, the H1, the art components, the `<Sheet>`',
  '  tags, or the `<Monster>` header attributes.',
  '* Never move anything across a `<Monster>` boundary.',
  '* Never resolve a contradiction you find. Raise it.',
  '',
  '# Questions',
  '',
  'Your questions file already exists and contains the word none. If you have',
  'nothing to raise, leave it exactly as it is.',
  '',
  'If you do, overwrite it with flat pairs, no headings, no preamble:',
  '',
  "PASSAGE: <the sheet's own words, quoted verbatim>",
  'QUESTION: <what you could not decide, in one or two sentences>',
  '',
  'Raise rather than guess. A block you left alone and asked about is a better',
  'outcome than one you moved on a hunch.',
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
  name: 'monster-structure',
  role: 'edit.apply',
  args: { roster, canon: CANON },
  members: (a) => a.roster.length,
  availableTools: ['read', 'edit'],
  contextFiles: (a, m) => [...a.canon, a.roster[m].file],
  expectFiles: (a, m) => a.roster[m].file,
  key: (a, m) => a.roster[m].file,
  brief: (a, m) =>
    BRIEF + a.roster[m].file + '\n\nYour questions: ' + a.roster[m].questions,
};
