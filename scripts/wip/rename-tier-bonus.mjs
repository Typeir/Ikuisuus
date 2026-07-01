#!/usr/bin/env node

/**
 * @fileoverview Tier Bonus Rename Script — Core Module
 * @description Automated regex-based migration: renames "tier bonus" → "tier bonus"
 * across all file types in the repo. Applies ordered replacement rules to avoid
 * double-matching and false positives.
 *
 * ## What gets renamed
 * - "tier bonus" → "tier bonus" (prose in MDX, comments, labels)
 * - tierBonus → tierBonus (camelCase identifiers)
 * - TierLevel → TierLevel (PascalCase type)
 * - TIER_CYCLE → TIER_CYCLE (CONSTANT_CASE)
 * - tier_bonus → tier_bonus (snake_case DB columns)
 * - "Tier Bonus" → "Tier Bonus" (short form)
 * - "Tier" → "Tier" (UI label)
 * - i18n keys: tierShort, ariaTierTrack, tierBonus
 *
 * ## What does NOT change
 * - The word "proficient" (English adjective meaning "trained in")
 * - The string value 'proficient' (a TierLevel/TierLevel value)
 * - Standalone "proficiency" in prose (e.g., "Proficiency with smithing tools")
 *
 * @module scripts/wip/rename-tier-bonus
 * @version 1.0.0
 */

/**
 * @typedef {Object} Replacement
 * @property {RegExp} pattern - Regex pattern with flags
 * @property {string} replacement - Replacement string
 * @property {string} label - Human-readable label for the change log
 */

/**
 * @typedef {Object} ChangeEntry
 * @property {string} file - File path
 * @property {number} line - Line number (1-indexed)
 * @property {string} old - Original text
 * @property {string} new - Replacement text
 * @property {string} rule - Rule label
 */

/**
 * @typedef {Object} RenameResult
 * @property {boolean} changed - Whether any changes were made
 * @property {string} content - Modified file content
 * @property {ChangeEntry[]} changes - List of changes made
 */

// ─── Replacement Rules (ORDERED — longest/most specific first) ─────────────

/**
 * Ordered replacement rules.
 * @type {Replacement[]}
 */
