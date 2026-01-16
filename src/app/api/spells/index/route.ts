/**
 * @fileoverview Spell Index API Route - Lightweight spell list for dropdown search
 * @description Returns minimal spell data for efficient dropdown/combobox search.
 * Only includes slug, title, level, and school fields to minimize payload size.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs
 * @requires next/server
 * @requires path
 * @requires @/lib/utils/getContentFolder
 * 
 * @example
 * ```typescript
 * // Fetch spell index for dropdown
 * const response = await fetch('/api/spells/index?locale=en');
 * const spellIndex = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'API:Spells:Index' });

/**
 * GET /api/spells/index
 * 
 * Returns lightweight spell index with minimal fields for dropdown search.
 * Accepts optional locale query parameter (defaults to 'en').
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of spell index entries
 * 
 * @example
 * fetch('/api/spells/index?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const spellsDir = path.join(contentDir, 'spells');
    const files = fs.readdirSync(spellsDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allSpells = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(spellsDir, file), 'utf-8');
      return JSON.parse(content);
    });

    // Flatten in case any metadata files contain arrays
    const flatSpells = allSpells.flat();
    
    // Map to minimal fields for dropdown
    const spellIndex = flatSpells.map((spell: any) => ({
      slug: spell.slug,
      title: spell.title,
      level: spell.level,
      school: spell.school,
    }));
    
    // Sort alphabetically by title
    spellIndex.sort((a: { title: string; }, b: { title: any; }) => a.title.localeCompare(b.title));

    return NextResponse.json(spellIndex);
  } catch (error) {
    log.error('Error loading spell index', {
      error: error instanceof Error ? error.message : String(error),
      locale
    });
    return NextResponse.json({ error: 'Failed to load spell index' }, { status: 500 });
  }
}
