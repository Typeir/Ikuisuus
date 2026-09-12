/**
 * @fileoverview Finishing pass over the rules audit.
 *
 * Two member kinds. A verdict still holding the placeholder gets judged from
 * scratch. A verdict carrying `missed` entries gets those entries vetted
 * against the same brief the confirmations were held to.
 */

import { readdirSync, readFileSync } from 'node:fs';

const FINDINGS = '.ignore/swarms/rules-audit/findings';
const VERDICTS = '.ignore/swarms/rules-audit/verdicts';

const targets = readdirSync(VERDICTS)
  .filter((n) => n.endsWith('.json'))
  .map((n) => {
    const slug = n.replace(/\.json$/, '');
    const raw = readFileSync(`${VERDICTS}/${n}`, 'utf8');
    if (raw.includes('PLACEHOLDER')) {
      let findings = [];
      try {
        findings = JSON.parse(readFileSync(`${FINDINGS}/${n}`, 'utf8')).findings ?? [];
      } catch {
        return null;
      }
      const file = JSON.parse(raw).file;
      return { kind: 'judge', slug, file, findings };
    }
    let v;
    try {
      v = JSON.parse(raw);
    } catch {
      return null;
    }
    const missed = Array.isArray(v.missed) ? v.missed : [];
    if (missed.length === 0) return null;
    return { kind: 'vet', slug, file: v.file, missed };
  })
  .filter(Boolean)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export default {
  name: 'rules-audit-vet',
  role: 'review.graze',
  args: { targets },
  members: (a) => a.targets.length,
  availableTools: ['read', 'edit'],
  brief: (a, m) => {
    const t = a.targets[m];
    const head = [
      'Read .ignore/swarms/rules-audit/brief.md IN FULL first. It is binding.',
      'It lists what counts as a defect AND what must never be flagged.',
      '',
      `Source file: src/content/en/rules/${t.file}`,
      `Your output file: ${VERDICTS}/${t.slug}.json — edit it in place.`,
      '',
      'Hard exclusions, repeated because they are the common failures:',
      '* `hit points` / `HP` is NOT renamed. Never a defect.',
      '* `attack rolls`, `attack roll` are live canonical terms. Only the',
      '  Attack ACTION became Assault. Never flag `attack rolls`.',
      '* `Major Action`, `Minor Action`, `Reaction` are resource names.',
      '* Uncanny Dodge, Sneak Attack, Multiattack, Lightning Bolt, Twilight',
      '  Bolt, bolt as ammunition, Hide as animal skin, brace/dash/dodge as',
      '  ordinary English — all correct as written.',
      '* `category` must be exactly one of: stale-term, x-action, restatement,',
      '  legacy-prose, contradiction. No other value is valid.',
      '',
    ];

    if (t.kind === 'judge') {
      return head
        .concat([
          '# Job: judge these findings',
          '',
          'Another model reported them. DISPROVE each. Reject when the quote is',
          'not verbatim at that line, when the line is wrong, when the term is',
          'excluded above, or when the text is correct. Default to reject.',
          '',
          JSON.stringify(t.findings, null, 2),
          '',
          'Then, separately, note real defects it missed — held to every rule above.',
          '',
          'Replace your output file with exactly:',
          '{',
          `  "file": ${JSON.stringify(t.file)},`,
          '  "confirmed": [ { "category": "", "line": 0, "quote": "", "issue": "", "confidence": "high|review" } ],',
          '  "rejected":  [ { "line": 0, "quote": "", "why": "" } ],',
          '  "missed":    [ { "category": "", "line": 0, "quote": "", "issue": "" } ]',
          '}',
        ])
        .join('\n');
    }

    return head
      .concat([
        '# Job: vet your own missed list',
        '',
        'These were reported as defects the first auditor missed. They were NOT',
        'checked against the brief. Many are wrong. Vet each one now.',
        '',
        JSON.stringify(t.missed, null, 2),
        '',
        'For each: open the file, confirm the quote is verbatim at that line,',
        'and confirm it is a defect under the brief and not on the exclusion',
        'list above. Drop every one that fails. Default to dropping.',
        '',
        'Keep `file`, `confirmed` and `rejected` exactly as they are. Replace',
        'only the `missed` array with the survivors, each using a valid category.',
        'Add a "missedDropped" number saying how many you removed.',
      ])
      .join('\n');
  },
  expectFiles: (a, m) => `${VERDICTS}/${a.targets[m].slug}.json`,
  key: (a, m) => `${a.targets[m].kind}:${a.targets[m].slug}`,
};
