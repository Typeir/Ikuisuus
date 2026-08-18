/**
 * @fileoverview Migration: drop school from spell subtitles.
 * @description Rewrite subtitle from school grammar to school-free form; keep level and quality.
 *
 * @module scripts/metadata/stripSpellSchools
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SPELLS = path.join(process.cwd(), 'src', 'content', 'en', 'spells');
const SCHOOLS =
  '(?:abjuration|conjuration|divination|enchantment|evocation|illusion|necromancy|transmutation)';
const dry = process.argv.includes('--dry');

/**
 * Rewrite one subtitle line or return unchanged.
 *
 * @param {string} line - Subtitle line
 * @returns {string} Rewritten line
 */
export function rewriteSubtitle(line: string): string {
  const m = /^(>\s*_)([^_]*)(_\s*)$/.exec(line);
  if (!m) return line;
  let inner = m[2];
  const cantrip = new RegExp(`^${SCHOOLS}(?:\\s+\\w)?\\s+cantrip$`, 'i');
  if (cantrip.test(inner.trim())) return `${m[1]}Cantrip${m[3]}`;
  const leveled = new RegExp(
    `^(\\d+(?:st|nd|rd|th)-level)\\s+((?:\\w+\\s+)?)${SCHOOLS}(\\s*\\(.*\\))?\\s*$`,
    'i',
  );
  const lm = leveled.exec(inner.trim());
  if (!lm) return line;
  const quality = lm[2] ? lm[2].trim() + ' ' : '';
  inner = `${lm[1]} ${quality}Spell${lm[3] ?? ''}`;
  return `${m[1]}${inner}${m[3]}`;
}

if (process.argv[1] && /stripSpellSchools/.test(process.argv[1])) {
  let files = 0;
  let lines = 0;
  const leftovers: string[] = [];
  for (const name of readdirSync(SPELLS)) {
    if (!name.endsWith('.mdx')) continue;
    const file = path.join(SPELLS, name);
    const raw = readFileSync(file, 'utf8');
    const eol = raw.includes('\r\n') ? '\r\n' : '\n';
    let changed = 0;
    const out = raw
      .split(eol)
      .map((line) => {
        const next = rewriteSubtitle(line);
        if (next !== line) changed++;
        else if (/^>\s*_[^_]*_\s*$/.test(line) && new RegExp(SCHOOLS, 'i').test(line)) {
          leftovers.push(`${name}: ${line.trim()}`);
        }
        return next;
      })
      .join(eol);
    if (changed) {
      files++;
      lines += changed;
      if (!dry) writeFileSync(file, out, 'utf8');
    }
  }
  console.log(JSON.stringify({ dry, files, lines, leftovers }, null, 2));
}
