/**
 * @fileoverview Format gap survey — reads the corpus against the slot
 * vocabulary and reports only what the format cannot express.
 */

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '.ignore/reports/format-gaps';

/**
 * The canon every member reads, in the same order, so the shared prefix is
 * one cache entry rather than two hundred.
 */
const CANON = [
  'src/modules/library/domain/slots.ts',
  'src/content/en/monsters/abandoned-old-war-machine.sheet.mdx',
  'tests/fixtures/slots/alfanjon.mdx',
  '.ignore/tasks/2026-09-02-152000-contentv2-slot-forms-spike.md',
];

/**
 * The war machine is the worked example in CANON, and the two prototypes are
 * copies of it, so none of the three is also surveyed.
 */
const EXEMPLARS = new Set([
  'abandoned-old-war-machine.sheet.mdx',
  'abandoned-old-war-machine-rows.sheet.mdx',
  'abandoned-old-war-machine-pages.sheet.mdx',
]);

/**
 * Every file of one kind, as roster entries.
 *
 * @param {string} kind - Label for the group, and its output folder.
 * @param {string} dir - Directory to read.
 * @param {string} suffix - Filename suffix that marks a member.
 * @param {boolean} deep - Whether to descend into subdirectories.
 * @returns {{kind: string, file: string, slug: string, report: string}[]} Entries.
 */
const rosterOf = (kind, dir, suffix, deep) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const here = entries
    .filter((e) => e.isFile() && e.name.endsWith(suffix))
    .filter((e) => !EXEMPLARS.has(e.name))
    .map((e) => {
      const slug = e.name.slice(0, -suffix.length);
      return {
        kind,
        slug,
        file: join(dir, e.name).split('\\').join('/'),
        report: OUT + '/' + kind + '/' + slug + '.md',
      };
    });
  if (!deep) return here;
  const below = entries
    .filter((e) => e.isDirectory())
    .flatMap((e) => rosterOf(kind, join(dir, e.name), suffix, true));
  return [...here, ...below];
};

const VOCATIONS = 'src/content/en/character-creation/vocations';

const roster = [
  ...rosterOf('heirloom', 'src/content/en/items/heirlooms', '.heirloom.mdx', false),
  ...rosterOf('monster', 'src/content/en/monsters', '.sheet.mdx', false),
  ...rosterOf('vocation', VOCATIONS, '.vocation.mdx', true),
  ...rosterOf('specialization', VOCATIONS, '.specialization.mdx', true),
].sort((a, b) => (a.report < b.report ? -1 : 1));

/* Every report exists before a single member runs. Two hundred agents each
   creating a directory and a file at once is what took the disk down before;
   they now only ever open a file that is already there.
   `wx` writes only what is missing, because reading this plan is not the same
   as running it — `paw swarm doctor` imports it too, and a validation pass
   must not throw away the findings of the run before it. Delete the folder to
   start over. */
for (const kind of ['heirloom', 'monster', 'vocation', 'specialization']) {
  mkdirSync(OUT + '/' + kind, { recursive: true });
}
for (const entry of roster) {
  try {
    writeFileSync(entry.report, 'none\n', { flag: 'wx' });
  } catch {
    /* already there, from a run that has something to say */
  }
}

const BRIEF = [
  'You are surveying one content file against the slot vocabulary the format',
  'defines, and reporting only what that vocabulary cannot express.',
  '',
  'Your context holds the slot schema, which is the authority on what exists:',
  'every header slot, every block slot, every block kind. It also holds two',
  'finished files — a monster sheet and an heirloom card — showing the shapes',
  'those slots are meant to take, and the spike note describing the format.',
  '',
  '# What you are looking for',
  '',
  'A gap is a mechanic the file actually contains that the format has no way',
  'to carry without inventing something new. That is the whole brief.',
  '',
  '# The default answer is none',
  '',
  'Most files have no gap. Your report already contains the word none, and',
  'leaving it that way is a correct, complete, expected result. You are not',
  'being measured on how much you find. A survey that reports nothing on a',
  'file with nothing to report is a good survey.',
  '',
  'Do not go looking for something to say. Do not report a maybe. If you are',
  'weighing whether something counts, it does not — leave the file as none.',
  '',
  '# Not gaps',
  '',
  '* A file that has not been migrated yet. Old shape is age, not a gap.',
  '* A slot that exists and is simply unused, or left empty.',
  '* Prose you would have worded differently.',
  '* A mechanic that existing slots could carry, even if this file does not',
  '  use them. The question is what the format can express, never what this',
  '  file happens to do.',
  '* A missing keyword, link, or piece of metadata.',
  '* Anything you would have to guess at to describe.',
  '',
  '# What a real gap looks like',
  '',
  'Something the file states as a rule, which a reader needs, and which no',
  'slot, block kind or heading division can hold. An object with its own',
  'defences that is not a creature. A value that changes as the thing is',
  'used, where the header can hold only one. A mechanic that belongs to two',
  'blocks at once. If you cannot name the slot it would need, say so plainly.',
  '',
  '# Your report',
  '',
  'If you found nothing, leave the report file exactly as it is. Do not',
  'rewrite it, do not add commentary, do not explain that you found nothing.',
  '',
  'If you found a gap, overwrite the report file with flat pairs, one per',
  'gap, no headings, no preamble:',
  '',
  'PASSAGE: <the file\'s own words, quoted verbatim>',
  'GAP: <what the format cannot carry, in one or two sentences>',
  '',
  'Quote the file. Never paraphrase a passage into something it does not say.',
  '',
  '# Never',
  '',
  '* Never edit the content file. You are reading it, nothing more.',
  '* Never write to any path but your own report.',
  '* Never invent a mechanic, a number, or a slot name.',
  '* Never report a gap you cannot quote a passage for.',
  '',
  '# Finishing',
  '',
  'Use your tools. Do not print the file or the report back in your reply.',
  'End with one short line: either the word none, or the number of gaps you',
  'wrote.',
  '',
  '# Your file',
  '',
].join('\n');

export default {
  name: 'format-gaps',
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
