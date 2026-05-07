/**
 * @fileoverview Optimistic duplication checker - detect-only, no changes.
 *
 * @module checkDuplicates
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

interface DuplicateCheck {
  file: string;
  type: 'header-in-body' | 'consecutive-body-paragraphs';
  headerText?: string;
  bodyText?: string;
  similarity?: number;
}

const results: DuplicateCheck[] = [];

const spellDir = path.resolve(process.cwd(), 'src/content/en/spells');
const files = fs.readdirSync(spellDir).filter((f) => f.endsWith('.mdx'));

for (const file of files) {
  const filePath = path.join(spellDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let blockquoteStartIdx = -1;
  let headerEndIdx = -1;
  let bodyStartIdx = -1;
  let blockquoteEndIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('>')) {
      if (blockquoteStartIdx === -1) blockquoteStartIdx = i;
    } else if (blockquoteStartIdx !== -1 && !lines[i].startsWith('>')) {
      blockquoteEndIdx = i;
      break;
    }
  }

  if (blockquoteStartIdx === -1) continue;

  for (let i = blockquoteStartIdx; i < (blockquoteEndIdx || lines.length); i++) {
    if (lines[i].trim() === '>') {
      headerEndIdx = i;
      bodyStartIdx = i + 1;
      break;
    }
  }

  if (headerEndIdx === -1) continue;

  const headerTexts: string[] = [];
  for (let i = blockquoteStartIdx; i < headerEndIdx; i++) {
    const clean = lines[i].replace(/^\s*>\s?/, '').trim();
    if (
      clean &&
      !clean.startsWith('**') &&
      !clean.startsWith('_') &&
      !clean.startsWith('|')
    ) {
      headerTexts.push(clean);
    }
  }

  const bodyParagraphs: string[] = [];
  let currentPara = '';
  for (let i = bodyStartIdx; i < (blockquoteEndIdx || lines.length); i++) {
    const line = lines[i];
    if (!line.startsWith('>')) break;
    const clean = line.replace(/^\s*>\s?/, '').trim();
    if (clean === '') {
      if (currentPara) {
        bodyParagraphs.push(currentPara);
        currentPara = '';
      }
    } else if (
      !clean.startsWith('**') &&
      !clean.startsWith('_') &&
      !clean.startsWith('|')
    ) {
      if (currentPara) currentPara += ' ';
      currentPara += clean;
    }
  }
  if (currentPara) bodyParagraphs.push(currentPara);

  for (const headerText of headerTexts) {
    const normHeader = normalizeText(headerText);
    for (const bodyPara of bodyParagraphs) {
      const normBody = normalizeText(bodyPara);
      if (
        normHeader.includes(normBody) ||
        normBody.includes(normHeader) ||
        fuzzyTextSimilarity(normHeader, normBody) > 0.85
      ) {
        results.push({
          file,
          type: 'header-in-body',
          headerText,
          bodyText: bodyPara.substring(0, 80),
        });
      }
    }
  }

  for (let i = 0; i < bodyParagraphs.length - 1; i++) {
    const norm1 = normalizeText(bodyParagraphs[i]);
    const norm2 = normalizeText(bodyParagraphs[i + 1]);
    const sim = fuzzyTextSimilarity(norm1, norm2);
    if (sim > 0.80) {
      results.push({
        file,
        type: 'consecutive-body-paragraphs',
        bodyText: `[${i}]: ${bodyParagraphs[i].substring(0, 60)}...`,
        similarity: sim,
      });
    }
  }
}

console.log(`\n📊 DUPLICATION CHECK RESULTS (${files.length} spells)`);
console.log(`==========================================\n`);

if (results.length === 0) {
  console.log('✅ No duplicates detected!\n');
} else {
  console.log(`⚠️  Found ${results.length} potential duplicates:\n`);

  const byType = {
    'header-in-body': results.filter((r) => r.type === 'header-in-body'),
    'consecutive-body-paragraphs': results.filter(
      (r) => r.type === 'consecutive-body-paragraphs'
    ),
  };

  if (byType['header-in-body'].length > 0) {
    console.log(`🔴 Header appearing in body (${byType['header-in-body'].length}):`);
    for (const r of byType['header-in-body'].slice(0, 10)) {
      console.log(`  - ${r.file}`);
      console.log(`    Header: "${r.headerText}"`);
      console.log(`    Body: "${r.bodyText}..."`);
    }
    if (byType['header-in-body'].length > 10) {
      console.log(
        `  ... and ${byType['header-in-body'].length - 10} more\n`
      );
    } else {
      console.log('');
    }
  }

  if (byType['consecutive-body-paragraphs'].length > 0) {
    console.log(
      `🟡 Consecutive similar body paragraphs (${byType['consecutive-body-paragraphs'].length}):`
    );
    for (const r of byType['consecutive-body-paragraphs'].slice(0, 10)) {
      console.log(`  - ${r.file} (similarity: ${(r.similarity! * 100).toFixed(0)}%)`);
      console.log(`    ${r.bodyText}`);
    }
    if (byType['consecutive-body-paragraphs'].length > 10) {
      console.log(
        `  ... and ${byType['consecutive-body-paragraphs'].length - 10} more\n`
      );
    } else {
      console.log('');
    }
  }
}
