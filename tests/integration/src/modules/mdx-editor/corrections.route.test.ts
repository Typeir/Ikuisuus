import { POST } from '@/app/api/corrections/route';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

describe('corrections route integration', () => {
  it('returns 503 when corrections env config is unavailable', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('CONTENT_REPO_OWNER', '');
    vi.stubEnv('CONTENT_REPO_NAME', '');
    vi.stubEnv('GITHUB_PAT', '');

    const req = new NextRequest('http://localhost/api/corrections', {
      method: 'POST',
      body: JSON.stringify({ path: 'en/file.mdx', content: 'x', baseSha: 'y' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
  });
});
