/**
 * @fileoverview Rider migration — a save with one consequence stays in prose,
 * and only a rider that is a choice, does several things, or runs long earns a
 * name. Missing DCs get stated, and slots that repeat another slot are dropped.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const SHEETS = 'src/content/en/monsters';
const QUESTIONS = '.ignore/reports/monster-riders/questions';

/**
 * The canon every member reads, in the same order, so the shared prefix is one
 * cache entry rather than a dozen.
 */
const CANON = [
  'src/content/en/monsters/abandoned-old-war-machine.sheet.mdx',
  'src/content/en/rules/steel-and-strife/turns-and-initiative.rule.mdx',
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

const SAVE =
  /\bsaves?\s+(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma|Concentration)\b/i;
const FIXED_DC = /against\s+\*{0,2}DC\s*\d+/i;
const DERIVED_DC = /DC\s+(?:equal|result)|with a DC|escape DC/i;
const DAMAGE_SHAPE = /\bhalving\b|\bhalf\b/i;
const BLOCK = /<(Attack|Feature|Action|Trait)\b([^>]*?)>([\s\S]*?)<\/\1>/g;

/**
 * A sheet's slug, which is also the name of its questions file.
 *
 * @param {string} name - The sheet's filename.
 * @returns {string} The slug.
 */
const slugOf = (name) => name.replace(/\.sheet\.mdx$/, '');

/**
 * Every save sentence a sheet's blocks state in their own prose.
 *
 * @description Nested blocks are stripped before a block is read, so a rider
 * already lifted into its own block is counted once, against itself.
 *
 * @param {string} text - The sheet.
 * @returns {string[]} The sentences.
 */
const saveSentences = (text) => {
  const found = [];
  for (const block of text.matchAll(BLOCK)) {
    const own = block[3].replace(BLOCK, '');
    for (const sentence of own.split(/(?<=[.!])\s+/)) {
      if (SAVE.test(sentence)) found.push(sentence);
    }
  }
  return found;
};

/**
 * Whether a save sentence carries more than one save with one consequence.
 *
 * @description Two conditions, or a choice, or a damage line and a save in the
 * same breath. These are the only riders that earn a name.
 *
 * @param {string} sentence - The sentence.
 * @returns {boolean} True when it is substantial.
 */
const isSubstantial = (sentence) =>
  !DAMAGE_SHAPE.test(sentence) &&
  ((sentence.match(/kw:condition:/g) ?? []).length >= 2 ||
    /\band\b.*\bor\b|\bchoose|\beither\b/i.test(sentence));

/**
 * Whether a save sentence never says what its DC is.
 *
 * @description A DC derived from something else — an escape DC, a DC equal to
 * the damage taken — already says it, and is left alone.
 *
 * @param {string} sentence - The sentence.
 * @returns {boolean} True when the DC is missing.
 */
const lacksDc = (sentence) =>
  !FIXED_DC.test(sentence) && !DERIVED_DC.test(sentence);

/**
 * Whether a sheet declares a target set a range already implies.
 *
 * @param {string} text - The sheet.
 * @returns {boolean} True when a block says the same thing twice.
 */
const holdsRepeated = (text) =>
  (text.match(/<[A-Z][A-Za-z]*\b[^>]*?>/gs) ?? []).some(
    (tag) =>
      !tag.startsWith('<Monster') &&
      /\b(?:range|reach)=/.test(tag) &&
      /\btargets=/.test(tag),
  );

/* A file holding more than one creature is left alone: its divisions cross
   `<Monster>` boundaries, and moving anything across one has broken these
   sheets before. They wait for the swapper. Most of the corpus already writes
   its riders the way the ruling wants — a save, a DC, one consequence, in the
   parent's prose — and reading one of those to conclude there is nothing to do
   costs the same as reading one that needs work, so the work is looked for
   here rather than paid for sixty times over. */
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
    const only = process.env.PAW_MONSTER_RIDERS_ONLY;
    if (only) return only.split(',').includes(entry.slug);
    const text = readFileSync(entry.file, 'utf8');
    if ((text.match(/^<Monster/gm) ?? []).length !== 1) return false;
    if (process.env.PAW_MONSTER_RIDERS_ALL) return true;
    const sentences = saveSentences(text);
    return (
      sentences.some(isSubstantial) ||
      sentences.some(lacksDc) ||
      holdsRepeated(text)
    );
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
  'You are editing one monster sheet in place with your tools.',
  '',
  'Your context holds the golden sheet — the Abandoned Old War Machine — which',
  'is already correct in every respect below. Read it before you write',
  'anything. It also holds the rule that governs what a reflex is, and the slot',
  'schema, which is the authority on what slots exist.',
  '',
  'Most of this corpus is already right. Expect to change little, and expect',
  'some sheets to need nothing at all.',
  '',
  '# A rider is prose by default',
  '',
  'A rider is an effect an attack imposes past its damage. A rider that is one',
  'save with one consequence stays a sentence in the attack that applies it. It',
  'gets no heading, no block, and no name. This is the normal case and it is',
  'already how nearly every sheet writes it:',
  '',
  '   Targets save Strength against DC 20 or are knocked [# kw:condition:prone #].',
  '',
  'A narrowing goes in the subject of that same sentence, not into a slot:',
  '',
  '   Targets that are Large or smaller save Strength against DC 20 or are ...',
  '',
  '# What earns a name',
  '',
  'A rider becomes its own named block only when one of these is true:',
  '',
  '* It offers the reader a choice between effects.',
  '* It does several distinct things, not one consequence.',
  '* It runs long or strange enough that prose would bury it.',
  '',
  'On the golden sheet, The Toll and The Cave earn names because they are',
  'choices that each do more than one thing, and Nulling earns one because it',
  'is long and unusual. Crushing Weight and Driven Down do NOT: each is a save',
  'and one consequence, so each lives in its parent’s prose.',
  '',
  '# Naming one',
  '',
  'If the sheet already calls the rider something, use that name exactly.',
  '',
  'Otherwise name it yourself, from what is in front of you. A rider’s name is',
  'tactile and belongs to its own sheet: it takes the flavour of the attack it',
  'rides on and the creature it comes from, and it says what the rider does.',
  '',
  '* An attack called "Hell Blast" whose rider saves Charisma or banishes:',
  '  **Infernal Banishing**.',
  '* The same rider on a "Void Barrage", from a creature of the Null type:',
  '  **Voided Banishment**.',
  '',
  'Two words is the usual shape: something of the source, something of the',
  'effect. Never a generic label — "Secondary Effect", "Rider", "Save Effect",',
  '"Knockdown" — and never a name borrowed from another sheet. If the attack',
  'and the creature give you nothing to build from, leave the rider in prose',
  'and raise it in your questions.',
  '',
  '# What is never a rider',
  '',
  '* A reflex: a response asked of THIS creature, which it makes and may',
  '  decline. Backfire on the golden sheet is one — the War Machine saves.',
  '  Leave reflexes alone.',
  '* An alteration: another way to attack. Acid Shotgun and Thruster Axe-Kick',
  '  are alterations. Leave them alone.',
  '* A save that only halves damage. That is the shape of the damage, not',
  '  something riding on it. Leave it alone.',
  '',
  '# Lifting one out, when it has earned it',
  '',
  '1. The parent names it, in the parent’s own prose, on whatever gates it.',
  '   A hit: "Targets suffer **Its Name**." A save: "It saves against',
  '   **Backfire**, or it cannot use **The Toll** or **The Cave** for this',
  '   attack."',
  '2. The rider becomes a block inside its parent, carrying the sentence you',
  '   lifted, verbatim:',
  '',
  '   <Feature mark="other" accuracy="+N">',
  '',
  '   ###### Its Name',
  '',
  '   The sentence, exactly as the sheet wrote it.',
  '',
  '   </Feature>',
  '',
  'Say **or** where the reader chooses and **and** where they do not. A rider',
  'gated on a choice that reads "and" states a rule the sheet does not have.',
  '',
  'A condition in the prose you lift must survive — a gate ("if it passed its',
  'Backfire"), a narrowing ("targets that are Large or smaller"). Losing one is',
  'losing a rule.',
  '',
  '# Stating a missing DC',
  '',
  'A save written with no DC at all — "saves Strength or is knocked prone" —',
  'is incomplete. Give it the DC its parent block implies: ten plus the',
  'parent’s accuracy, so `accuracy="+10"` is DC 20. Write it into the sentence',
  'as `against DC 20`, with no comma before `or`.',
  '',
  'A DC the prose derives from something else — an escape DC, a DC equal to the',
  'damage taken, a DC named elsewhere — is already stated. Leave it exactly as',
  'it is. If you cannot tell which accuracy a save belongs to, raise it.',
  '',
  '# The accuracy a named rider carries',
  '',
  'A named rider that imposes a save needs an `accuracy`, because its DC is',
  'printed from it. If its prose states a DC, work back: accuracy is DC minus',
  'ten, so DC 23 is `accuracy="+13"`, and drop the written DC from the prose,',
  'since the block now prints it. Otherwise use the parent’s accuracy. A named',
  'rider that imposes no save needs no accuracy.',
  '',
  '# Which other fields a named rider keeps',
  '',
  'A rider declares a field only where it genuinely DIFFERS from its parent.',
  'Same targets as the parent: say nothing. No `cost`, and no `trigger` that',
  'only repeats when the parent already happens.',
  '',
  '# Slots that repeat another slot',
  '',
  'A slot another slot already implies is redundant, and comes out. A',
  'single-target attack that declares `range` or `reach` has already said who',
  'it can hit; a `targets` slot after that says it twice. This applies to any',
  'block.',
  '',
  'Only delete where the meaning is genuinely already carried. A `targets` that',
  'names an area, a shape, a count, or a subset is doing work — keep it.',
  '',
  '# Never',
  '',
  '* Never invent a mechanic, a number, or a rider. A name you may coin, by',
  '  the rule above, and nothing else.',
  '* Never retune a number. Damage, DCs, ranges, durations and charges keep',
  '  their values exactly.',
  '* Never split a working prose rider into a block. Prose is the default.',
  '* Never write a curly quote in a JSX attribute. It is a compile error.',
  '* Never touch the frontmatter, the H1, the art components, or the',
  '  `<Monster>` header attributes.',
  '* Never rewrite prose that is already correct, including its typos.',
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
  'outcome than one you migrated on a hunch. A sheet that already writes its',
  'riders correctly needs no edits at all, and that is a complete result.',
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
  name: 'monster-riders',
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
