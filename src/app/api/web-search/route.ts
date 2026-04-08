/**
 * Web Search API Proxy
 * 
 * @fileoverview Proxies search queries to Google Custom Search Engine API.
 * Requires GOOGLE_API_KEY and GOOGLE_CX environment variables.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/app/api/web-search/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../lib/logging/logger';

const log = logger.child({ module: 'API:WebSearch' });

/**
 * GET /api/web-search
 * 
 * Proxies search queries to Google Custom Search Engine API.
 * Requires GOOGLE_API_KEY and GOOGLE_CX environment variables.
 * 
 * @param {NextRequest} req - Next.js request object with search query parameter 'q'
 * @returns {Promise<NextResponse>} JSON array of search results or empty array on error
 * 
 * @example
 * fetch('/api/web-search?q=dragon')
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json({ items: [] });

  const apiKey = process.env.GOOGLE_API_KEY!;
  const cx = process.env.GOOGLE_CX!;
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    q
  )}&key=${apiKey}&cx=${cx}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      log.error('Google API error', {
        status: res.status,
        statusText: res.statusText,
        query: q
      });
      return NextResponse.json({ items: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data.items || []);
  } catch (err) {
    log.error('External search failed', {
      error: err instanceof Error ? err.message : String(err),
      query: q
    });
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
