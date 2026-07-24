#!/usr/bin/env node
// Audit .ignore/spellresult.md verdicts against the actual spell corpus.
//
// The ledger records a verdict per spell (KEEP / REFACTOR / RENAME / REMOVE / CONDENSE)
// plus the actionable change in its Notes. Renames and deletions were applied wholesale;
// the *mechanical reworks* were not (Ravenous Rosary kept its name change but never got
// the 3-bead spec). This finds the gap.
//
// Three checks, in descending order of certainty:
//   HARD    REMOVE/CONDENSE → the file must be gone; RENAME → new slug present, old gone.
//   VERBATIM A phrase the verdict quoted still appears word-for-word in the file. Verdicts
//            quote text they want *replaced*, so a surviving quote usually means untouched.
//            (Some verdicts quote text they want kept — hits need reading, not trusting.)
//   THIN    A REFACTOR whose Notes' distinctive terms are almost entirely absent from the
//            file — nothing in the prescription seems to have landed.
//
// Usage:
//   node scripts/migrations/audit-spellresult.mjs
//   node scripts/migrations/audit-spellresult.mjs --report .ignore/reports/spellresult-audit.md

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';

const argv = process.argv.slice(2);
const val = (f, d) => (argv.indexOf(f) >= 0 ? argv[argv.indexOf(f) + 1] : d);
const LEDGER = val('--ledger', '.ignore/spellresult.md');
const SPELL_DIR = val('--spells', 'src/content/en/spells');
const REPORT = val('--report', null);
// Optional: a list of spell paths the refactor actually touched, from
//   git diff --name-only HEAD -- en/spells   +   git status --porcelain (untracked)
// run inside the src/content submodule. A file absent from this list was never edited,
// which settles "did the rework land?" without any word-matching guesswork.
const TOUCHED_LIST = val('--touched', null);
const touched = TOUCHED_LIST && existsSync(TOUCHED_LIST)
  ? new Set(
      readFileSync(TOUCHED_LIST, 'utf8')
        .split('\n')
        .map((l) => basename(l.trim()).replace(/\.mdx?$/, ''))
        .filter(Boolean)
    )
  : null;

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

// Curly quotes, em dashes and collapsed whitespace all differ between ledger and content.
const flat = (s) =>
  s
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

