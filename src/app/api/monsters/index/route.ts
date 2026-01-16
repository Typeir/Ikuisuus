/**
 * @fileoverview Monster Index API Route - Lightweight monster index for combobox
 * @description Returns minimal monster metadata (slug, title, cr, size, creatureType)
 * for efficient dropdown population. Full metadata is fetched separately on selection.
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
 * // Fetch monster index
 * const response = await fetch('/api/monsters/index?locale=en');
 * const monsters = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { logger } from '../../../../lib/logging/logger';
import { getContentFolder } from '../../../../lib/utils/getContentFolder';

const log = logger.child({ module: 'API:Monsters:Index' });

/**
 * GET /api/monsters/index
 * 
 * Returns lightweight array of monster index entries for combobox.
 * Only includes fields needed for search/display: slug, title, cr, size, creatureType.
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of minimal monster objects
 * 
 * @example
 * fetch('/api/monsters/index?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const monstersDir = path.join(contentDir, 'monsters');
    const files = fs.readdirSync(monstersDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allMonsters = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(monstersDir, file), 'utf-8');
      const data = JSON.parse(content);
      
      // Return array or single object, always as array
      const monsters = Array.isArray(data) ? data : [data];
      
      // Extract only minimal fields for index
      // Use subSlug for multi-statblock files, fallback to slug for single-statblock files
      return monsters.map((monster: any) => ({
        slug: monster.subSlug || monster.slug,
        title: monster.title,
        cr: monster.cr,
        size: monster.size,
        creatureType: monster.creatureType,
      }));
    });

    // Flatten array
    const monsters = allMonsters.flat();

    return NextResponse.json(monsters);
  } catch (error) {
    log.error('Error loading monster index', { error: error instanceof Error ? error.message : String(error), locale });
    return NextResponse.json({ error: 'Failed to load monster index' }, { status: 500 });
  }
}
