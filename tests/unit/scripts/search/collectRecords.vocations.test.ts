/**
 * @fileoverview Search collection checks for vocation pages.
 * @description A vocation page is the folder's own file rather than a `main`,
 * so the collector has to match the content-type suffix it is actually written
 * with; when it does not, only the specializations are findable
 *
 * @module tests/unit/scripts/search/collectRecords.vocations.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-10
 */

import { collectRecords } from '@scripts/search/collectRecords';
import { describe, expect, it, beforeAll } from 'vitest';
import type { IndexRecord } from '@scripts/search/collectRecords';

/** Records the collection run produced for vocations. */
let vocations: IndexRecord[] = [];

beforeAll(async () => {
  const records = await collectRecords('en');
  vocations = records.filter((record) =>
    (record.filters.type ?? []).includes('vocations'),
  );
});

describe('collectRecords · vocations', () => {
  it('indexes the vocation pages themselves', () => {
    expect(vocations.length).toBeGreaterThanOrEqual(5);
  });

  it('indexes berserker and scion, the pages that are read most', () => {
    const urls = vocations.map((record) => record.url);

    expect(urls.some((url) => url.includes('/vocations/berserker'))).toBe(true);
    expect(urls.some((url) => url.includes('/vocations/scion'))).toBe(true);
  });

  it('carries the page prose, so the vocation can be found by name', () => {
    const berserker = vocations.find((record) =>
      record.url.includes('/vocations/berserker'),
    );

    expect(berserker?.content.toLowerCase()).toContain('abandon');
    expect(berserker?.meta.title).toBe('Berserker');
  });
});
