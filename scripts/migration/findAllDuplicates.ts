/**
 * @fileoverview Find ALL post-H1 vs blockquote body duplicates.
 *
 * @module findAllDuplicates
 * @version 1.0.0
 * @author Agent
 * @since 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { distance } from 'fastest-levenshtein';

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,!?;:—–\-'"""""'']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const fuzzyTextSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0;
  const maxLen = Math.max(text1.length, text2.length);
  if (maxLen === 0) return 1;
  const lev = distance(text1, text2);
  return 1 - lev / maxLen;
};

interface Duplicate {
  file: string;
  postH1?: string;
  blockquoteStart?: string;
  similarity: number;
}

const duplicates: Duplicate[] = [];

const spellDir = path.resolve(process.cwd(), 'src/content/en/spells');
const files = fs.readdirSync(spellDir).filter((f) => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(spellDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find H1
  let h1Idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#')) {
      h1Idx = i;
      break;
    }
  }
  if (h1Idx === -1) continue;

  // Find post-H1 text (before ---)
  let postH1Start = h1Idx + 1;
  while (postH1Start < lines.length && lines[postH1Start].trim() === '')
    postH1Start++;

  let postH1End = postH1Start;
  while (postH1End < lines.length && lines[postH1End].trim() !== '' && !lines[postH1End].startsWith('---')) {
    postH1End++;
  }

  const postH1Text = lines.slice(postH1Start, postH1End).join('\n').trim();
  if (!postH1Text) continue;

  // Find blockquote
  let blockquoteStart = -1;
  let blockquoteBodyStart = -1;
  for (let i = postH1End; i < lines.length; i++) {
    if (lines[i].startsWith('>')) {
      if (blockquoteStart === -1) blockquoteStart = i;
      // Find first empty blockquote line (end of header)
      if (blockquoteBodyStart === -1) {
        for (let j = i; j < lines.length; j++) {
          if (lines[j].trim() === '>') {
            blockquoteBodyStart = j + 1;
            break;
          }
        }
      }
    } else if (blockquoteStart !== -1 && !lines[i].startsWith('>')) {
      break;
    }
  }

  if (blockquoteStart === -1 || blockquoteBodyStart === -1) continue;

  // Get first blockquote body paragraph
  let blockquoteBodyEnd = blockquoteBodyStart;
  for (let i = blockquoteBodyStart; i < lines.length; i++) {
    if (!lines[i].startsWith('>') || lines[i].trim() === '>') {
      blockquoteBodyEnd = i;
      break;
    }
  }

  const blockquoteBodyLines = lines.slice(blockquoteBodyStart, blockquoteBodyEnd);
  const blockquoteBody = blockquoteBodyLines
    .map((l) => l.replace(/^\s*>\s?/, '').trim())
    .filter((t) => t && !t.startsWith('**') && !t.startsWith('_'))
    .join('\n');

  if (!blockquoteBody) continue;

  // Compare
  const normPost = normalizeText(postH1Text);
  const normBlock = normalizeText(blockquoteBody);
  const similarity = fuzzyTextSimilarity(normPost, normBlock);

  if (similarity > 0.75) {
    duplicates.push({
      file,
      postH1: postH1Text.substring(0, 80),
      blockquoteStart: blockquoteBody.substring(0, 80),
      similarity,
    });
  }
}

console.log(`\n📊 POST-H1 → BLOCKQUOTE DUPLICATES (${files.length} spells)`);
console.log(`==========================================\n`);

if (duplicates.length === 0) {
  console.log('✅ No duplicates found\n');
} else {
  console.log(`🔴 Found ${duplicates.length} spells with duplicates (${((duplicates.length / files.length) * 100).toFixed(1)}%):\n`);

  for (const dup of duplicates.slice(0, 20)) {
    console.log(`  ${dup.file} (${(dup.similarity * 100).toFixed(0)}%)`);
    console.log(`    Post-H1: "${dup.postH1}..."`);
    console.log(`    Blockquote: "${dup.blockquoteStart}..."\n`);
  }

  if (duplicates.length > 20) {
    console.log(`  ... and ${duplicates.length - 20} more\n`);
  }
}
