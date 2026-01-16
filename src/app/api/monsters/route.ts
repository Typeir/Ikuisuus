/**
 * @fileoverview Monsters API Route - Monster metadata JSON endpoint for MonsterTable
 * @description Next.js API route that serves monster stat block metadata from .metadata.json files.
 * Supports locale-aware content via ?locale query parameter. Flattens multi-stat-block arrays
 * (e.g., dragon variants in single file) into unified response. Used by MonsterTableWrapper
 * for client-side data fetching.
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
 * // Fetch English monsters
 * const response = await fetch('/api/monsters?locale=en');
 * const monsters = await response.json();
 * 
 * // Fetch Spanish monsters
 * const response = await fetch('/api/monsters?locale=es');
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '../../../lib/utils/getContentFolder';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'API:Monsters' });

/**
 * GET /api/monsters
 * 
 * Returns array of monster metadata from .metadata.json files.
 * Accepts optional locale query parameter (defaults to 'en').
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of monster objects
 * 
 * @example
 * fetch('/api/monsters?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const monstersDir = path.join(contentDir, 'monsters');    
    // Check if directory exists, return empty array if not (graceful handling for missing locales)
    if (!fs.existsSync(monstersDir)) {
      return NextResponse.json([]);
    }
        const files = fs.readdirSync(monstersDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allMonsters = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(monstersDir, file), 'utf-8');
      return JSON.parse(content);
    });

    // Flatten array in case any metadata files contain arrays
    const monsters = allMonsters.flat();

    return NextResponse.json(monsters);
  } catch (error) {
    log.error('Error loading monster metadata', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to load monsters' }, { status: 500 });
  }
}
