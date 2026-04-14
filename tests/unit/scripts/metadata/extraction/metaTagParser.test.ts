/**
 * Unit tests for the Meta Tag Parser.
 *
 * @module metaTagParser.test
 */

import {
    findMetaForFeature,
    parseMetaTags,
} from '@scripts/metadata/extraction/metaTagParser';
import { describe, expect, it } from 'vitest';

describe('parseMetaTags', () => {
  it('should extract a basic Meta directive', () => {
    const raw = `
#### Faterender (Costs 3 Actions)
<Meta target="generator" type="feature" featureId="war-godess-yskeia/faterender" customHandler="instant_death" />

Yskeia channels all of her power...
    `.trim();

    const directives = parseMetaTags(raw);
    expect(directives).toHaveLength(1);
    expect(directives[0].featureId).toBe('war-godess-yskeia/faterender');
    expect(directives[0].attrs.customHandler).toBe('instant_death');
  });

  it('should extract multiple directives', () => {
    const raw = `
<Meta target="generator" type="feature" featureId="slug/feat-a" customHandler="handler_a" />
<Meta target="generator" type="feature" featureId="slug/feat-b" notes="some note" />
    `.trim();

    const directives = parseMetaTags(raw);
    expect(directives).toHaveLength(2);
    expect(directives[0].featureId).toBe('slug/feat-a');
    expect(directives[1].featureId).toBe('slug/feat-b');
    expect(directives[1].attrs.notes).toBe('some note');
  });

  it('should skip tags without target="generator"', () => {
    const raw = `<Meta target="other" type="feature" featureId="slug/feat" />`;
    expect(parseMetaTags(raw)).toHaveLength(0);
  });

  it('should skip tags without type="feature"', () => {
    const raw = `<Meta target="generator" type="layout" featureId="slug/feat" />`;
    expect(parseMetaTags(raw)).toHaveLength(0);
  });

  it('should skip tags without featureId', () => {
    const raw = `<Meta target="generator" type="feature" customHandler="test" />`;
    expect(parseMetaTags(raw)).toHaveLength(0);
  });

  it('should not include target, type in attrs', () => {
    const raw = `<Meta target="generator" type="feature" featureId="slug/feat" customHandler="test" />`;
    const directives = parseMetaTags(raw);
    expect(directives[0].attrs).not.toHaveProperty('target');
    expect(directives[0].attrs).not.toHaveProperty('type');
    expect(directives[0].attrs).not.toHaveProperty('featureId');
    expect(directives[0].attrs.customHandler).toBe('test');
  });

  it('should handle multi-line Meta tags', () => {
    const raw = `
<Meta
  target="generator"
  type="feature"
  featureId="slug/feat"
  customHandler="summon"
  notes="spawns warlings" />
    `.trim();

    const directives = parseMetaTags(raw);
    expect(directives).toHaveLength(1);
    expect(directives[0].attrs.customHandler).toBe('summon');
    expect(directives[0].attrs.notes).toBe('spawns warlings');
  });

  it('should return empty array for content without Meta tags', () => {
    const raw = `
## Traits
**Cool Trait.** Does something cool.
    `.trim();
    expect(parseMetaTags(raw)).toHaveLength(0);
  });
});

describe('findMetaForFeature', () => {
  const directives = parseMetaTags(
    `
<Meta target="generator" type="feature" featureId="slug/alpha" customHandler="h1" />
<Meta target="generator" type="feature" featureId="slug/beta" customHandler="h2" />
  `.trim(),
  );

  it('should find a matching directive', () => {
    const match = findMetaForFeature(directives, 'slug/alpha');
    expect(match).toBeDefined();
    expect(match!.attrs.customHandler).toBe('h1');
  });

  it('should return undefined for non-matching ID', () => {
    expect(findMetaForFeature(directives, 'slug/gamma')).toBeUndefined();
  });
});
