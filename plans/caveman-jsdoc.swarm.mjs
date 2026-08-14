/**
 * @fileoverview Caveman JSDoc sweep for Ikuisuus: one member per tracked
 * .ts/.tsx file, each rewrites the file's JSDoc to the dry caveman spec in
 * .github/docs/jsdoc.md — technical core only, no flowery prose, no
 * implementation rationale. File roster comes from PAW_SWEEP_FILES, default
 * .ignore/sweep/caveman-files.txt (git ls-files, .d.ts excluded). Resume keys
 * are the file paths.
 *
 *   paw swarm run plans/caveman-jsdoc.swarm.mjs --live
 */

import { readFileSync } from 'node:fs';

const LIST = process.env.PAW_SWEEP_FILES ?? '.ignore/sweep/caveman-files.txt';

const files = readFileSync(LIST, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0)
  .sort();

export default {
  name: 'caveman-jsdoc-ikuisuus',
  role: 'edit.apply',
  args: { files },
  members: (a) => a.files.length,
  availableTools: ['read', 'edit'],
  brief: (a, m) =>
    [
      'You are editing one TypeScript file in place with your tools.',
      `Open ${a.files[m]} and read it fully.`,
      '',
      'This repository requires dry, caveman-style JSDoc: the shortest',
      'technical description of what the thing does, in code terms. The',
      "file's JSDoc has drifted into flowery prose. Rewrite every JSDoc",
      'sentence that is not a plain technical fact a caller needs.',
      '',
      '# Delete',
      '* Philosophy, metaphor, storytelling, narrative flourish, filler,',
      '  marketing adjectives (robust, elegant, powerful, seamless).',
      '* Implementation and design rationale: "A must run before B because',
      '  X", "we do X so that Y", "chosen over Z", "this exists to",',
      '  "the point is", history of the code. State WHAT it does; the',
      '  reader can read code for how and why.',
      '* Restated parameter lists or logic walkthroughs in @description',
      '  bodies that repeat what @param lines or the code already say.',
      '',
      '# Keep',
      '* Every JSDoc tag in its position: @fileoverview, @module, @version,',
      '  @since, @component, @param (including per-prop props.x lines),',
      '  @returns, @throws, @property, @constant, @example. Rewrite only',
      '  the prose after the tag. Never delete a tag line.',
      '* Interface @property tables. Never convert to inline property',
      '  comments.',
      '* Caller-facing facts: units, ranges, defaults, error conditions,',
      '  side effects, hard limits ("truncates at 1024 chars" stays).',
      '* @example code blocks byte-identical.',
      '* All code byte-identical: imports, types, identifiers, string',
      '  literals, logic. You edit comments only.',
      '* Compress @fileoverview to 1-3 dry sentences.',
      '',
      '# Never',
      '* Never add inline comments inside function bodies.',
      '* Never leave a JSDoc block empty; one dry sentence minimum.',
      '',
      'Edit the file in place with str_replace edits. Do not print the file',
      'back. If every comment is already dry technical fact, change nothing.',
      'When done, reply with one short line naming what you changed.',
    ].join('\n'),
  expectFiles: (a, m) => a.files[m],
  key: (a, m) => a.files[m],
};
