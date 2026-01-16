/**
 * @fileoverview Spells API Route - Spell metadata JSON endpoint for SpellTable
 * @description Next.js API route that serves spell metadata from .metadata.json files.
 * Supports locale-aware content via ?locale query parameter. Returns array of spell objects
 * with level, school, casting time, components, and concentration requirements. Used by
 * SpellTableWrapper for client-side data fetching.
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
 * // Fetch English spells
 * const response = await fetch('/api/spells?locale=en');
 * const spells = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '../../../lib/utils/getContentFolder';
import { logger } from '../../../lib/logging/logger';

const log = logger.child({ module: 'API:Spells:List' });

/**
 * POST /api/spells
 * 
 * Returns array of spell metadata from .metadata.json files.
 * Accepts optional locale and spells array in request body.
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of spell objects
 * 
 * @example
 * fetch('/api/spells', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ locale: 'en', spells: ['fireball', 'cone-of-cold'] })
 * })
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locale = body.locale || 'en';
  const spellSlugs = body.spells;
  
  try {
    const contentDir = getContentFolder(locale);
    const spellsDir = path.join(contentDir, 'spells');
    
    // Check if directory exists, return empty array if not (graceful handling for missing locales)
    if (!fs.existsSync(spellsDir)) {
      return NextResponse.json([]);
    }
    
    const files = fs.readdirSync(spellsDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allSpells = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(spellsDir, file), 'utf-8');
      return JSON.parse(content);
    });

    // Flatten array in case any metadata files contain arrays
    let spells = allSpells.flat();
    
    // Filter by spell slugs if provided
    if (spellSlugs && Array.isArray(spellSlugs) && spellSlugs.length > 0) {
      spells = spells.filter((spell: any) => spellSlugs.includes(spell.slug));
    }

    return NextResponse.json(spells);
  } catch (error) {
    log.error('Error loading spell metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
      spellCount: spellSlugs?.length
    });
    return NextResponse.json({ error: 'Failed to load spells' }, { status: 500 });
  }
}
