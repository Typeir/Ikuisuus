/**
 * @fileoverview E2E tests for the ISR revalidation endpoint's metadata contract.
 * Drives the live route over HTTP and asserts the response shape that callers
 * depend on: per-path results plus a metadata block reporting which content
 * types were regenerated.
 *
 * Skipped unless REVALIDATION_SECRET is present in the server environment, since
 * the endpoint refuses to run unconfigured.
 */

import { expect, test } from '@playwright/test';

const SECRET = process.env.REVALIDATION_SECRET;

/**
 * Posts paths to the revalidation endpoint.
 *
 * @param {import('@playwright/test').APIRequestContext} request - Playwright request context
 * @param {string[]} paths - Library paths to revalidate
 * @param {string | undefined} secret - Secret to present
 * @returns {Promise<import('@playwright/test').APIResponse>} Endpoint response
 */
async function revalidate(
  request: import('@playwright/test').APIRequestContext,
  paths: string[],
  secret: string | undefined = SECRET,
) {
  return request.post('/api/revalidate', {
    headers: secret ? { 'x-revalidation-secret': secret } : {},
    data: { paths },
    failOnStatusCode: false,
  });
}

test.describe('POST /api/revalidate', () => {
  test('rejects an unsigned request', async ({ request }) => {
    const res = await revalidate(request, ['/en/library/spells/bane'], undefined);
    expect([401, 503]).toContain(res.status());
  });

  test('rejects a wrong secret', async ({ request }) => {
    const res = await revalidate(
      request,
      ['/en/library/spells/bane'],
      'definitely-not-the-secret',
    );
    expect([401, 503]).toContain(res.status());
  });

  test('rejects an empty path list', async ({ request }) => {
    test.skip(!SECRET, 'REVALIDATION_SECRET not configured');
    const res = await revalidate(request, []);
    expect(res.status()).toBe(400);
  });

  test('reports metadata regeneration for a content path', async ({
    request,
  }) => {
    test.skip(!SECRET, 'REVALIDATION_SECRET not configured');

    const res = await revalidate(request, ['/en/library/spells/bane']);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.results).toEqual([
      { path: '/en/library/spells/bane', status: 'ok' },
    ]);
    expect(Array.isArray(body.metadata)).toBe(true);
    expect(body.metadata).toHaveLength(1);
    expect(body.metadata[0]).toMatchObject({
      locale: 'en',
      contentType: 'spells',
    });
  });

  test('collapses many paths of one type into a single sync', async ({
    request,
  }) => {
    test.skip(!SECRET, 'REVALIDATION_SECRET not configured');

    const res = await revalidate(request, [
      '/en/library/spells/bane',
      '/en/library/spells/bless',
      '/en/library/spells/blur',
    ]);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.results).toHaveLength(3);
    expect(body.metadata).toHaveLength(1);
    expect(body.metadata[0].contentType).toBe('spells');
  });

  test('reports one entry per distinct content type', async ({ request }) => {
    test.skip(!SECRET, 'REVALIDATION_SECRET not configured');

    const res = await revalidate(request, [
      '/en/library/spells/bane',
      '/en/library/monsters/albedo-the-bleak-bloom',
    ]);
    expect(res.status()).toBe(200);

    const body = await res.json();
    const types = body.metadata
      .map((m: { contentType: string }) => m.contentType)
      .sort();
    expect(types).toEqual(['monsters', 'spells']);
  });

  test('omits metadata for content with no synced table', async ({
    request,
  }) => {
    test.skip(!SECRET, 'REVALIDATION_SECRET not configured');

    const res = await revalidate(request, [
      '/en/library/rules/steel-and-strife/conditions',
    ]);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.results[0].status).toBe('ok');
    expect(body.metadata).toEqual([]);
  });
});
