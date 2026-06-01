import * as authModule from '@/lib/db/auth';
import {
    authenticateWithSecret,
    authenticateWithSession,
} from '@/modules/mdx-editor/application/use-cases/authenticateEditor';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

describe('authenticateEditor use-cases', () => {
  it('rejects secret auth with missing secret', () => {
    vi.unstubAllEnvs();
    const req = new NextRequest('http://localhost/api/drafts');
    const result = authenticateWithSecret(req);
    expect(result.ok).toBe(false);
  });

  it('accepts valid session', async () => {
    vi.spyOn(authModule, 'extractSession').mockResolvedValue({
      userId: '1',
      username: 'alice',
      role: 'editor',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 1000,
    });
    const req = new NextRequest('http://localhost/api/corrections', {
      headers: { authorization: 'Bearer t' },
    });
    const result = await authenticateWithSession(req);
    expect(result.ok).toBe(true);
  });
});
