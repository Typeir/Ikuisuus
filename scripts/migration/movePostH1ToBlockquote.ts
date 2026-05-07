/**
 * @fileoverview Move post-H1 description into blockquote body.
 *
 * @module movePostH1ToBlockquote
 * @version 1.0.0
 * @author Agent
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const log = createLogger({ script: 'MovePostH1ToBlockquote' });

const processSpellFile = (filePath: string): boolean => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let idx = 0;

  if (lines[0].trim() === '---') {
    idx = 1;
    while (idx < lines.length && lines[idx].trim() !== '---') idx += 1;
    idx += 1;
  }

  while (idx < lines.length && !lines[idx].startsWith('#')) idx += 1;
  if (idx >= lines.length) return false;

  idx += 1;

  while (idx < lines.length && lines[idx].trim() === '') idx += 1;

  const postH1Start = idx;
  while (
    idx < lines.length &&
    lines[idx].trim() !== '' &&
    !lines[idx].startsWith('---')
  ) {
    idx += 1;
  }

  const postH1End = idx;
  const postH1Text = lines.slice(postH1Start, postH1End).join('\n').trim();

  if (!postH1Text) return false;

  while (idx < lines.length && lines[idx].trim() !== '---') idx += 1;
  if (idx >= lines.length) return false;

  const separatorIdx = idx;
  idx += 1;

  while (idx < lines.length && lines[idx].trim() === '') idx += 1;

  let headerEndIdx = idx;
  while (
    idx < lines.length &&
    lines[idx].trim() !== '' &&
    lines[idx].trim() !== '>'
  ) {
    idx += 1;
  }

  const bodyStartIdx = idx;
  if (lines[bodyStartIdx]?.trim() === '>') {
    headerEndIdx = bodyStartIdx;
  } else {
    headerEndIdx = idx;
  }

  const newLines = [
    ...lines.slice(0, postH1Start),
    'NO DESCRIPTION!!!!',
    '',
    ...lines.slice(separatorIdx, headerEndIdx),
    '>',
    `> ${postH1Text}`,
    ...lines.slice(headerEndIdx),
  ];

  const newContent = newLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');

  return true;
};

async function main(): Promise<void> {
  try {
    const newFilesOutput = execSync(
      `git diff --name-only --diff-filter=A 3fd71169dce70a27c4c66422c08a14b697dfdb8d...HEAD -- en/spells/*.mdx`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const newFiles = newFilesOutput
      .trim()
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.endsWith('.mdx'));

    log.message(`Found ${newFiles.length} newly added spell files.`);

    let moved = 0;
    for (const file of newFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath) && processSpellFile(filePath)) {
        moved += 1;
        if (moved % 50 === 0) {
          log.message(`Moved: ${moved}/${newFiles.length}`);
        }
      }
    }

    log.message(`Moved ${moved} spells post-H1 to blockquote body.`);
  } catch (error) {
    log.error('Fatal error', { error: String(error) });
    process.exit(1);
  }
}

main();
