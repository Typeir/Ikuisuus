#!/usr/bin/env node

/**
 * @fileoverview Monster Tier Bonus Recalculator
 *
 * Recalculates **Tier Bonus** in `.sheet.mdx` files from ceil(CR/3).
 * Adjusts all derived bonuses (attack, save DC, saving throws, skills)
 * by the same delta. Never touches AC, HP, ability scores, damage dice,
 * challenge rating, XP, or spell point costs.
 *
 * Usage: node scripts/wip/recalculate-monster-tier-bonus.mjs [--dry-run]
 *
 * @module scripts/wip/recalculate-monster-tier-bonus
 * @version 1.0.0
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const MONSTERS_DIR = join(ROOT, 'src', 'content', 'en', 'monsters');

// ─── Parsers ─────────────────────────────────────────────────────────────────

/** Parse CR string like "1/4", "12", "0". */
function parseCR(s) {
  if (!s) return 0;
  const t = s.trim();
  if (t.includes('/')) { const [n, d] = t.split('/').map(Number); return n / d; }
  return Number(t) || 0;
}

/** New formula: ceil(CR / 3). */
function newTB(cr) { return Math.ceil(cr / 3); }

/** Extract current tier bonus from "**Tier Bonus**: +7". */
function parseTB(line) {
  const m = line.match(/\*\*Tier Bonus\*\*:\s*\+(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Extract challenge rating from "**Challenge**: 12 (8,300 XP)". */
function parseChallenge(line) {
  const m = line.match(/\*\*Challenge\*\*:\s*([\d/]+)/);
  return m ? parseCR(m[1]) : null;
}

// ─── Line classifiers ────────────────────────────────────────────────────────

/** Check if a line should be skipped (AC, HP, ability scores, damage, etc.). */
function isImmune(line) {
  const L = line.trim();
  if (!L) return true;
  // Header separator rows
  if (/^\|[-|\s:]+\|$/.test(L)) return true;
  // Ability score header row
  if (/\|\s*\*?\*?STR\*?\*?\s*\|/.test(L)) return true;
  // Ability score value row: "| 24 (+7) |"
  if (/^\|\s*\d+\s*\(\+?\d+\)/.test(L)) return true;
  // AC / HP / Speed / Challenge / XP rows
  if (/\*\*(Armor Class|Hit Points|Speed|Challenge)\*\*/.test(L)) return true;
  // Damage expressions: "2d10 + 7 slashing" or "55 (8d10 + 10) bludgeoning"
  if (/\d+d\d+\s*[+-]\s*\d+\s+\w+/.test(L)) return true;
  if (/^[-*]\s+\*?\*?Hit\*?\*?:/.test(L)) return true;
  // Spell point costs or spell levels
  if (/^\|\s*\d+\s*\|/.test(L)) return true; // table rows with first-column numbers
  // Image tags, MDX components
  if (/<BlendedImage|<FlexRenderer|<Image/.test(L)) return true;
  // Frontmatter
  if (/^---$/.test(L)) return true;
  return false;
}

/** Check if line has adjustable bonus numbers. */
function hasAdjustableBonus(line) {
  return /\+\d+\s+to\s+hit/.test(line) ||
    /\bDC\s+\d+\b/.test(line) ||
    /\*\*Save DC\*\*/.test(line) ||
    /\*\*Spell attack modifier\*\*/.test(line);
}

/** Check if line is a save/skill bullet: "- **Saving Throws**: Str +14, ..." */
function isSaveSkillBullet(line) {
  return /^-\s+\*\*Saving Throws?\*\*:/.test(line) ||
    /^-\s+\*\*Skills\*\*:/.test(line);
}

// ─── Adjusters ───────────────────────────────────────────────────────────────

/**
 * Add `delta` to every signed number in a string.
 * "+14" → "+15", "−2" → "−1" (if delta=+1).
 */
function adjustNumbers(str, delta) {
  return str.replace(/([+\-−])?\d+/g, (match) => {
    // Parse sign
    let sign = 1;
    let numStr = match;
    if (match.startsWith('+') || match.startsWith('−') || match.startsWith('-')) {
      sign = match[0] === '−' || match[0] === '-' ? -1 : 1;
      numStr = match.slice(1);
    }
    const val = parseInt(numStr, 10);
    if (isNaN(val)) return match;
    const newVal = val + delta * sign;
    // Preserve sign style
    if (match.startsWith('−')) return newVal >= 0 ? '+' + newVal : '−' + Math.abs(newVal);
    if (match.startsWith('-')) return newVal >= 0 ? '+' + newVal : String(newVal);
    if (match.startsWith('+')) return newVal >= 0 ? '+' + newVal : String(newVal);
    return newVal >= 0 ? '+' + newVal : String(newVal);
  });
}

// ─── Processor ───────────────────────────────────────────────────────────────

async function processFile(filePath, dryRun) {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find CR and current TB (only in stat block header, before first "---")
  let cr = null, currentTB = null, tbLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^---$/.test(lines[i].trim())) break;
    if (cr === null) { const p = parseChallenge(lines[i]); if (p !== null) cr = p; }
    if (currentTB === null) { const p = parseTB(lines[i]); if (p !== null) { currentTB = p; tbLineIdx = i; } }
  }

  if (cr === null || currentTB === null) {
    return { file: filePath, changed: false, cr: cr ?? 0, oldTB: currentTB ?? 0, newTB: 0, delta: 0, adj: 0 };
  }

  const ntb = newTB(cr);
  const delta = ntb - currentTB;
  if (delta === 0) {
    return { file: filePath, changed: false, cr, oldTB: currentTB, newTB: ntb, delta: 0, adj: 0 };
  }

  // Update the TB line
  lines[tbLineIdx] = lines[tbLineIdx].replace(
    /\*\*Tier Bonus\*\*:\s*\+\d+/,
    `**Tier Bonus**: +${ntb}`,
  );
  let adj = 1;

  // Pass through all lines and adjust bonuses
  for (let i = 0; i < lines.length; i++) {
    if (i === tbLineIdx) continue;
    if (isImmune(lines[i])) continue;

    const line = lines[i];

    // Save/skill bullets in the stat header
    if (isSaveSkillBullet(line)) {
      const a = adjustNumbers(line, delta);
      if (a !== line) { lines[i] = a; adj++; }
      continue;
    }

    // Lines with adjustable bonuses (attack, DC, spell DC/mod)
    if (hasAdjustableBonus(line)) {
      let adjusted = line;

      // "+N to hit"
      adjusted = adjusted.replace(/\+\d+(\s+to\s+hit)/g, (m, suffix) => {
        const n = parseInt(m, 10) + delta;
        return (n >= 0 ? '+' : '') + n + suffix;
      });

      // "DC N" — standalone DC values
      adjusted = adjusted.replace(/\bDC\s+(\d+)\b/g, (_m, num) => {
        return `DC ${parseInt(num, 10) + delta}`;
      });

      // "**Save DC**: N"
      adjusted = adjusted.replace(/\*\*Save DC\*\*:\s*(\d+)/g, (_m, num) => {
        return `**Save DC**: ${parseInt(num, 10) + delta}`;
      });

      // "**Spell attack modifier**: +N"
      adjusted = adjusted.replace(/\*\*Spell attack modifier\*\*:\s*\+(\d+)/g, (_m, num) => {
        return `**Spell attack modifier**: +${parseInt(num, 10) + delta}`;
      });

      if (adjusted !== line) { lines[i] = adjusted; adj++; }
    }
  }

  if (!dryRun) {
    await writeFile(filePath, lines.join('\n'), 'utf-8');
  }

  return { file: filePath, changed: true, cr, oldTB: currentTB, newTB: ntb, delta, adj };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const files = (await readdir(MONSTERS_DIR))
    .filter(f => f.endsWith('.sheet.mdx'))
    .sort();

  let changed = 0, skipped = 0, totalAdj = 0;

  for (const f of files) {
    const r = await processFile(join(MONSTERS_DIR, f), dryRun);
    if (r.changed) {
      const s = r.delta > 0 ? '+' : '';
      console.log(`  ${f}: CR ${r.cr}, TB +${r.oldTB}→+${r.newTB} (${s}${r.delta}), ${r.adj} adj`);
      changed++; totalAdj += r.adj;
    } else if (r.cr > 0) {
      skipped++;
    }
  }

  console.log(`\nChanged: ${changed} (${totalAdj} adjustments), Unchanged: ${skipped}`);
  if (dryRun) console.log('(Dry run)');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
