/**
 * @fileoverview Migrate: hardcode school: into spell frontmatter aspects.
 * @description One-shot bridge for school → form migration; idempotent.
 *
 * @module scripts/metadata/applySchoolAspects
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import matter from 'gray-matter';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SPELLS = path.join(process.cwd(), 'src', 'content', 'en', 'spells');
const dry = process.argv.includes('--dry');

/**
 * Writes frontmatter back preserving the file's line endings and leaving
 * `group:value` entries unquoted.
 *
 * @param {string} file - Spell path
 * @param {string} raw - Original file text
 * @param {Record<string, unknown>} data - Frontmatter
 * @param {string} content - Body
 */
function write(file: string, raw: string, data: Record<string, unknown>, content: string): void {
  let out = matter.stringify(content, data, { lineWidth: -1 } as never);
  out = out.replace(/^(\s*- )'([a-z-]+:[a-z0-9-]+)'$/gm, '$1$2');
  if (raw.includes('\r\n')) out = out.replace(/\r?\n/g, '\r\n');
  writeFileSync(file, out, 'utf8');
}

let written = 0;
let unchanged = 0;
let noSchool = 0;
for (const name of readdirSync(SPELLS)) {
  if (!name.endsWith('.mdx')) continue;
  const slug = name.slice(0, -4);
  const sidecar = path.join(SPELLS, `${slug}.metadata.json`);
  if (!existsSync(sidecar)) continue;
  const meta = JSON.parse(readFileSync(sidecar, 'utf8')) as { school?: string } | Array<{ school?: string }>;
  const school = (Array.isArray(meta) ? meta[0]?.school : meta.school)?.toLowerCase();
  if (!school) {
    noSchool++;
    continue;
  }
  const file = path.join(SPELLS, name);
  const raw = readFileSync(file, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const current = Array.isArray(data.aspects)
    ? (data.aspects as unknown[]).filter((a): a is string => typeof a === 'string')
    : [];
  const forms = current.filter((a) => a.startsWith('form:'));
  const rest = current.filter((a) => !a.startsWith('form:') && !a.startsWith('school:'));
  const next = [...forms, `school:${school}`, ...rest];
  if (next.length === current.length && next.every((a, i) => a === current[i])) {
    unchanged++;
    continue;
  }
  data.aspects = next;
  written++;
  if (!dry) write(file, raw, data, parsed.content);
}
console.log(JSON.stringify({ dry, written, unchanged, noSchool }));
