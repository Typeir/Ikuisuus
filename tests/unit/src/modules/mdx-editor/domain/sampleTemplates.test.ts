/**
 * @fileoverview Sample Template Tests
 * @description Every sample must parse through the real metadata dispatcher to
 * its intended kind — "perfectly formatted" is enforced here, not by eye.
 *
 * @module tests/unit/src/modules/mdx-editor/domain/sampleTemplates
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { SAMPLE_TEMPLATES } from '@/modules/mdx-editor/domain/sampleTemplates';
import { loadSharedData } from '@scripts/metadata/sharedData';
import { parseMetadataFromSource } from '@scripts/metadata/sourceParser';
import { beforeAll, describe, expect, it } from 'vitest';

let sharedData: Awaited<ReturnType<typeof loadSharedData>>;

beforeAll(async () => {
  sharedData = await loadSharedData();
});

const PATHS: Record<string, { path: string; kind: string }> = {
  creature: {
    path: 'src/content/en/monsters/sample-creature.sheet.mdx',
    kind: 'monster',
  },
  heirloom: {
    path: 'src/content/en/items/heirlooms/sample-heirloom.heirloom.mdx',
    kind: 'heirloom',
  },
  spell: { path: 'src/content/en/spells/sample-spell.mdx', kind: 'spell' },
  trinket: {
    path: 'src/content/en/items/trinkets/sample-trinket.trinket.mdx',
    kind: 'trinket',
  },
  rule: { path: 'src/content/en/rules/sample-rule.mdx', kind: 'generic' },
  world: { path: 'src/content/en/world/sample-world.lore.mdx', kind: 'generic' },
};

describe('SAMPLE_TEMPLATES', () => {
  it('covers every declared path mapping', () => {
    expect(SAMPLE_TEMPLATES.map((t) => t.key).sort()).toEqual(
      Object.keys(PATHS).sort(),
    );
  });

  it.each(SAMPLE_TEMPLATES.map((t) => [t.key, t] as const))(
    'parses the %s sample to its kind with at least one record',
    (key, template) => {
      const { path, kind } = PATHS[key];
      const result = parseMetadataFromSource(template.content, path, sharedData);

      expect(result.kind).toBe(kind);
      expect(result.records.length).toBeGreaterThan(0);
    },
  );

  it.each(SAMPLE_TEMPLATES.map((t) => [t.key, t] as const))(
    'parses the %s sample pathless via frontmatter contentType',
    (key, template) => {
      const result = parseMetadataFromSource(template.content, '', sharedData);

      expect(result.kind).toBe(PATHS[key].kind);
      expect(result.records.length).toBeGreaterThan(0);
    },
  );

  it('parses the creature sample as one neutral stat block', () => {
    const template = SAMPLE_TEMPLATES.find((t) => t.key === 'creature');
    const result = parseMetadataFromSource(
      template!.content,
      PATHS.creature.path,
      sharedData,
    );

    const record = result.records[0] as Record<string, unknown>;
    expect(result.records).toHaveLength(1);
    expect(record.title).toBe('Sample Creature');
    expect(Array.isArray(record.features)).toBe(true);
    expect((record.features as unknown[]).length).toBeGreaterThan(0);
  });

  it('parses the heirloom sample with rarity and weapon type', () => {
    const template = SAMPLE_TEMPLATES.find((t) => t.key === 'heirloom');
    const record = parseMetadataFromSource(
      template!.content,
      PATHS.heirloom.path,
      sharedData,
    ).records[0] as Record<string, unknown>;

    expect(record.rarity).toBe('common');
    expect(record.weaponType).toBe('longsword');
  });

  it('parses the spell sample with level and school', () => {
    const template = SAMPLE_TEMPLATES.find((t) => t.key === 'spell');
    const record = parseMetadataFromSource(
      template!.content,
      PATHS.spell.path,
      sharedData,
    ).records[0] as Record<string, unknown>;

    expect(record.level).toBe(1);
    expect(record.school).toBe('Evocation');
  });
});
