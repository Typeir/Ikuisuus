/**
 * @fileoverview Trinkets API Route - Adventuring gear metadata JSON endpoint for TrinketTable
 * @description Next.js API route that serves trinket item metadata from .metadata.json files.
 * Supports locale-aware content via ?locale query parameter. Returns array of trinket objects
 * with item type, damage, properties, range, weight, and special effects. Used by
 * TrinketTableWrapper for client-side data fetching.
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
 * // Fetch English trinkets
 * const response = await fetch('/api/trinkets?locale=en');
 * const trinkets = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '../../../lib/utils/getContentFolder';
import { logger } from '../../../lib/logging/logger';

const log = logger.child({ module: 'API:Trinkets' });

/**
 * GET /api/trinkets
 * 
 * Returns array of trinket item metadata from .metadata.json files.
 * Accepts optional locale query parameter (defaults to 'en').
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of trinket objects
 * 
 * @example
 * fetch('/api/trinkets?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const trinketsDir = path.join(contentDir, 'items', 'trinkets');
    const files = fs.readdirSync(trinketsDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allTrinkets = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(trinketsDir, file), 'utf-8');
      return JSON.parse(content);
    });

    // Flatten in case metadata files contain arrays
    const trinkets = allTrinkets.flat();

    return NextResponse.json(trinkets);
  } catch (error) {
    log.error('Error loading trinket metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale
    });
    return NextResponse.json({ error: 'Failed to load trinkets' }, { status: 500 });
  }
}
