#!/usr/bin/env npx tsx
/**
 * @fileoverview Deduplicates spell descriptions across post-H1 and blockquote body.
 * Checks if descriptions are substrings of each other or have >50% Levenshtein distance.
 * Keeps the non-duplicate, removes the duplicate.
 * @module scripts/migration/deduplicateDescriptions
 * @author Copilot
 * @version 1.0.0
 * @since 2026-05-07
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { distance } from 'fastest-levenshtein';
import { createLogger } from '@/lib/logging/logger';

const logger = createLogger({ name: 'DeduplicateDescriptions' });

interface ParsedSpell {
  frontmatter: string;
  title: string;
  postH1Text: string;
  blockquoteBody: string;
}

function parseSpellMdx(raw: string): ParsedSpell {
  const lines = raw
    .split('\n')
    .map((l) => l.replace(/\r+$/, ''));

  let frontmatterEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---' && i > 0) {
      frontmatterEnd = i;
      break;
    }
  }

  const frontmatter = lines.slice(0, frontmatterEnd + 1).join('\n');
  let titleLine = '';
  let postH1Start = -1;
  let dividerIdx = -1;

  for (let i = frontmatterEnd + 1; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      titleLine = lines[i];
      postH1Start = i + 1;
      break;
    }
  }

  for (let i = postH1Start; i < lines.length; i++) {
    if (lines[i] === '---') {
      dividerIdx = i;
      break;
    }
  }

  const postH1Text = lines
    .slice(postH1Start, dividerIdx)
    .join('\n')
    .trim();
  const blockquoteBody = lines
    .slice(dividerIdx + 1)
    .join('\n')
    .trim();

  return { frontmatter, title: titleLine, postH1Text, blockquoteBody };
}

function getFirstParagraph(text: string): string {
  if (!text) return '';
  const paragraphs = text.split('\n\n').map((p) => p.trim());
  return paragraphs[0] || '';
}

function fuzzyTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const shorterLen = Math.min(text1.length, text2.length);
  if (shorterLen === 0) return 0;
  const comparison = text2.substring(0, text1.length);
  const dist = distance(text1, comparison);
  return 1 - dist / shorterLen;
}

function reconstructSpellMdx(
  parsed: ParsedSpell,
  blockquoteBody: string,
): string {
  return [
    parsed.frontmatter,
    parsed.title,
    '',
    parsed.postH1Text || '',
    '',
    '---',
    '',
    blockquoteBody || '',
  ].join('\n');
}

/**
 * Deduplicate blockquote first and second paragraphs
 * Removes first paragraph if it's a substring of second or similarity >50%
 */
function deduplicateBlockquoteParagraphs(blockquoteBody: string): string {
  if (!blockquoteBody) return blockquoteBody;

  /** Remove blockquote markers (>) and clean up lines */
  const cleanedBody = blockquoteBody
    .split('\n')
    .map((line) => line.replace(/^\s*>\s?/, '').trim())
    .join('\n');

  /** Split into paragraphs */
  const paragraphs = cleanedBody
    .split('\n\n')
    .map((p) => p.trim())
    .filter(
      (p) =>
        p.length > 10 &&
        !p.startsWith('**') &&
        !p.startsWith('_') &&
        !p.includes('Casting Time'),
    );

  if (paragraphs.length < 2) {
    return blockquoteBody;
  }

  const para1 = paragraphs[0];
  const para2 = paragraphs[1];

  const similarity = fuzzyTextSimilarity(para1, para2);
  const inverseSimilarity = fuzzyTextSimilarity(para2, para1);

  const isSubstring = para1.includes(para2) || para2.includes(para1);
  const isDuplicate = isSubstring || similarity > 0.5 || inverseSimilarity > 0.5;

  if (isDuplicate) {
    if (para2.includes(para1) && para2.length > para1.length) {
      /** para2 is longer and contains para1; remove para1 from body */
      return blockquoteBody.replace(para1, '').replace(/\n\n+/g, '\n\n');
    } else if (para1.includes(para2) && para1.length > para2.length) {
      /** para1 is longer; keep original structure */
      return blockquoteBody;
    }
  }

  return blockquoteBody;
}

async function main() {
  const contentDir = path.resolve(__dirname, '../../src/content/en/spells');
  const contentRepoDir = path.resolve(__dirname, '../../src/content');
  const commitHash = '08377b7';

  let changedFiles: string[] = [];
  try {
    const output = execSync(`git show --name-only --pretty=format: ${commitHash}`, {
      cwd: contentRepoDir,
      encoding: 'utf-8',
    });
    changedFiles = output
      .trim()
      .split('\n')
      .filter((f) => f.endsWith('.mdx'));
  } catch (error) {
    logger.error(`Failed to get changed files: ${error}`);
    process.exit(1);
  }

  logger.message(`Found ${changedFiles.length} files to check.`);

  let fixedCount = 0;

  for (const file of changedFiles) {
    const filePath = path.join(contentDir, path.basename(file));
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseSpellMdx(raw);

    const deduplicatedBlockquote = deduplicateBlockquoteParagraphs(
      parsed.blockquoteBody,
    );

    if (deduplicatedBlockquote !== parsed.blockquoteBody) {
      const newMdx = reconstructSpellMdx(parsed, deduplicatedBlockquote);
      fs.writeFileSync(filePath, newMdx, 'utf-8');
      fixedCount++;
      logger.message(
        `Deduplicated blockquote paragraphs: ${path.basename(filePath)}`,
      );
    }
  }

  logger.message(`Deduplicated ${fixedCount} spells.`);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
