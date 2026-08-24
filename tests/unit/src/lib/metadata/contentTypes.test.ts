/**
 * @fileoverview Unit tests for metadata content types
 * @module tests/unit/src/lib/metadata/contentTypes.test
 * @description Validates suffix extraction, suffix classification, ambiguity
 * handling, and frontmatter narrowing. Classification must never depend on the
 * folder a file lives in.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/lib/metadata/contentTypes
 */

import {
  AMBIGUOUS_SUFFIXES,
  CONTENT_TYPES,
  ClassificationKind,
  ContentType,
  classifyContent,
  contentTypeFromFrontmatter,
  isContentType,
  resolveContentType,
  suffixOf,
} from '@/lib/metadata/contentTypes';
import { describe, expect, it } from 'vitest';

describe('suffixOf', () => {
  it.each([
    ['en/spells/bane.spell.mdx', 'spell'],
    ['bane.spell.mdx', 'spell'],
    ['bane.spell', 'spell'],
    ['monsters/albedo.sheet.mdx', 'sheet'],
    ['items/tools/alchemy.tool.md', 'tool'],
  ])('extracts the suffix from %s', (path, expected) => {
    expect(suffixOf(path)).toBe(expected);
  });

  it.each([['spells/bane'], ['bane.mdx'], ['main.mdx'], ['conditions']])(
    'returns null for unsuffixed %s',
    (path) => {
      expect(suffixOf(path)).toBeNull();
    },
  );

  it('is unaffected by dots earlier in the path', () => {
    expect(suffixOf('campaigns/v1.2/spells/bane.spell.mdx')).toBe('spell');
  });
});

describe('classifyContent', () => {
  it.each([
    ['spells/bane.spell.mdx', ContentType.Spells],
    ['items/heirlooms/deep-dredge.heirloom.mdx', ContentType.Heirlooms],
    ['items/trinkets/torch.trinket.mdx', ContentType.Trinkets],
    ['character-creation/bloodlines/tallian.bloodline.mdx', ContentType.Bloodlines],
  ])('resolves %s', (path, expected) => {
    expect(classifyContent(path)).toEqual({
      kind: ClassificationKind.Resolved,
      contentType: expected,
      suffix: expect.any(String),
    });
  });

  it('reports .sheet as ambiguous, since several types share it', () => {
    expect(classifyContent('monsters/albedo.sheet.mdx')).toEqual({
      kind: ClassificationKind.Ambiguous,
      suffix: 'sheet',
    });
  });

  it.each([
    ['rules/steel-and-strife/conditions.rule.mdx', ContentType.Rules],
    ['world/plato-station.lore.mdx', ContentType.World],
    ['character-creation/feats/anima-warrior.feat.mdx', ContentType.Feats],
    ['items/tools/alchemy.tool.mdx', ContentType.Tools],
  ])('resolves %s by suffix', (path, expected) => {
    expect(classifyContent(path)).toEqual({
      kind: ClassificationKind.Resolved,
      contentType: expected,
      suffix: expect.any(String),
    });
  });

  it('reports an unknown suffix as untyped', () => {
    expect(classifyContent('spells/bane.wibble.mdx')).toEqual({
      kind: ClassificationKind.Untyped,
      suffix: 'wibble',
    });
  });

  it('reports an unsuffixed path as untyped with no suffix', () => {
    expect(classifyContent('spells/bane')).toEqual({
      kind: ClassificationKind.Untyped,
      suffix: null,
    });
  });

  it('classifies identically regardless of folder', () => {
    const inPlace = classifyContent('spells/bane.spell.mdx');
    const inCampaign = classifyContent(
      'campaigns/the-drowned-year/homebrew/bane.spell.mdx',
    );
    expect(inCampaign).toEqual(inPlace);
  });
});

describe('resolveContentType', () => {
  it('resolves an unambiguous suffix', () => {
    expect(resolveContentType('spells/bane.spell.mdx')).toBe(
      ContentType.Spells,
    );
  });

  it.each([
    ['monsters/albedo.sheet.mdx'],
    ['spells/bane.wibble.mdx'],
    ['spells/bane'],
  ])('returns null when the suffix cannot decide: %s', (path) => {
    expect(resolveContentType(path)).toBeNull();
  });
});

describe('contentTypeFromFrontmatter', () => {
  it.each(Object.values(ContentType))('accepts declared %s', (declared) => {
    expect(contentTypeFromFrontmatter(declared)).toBe(declared);
  });

  it.each([[undefined], [null], [''], ['wibbles'], [42], [{}]])(
    'rejects %s',
    (declared) => {
      expect(contentTypeFromFrontmatter(declared)).toBeNull();
    },
  );

  it('settles an ambiguous sheet', () => {
    const classification = classifyContent('monsters/albedo.sheet.mdx');
    expect(classification.kind).toBe(ClassificationKind.Ambiguous);
    expect(contentTypeFromFrontmatter('monsters')).toBe(ContentType.Monsters);
  });
});

describe('registries', () => {
  it('CONTENT_TYPES contains every enum member', () => {
    expect([...CONTENT_TYPES].sort()).toEqual(Object.values(ContentType).sort());
  });

  it('marks sheet as the ambiguous suffix', () => {
    expect([...AMBIGUOUS_SUFFIXES]).toEqual(['sheet']);
  });
});

describe('isContentType', () => {
  it.each(Object.values(ContentType))('accepts %s', (value) => {
    expect(isContentType(value)).toBe(true);
  });

  it.each([['wibbles'], ['sheets'], ['']])(
    'rejects %s',
    (value) => {
      expect(isContentType(value)).toBe(false);
    },
  );
});
