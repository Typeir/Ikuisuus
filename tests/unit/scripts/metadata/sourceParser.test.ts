/**
 * @fileoverview Source Parser Dispatcher Tests
 * @description Kind detection and raw-source parsing without file reads.
 *
 * @module tests/unit/scripts/metadata/sourceParser
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { loadSharedData } from '@scripts/metadata/sharedData';
import {
  kindOfPath,
  kindOfSource,
  parseMetadataFromSource,
} from '@scripts/metadata/sourceParser';
import { beforeAll, describe, expect, it } from 'vitest';

let sharedData: Awaited<ReturnType<typeof loadSharedData>>;

beforeAll(async () => {
  sharedData = await loadSharedData();
});

const SPELL_SOURCE = [
  '---',
  'source: Ikuisuus',
  'contentType: spells',
  '---',
  '',
  '# Test Bolt',
  '',
  '> **Test Bolt**  ',
  '> _1st-level Evocation_  ',
  '> **Casting Time**: 1 Major Action  ',
  '> **Range**: [= 12 stride =]  ',
  '> **Components**: V, S  ',
  '> **Duration**: Instantaneous  ',
  '>',
  '> Make a ranged spell attack. On a hit, the target takes [% 1d8 fire %].',
  '',
].join('\n');

describe('kindOfPath', () => {
  it('should route by filename suffix and folder', () => {
    expect(kindOfPath('src/content/en/monsters/mucklord.sheet.mdx')).toBe(
      'monster',
    );
    expect(
      kindOfPath('src/content/en/items/heirlooms/nullbrand.heirloom.mdx'),
    ).toBe('heirloom');
    expect(
      kindOfPath('src/content/en/items/trinkets/lucky-coin.trinket.mdx'),
    ).toBe('trinket');
    expect(kindOfPath('src/content/en/spells/magic-missile.mdx')).toBe(
      'spell',
    );
    expect(kindOfPath('src/content/en/rules/main.mdx')).toBe('generic');
  });

  it('should tolerate backslash paths', () => {
    expect(kindOfPath('src\\content\\en\\spells\\fireball.mdx')).toBe('spell');
  });
});

describe('kindOfSource', () => {
  it('should honour a frontmatter extractor declaration', () => {
    const raw = ['---', 'extractor: spell', '---', '', '# X', ''].join('\n');
    expect(kindOfSource(raw, 'src/content/en/adventures/x.mdx')).toBe('spell');
  });

  it('should fall back to path detection for unknown extractors', () => {
    const raw = ['---', 'extractor: nonsense', '---', '', '# X', ''].join('\n');
    expect(kindOfSource(raw, 'src/content/en/spells/x.mdx')).toBe('spell');
    expect(kindOfSource(raw, 'src/content/en/rules/x.mdx')).toBe('generic');
  });

  it('should infer kind from frontmatter contentType without a path', () => {
    expect(kindOfSource(SPELL_SOURCE)).toBe('spell');
    const monster = ['---', 'contentType: monsters', '---', '', '# X'].join(
      '\n',
    );
    expect(kindOfSource(monster, '')).toBe('monster');
  });

  it('should resolve generic when neither frontmatter nor path decide', () => {
    const raw = ['---', 'source: Ikuisuus', '---', '', '# X'].join('\n');
    expect(kindOfSource(raw, '')).toBe('generic');
    const rules = ['---', 'contentType: rules', '---', '', '# X'].join('\n');
    expect(kindOfSource(rules, '')).toBe('generic');
  });

  it('should route parseMetadataFromSource through the declaration', () => {
    const raw = [
      '---',
      'extractor: spell',
      '---',
      '',
      '# Adventure Bolt',
      '',
      '> **Adventure Bolt**  ',
      '> _1st-level Evocation_  ',
      '> **Range**: [= 12 stride =]  ',
      '>',
      '> The target takes [% 1d8 fire %].',
      '',
    ].join('\n');

    const result = parseMetadataFromSource(
      raw,
      'src/content/en/adventures/some-quest/x.mdx',
      sharedData,
    );
    expect(result.kind).toBe('spell');
    expect((result.records[0] as { title: string }).title).toBe(
      'Adventure Bolt',
    );
  });
});

describe('parseMetadataFromSource', () => {
  it('should parse a spell buffer into one record', () => {
    const result = parseMetadataFromSource(
      SPELL_SOURCE,
      'src/content/en/spells/test-bolt.mdx',
      sharedData,
    );

    expect(result.kind).toBe('spell');
    expect(result.records).toHaveLength(1);
    const record = result.records[0] as Record<string, unknown>;
    expect(record.slug).toBe('test-bolt');
    expect(record.title).toBe('Test Bolt');
    expect(record.tags).toContain('damage:fire');
  });

  it('should parse a pathless buffer via a fallback stand-in path', () => {
    const result = parseMetadataFromSource(SPELL_SOURCE, '', sharedData);

    expect(result.kind).toBe('spell');
    expect(result.records).toHaveLength(1);
    const record = result.records[0] as Record<string, unknown>;
    expect(record.title).toBe('Test Bolt');
    expect(record.tags).toContain('damage:fire');
  });

  it('should fall back to generic tags for unknown kinds', () => {
    const raw = [
      '---',
      'source: Ikuisuus',
      '---',
      '',
      '# Some Rule',
      '',
      'Creatures take [% 2d6 fire %] and are knocked prone.',
      '',
    ].join('\n');

    const result = parseMetadataFromSource(
      raw,
      'src/content/en/rules/some-rule.mdx',
      sharedData,
    );

    expect(result.kind).toBe('generic');
    const record = result.records[0] as { tags: string[] };
    expect(record.tags).toContain('damage:fire');
  });

  it('should honour frontmatter denyAspects in the generic path', () => {
    const raw = [
      '---',
      'source: Ikuisuus',
      'denyAspects:',
      '  - damage:fire',
      '---',
      '',
      '# Some Rule',
      '',
      'Creatures take [% 2d6 fire %].',
      '',
    ].join('\n');

    const result = parseMetadataFromSource(
      raw,
      'src/content/en/rules/some-rule.mdx',
      sharedData,
    );

    const record = result.records[0] as { tags: string[] };
    expect(record.tags).not.toContain('damage:fire');
  });
});
