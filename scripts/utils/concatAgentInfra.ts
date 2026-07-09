/**
 * @fileoverview Concatenates all agentic interface files into single doc.
 * Walks .github/agents/, skills/, instructions/, prompts/ + root AGENTS.md.
 * Output: .ignore/damocles-agent.md
 *
 * @author David
 * @version 1.0.0
 * @since 2026-07-09
 * @module concatAgentInfra
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const REPO_ROOT = process.cwd();
const OUT = resolve(REPO_ROOT, '.ignore', 'damocles-agent.md');

/** Collect files from dir matching suffix, sorted. Recursive into subdirs for SKILL.md. */
function collect(dir: string, suffix: string, recursive: boolean): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (recursive) out.push(...collect(full, suffix, true));
    } else if (entry.endsWith(suffix)) {
      out.push(full);
    }
  }
  return out.sort();
}

function sectionHeader(title: string): string {
  const line = '='.repeat(72);
  return `\n${line}\n${title}\n${line}\n\n`;
}

const sources: { label: string; files: string[] }[] = [
  {
    label: 'ROOT — AGENTS.md',
    files: [resolve(REPO_ROOT, 'AGENTS.md')],
  },
  {
    label: 'AGENTS — .github/agents/',
    files: collect(resolve(REPO_ROOT, '.github', 'agents'), '.agent.md', false),
  },
  {
    label: 'SKILLS — .github/skills/',
    files: collect(resolve(REPO_ROOT, '.github', 'skills'), 'SKILL.md', true),
  },
  {
    label: 'INSTRUCTIONS — .github/instructions/',
    files: collect(resolve(REPO_ROOT, '.github', 'instructions'), '.instructions.md', false),
  },
  {
    label: 'PROMPTS — .github/prompts/',
    files: collect(resolve(REPO_ROOT, '.github', 'prompts'), '.prompt.md', false),
  },
];

const parts: string[] = [];
parts.push('# Damocles Agent Infrastructure\n');
parts.push(`> Auto-generated — ${new Date().toISOString()}\n`);
parts.push(`> Source: \`scripts/utils/concatAgentInfra.ts\`\n`);

let total = 0;
for (const { label, files } of sources) {
  if (files.length === 0) continue;
  parts.push(sectionHeader(label));
  for (const f of files) {
    const rel = relative(REPO_ROOT, f).replace(/\\/g, '/');
    const content = readFileSync(f, 'utf-8');
    parts.push(`## ${rel}\n\n`);
    parts.push(content);
    parts.push('\n');
    total++;
  }
}

writeFileSync(OUT, parts.join(''), 'utf-8');
process.stdout.write(`Wrote ${total} files → ${relative(REPO_ROOT, OUT)}\n`);
