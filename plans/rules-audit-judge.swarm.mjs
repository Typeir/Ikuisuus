/**
 * @fileoverview DeepSeek judgement pass over the Haiku rules audit.
 *
 * One member per rules file that Haiku reported findings on. Each member reads
 * the source file and Haiku's findings, then writes a verdict file keeping only
 * the findings it can confirm against the text.
 */

import { readdirSync, readFileSync } from 'node:fs';

const FINDINGS = '.ignore/swarms/rules-audit/findings';
const VERDICTS = '.ignore/swarms/rules-audit/verdicts';

/** Findings files that carry at least one finding. */
const targets = readdirSync(FINDINGS)
  .filter((name) => name.endsWith('.json'))
  .map((name) => {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(`${FINDINGS}/${name}`, 'utf8'));
    } catch {
      return null;
    }
    const findings = Array.isArray(parsed?.findings) ? parsed.findings : [];
    if (findings.length === 0) return null;
    return { slug: name.replace(/\.json$/, ''), file: parsed.file, findings };
  })
  .filter(Boolean)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export default {
  name: 'rules-audit-judge',
  /*
   * review.graze, not review.judge: DeepSeek now serves every model as
   * deepseek-chat, and review.judge requires 16384 max output tokens that no
   * live model declares. Verdict files are a couple of KB, so the judge's
   * output ceiling was never the binding constraint.
   */
  role: 'review.graze',
  args: { targets },
  members: (a) => a.targets.length,
  availableTools: ['read', 'edit'],
  brief: (a, m) => {
    const t = a.targets[m];
    return [
      'You are judging another model’s audit findings for one rules file.',
      'You are the adversary. Your job is to DISPROVE each finding, not to agree with it.',
      '',
      `Source file: src/content/en/rules/${t.file}`,
      `Brief the auditor worked from: .ignore/swarms/rules-audit/brief.md`,
      '',
      'Read the brief first, then read the source file in full.',
      '',
      '# The findings to judge',
      '',
      JSON.stringify(t.findings, null, 2),
      '',
      '# How to judge',
      '',
      'For each finding, check all of these. Any failure REJECTS it.',
      '* The quoted text appears at the stated line, verbatim.',
      '* The quote is real prose from the file, not invented or paraphrased.',
      '* The issue is a defect under the brief, not correct text.',
      '* The term is not on the brief’s do-NOT-flag list (Uncanny Dodge,',
      '  Sneak Attack, Multiattack, Lightning Bolt, Twilight Bolt, bolt as',
      '  ammunition, Hide as animal skin, brace as ordinary English, and the',
      '  rest of that list).',
      '* `hit points` is NOT renamed yet and is never a defect.',
      '* `Major Action`, `Minor Action`, `Reaction` are resource names and are',
      '  never the "X action" defect.',
      '',
      'Default to REJECT when you are unsure. A rejected finding costs nothing;',
      'a confirmed false finding sends a human to fix text that is already right.',
      '',
      '# Also report what the auditor missed',
      '',
      'While you have the file open, note any defect under the brief that the',
      'auditor did not report. Put those in `missed`. Hold them to the same',
      'standard: verbatim quote, real line number.',
      '',
      '# Output',
      '',
      `Write your verdict to ${VERDICTS}/${t.slug}.json with your edit tool.`,
      'Exactly this shape, valid JSON, nothing else in the file:',
      '{',
      `  "file": ${JSON.stringify(t.file)},`,
      '  "confirmed": [ { "category": "", "line": 0, "quote": "", "issue": "", "confidence": "high|review" } ],',
      '  "rejected":  [ { "line": 0, "quote": "", "why": "" } ],',
      '  "missed":    [ { "category": "", "line": 0, "quote": "", "issue": "" } ]',
      '}',
      '',
      'Do not edit the rules file. Write only your verdict file.',
      'Reply with one short line: how many you confirmed, rejected and missed.',
    ].join('\n');
  },
  expectFiles: (a, m) => `${VERDICTS}/${a.targets[m].slug}.json`,
  key: (a, m) => a.targets[m].slug,
};
