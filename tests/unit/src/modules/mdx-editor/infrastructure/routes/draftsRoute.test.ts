import { GET } from '@/modules/mdx-editor/infrastructure/routes/draftsRoute';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

describe('draftsRoute GET', () => {
  it('returns 400 when slug is missing', async () => {
    const req = new NextRequest('http://localhost/api/drafts?locale=en');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
