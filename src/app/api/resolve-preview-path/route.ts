/**
 * @fileoverview Preview Path API Route
 * @description Resolves a PreviewKind + slug into a library content path.
 *
 * @module app/api/resolve-preview-path
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';

const PATH_MAP: Record<string, string> = {
  spells: 'spells',
  heirlooms: 'items/heirlooms',
  trinkets: 'items/trinkets',
  feats: 'character-creation/feats',
  bloodlines: 'character-creation/bloodlines',
  vocations: 'character-creation/vocations',
  specializations: 'character-creation/specializations',
};

export async function POST(req: Request) {
  const { kind, slug } = await req.json().catch(() => ({}));
  if (!kind || !slug)
    return NextResponse.json(
      { error: 'kind and slug required' },
      { status: 400 },
    );
  const prefix = PATH_MAP[kind];
  if (!prefix)
    return NextResponse.json(
      { error: `Unknown kind: ${kind}` },
      { status: 400 },
    );
  return NextResponse.json({ path: `${prefix}/${slug}` });
}
