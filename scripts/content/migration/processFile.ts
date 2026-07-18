/**
 * @fileoverview Single-file processing logic
 * @description Reads, transforms, and optionally writes MDX files
 * during dice expression migration.
 *
 * @module scripts/content/migration/processFile
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { readFileSync } from 'fs';
import { relative } from 'path';
import { EXCLUSIONS } from './exclusions';
import { TARGET_SHAPES } from './shapes';
import { ensureExclusionStats, ensureShapeStats } from './stats';
import type { CliFlags, MigrationStats } from './types';

/** Root content directory for relative path reporting. */
const CONTENT_ROOT = 'src/content';

/** A text segment that is either wrapped in `[% ... %]` or unwrapped (safe to match). */
interface Segment {
  text: string;
  wrapped: boolean;
  offset: number;
}

/** Split regex to find `[% ... %]` delimited regions. */
const WRAPPED_RE = /\[%\s*.*?\s*%\]/g;

/**
 * Splits a line into wrapped and unwrapped segments with position offsets.
 * Unwrapped segments are safe for shape matching; wrapped ones are preserved verbatim.
 *
 * @param {string} line - The line to split
 * @returns {Segment[]} Array of segments with text, wrapped flag, and offset in the line
 */
function splitWrapped(line: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  const regex = new RegExp(WRAPPED_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    if (m.index > cursor) {
      segments.push({
        text: line.slice(cursor, m.index),
        wrapped: false,
        offset: cursor,
      });
    }
    segments.push({ text: m[0], wrapped: true, offset: m.index });
    cursor = m.index + m[0].length;
  }
  if (cursor < line.length) {
    segments.push({ text: line.slice(cursor), wrapped: false, offset: cursor });
  }
  return segments.length > 0
    ? segments
    : [{ text: line, wrapped: false, offset: 0 }];
}

/**
 * Replaces a specific occurrence of oldText within a line, identified by its position
 * within an unwrapped segment at a known offset. Avoids replacing earlier occurrences
 * that may be inside already-wrapped regions.
 *
 * @param {string} line - The full line containing oldText
 * @param {string} oldText - The exact substring to replace
 * @param {string} replacement - The replacement string
 * @param {number} segOffset - The offset of the segment within the line
 * @param {number} matchIndex - The index of the match within the segment
 * @returns {string} The line with the specific occurrence replaced
 */
function replaceAt(
  line: string,
  oldText: string,
  replacement: string,
  segOffset: number,
  matchIndex: number,
): string {
  const absoluteIndex = segOffset + matchIndex;
  return (
    line.slice(0, absoluteIndex) +
    replacement +
    line.slice(absoluteIndex + oldText.length)
  );
}

/** Checks if a line contains any dice notation (NdM pattern). */
function hasDiceNotation(line: string): boolean {
  return /\d+d\d+/.test(line);
}

/** Checks if a dice expression is adjacent to a variable modifier. */
function hasVariableModifier(line: string): boolean {
  return /(?:your|the|its)\s+(?:spellcasting\s+ability\s+modifier|Tier\s+Bonus|proficiency\s+bonus|level)/i.test(
    line,
  );
}

/**
 * Processes a single MDX file line by line, applying exclusion rules and
 * target shape matching. Mutates stats in place.
 *
 * @param {string} filePath - Absolute path to the .mdx file
 * @param {MigrationStats} stats - Running statistics
 * @param {CliFlags} flags - CLI flags
 * @returns {string | null} Transformed file content, or null if no changes
 */
export function processFile(
  filePath: string,
  stats: MigrationStats,
  flags: CliFlags,
): string | null {
  const raw = readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  stats.linesProcessed += lines.length;

  let changed = false;
  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    let excluded = false;
    for (const excl of EXCLUSIONS) {
      if (excl.test(trimmed, filePath)) {
        ensureExclusionStats(stats, excl.name);
        stats.exclusions[excl.name].matched++;
        if (
          stats.exclusions[excl.name].examples.length < 3 &&
          hasDiceNotation(trimmed)
        ) {
          const rel = relative(CONTENT_ROOT, filePath);
          stats.exclusions[excl.name].examples.push(
            `  ${rel}:${i + 1} — "${trimmed.slice(0, 80)}"`,
          );
        }
        excluded = true;
        break;
      }
    }
    if (excluded) {
      outputLines.push(line);
      continue;
    }
    if (!hasDiceNotation(trimmed)) {
      outputLines.push(line);
      continue;
    }

    let matchedAny = false;
    let current = line;
    let safety = 0;

    while (safety < 20) {
      safety++;
      const segments = splitWrapped(current);
      let matchedThisPass = false;

      for (const shape of TARGET_SHAPES) {
        for (const seg of segments) {
          if (seg.wrapped) continue;
          const regex = new RegExp(shape.regex.source, shape.regex.flags);
          const match = regex.exec(seg.text);
          if (match) {
            const result = shape.transform(match);
            if (result) {
              current = replaceAt(
                current,
                result.oldText,
                result.replacement,
                seg.offset,
                match.index,
              );
              ensureShapeStats(stats, shape.name);
              stats.shapes[shape.name].matched++;
              stats.totalExpressions++;
              if (
                flags.verbose &&
                stats.shapes[shape.name].examples.length < 5
              ) {
                const rel = relative(CONTENT_ROOT, filePath);
                stats.shapes[shape.name].examples.push(
                  `  [${rel}:${i + 1}] ${shape.name}\n    OLD: ${result.oldText.slice(0, 90)}\n    NEW: ${result.replacement.slice(0, 90)}`,
                );
              }
              matchedThisPass = true;
              matchedAny = true;
              changed = true;
              break;
            }
          }
        }
        if (matchedThisPass) break;
      }
      if (!matchedThisPass) break;
    }

    if (!matchedAny) {
      let reason = 'ambiguous';
      if (hasVariableModifier(trimmed)) reason = 'variable modifier';
      else if (/[×x]\s*\d+/.test(trimmed)) reason = 'multiplication';
      stats.outliers.push({
        filePath: relative(CONTENT_ROOT, filePath),
        lineNum: i + 1,
        line: trimmed.slice(0, 100),
        reason,
      });
      outputLines.push(line);
    } else {
      outputLines.push(current);
    }
  }

  return changed ? outputLines.join('\n') : null;
}
