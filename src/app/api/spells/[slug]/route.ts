/**
 * @fileoverview Spell Details API Route - Fetch single spell by slug
 * @description Returns full metadata for a specific spell by slug. Used for lazy loading
 * of spell details in encounter planner when a spell is selected.
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
 * // Fetch specific spell details
 * const response = await fetch('/api/spells/fireball?locale=en');
 * const spell = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'API:Spell:Single' });

/**
 * GET /api/spells/[slug]
 * 
 * Returns full metadata for a specific spell.
 * Accepts optional locale query parameter (defaults to 'en').
 * 
 * @param {Request} req - Next.js request object
 * @param {Object} context - Next.js context
 * @param {Promise<Object>} context.params - Route parameters (async in Next.js 15)
 * @param {string} context.params.slug - Spell slug identifier
 * @returns {NextResponse} JSON spell object or 404
 * 
 * @example
 * fetch('/api/spells/fireball?locale=en')
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  const { slug } = await params;
  
  try {
    const contentDir = getContentFolder(locale);
    const spellsDir = path.join(contentDir, 'spells');
    const metadataPath = path.join(spellsDir, `${slug}.metadata.json`);
    
    // Check if file exists
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      const spell = JSON.parse(content);
      return NextResponse.json(spell);
    }
    
    // If not found, check external spells metadata
    const externalPath = path.join(spellsDir, 'spells-external.metadata.json');
    if (fs.existsSync(externalPath)) {
      const externalContent = fs.readFileSync(externalPath, 'utf-8');
      const externalSpells = JSON.parse(externalContent);
      const externalSpell = externalSpells.find((s: any) => s.slug === slug);
      
      if (externalSpell) {
        return NextResponse.json(externalSpell);
      }
    }
    
    // Not found in either location
    return NextResponse.json(
      { error: 'Spell not found' },
      { status: 404 }
    );
  } catch (error) {
    log.error('Error loading spell details', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale
    });
    return NextResponse.json(
      { error: 'Failed to load spell details' },
      { status: 500 }
    );
  }
}
