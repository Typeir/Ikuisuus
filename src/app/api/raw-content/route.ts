/**
 * @fileoverview Raw Content API Route
 * @description Returns the raw MDX source text for any content file.
 * POST body: { type: 'spells'|'heirlooms'|'trinkets'|'feats', slug: string, locale: string }
 *
 * @module app/api/raw-content/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { join } from 'path';

const TYPE_DIRS: Record<string, string> = {
  spells: 'spells',
  heirlooms: 'items/heirlooms',
  trinkets: 'items/trinkets',
  feats: 'character-creation/feats',
};

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content;
  const closeIdx = content.indexOf('\n---', 3);
  if (closeIdx === -1) return content;
  return content.slice(closeIdx + 4).trim();
}

export async function POST(req: Request) {
  try {
    const { type, slug, locale = 'en' } = await req.json();
    if (!type || !slug)
      return NextResponse.json(
        { error: 'type and slug required' },
        { status: 400 },
      );
    const dir = TYPE_DIRS[type];
    if (!dir)
      return NextResponse.json(
        { error: `Unknown type: ${type}` },
        { status: 400 },
      );

    const filePath = join(
      process.cwd(),
      'src',
      'content',
      locale,
      dir,
      `${slug}.mdx`,
    );
    if (!existsSync(filePath))
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const content = await readFile(filePath, 'utf-8');
    const clean = stripFrontmatter(content);
    return NextResponse.json({ content: clean });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read content' },
      { status: 500 },
    );
  }
}
