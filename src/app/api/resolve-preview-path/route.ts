/**
 * @fileoverview Preview Path API Route
 * @description Resolves a PreviewKind + slug into a library content path.
 *
 * @module app/api/resolve-preview-path/route
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  CONTENT_SUBDIRS,
  type ContentKind,
} from '@/lib/constants/contentPaths';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { kind, slug } = await req.json().catch(() => ({}));
  if (!kind || !slug)
    return NextResponse.json(
      { error: 'kind and slug required' },
      { status: 400 },
    );
  const prefix = CONTENT_SUBDIRS[kind as ContentKind];
  if (!prefix)
    return NextResponse.json(
      { error: `Unknown kind: ${kind}` },
      { status: 400 },
    );
  return NextResponse.json({ path: `${prefix}/${slug}` });
}
