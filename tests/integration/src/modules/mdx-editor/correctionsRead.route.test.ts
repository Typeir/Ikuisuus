import { GET } from '@/app/api/corrections/read/route';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

describe('corrections read route integration', () => {
  it('returns 400 when slug query is missing', async () => {
    const req = new NextRequest(
      'http://localhost/api/corrections/read?locale=en',
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
