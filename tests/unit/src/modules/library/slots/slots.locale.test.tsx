/**
 * @fileoverview Slot card T12: labels out of content.
 * @description Slot labels come from the message catalogue, so the fixture
 * stays locale-free; `en` carries one label per schema row.
 *
 * @module tests/unit/src/modules/library/slots/slots.locale.test
 * @version 0.3.0
 * @author Typeir
 * @since 2026-09-02
 */

import {
  SLOT_LABEL_OVERRIDES,
  SLOT_NAMES,
} from '@/modules/library/domain/slots';
import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { fixtureSource, renderFixture } from './harness';

/**
 * Reads one locale's library messages.
 *
 * @param {string} locale - Locale code
 * @returns {Record<string, unknown>} Message catalogue
 */
function messagesOf(locale: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      path.resolve(process.cwd(), `messages/${locale}/library.json`),
      'utf8',
    ),
  ) as Record<string, unknown>;
}

describe('T12 labels out of content', () => {
  it('en carries a label for every slot in the schema', () => {
    const slots = (messagesOf('en').slots ?? {}) as Record<string, string>;
    for (const key of SLOT_NAMES) {
      expect(slots[key], `en slots.${key}`).toBeTruthy();
    }
  });

  it('carries a label for every host override, and no orphans', () => {
    const slots = (messagesOf('en').slots ?? {}) as Record<string, string>;
    const overrides = Object.values(SLOT_LABEL_OVERRIDES).flatMap((host) =>
      Object.values(host),
    ) as string[];
    for (const key of overrides) {
      expect(slots[key], `en slots.${key}`).toBeTruthy();
    }
    const expected = new Set<string>([...SLOT_NAMES, ...overrides]);
    for (const key of Object.keys(slots)) {
      expect(expected.has(key), `orphan label slots.${key}`).toBe(true);
    }
    expect(Object.keys(slots)).toHaveLength(expected.size);
  });

  it('rendered slot labels come from the catalogue key, not the content', async () => {
    const html = await renderFixture();
    const labels = html.match(/data-slot-label="true">([^<]*)</g) ?? [];
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label, `label is a catalogue key`).toMatch(
        /data-slot-label="true">slots\.[a-zA-Z]+</,
      );
    }
  });

  it('the fixture never authors the English labels as content', () => {
    expect(fixtureSource()).not.toMatch(/<Attunement>Attunement|>Attunement</);
  });
});
