/**
 * @fileoverview Heirlooms API Route - Magical item metadata JSON endpoint for HeirloomTable
 * @description Next.js API route that serves heirloom item metadata from .metadata.json files.
 * Supports locale-aware content via ?locale query parameter. Returns array of heirloom objects
 * with rarity, item type, weapon properties, and attunement requirements. Used by
 * HeirloomTableWrapper for client-side data fetching.
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
 * // Fetch English heirlooms
 * const response = await fetch('/api/heirlooms?locale=en');
 * const heirlooms = await response.json();
 * ```
 */
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { getContentFolder } from '../../../lib/utils/getContentFolder';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'API:Heirlooms' });

/**
 * GET /api/heirlooms
 * 
 * Returns array of heirloom item metadata from .metadata.json files.
 * Accepts optional locale query parameter (defaults to 'en').
 * 
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of heirloom objects
 * 
 * @example
 * fetch('/api/heirlooms?locale=es')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  
  try {
    const contentDir = getContentFolder(locale);
    const heirloomsDir = path.join(contentDir, 'items', 'heirlooms');
    
    // Check if directory exists, return empty array if not (graceful handling for missing locales)
    if (!fs.existsSync(heirloomsDir)) {
      return NextResponse.json([]);
    }
    
    const files = fs.readdirSync(heirloomsDir);
    const metadataFiles = files.filter((f: string) => f.endsWith('.metadata.json'));

    const allHeirlooms = metadataFiles.map((file: string) => {
      const content = fs.readFileSync(path.join(heirloomsDir, file), 'utf-8');
      return JSON.parse(content);
    });

    // Flatten in case metadata files contain arrays
    const heirlooms = allHeirlooms.flat();

    return NextResponse.json(heirlooms);
  } catch (error) {
    log.error('Error loading heirloom metadata', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to load heirlooms' }, { status: 500 });
  }
}