// ---- index the corpus ----
const files = readdirSync(SPELL_DIR).filter((f) => /\.mdx?$/.test(f));
const bySlug = new Map();
const byH1 = new Map();
for (const f of files) {
  const slug = f.replace(/\.mdx?$/, '');
  const text = readFileSync(join(SPELL_DIR, f), 'utf8');
  bySlug.set(slug, { slug, text, file: join(SPELL_DIR, f) });
  const h1 = text.match(/^#\s+(.+)$/m);
  if (h1) byH1.set(slugify(h1[1]), slug);
}
const resolve = (name) => {
  const s = slugify(name);
  if (bySlug.has(s)) return bySlug.get(s);
  if (byH1.has(s)) return bySlug.get(byH1.get(s));
  return null;
};

// ---- parse the ledger ----
const raw = readFileSync(LEDGER, 'utf8').split('\n');
const VERDICT = /^\*\*\[?(.+?)\]?\s*[-–—]\s*(KEEP|REFACTOR|REMOVE|RENAME|CONDENSE|MERGE|SPLIT|CREATE)\*\*\s*$/;

const entries = [];
let cur = null;
for (let i = 0; i < raw.length; i++) {
  const m = raw[i].match(VERDICT);
  if (m) {
    cur = { name: m[1].trim(), verdict: m[2], line: i + 1, body: [] };
    entries.push(cur);
  } else if (cur && /^\s*$/.test(raw[i]) === false && !/^#/.test(raw[i])) {
    cur.body.push(raw[i]);
  } else if (/^#/.test(raw[i])) {
    cur = null;
  }
}

// Generic words that carry no evidence about whether a rework landed.
const STOP = new Set(
  `the a an and or but if then than that this these those with without within into onto from for
   to of on at by as is are was were be been being it its their they them you your our not no nor
   spell spells damage target targets creature creatures level levels slot slots cast casting caster
   turn turns action actions round rounds save saving throw feet foot range duration effect effects
   per each one two three all any more most less least higher lower same other another new old
   should would could can cant must may might will shall does do did done keep kept make makes made
   line lines file files delete deleted note notes flavor flavour text wording name named names
   damocles design review per csv already still only also just when what which who whose how why
   because since while after before during until unless about above below over under out off up down
   good bad better best worse fine clean real actual very much many few little big small`
    .split(/\s+/)
    .filter(Boolean)
);

// Ledger prose — words the verdicts use to *talk about* changes. They are rare in the
// spell corpus, so the df filter keeps them, but their absence proves nothing.
for (const w of `rework reworks spec specs accordingly quirk specify avoids conundrum theoretically
  cross-batch batch batches flagged keeper folds folded port ported garnish nit optional later
  directive directives ruling ruled verdict entry entries ledger corpus sidecar stub srd wotc dev
  author write written rewrite rewritten replace replaced replacing delete deleted remove removed
  rename renamed merge merged condense condensed restore rebuild rebuilt create created add added
  drop dropped swap swapped fixed reconcile coordinate defer deferred apply applied land landed
  needs need want wanted worth concept idea niche chassis register tone voice texture framing
  imagery wording phrasing sentence sentences paragraph typos fragments leftover verbatim generic
  bespoke blanket deliberate deliberately exactly likely probably genuinely otherwise acceptable
  satisfied contradicts contradiction defect defects duplicate redundant liability legal signature
  package pending upstream downstream elsewhere anywhere something anything nothing everything
  currently already still instead rather whether therefore however moreover additionally
  version versions variant variants suggested justification note noted mention mentions mentioned
  clean cleaner cleanest tighten tightened sharpen sharpened polish polished pass passes
  keep keeps keeping remains remain remaining survive survives survived surviving
  gone missing absent present presence existing exists exist
  design designs designed review reviewed reviews system systems house lists family families
  member members mechanic mechanics number numbers model models track tracks ladder pattern
  patterns tier tiers gated gating language languages cite citing term terms names named called
  fails failing test tests testing check checks checking verify verified confirm confirmed
  original originals actual actually essentially basically simply merely
  good better best fine solid strong weak poor bad worse worst
  entire entirely whole wholly partly partially mostly largely broadly
  reads read reading feel feels felt sounds sound looks look seems seem
  five four six seven eight nine ten
  damocles 5e dnd d20 osr ip srd-safe faerun faerunism faerunisms`
  .split(/\s+/)
  .filter(Boolean)) {
  STOP.add(w);
}

const terms = (s) =>
  [...new Set(flat(s).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/))].filter(
    (w) => w.length >= 4 && !STOP.has(w)
  );

// Document frequency across the corpus. A prescribed term that is rare corpus-wide
// ("bead", "plucked") is a real fingerprint of the rework; a common one ("upcast",
// "damage") proves nothing, which is how Ravenous Rosary passed a naive coverage check.
const df = new Map();
for (const { text } of bySlug.values()) {
  for (const w of new Set(flat(text).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/))) {
    df.set(w, (df.get(w) || 0) + 1);
  }
}
const RARE = 12; // present in ≤12 of 400 files, or absent entirely

const hard = [];
const untouched = [];
const condense = [];
const verbatim = [];
const thin = [];
const unresolved = [];

