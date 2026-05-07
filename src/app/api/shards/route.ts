/**
 * @fileoverview Shards API Route — MDX heading block extractor
 * @description Returns the line range and raw text of a named heading block
 * from a content MDX file. Used by the character sheet to lazily load
 * boon and feature descriptions without duplicating content.
 *
 * Security: path traversal is checked explicitly before any file access.
 * The `file` parameter must resolve to a path inside the `src/content/en`
 * content root; otherwise a 400 is returned.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/app/api/shards/route
 *
 * @example
 * ```
 * GET /api/shards?file=character-creation/bloodlines/empyrean.bloodline.mdx&heading=Extended+Reach
 * → { startLine: 42, endLine: 55, text: "## Extended Reach\n\nYour unarmed reach..." }
 * ```
 */

import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

/** Root directory for en-locale content files. */
const CONTENT_ROOT = path.resolve(process.cwd(), 'src', 'content', 'en');

/**
 * Extract the text block that begins at the given heading and ends before
 * the next heading of the same or higher level (or EOF).
 *
 * @function extractHeadingBlock
 * @param {string} content - Full file content as a string
 * @param {string} heading - Target heading text (case-insensitive, stripped of `#`)
 * @returns {{ startLine: number; endLine: number; text: string } | null} Block info or null if not found
 */
function extractHeadingBlock(
  content: string,
  heading: string,
): { startLine: number; endLine: number; text: string } | null {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const target = heading.trim().toLowerCase();

  let startIdx = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = /^(#{1,6})\s+(.+)$/.exec(lines[i]);
    if (!match) continue;
    const text = match[2].trim().toLowerCase();
    if (text === target) {
      startIdx = i;
      headingLevel = match[1].length;
      break;
    }
  }

  if (startIdx < 0) return null;

  let endIdx = lines.length - 1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const match = /^(#{1,6})\s+/.exec(lines[i]);
    if (match && match[1].length <= headingLevel) {
      endIdx = i - 1;
      break;
    }
  }

  while (endIdx > startIdx && lines[endIdx].trim() === '') {
    endIdx--;
  }

  return {
    startLine: startIdx + 1,
    endLine: endIdx + 1,
    text: lines.slice(startIdx, endIdx + 1).join('\n'),
  };
}

/**
 * GET /api/shards
 *
 * Returns the line range and raw text of a named heading block within an MDX file.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON `{ startLine, endLine, text }` or error object
 *
 * @example
 * ```
 * GET /api/shards?file=character-creation/bloodlines/empyrean.bloodline.mdx&heading=Featherfall
 * ```
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file') ?? '';
  const heading = searchParams.get('heading') ?? '';

  if (!file || !heading) {
    return NextResponse.json(
      { error: 'Missing required query params: file and heading' },
      { status: 400 },
    );
  }

  const resolvedPath = path.resolve(CONTENT_ROOT, file);
  if (!resolvedPath.startsWith(CONTENT_ROOT)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  let content: string;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const block = extractHeadingBlock(content, heading);
  if (!block) {
    return NextResponse.json(
      { error: `Heading not found: ${heading}` },
      { status: 404 },
    );
  }

  return NextResponse.json(block);
}
