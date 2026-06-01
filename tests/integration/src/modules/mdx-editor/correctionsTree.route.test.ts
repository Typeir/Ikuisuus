import { GET } from '@/app/api/corrections/tree/route';
import * as contentTreeService from '@/lib/db/content/contentTreeService';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

describe('corrections tree route integration', () => {
  it('returns 200 response with tree payload', async () => {
    vi.spyOn(contentTreeService, 'listContentTree').mockResolvedValue([]);
    const req = new NextRequest(
      'http://localhost/api/corrections/tree?locale=en',
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
