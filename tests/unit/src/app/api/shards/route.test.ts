/**
 * @fileoverview Shards API Route Unit Tests
 * @description Tests for GET /api/shards. Validates security checks, heading
 * extraction logic, locale handling, and edge cases.
 *
 * @module tests/unit/app/api/shards/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import * as ShardsRoute from '@/app/api/shards/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: { readFileSync: mockReadFileSync },
  readFileSync: mockReadFileSync,
}));

beforeEach(() => {
  mockReadFileSync.mockReset();
});

/** Helper: build a mock Request for the shards route. */
function makeRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/shards');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

/** Sample MDX content used across heading-extraction tests. */
const SAMPLE_MDX = `# Bloodline: Empyrean

## Extended Reach

Your unarmed strikes gain +5 ft. reach.

## Featherfall

You fall safely from any height.

### Featherfall Passive

No fall damage.
`;

describe('GET /api/shards', () => {
  it('returns 400 when file param is missing', async () => {
    const res = await ShardsRoute.GET(
      makeRequest({ heading: 'Extended Reach' }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/missing/i);
  });

  it('returns 400 when heading param is missing', async () => {
    const res = await ShardsRoute.GET(
      makeRequest({
        file: 'character-creation/bloodlines/empyrean.bloodline.mdx',
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/missing/i);
  });

  it('returns 400 for path traversal attempts', async () => {
    const res = await ShardsRoute.GET(
      makeRequest({ file: '../../etc/passwd', heading: 'root' }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/invalid/i);
  });

  it('returns 404 when the file does not exist', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const res = await ShardsRoute.GET(
      makeRequest({
        file: 'character-creation/bloodlines/nonexistent.mdx',
        heading: 'Anything',
      }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/file not found/i);
  });

  it('returns 404 when the heading is not in the file', async () => {
    mockReadFileSync.mockReturnValue(SAMPLE_MDX);
    const res = await ShardsRoute.GET(
      makeRequest({
        file: 'character-creation/bloodlines/empyrean.bloodline.mdx',
        heading: 'NonExistentHeading',
      }),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/heading not found/i);
  });

  it('extracts a heading block and returns startLine/endLine/text', async () => {
    mockReadFileSync.mockReturnValue(SAMPLE_MDX);
    const res = await ShardsRoute.GET(
      makeRequest({
        file: 'character-creation/bloodlines/empyrean.bloodline.mdx',
        heading: 'Extended Reach',
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      startLine: number;
      endLine: number;
      text: string;
    };
    expect(body.startLine).toBe(3);
    expect(body.endLine).toBe(5);
    expect(body.text).toContain('Extended Reach');
    expect(body.text).toContain('unarmed strikes');
  });

  it('stops at a sibling heading of the same level', async () => {
    mockReadFileSync.mockReturnValue(SAMPLE_MDX);
    const res = await ShardsRoute.GET(
      makeRequest({
        file: 'character-creation/bloodlines/empyrean.bloodline.mdx',
        heading: 'Featherfall',
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { text: string };
    expect(body.text).not.toContain('Extended Reach');
    expect(body.text).toContain('safely from any height');
  });

  it('is case-insensitive when matching the heading', async () => {
    mockReadFileSync.mockReturnValue(SAMPLE_MDX);
    const res = await ShardsRoute.GET(
      makeRequest({
        file: 'character-creation/bloodlines/empyrean.bloodline.mdx',
        heading: 'extended reach',
      }),
    );
    expect(res.status).toBe(200);
  });
});