export const RULES = [
  // ── CONSTANT_CASE (longest first) ──
  {
    pattern: /\bPROFICIENCY_LABELS\b/g,
    replacement: 'TIER_LABELS',
    label: 'CONST: TIER_LABELS → TIER_LABELS',
  },
  {
    pattern: /\bPROFICIENCY_LEVELS\b/g,
    replacement: 'TIER_LEVELS',
    label: 'CONST: TIER_LEVELS → TIER_LEVELS',
  },
  {
    pattern: /\bPROFICIENCY_CYCLE\b/g,
    replacement: 'TIER_CYCLE',
    label: 'CONST: TIER_CYCLE → TIER_CYCLE',
  },

  // ── camelCase identifiers (longest first) ──
  {
    pattern: /\bresolveDisplayProficiencyBonus\b/g,
    replacement: 'resolveDisplayTierBonus',
    label: 'camel: resolveDisplayTierBonus',
  },
  {
    pattern: /\bproficiencyBonusOverride\b/g,
    replacement: 'tierBonusOverride',
    label: 'camel: tierBonusOverride',
  },
  {
    pattern: /\bcomputeProficiencyBonus\b/g,
    replacement: 'computeTierBonus',
    label: 'camel: computeTierBonus',
  },
  {
    pattern: /\bupdateItemProficiency\b/g,
    replacement: 'updateItemTier',
    label: 'camel: updateItemTier',
  },
  {
    pattern: /\bproficiencyBonus\b/g,
    replacement: 'tierBonus',
    label: 'camel: tierBonus → tierBonus',
  },

  // ── PascalCase identifiers ──
  {
    pattern: /\bProficiencyLevel\b/g,
    replacement: 'TierLevel',
    label: 'Pascal: TierLevel → TierLevel',
  },

  // ── Mixed-case identifiers ──
  {
    pattern: /\bnewProficiency\b/g,
    replacement: 'newTier',
    label: 'camel: newTier → newTier',
  },
  {
    pattern: /\bproficiencyShort\b/g,
    replacement: 'tierShort',
    label: 'camel: tierShort → tierShort',
  },
  {
    pattern: /\bariaProfTrack\b/g,
    replacement: 'ariaTierTrack',
    label: 'camel: ariaTierTrack → ariaTierTrack',
  },

  // ── snake_case ──
  {
    pattern: /\bproficiency_bonus\b/g,
    replacement: 'tier_bonus',
    label: 'snake: tier_bonus → tier_bonus',
  },

  // ── Field access: .tier → .tier ──
  {
    pattern: /\.tier\b/g,
    replacement: '.tier',
    label: 'field: .tier → .tier',
  },

  // ── Bare "proficiency" identifier in code ──
  {
    pattern: /\bproficiency:/g,
    replacement: 'tier:',
    label: 'code: tier: → tier:',
  },
  {
    pattern: /([,{])\s*proficiency\s*([,})])/g,
    replacement: '$1tier$2',
    label: 'code: , proficiency → , tier',
  },
  {
    pattern: /\(tier,/g,
    replacement: '(tier,',
    label: 'code: (tier, → (tier,',
  },
  // Variable references in function bodies (only safe in code, not prose)
  {
    pattern: /\bproficiency ===/g,
    replacement: 'tier ===',
    label: 'code: tier === → tier ===',
  },
  {
    pattern: /\bproficiency \*/g,
    replacement: 'tier *',
    label: 'code: tier * → tier *',
  },
  {
    pattern: /\(proficiency \//g,
    replacement: '(tier /',
    label: 'code: (tier / → (tier /',
  },
  {
    pattern: /return tier\b/g,
    replacement: 'return tier',
    label: 'code: return tier → return tier',
  },
  {
    pattern: /Math\.floor\(tier /g,
    replacement: 'Math.floor(tier ',
    label: 'code: Math.floor(proficiency',
  },

  // ── Prose: MDX bold heading ──
  {
    pattern: /\*\*Tier Bonus\*\*/g,
    replacement: '**Tier Bonus**',
    label: 'prose: **Tier Bonus**',
  },

  // ── Prose: title case ──
  {
    pattern: /\bProficiency Bonus\b/g,
    replacement: 'Tier Bonus',
    label: 'prose: Tier Bonus',
  },

  // ── Prose: short form ──
  {
    pattern: /\bProf Bonus\b/g,
    replacement: 'Tier Bonus',
    label: 'prose: Tier Bonus',
  },

  // ── String literals: 'Tier' → 'Tier' ──
  {
    pattern: /'Prof\.'/g,
    replacement: "'Tier'",
    label: "string: 'Tier' → 'Tier'",
  },

  // ── JSON strings: "Tier" → "Tier" ──
  {
    pattern: /"Prof\."/g,
    replacement: '"Tier"',
    label: 'JSON: "Tier" → "Tier"',
  },

  // ── Prose: case-insensitive "tier bonus" (catches remainder) ──
  {
    pattern: /\bproficiency bonus\b/gi,
    replacement: 'tier bonus',
    label: 'prose (ci): tier bonus',
  },
];

// ─── Core Logic ──────────────────────────────────────────────────────────────

/**
 * Apply all replacement rules to a single line.
 * @param {string} line
 * @param {number} lineIndex - 0-indexed
 * @param {string} filePath
 * @returns {{ line: string, changes: ChangeEntry[] }}
 */
export function applyRulesToLine(line, lineIndex, filePath) {
  /** @type {ChangeEntry[]} */
  const changes = [];
  let result = line;

  for (const rule of RULES) {
    result = result.replace(rule.pattern, (match) => {
      const actual = match.replace(
        new RegExp(rule.pattern.source, rule.pattern.flags),
        rule.replacement,
      );
      changes.push({
        file: filePath,
        line: lineIndex + 1,
        old: match,
        new: actual,
        rule: rule.label,
      });
      return actual;
    });
    rule.pattern.lastIndex = 0;
  }

  return { line: result, changes };
}

/**
 * Apply all replacement rules to full file content.
 * @param {string} content
 * @param {string} filePath
 * @returns {RenameResult}
 */
export function applyRules(content, filePath) {
  const lines = content.split('\n');
  /** @type {ChangeEntry[]} */
  const allChanges = [];
  const resultLines = [];

  for (let i = 0; i < lines.length; i++) {
    const { line, changes } = applyRulesToLine(lines[i], i, filePath);
    resultLines.push(line);
    allChanges.push(...changes);
  }

  return {
    changed: allChanges.length > 0,
    content: resultLines.join('\n'),
    changes: allChanges,
  };
}
