/**
 * Phase A + B regex rules for Damocles action system migration.
 * Phase A: bare mechanical "action" → "Major Action"
 * Phase B: "bonus action" → "Minor Action"
 * @module scripts/wip/rename-action-rules
 */

/** @type {Array<{ re: RegExp, to: string, desc: string }>} */
export const RULES_A = [
  // ── Exact line-level ──
  {
    re: /^## Actions$/,
    to: '## Major Actions',
    desc: '## Actions → ## Major Actions',
  },
  {
    re: /^(\*\*Casting Time\*\*: 1) Action$/,
    to: '$1 Major Action',
    desc: 'Casting: 1 Action → 1 Major Action',
  },
  {
    re: /^(\*\*Casting Time\*\*: 1) action$/,
    to: '$1 Major Action',
    desc: 'Casting: 1 action → 1 Major Action',
  },

  // ── "as an action" — preserves case via [Aa] capture ──
  {
    re: /\b([Aa])s an action\b/g,
    to: '$1s a Major Action',
    desc: 'as an action → as a Major Action',
  },

  // ── "without using an action" — pool economy, not type ──
  { re: /\bwithout using an action\b/gi, to: 'without spending an Action', desc: 'without using an action' },

  // ── Verb + determiner + "action" (grammar: "an"→"a" where needed) ──
  {
    re: /\b(us(?:e|es|ing)\s+)your\s+action\b/gi,
    to: '$1your Major Action',
    desc: 'use(s)/using your action',
  },
  {
    re: /\b(us(?:e|es|ing)\s+)an\s+action\b/gi,
    to: '$1a Major Action',
    desc: 'use(s)/using an action',
  },
  {
    re: /\b(us(?:e|es|ing)\s+)its\s+action\b/gi,
    to: '$1a Major Action',
    desc: 'use(s)/using its action',
  },
  {
    re: /\b(spend(?:s?|ing)\s+)an\s+action\b/gi,
    to: '$1a Major Action',
    desc: 'spend(s)/spending an action',
  },
  {
    re: /\b(costs?\s+1)\s+action\b/gi,
    to: '$1 Major Action',
    desc: 'cost(s) 1 action',
  },
  {
    re: /\b(requir(?:es?|ing)\s+)an\s+action\b/gi,
    to: '$1a Major Action',
    desc: 'require(s)/requiring an action',
  },
  {
    re: /\b(tak(?:es?|ing)\s+)an\s+action\b/gi,
    to: '$1a Major Action',
    desc: 'take(s)/taking an action',
  },
  {
    re: /\b(tak(?:es?|ing)\s+one)\s+action\b/gi,
    to: '$1 Major Action',
    desc: 'take(s)/taking one action',
  },
  {
    re: /\b(los(?:es?|ing)\s+)its\s+action\b/gi,
    to: '$1a Major Action',
    desc: 'lose(s)/losing its action',
  },

  // Catch-all: any remaining "its action" (old slot language) → "a Major Action"
  { re: /\bits action\b/gi, to: 'a Major Action', desc: 'its action (catch-all)' },

  // ── Prose references ──
  { re: /\b(of 1) action\b/gi, to: '$1 Major Action', desc: 'of 1 action' },
  {
    re: /(?<!\bno )\b(one) action\b/gi,
    to: '$1 Major Action',
    desc: 'one action (not "no one")',
  },

  // ── Catch-all: "an action" at clause boundary; negative lookbehind prevents double-match ──
  {
    re: /(?<!Major )(?<!major )\ban action([.,;:!?\n)])/gi,
    to: 'a Major Action$1',
    desc: 'an action. (catch-all)',
  },
];

/**
 * Phase B rules: "bonus action" → "Minor Action"
 * "Bonus" only matches when adjacent to "action" — safe from tier bonus, etc.
 * @type {Array<{ re: RegExp, to: string, desc: string }>}
 */
export const RULES_B = [
  // Exact line-level
  {
    re: /^## Bonus Actions$/,
    to: '## Minor Actions',
    desc: '## Bonus Actions → ## Minor Actions',
  },
  {
    re: /^(\*\*Casting Time\*\*: 1) Bonus Action$/,
    to: '$1 Minor Action',
    desc: 'Casting: 1 Bonus Action → 1 Minor Action',
  },

  // Prose (case-insensitive)
  {
    re: /\bbonus action\b/gi,
    to: 'Minor Action',
    desc: 'bonus action → Minor Action',
  },
  {
    re: /\bbonus actions\b/gi,
    to: 'Minor Actions',
    desc: 'bonus actions → Minor Actions',
  },

  // Code identifiers
  {
    re: /\bbonus_action\b/g,
    to: 'minor_action',
    desc: 'bonus_action → minor_action',
  },
  {
    re: /\bbonus_actions\b/g,
    to: 'minor_actions',
    desc: 'bonus_actions → minor_actions',
  },
  {
    re: /\bbonusAction\b/g,
    to: 'minorAction',
    desc: 'bonusAction → minorAction',
  },
  {
    re: /\bbonusActions\b/g,
    to: 'minorActions',
    desc: 'bonusActions → minorActions',
  },
];
