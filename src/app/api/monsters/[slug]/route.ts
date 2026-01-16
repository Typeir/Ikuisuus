/**
 * @fileoverview Single Monster API Route - Fetch individual monster metadata by slug
 * @description Returns full monster metadata for a specific creature by slug/subSlug.
 * Searches all metadata files to find matching creature. Used for lazy loading
 * full creature data on import selection.
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
 * // Fetch specific monster
 * const response = await fetch('/api/monsters/ancient-red-dragon?locale=en');
 * const monster = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '../../../../lib/utils/getContentFolder';
import { logger } from '../../../../lib/logging/logger';

const log = logger.child({ module: 'API:Monster:Single' });

/**
 * GET /api/monsters/[slug]
 * 
 * Returns full metadata for a single monster by slug or subSlug.
 * Searches all .metadata.json files and returns first match.
 * 
 * @param {Request} req - Next.js request object
 * @param {Object} context - Route context with params
 * @returns {NextResponse} JSON monster object or 404 error
 * 
 * @example
 * fetch('/api/monsters/albedo-the-bleak-bloom?locale=en')
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const monstersDir = path.join(contentDir, 'monsters');
    const files = fs.readdirSync(monstersDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    // Search all metadata files for matching slug
    for (const file of metadataFiles) {
      const content = fs.readFileSync(path.join(monstersDir, file), 'utf-8');
      const data = JSON.parse(content);
      
      // Handle both array and single object formats
      const monsters = Array.isArray(data) ? data : [data];
      
      // Check subSlug first (used in multi-statblock files), then slug (single-statblock files)
      const match = monsters.find((m: any) => 
        m.subSlug === slug || m.slug === slug
      );
      
      if (match) {
        return NextResponse.json(match);
      }
    }

    return NextResponse.json(
      { error: 'Monster not found' },
      { status: 404 }
    );
  } catch (error) {
    log.error('Error loading monster', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale
    });
    return NextResponse.json(
      { error: 'Failed to load monster' },
      { status: 500 }
    );
  }
}
