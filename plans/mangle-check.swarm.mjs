/**
 * @fileoverview Asks one question of every file the migration touched: is it
 * mangled? Reports only damage, and changes nothing.
 */

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';

const MONSTERS = 'src/content/en/monsters';
const HEIRLOOMS = 'src/content/en/items/heirlooms';
const TRINKETS = 'src/content/en/items/trinkets';
const REPORTS = '.ignore/reports/mangle-check';

/**
 * The canon every member reads, in the same order, so the shared prefix is one
 * cache entry rather than a hundred and fifty.
 */
const CANON = [
  'src/content/en/monsters/abandoned-old-war-machine.sheet.mdx',
  'src/content/en/items/heirlooms/alfanjon-of-the-crescent-moon.heirloom.mdx',
];

/**
 * Files the migration rewrote, each with the slug its report is named for.
 *
 * @returns {{slug: string, file: string, report: string}[]} The roster.
 */
function migrated() {
  const seen = [];
  for (const [dir, suffix] of [
    [MONSTERS, '.sheet.mdx'],
    [HEIRLOOMS, '.heirloom.mdx'],
    [TRINKETS, '.trinket.mdx'],
  ]) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(suffix)) continue;
      const slug = name.slice(0, -suffix.length);
      seen.push({
        slug,
        file: dir + '/' + name,
        report: REPORTS + '/' + slug + '.md',
      });
    }
  }
  return seen.sort((a, b) => (a.file < b.file ? -1 : 1));
}

const roster = migrated().filter((entry) => {
  const only = process.env.PAW_MANGLE_ONLY;
  return only ? only.split(',').includes(entry.slug) : true;
});

/* Every report exists before a single member runs, so no two agents race to
   create one. `wx` leaves a previous run's answers alone. */
mkdirSync(REPORTS, { recursive: true });
for (const entry of roster) {
  try {
    writeFileSync(entry.report, 'none\n', { flag: 'wx' });
  } catch {
    /* already there, from a run that found damage */
  }
}

const BRIEF = [
  'One question: is this file mangled?',
  '',
  'It was rewritten by a series of scripts that moved headings, lifted blocks',
  'out of other blocks, reordered sections and changed heading levels. Scripts',
  'that move text can drop it, duplicate it, splice two pieces together, or',
  'leave a block wrapped around something that should stand beside it. You are',
  'looking for that damage and nothing else.',
  '',
  'Your context holds two files that are known good — a monster sheet and an',
  'heirloom. Read whichever matches yours and compare against it.',
  '',
  '# Work through these in order. Each is a fact you can check.',
  '',
  '1. **A section that is not one of ours.** The only sections are Traits,',
  '   Features, Deeds, Curses, Grafting, and Attributes on an heirloom. A',
  '   section heading naming anything else — Actions and Attacks are',
  '   subsections of Features, not sections — is invented and is damage.',
  '2. **A deed under the wrong rung.** The rungs are Lair, Stratagem, Act,',
  '   Phase, in that order. A block declaring `deed="stratagem"` sitting under',
  '   `#### Act` is filed wrong. A rung with nothing under it is damage too.',
  '3. **Deeds written as sections.** A heading like `Legendary Deed: Act` is a',
  '   rung inside the Deeds section, never a section of its own.',
  '4. **A block wrapping its own siblings.** A Feature, Action or Trait whose',
  '   body holds other Features, Actions or Traits that are plainly separate',
  '   things rather than parts of it.',
  '5. **A block of the wrong kind for where it sits.** A Trait inside an',
  '   Action, an Action inside a Trait.',
  '6. **An action that never says what it costs.** A block that reads as a',
  '   Major, Minor, or Reaction and carries no `cost`.',
  '7. **An attack alteration that is not keyworded.** An alteration names',
  '   itself with `<span>[# kw:attack alteration #]</span>` beside its title.',
  '8. **A reflex that is really a rider.** A reflex is a response THIS',
  '   creature makes and may decline. Something imposed on a target, which it',
  '   cannot refuse, is a rider and is not a reflex.',
  '9. **A heading with no title**, a block with a heading and no body, or a',
  '   body with no heading.',
  '10. **A heading at the wrong level.** Ranks skipping a step downward, or a',
  '    heading level with the one it should sit under.',
  '11. **Text cut or doubled.** A sentence starting mid-thought; the same',
  '    sentence, heading or block twice.',
  '12. **Content in the wrong creature**, or stranded after the last closing',
  '    tag.',
  '13. **More than one first-level heading**, or none.',
  '',
  '# What mangled does not mean',
  '',
  '* Wording, grammar, spelling, or a phrase you would have written',
  '  differently. The prose is the author\'s.',
  '* A number you think is wrong. Balance is not yours.',
  '* Content you think is missing but that was never there — you cannot see',
  '  what the file used to say, so do not guess at it.',
  '* A slot you would have filled in, a name you would have given something.',
  '* Second person. These are written to a reader who wields or runs the',
  '  thing, and that is correct.',
  '* An arrangement that is merely different from the exemplar. Only report a',
  '  difference that is damage.',
  '',
  '# Your report',
  '',
  'Your report already exists and contains the word none. A file that is not',
  'mangled is the normal answer: leave it exactly as it is, and do not write a',
  'report saying you found nothing.',
  '',
  'If it is mangled, overwrite it with flat pairs, no headings, no preamble,',
  'one blank line between them:',
  '',
  'WHERE: <the line as it reads, quoted verbatim>',
  'WHAT: <which of the seven, and what the damage is, in one or two sentences>',
  '',
  'Quote rather than describe. A passage that is not the file\'s own words',
  'cannot be checked. If you are unsure whether something is damage, it is',
  'not.',
  '',
  '# Finishing',
  '',
  'Do not edit the file. Do not print it back. End your reply with the word',
  'mangled or the word clean.',
  '',
  '# Your file',
  '',
].join('\n');

export default {
  name: 'mangle-check',
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
