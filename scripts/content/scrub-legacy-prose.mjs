/**
 * @fileoverview Rewrites D&D-inherited prose into the register, mechanically.
 * Each pass is a closed grammar: the corpus writes its save clauses, attack
 * blocks and durations in a dozen shapes, and every shape has one rewrite.
 * A clause outside the grammar is never guessed at — it goes to a review
 * file as a PASSAGE/QUESTION block for a reader, the same shape a swarm
 * agent writes.
 *
 * The save pass is the one that needs syntax. It reads the subject's head
 * noun — head-first, since the corpus writes `creatures [within 2 stride of
 * the frog]` — to pick `saves` or `save`, and carries that number onto the
 * verb after `or`, so `must succeed … or take` becomes `saves … or takes`
 * for a singular subject and `save … or take` for a plural one.
 *
 *   node scripts/content/scrub-legacy-prose.mjs src/content/en/monsters --check
 *   node scripts/content/scrub-legacy-prose.mjs src/content/en/monsters
 *   node scripts/content/scrub-legacy-prose.mjs src/content/en/monsters --pass=attacks,saves
 *
 * Review residue lands in `.ignore/legacy-expressions/review/<file>.md`.
 */

import {
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A change one pass made to one line.
 *
 * @typedef {object} Change
 * @property {number} line - 1-based line
 * @property {string} pass - Pass id
 * @property {string} before - Text replaced
 * @property {string} after - Replacement
 */

/**
 * A clause a pass declined to rewrite.
 *
 * @typedef {object} Review
 * @property {number} line - 1-based line
 * @property {string} pass - Pass id
 * @property {string} passage - The clause as it stands
 * @property {string} question - Why it was declined
 */

/**
 * Nouns a save clause's subject can head. Singular forms; the scrub reads a
 * trailing `s` as plural.
 */
const HEAD_NOUNS =
  'creature|target|enemy|ally|being|attacker|humanoid|construct|player|' +
  'character|caster|wielder|victim|rider|swimmer|climber|occupant|mount|' +
  'object|vehicle|wall|door|undead|fiend|celestial|elemental|dragon|giant|' +
  'plant|monstrosity|aberration|ooze|fey|spirit|foe|opponent|individual|' +
  'person|figure|retinue|minion|companion|familiar|animal|wildlife|beast';

/**
 * First head noun or pronoun in a subject span, with its determiner.
 */
const HEAD = new RegExp(
  `(?<![\\w-])(?:(?<det>each|every|any|one|a|an|the|that|this|all|other|those|these)\\s+(?:[\\w-]+\\s+){0,3}?)?(?<noun>(?:${HEAD_NOUNS})s?|it|they|you|he|she|who|which)\\b`,
  'i',
);

/**
 * Two head nouns joined by `and` inside one clause: a compound subject.
 */
const COMPOUND = new RegExp(
  `\\b(?:${HEAD_NOUNS})s?\\b[^,;]*\\band\\b[^,;]*\\b(?:${HEAD_NOUNS})s?\\b`,
  'i',
);

/**
 * Grammatical number of a subject span, read head-first.
 *
 * @param {string} subject - Text before `must`
 * @returns {'singular'|'plural'|'second'|null} Number, or null when unreadable
 */
export function subjectNumber(subject) {
  let s = subject
    .replace(/\[[=#%][^\]]*\]/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  s = s.replace(/^.*?(?:effect|effects|turn|round|hour|:),\s*/i, '');
  const tailMatch =
    /(?:^|[\s,])(?<!\b(?:of|to|from|by|with|than|near|around|at|on|in|for|against|behind|before|beside|toward|towards|through|under|over|between|above|below|beneath|onto|into|upon)\s)(?<noun>it|they|you|he|she|each|each one|everyone)$/i.exec(
      s,
    );
  if (!tailMatch && COMPOUND.test(s)) return 'plural';
  const m =
    tailMatch ??
    s
      .split(/[,;]/)
      .reverse()
      .map((chunk) => HEAD.exec(chunk))
      .find(Boolean);
  if (!m) return null;
  const noun = m.groups.noun.toLowerCase();
  const det = (m.groups.det ?? '').toLowerCase();
  if (noun === 'you') return 'second';
  if (noun === 'who' || noun === 'which') return null;
  if (noun === 'they') return 'plural';
  if (['each', 'each one', 'everyone'].includes(noun)) return 'singular';
  if (noun.endsWith('s') && noun !== 'this') return 'plural';
  if (['all', 'those', 'these', 'other'].includes(det)) return 'plural';
  return 'singular';
}

/**
 * Third-person singular forms of the verbs a save clause coordinates with.
 */
const VERB_S = {
  be: 'is',
  cast: 'casts',
  sink: 'sinks',
  take: 'takes',
  become: 'becomes',
  suffer: 'suffers',
  gain: 'gains',
  have: 'has',
  fall: 'falls',
  lose: 'loses',
  fail: 'fails',
  roll: 'rolls',
  drop: 'drops',
  die: 'dies',
  contract: 'contracts',
  catch: 'catches',
};

/**
 * A verb agreed to a subject number.
 *
 * @param {string} verb - Base form
 * @param {'singular'|'plural'|'second'} number - Subject number
 * @returns {string|null} Agreed form, or null when the verb is unknown
 */
function agree(verb, number) {
  const base = verb.toLowerCase();
  if (!(base in VERB_S)) return null;
  if (number === 'singular') return VERB_S[base];
  return base === 'be' ? 'are' : base;
}

/**
 * The legacy save clause, from the subject to the end of its sentence.
 * Group `subject` is everything on the line before `must`, trimmed by the
 * caller to the clause start.
 */
const SAVE = new RegExp(
  '(?<lead>(?:^|[.>|;]\\s*|\\*\\*[^*.;|>]+\\*\\*\\s*)?)' +
    '(?<subject>(?:\\[[^\\]]*\\]|[^.>|;\\n\\[]){1,120}?)\\s+' +
    '(?<open>\\*\\*)?(?:must|has to|have to) (?:succeed on|succeed|make a successful|make|roll) (?:an? |another )?(?:\\*\\*)?' +
    '(?:DC ?(?<dc>\\d+) (?:\\*\\*)?)?' +
    '(?<ability>Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)' +
    '(?:\\*\\*)? ?(?:saving throw|save)(?<close>\\*\\*)?' +
    '(?: ?(?:\\*\\*)?\\(DC ?=? ?(?<pdc>[^)]+)\\)(?:\\*\\*)?)?' +
    '(?<tail>[^.\\n]*)',
  'gi',
);

/**
 * Save-clause pass.
 *
 * @param {string} line - One line
 * @param {number} lineNo - Its number
 * @param {Change[]} changes - Collector
 * @param {Review[]} review - Collector
 * @returns {string} Rewritten line
 */
function passSaves(line, lineNo, changes, review) {
  return line.replace(SAVE, (whole, ...captures) => {
    const g = captures[captures.length - 1];
    let subject = g.subject;
    const number = subjectNumber(subject);
    const tail = g.tail ?? '';
    const dc = g.dc ?? (g.pdc ? g.pdc.trim() : null);
    const decline = (why) => {
      review.push({ line: lineNo, pass: 'saves', passage: whole.trim(), question: why });
      return whole;
    };
    if (!number) return decline('could not read the subject to pick saves/save');

    const verbSave = number === 'singular' ? 'saves' : 'save';
    if (dc && /\b(?:or|whichever)\b/i.test(dc)) {
      return decline(`DC is an expression, not a number: (${dc})`);
    }
    let against = '';
    let rest = tail;
    const namedDc = /^\s*(against\s+[^,.;]*?\bspell save DC\b(?:\*\*)?)/i.exec(rest);
    if (dc) against = /^\**\d/.test(dc) ? ` against DC ${dc}` : ` against ${dc}`;
    else if (namedDc) {
      against = ` ${namedDc[1]}`;
      rest = rest.slice(namedDc[0].length);
    }
    let outcome;

    const halving =
      /^,?\s*(\*\*)?taking\s+(?<damage>.+?)\s+on a (?:failed save|failure|fail),?\s+or half(?: as much)?(?: damage)?(?: on a (?:successful (?:one|save)|success)| if (?:it|they) succeeds?)\.?\**$/i.exec(
        rest.trim(),
      );
    const rider = /\b(?:and|while)\s+(?:becoming|gaining|triggering|being|suffering|losing)\b/i;
    const ownSubject =
      /^\s*,?\s*or\s+(\*\*)?(?:the|their|its|his|her|a|an|all|any|each|no|nothing|one|both|it|they|you|he|she|we|that|this|these|those)\b/i.test(
        rest,
      );
    const qualifier =
      /^\s*(?:[,;]|(?:at|to|with|while|each|every|whenever|when|before|after|for|during)\b)/i.test(rest);
    const orVerb = /^\s*,?\s*or\s+(\*\*)?(immediately\s+)?(\w+)/i.exec(rest);
    if (halving && !rider.test(halving.groups.damage)) {
      outcome = `, halving ${halving.groups.damage}`;
    } else if (ownSubject) {
      outcome = rest;
    } else if (orVerb) {
      const agreed = agree(orVerb[3], number);
      if (!agreed) return decline(`verb after "or" not in the agreement table: ${orVerb[3]}`);
      outcome = rest.replace(
        /^(\s*,?\s*or\s+)(\*\*)?(immediately\s+)?(\w+)/i,
        (_m, or, bold, imm, _v) => `${or}${bold ?? ''}${imm ?? ''}${agreed}`,
      );
      outcome = outcome.replace(
        new RegExp(`(\\s+and,?\\s+(?:if [^,]+,\\s+)?)(\\*\\*)?(${Object.keys(VERB_S).join('|')})\\b`, 'i'),
        (_m, and, bold, verb) => `${and}${bold ?? ''}${agree(verb, number)}`,
      );
    } else if (qualifier || rest.trim() === '' || /^\s*[,;:]?\s*$/.test(rest)) {
      outcome = rest;
    } else {
      return decline(`tail is not "or <verb>", "taking … half", or empty: "${rest.trim().slice(0, 40)}"`);
    }

    const stars = (text) => (text.match(/\*\*/g) ?? []).length;
    const consumed = stars(whole) - stars(`${g.lead ?? ''}${subject}`) - stars(tail);
    if (consumed % 2 === 1) {
      if (stars(subject) % 2 === 1) subject = subject.replace(/\*\*(?![\s\S]*\*\*)/, '');
      else if (stars(outcome) % 2 === 1) outcome = outcome.replace('**', '');
    }

    const after = `${g.lead ?? ''}${subject} ${verbSave} ${g.ability}${against}${outcome}`;
    changes.push({ line: lineNo, pass: 'saves', before: whole.trim(), after: after.trim() });
    return after;
  });
}

/**
 * Attack-block pass: the opener and the hit line, pure template.
 *
 * @param {string} line - One line
 * @param {number} lineNo - Its number
 * @param {Change[]} changes - Collector
 * @returns {string} Rewritten line
 */
function passAttacks(line, lineNo, changes) {
  let out = line;
  const opener =
    /_(?:Melee|Ranged|Melee or Ranged)(?: Weapon| Spell)? Attack[:.]?_:?\s*\+(\d+) to hit,?\s*(reach|range)\s+(\*\*)?([^,;*]+?)(\*\*)?\s*[,;]\s*one (?:target|creature)\b\.?/gi;
  out = out.replace(opener, (whole, bonus, kind, b1, dist, b2) => {
    const after = `Accuracy +${bonus}, ${kind.toLowerCase()} ${b1 ?? ''}${dist.trim()}${b2 ?? ''}, one creature.`;
    changes.push({ line: lineNo, pass: 'attacks', before: whole, after });
    return after;
  });
  out = out.replace(/_Hit[:.]?_:?\s*/gi, (whole) => {
    changes.push({ line: lineNo, pass: 'attacks', before: whole.trim(), after: 'On a hit, ' });
    return 'On a hit, ';
  });
  out = out.replace(
    /(?<!\w)(\+\d+|(?:your|its|their|the) [^,;()]{1,40}?) to hit\b/gi,
    (whole, bonus) => {
      changes.push({ line: lineNo, pass: 'attacks', before: whole, after: `accuracy ${bonus}` });
      return `accuracy ${bonus}`;
    },
  );
  out = out.replace(
    /_?(?:Melee|Ranged|Melee or Ranged)(?: Weapon| Spell)? Attack(?:[:.]?_|[:;])[:;]?\s*(\S)?/g,
    (whole, next) => {
      const after = next ? next.toUpperCase() : '';
      changes.push({ line: lineNo, pass: 'attacks', before: whole.trim(), after });
      return after;
    },
  );
  if (/\b(?:accuracy|reach|range)\b/i.test(out)) {
    out = out.replace(/\bone target\b/g, (whole) => {
      changes.push({ line: lineNo, pass: 'attacks', before: whole, after: 'one creature' });
      return 'one creature';
    });
  }
  return out;
}

/**
 * Simple substitutions: one regex, one replacement, no syntax.
 */
const SUBSTITUTIONS = [
  { id: 'briefly', regex: /\s*until the end of (?:its|their) next turn\b/gi, to: ' [# kw:briefly #]' },
  { id: 'no-action', regex: /\s*\(no action required\)|,?\s*no action required/gi, to: '' },
  { id: 'upcast', regex: /\(upcast\)/gi, to: '(overcast)' },
  { id: 'upcast', regex: /\bupcast(ed|ing)?\b/gi, to: (m, s) => `overcast${s ?? ''}` },
  { id: 'per-day', regex: /\((\d+)\/[Dd]ay\)/g, to: (_m, n) => `(${n}/[# kw:Recovery #])` },
  { id: 'bonus-action', regex: /\b[Bb]onus [Aa]ction\b/g, to: 'Minor Action' },
  { id: 'magic-action', regex: /(?:\*\*)?\b[Mm]agic\*{0,2} [Aa]ction\b/g, to: 'Major Action' },
  {
    id: 'saves',
    regex:
      /\b(makes|to make) (?:an? )?(?:\*\*)?DC ?(\d+) (?:\*\*)?(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)(?:\*\*)? ?(?:saving throw|save)(?:\*\*)?/gi,
    to: (_m, verb, dc, ability) =>
      `${verb.toLowerCase() === 'makes' ? 'saves' : 'to save'} ${ability} against DC ${dc}`,
  },
  { id: 'pb', regex: /\b[Pp]roficiency [Bb]onus\b/g, to: 'tier bonus' },
  { id: 'pb', regex: /\bPB\b/g, to: 'TB' },
  {
    id: 'repeat-save',
    regex:
      /\b(can|may) repeat the saving throw( at the (\*\*)?end of each of (its|their) turns?(\*\*)?)?, ending the effect(?: on (?:itself|themselves))? on a success/gi,
    to: (_m, modal, at, b1, poss, b2) =>
      `${modal} [# kw:resist #]${at ? ` at the ${b1 ?? ''}end of each of ${poss} turns${b2 ?? ''}` : ''}`,
  },
  {
    id: 'repeat-save',
    regex: /\brepeats? the save at the end of each of (its|their) turns\b/gi,
    to: (_m, poss) => `can [# kw:resist #] at the end of each of ${poss} turns`,
  },
];

/**
 * Substitution pass.
 *
 * @param {string} line - One line
 * @param {number} lineNo - Its number
 * @param {Change[]} changes - Collector
 * @param {Set<string>} enabled - Pass ids to run
 * @returns {string} Rewritten line
 */
function passSubstitutions(line, lineNo, changes, enabled) {
  let out = line;
  for (const sub of SUBSTITUTIONS) {
    if (!enabled.has(sub.id)) continue;
    out = out.replace(sub.regex, (...args) => {
      const whole = args[0];
      const after = typeof sub.to === 'function' ? sub.to(...args) : sub.to;
      changes.push({ line: lineNo, pass: sub.id, before: whole, after });
      return after;
    });
  }
  return out;
}

/**
 * Every pass id.
 */
export const PASS_IDS = [
  'attacks',
  'saves',
  ...new Set(SUBSTITUTIONS.map((s) => s.id)),
];

/**
 * Scrubs one file's text.
 *
 * @param {string} text - File contents
 * @param {Set<string>} [enabled] - Pass ids to run; all when omitted
 * @returns {{ text: string, changes: Change[], review: Review[] }} Result
 */
export function scrub(text, enabled = new Set(PASS_IDS)) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const changes = [];
  const review = [];
  let inFrontmatter = false;
  let inFence = false;

  const lines = text.split(/\r?\n/).map((line, index) => {
    const no = index + 1;
    if (index === 0 && line.trim() === '---') {
      inFrontmatter = true;
      return line;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false;
      return line;
    }
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence || /^\s*#{1,6}\s/.test(line)) return line;

    let out = line;
    if (enabled.has('attacks')) out = passAttacks(out, no, changes);
    if (enabled.has('saves')) out = passSaves(out, no, changes, review);
    out = passSubstitutions(out, no, changes, enabled);
    return out;
  });

  return { text: lines.join(eol), changes, review };
}

/**
 * Expands paths and globs into MDX files.
 *
 * @param {string[]} inputs - Paths, directories or globs
 * @returns {string[]} MDX file paths
 */
function resolveFiles(inputs) {
  const out = new Set();
  for (const input of inputs) {
    if (input.includes('*')) {
      globSync(input).forEach((f) => out.add(f));
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(input).isDirectory();
    } catch {
      continue;
    }
    if (isDir) globSync(join(input, '**', '*.mdx')).forEach((f) => out.add(f));
    else out.add(input);
  }
  return [...out].sort();
}

/**
 * Standalone entry point.
 */
function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const passArg = args.find((a) => a.startsWith('--pass='))?.slice(7);
  const enabled = new Set(passArg ? passArg.split(',') : PASS_IDS);
  const inputs = args.filter((a) => !a.startsWith('--'));
  if (inputs.length === 0) {
    console.error('usage: scrub-legacy-prose.mjs [--check] [--pass=a,b] <path|glob>...');
    process.exit(2);
  }

  const reviewDir = resolve('.ignore/legacy-expressions/review');
  let files = 0;
  let total = 0;
  let declined = 0;

  for (const file of resolveFiles(inputs)) {
    const before = readFileSync(file, 'utf8');
    const { text, changes, review } = scrub(before, enabled);
    if (changes.length === 0 && review.length === 0) continue;
    files += 1;
    total += changes.length;
    declined += review.length;
    console.log(
      `${String(changes.length).padStart(3)} changed ${String(review.length).padStart(2)} review  ${file}`,
    );
    if (check) {
      for (const c of changes) console.log(`      :${c.line} [${c.pass}]\n        - ${c.before}\n        + ${c.after}`);
      for (const r of review) {
        console.log(`      :${r.line} [${r.pass}] ? ${r.question}`);
        console.log(`        ${r.passage}`);
      }
    } else {
      writeFileSync(file, text);
      if (review.length) {
        mkdirSync(reviewDir, { recursive: true });
        const body = review
          .map((r) => `PASSAGE: ${r.passage}\nQUESTION: [${r.pass}] ${r.question}\n`)
          .join('\n');
        writeFileSync(join(reviewDir, basename(file).replace(/\.mdx$/, '.md')), body);
      }
    }
  }
  console.log(
    `\n${check ? 'would change' : 'changed'} ${total} in ${files} files; ${declined} sent to review${check ? '' : ` (${existsSync(reviewDir) ? reviewDir : 'none'})`}`,
  );
}

if (
  process.argv[1] &&
  basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))
) {
  main();
}