for (const e of entries) {
  const body = e.body.join('\n');
  const suggested = body.match(/\*\*Suggested Name:\*\*\s*\*\*(.+?)\*\*/);
  const notes = (body.match(/\*\*Notes:\*\*([\s\S]*)/) || [, ''])[1];

  const oldHit = resolve(e.name);
  const newHit = suggested ? resolve(suggested[1]) : null;

  // ---- HARD checks ----
  if (e.verdict === 'REMOVE') {
    if (oldHit) hard.push({ e, why: `REMOVE but \`${oldHit.slug}.mdx\` still exists` });
    continue;
  }
  // A CONDENSE family has a keeper that legitimately survives — only the folded-in
  // member should be gone, so this bucket is "verify which member won", not a defect.
  if (e.verdict === 'CONDENSE') {
    if (oldHit) condense.push({ e, slug: oldHit.slug });
    continue;
  }
  if (e.verdict === 'RENAME') {
    if (oldHit && slugify(e.name) === oldHit.slug)
      hard.push({ e, why: `RENAME but old slug \`${oldHit.slug}.mdx\` still exists` });
    if (suggested && !newHit)
      hard.push({ e, why: `RENAME target **${suggested[1]}** does not exist` });
  }

  const target = newHit || oldHit;
  if (!target) {
    unresolved.push({ e, suggested: suggested ? suggested[1] : null });
    continue;
  }
  const fileFlat = flat(target.text);

  // ---- UNTOUCHED: the verdict demanded work and the file was never edited ----
  if (touched && (e.verdict === 'REFACTOR' || e.verdict === 'RENAME') && !touched.has(target.slug)) {
    untouched.push({ e, slug: target.slug, notes: notes.replace(/\s+/g, ' ').trim() });
    continue;
  }

  // ---- VERBATIM check: phrases the verdict quoted that survive in the file ----
  const quotes = [...notes.matchAll(/["“]([^"“”]{12,120})["”]/g)].map((m) => m[1]);
  for (const q of quotes) {
    if (fileFlat.includes(flat(q))) verbatim.push({ e, slug: target.slug, quote: q });
  }

  // ---- THIN check: are the *distinctive* prescribed terms absent? ----
  if (e.verdict === 'REFACTOR' || e.verdict === 'RENAME' || e.verdict === 'KEEP') {
    const rare = terms(notes).filter((w) => (df.get(w) || 0) <= RARE);
    const missing = rare.filter((w) => !fileFlat.includes(w));
    if (missing.length >= 3)
      thin.push({ e, slug: target.slug, missing, rare: rare.length });
  }
}

thin.sort((a, b) => b.missing.length - a.missing.length);

const out = [];
const P = (s) => out.push(s);
P(`# spellresult.md audit`);
P(``);
P(`Ledger entries parsed: **${entries.length}**   spell files: **${files.length}**`);
P(``);
P(`## 1. HARD — mechanically wrong (${hard.length})`);
P(``);
for (const h of hard) P(`- **${h.e.name}** (ledger:${h.e.line}) — ${h.why}`);
P(``);
P(`## 1b. UNTOUCHED — verdict demanded a change, file never edited (${untouched.length})`);
P(``);
P(touched ? `Decisive: these slugs appear in no working-tree diff and no untracked set.` : `(no --touched list supplied)`);
P(``);
for (const u of untouched) P(`- **${u.e.name}** [${u.e.verdict}] → \`${u.slug}.mdx\` (ledger:${u.e.line})\n  - asked: ${u.notes.slice(0, 320)}`);
P(``);
P(`## 2. VERBATIM — text the verdict quoted still present (${verbatim.length})`);
P(``);
P(`Verdicts usually quote the text they want *gone*. Each hit is a candidate, not a proof.`);
P(``);
for (const v of verbatim) P(`- **${v.e.name}** → \`${v.slug}.mdx\` (ledger:${v.e.line})\n  - still contains: "${v.quote}"`);
P(``);
P(`## 3. THIN — distinctive prescribed terms absent from the file (${thin.length})`);
P(``);
P(`Terms rare corpus-wide (≤${RARE}/${files.length} files) that the verdict asked for and the file does not contain.`);
P(``);
for (const t of thin)
  P(
    `- **${t.e.name}** → \`${t.slug}.mdx\` (ledger:${t.e.line}) — ${t.missing.length}/${t.rare} distinctive terms absent\n  - absent: ${t.missing.slice(0, 16).join(', ')}`
  );
P(``);
P(`## 3b. CONDENSE families — confirm the right member survived (${condense.length})`);
P(``);
for (const c of condense) P(`- **${c.e.name}** → \`${c.slug}.mdx\` still present (ledger:${c.e.line})`);
P(``);
P(`## 4. UNRESOLVED — no file matched (${unresolved.length})`);
P(``);
for (const u of unresolved)
  P(`- **${u.e.name}** [${u.e.verdict}]${u.suggested ? ` → suggested **${u.suggested}**` : ''} (ledger:${u.e.line})`);

const text = out.join('\n');
if (REPORT) {
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, text, 'utf8');
}
console.log(
  `entries: ${entries.length}   HARD: ${hard.length}   UNTOUCHED: ${untouched.length}   VERBATIM: ${verbatim.length}   THIN: ${thin.length}   CONDENSE: ${condense.length}   UNRESOLVED: ${unresolved.length}`
);
if (REPORT) console.log(`report -> ${REPORT}`);
else console.log('\n' + text);
