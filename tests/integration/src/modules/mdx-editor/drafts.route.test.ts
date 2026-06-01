import { GET } from '@/app/api/drafts/route';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

describe('drafts route integration', () => {
  it('returns 400 when slug query param is missing', async () => {
    const req = new NextRequest('http://localhost/api/drafts?locale=en');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
