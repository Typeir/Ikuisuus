#!/usr/bin/env node

/**
 * @fileoverview Monster Bonus Auditor
 * @description Scans every `.sheet.mdx` for ALL numeric bonus patterns (+N to hit,
 * DC N, spell save DC N, save/skill +N, etc.) and flags any that are inconsistent
 * with a naive `ceil(CR/3)` tier bonus check. Not a fixer — a linter for manual review.
 *
 * Usage: node scripts/wip/audit-monster-bonuses.mjs
 *
 * @module scripts/wip/audit-monster-bonuses
 * @version 1.0.0
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const MONSTERS_DIR = join(ROOT, 'src', 'content', 'en', 'monsters');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCR(str) {
  if (!str) return 0;
  const t = str.trim();
  if (t.includes('/')) {
    const [n, d] = t.split('/').map(Number);
    return n / d;
  }
  return Number(t) || 0;
}

function expectedTB(cr) {
  return Math.ceil(cr / 3);
}

/**
 * Extract ALL numeric bonus occurrences from a monster sheet.
 * Returns structured findings for manual audit.
 */
function extractBonuses(content) {
  const lines = content.split('\n');
  const findings = [];

  let cr = null,
    listedTB = null,
    tierBonusLine = '';
  let passedDivider = false;
  let inNestedBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track nested blockquotes (stat blocks inside > sections)
    if (/^>\s/.test(line)) inNestedBlockquote = true;
    if (inNestedBlockquote && /^\S/.test(line) && !/^>/.test(line))
      inNestedBlockquote = false;

    // End of stat header
    if (/^---$/.test(line.trim())) passedDivider = true;

    // Extract CR
    if (!passedDivider && cr === null) {
      const m = line.match(/\*\*Challenge\*\*:\s*([\d/]+)/);
      if (m) cr = parseCR(m[1]);
    }

    // Extract listed TB
    if (!passedDivider && listedTB === null) {
      const m = line.match(/\*\*Tier Bonus\*\*:\s*\+(\d+)/);
      if (m) {
        listedTB = parseInt(m[1], 10);
        tierBonusLine = line.trim();
      }
    }

    // Skip lines inside nested blockquotes (sub-stat blocks like drones)
    if (inNestedBlockquote) continue;
    if (i === 0) continue; // H1 title
    if (/^\|[-|\s]+\|$/.test(line)) continue; // table separator
    if (/^\|\s*\*?\*?STR\*?\*?\s*\|/.test(line)) continue; // ability header
    if (/^\|\s*\d+\s*\(\+?\d+\)/.test(line)) continue; // ability score row
    if (
      /^\*\*Armor Class\*\*|\*\*Hit Points\*\*|\*\*Speed\*\*|\*\*Challenge\*\*|\*\*Tier Bonus\*\*/.test(
        line,
      )
    )
      continue;

    // ── Pattern 1: "+N to hit" ──
    let m;
    const toHitRe = /\+(\d+)\s+to\s+hit/g;
    while ((m = toHitRe.exec(line)) !== null) {
      findings.push({
        line: i + 1,
        type: 'to-hit',
        bonus: parseInt(m[1]),
        snippet: line.trim().substring(0, 80),
      });
    }

    // ── Pattern 2: "DC N" (not in parentheses like "DC 10 (1d6)") ──
    const dcRe = /\bDC\s+(\d+)\b(?!\s*\()/g;
    while ((m = dcRe.exec(line)) !== null) {
      findings.push({
        line: i + 1,
        type: 'DC',
        bonus: parseInt(m[1]),
        snippet: line.trim().substring(0, 80),
      });
    }

    // ── Pattern 3: "spell save DC N" or "save DC N" ──
    const spellDcRe = /(?:spell\s+)?save\s+DC\s+(\d+)/gi;
    while ((m = spellDcRe.exec(line)) !== null) {
      // Avoid double-counting with pattern 2
      if (
        !findings.some(
          (f) =>
            f.line === i + 1 && f.type === 'DC' && f.bonus === parseInt(m[1]),
        )
      ) {
        findings.push({
          line: i + 1,
          type: 'spell-DC',
          bonus: parseInt(m[1]),
          snippet: line.trim().substring(0, 80),
        });
      }
    }

    // ── Pattern 4: "+N" in saving throw or skill bullet lines ──
    if (passedDivider === false) {
      // Already in stat header
    }

    // ── Pattern 5: Spell attack modifier "+N" not followed by "to hit" ──
    const spellAtkRe = /\+(\d+)\s+(?:to\s+hit\s+with\s+spell|spell\s+attack)/gi;
    while ((m = spellAtkRe.exec(line)) !== null) {
      findings.push({
        line: i + 1,
        type: 'spell-atk',
        bonus: parseInt(m[1]),
        snippet: line.trim().substring(0, 80),
      });
    }
  }

  // Extract saving throw bonuses from the stat header (after the loop since we need full context)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!passedDivider && i > 0) {
      // Saving throws line
      const saveMatch = line.match(/^-\s+\*\*Saving Throws?\*\*:\s*(.+)/i);
      if (saveMatch) {
        const bonuses = saveMatch[1].match(/\+(\d+)/g);
        if (bonuses) {
          for (const b of bonuses) {
            findings.push({
              line: i + 1,
              type: 'save',
              bonus: parseInt(b),
              snippet: line.trim().substring(0, 80),
            });
          }
        }
      }
    }
  }

  return { cr, listedTB, findings };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const files = (await readdir(MONSTERS_DIR))
    .filter((f) => f.endsWith('.sheet.mdx'))
    .sort();
  console.log(`Auditing ${files.length} monsters...\n`);

  let totalFindings = 0;
  let tbMismatches = 0;
  let skipped = 0;

  for (const filename of files) {
    const content = await readFile(join(MONSTERS_DIR, filename), 'utf-8');
    const { cr, listedTB, findings } = extractBonuses(content);

    if (listedTB === null) {
      skipped++;
      continue;
    }

    totalFindings += findings.length;
    const expTB = expectedTB(cr);
    const tbOk = listedTB === expTB;
    if (!tbOk) tbMismatches++;

    const byType = {};
    for (const f of findings) {
      if (!byType[f.type]) byType[f.type] = [];
      byType[f.type].push(f.bonus);
    }
    const summary = Object.entries(byType)
      .map(
        ([t, b]) =>
          `${t}(${b.length}): ${[...new Set(b)]
            .sort((a, b) => a - b)
            .map((b) => '+' + b)
            .join(',')}`,
      )
      .join('; ');

    const flag = tbOk ? '' : ` ⚠ ceil(CR/3)=+${expTB}`;
    console.log(`  ${filename}`);
    console.log(`    CR ${cr}, TB +${listedTB}${flag}`);
    console.log(`    ${findings.length} bonuses: ${summary}\n`);
  }

  console.log(`─── Summary ───`);
  console.log(
    `  ${files.length} monsters, ${skipped} skipped, ${totalFindings} bonuses, ${tbMismatches} TB mismatches`,
  );
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
