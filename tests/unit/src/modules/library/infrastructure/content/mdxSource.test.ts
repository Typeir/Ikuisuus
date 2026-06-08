/**
 * @fileoverview MDX Source Utility Tests
 * @description Tests for `extractHeadingBlock`, `extractFirstParagraph`, and
 * `buildShardsFromSource` from mdxSource.ts.
 *
 * @module tests/unit/lib/utils/mdxSource
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    buildShardsFromSource,
    extractFirstParagraph,
    extractHeadingBlock,
} from '@/modules/library/infrastructure/content/mdxSource';
import { describe, expect, it } from 'vitest';

const SAMPLE_MDX = `# Empyrean

Some intro text.

## Extended Reach

Your unarmed reach increases by 5 ft.

More detail here.

## Featherfall

You can cast featherfall once per day.

### Nested

This is nested under Featherfall.

## Third Boon

Last boon.
`;

describe('extractHeadingBlock', () => {
  it('returns the full block for a top-level heading', () => {
    const result = extractHeadingBlock(SAMPLE_MDX, 'Extended Reach');
    expect(result).not.toBeNull();
    expect(result).toContain('## Extended Reach');
    expect(result).toContain('Your unarmed reach increases by 5 ft.');
  });

  it('stops before the next same-level heading', () => {
    const result = extractHeadingBlock(SAMPLE_MDX, 'Featherfall');
    expect(result).not.toBeNull();
    expect(result).toContain('Featherfall');
    expect(result).toContain('Nested');
    expect(result).not.toContain('Third Boon');
  });

  it('is case-insensitive', () => {
    const result = extractHeadingBlock(SAMPLE_MDX, 'extended reach');
    expect(result).not.toBeNull();
  });

  it('returns null when heading is not found', () => {
    expect(extractHeadingBlock(SAMPLE_MDX, 'Nonexistent')).toBeNull();
  });

  it('handles CRLF line endings', () => {
    const crlf = SAMPLE_MDX.replace(/\n/g, '\r\n');
    const result = extractHeadingBlock(crlf, 'Extended Reach');
    expect(result).not.toBeNull();
    expect(result).toContain('Extended Reach');
  });

  it('trims trailing blank lines from the block', () => {
    const result = extractHeadingBlock(SAMPLE_MDX, 'Third Boon');
    expect(result).not.toBeNull();
    expect(result!.endsWith('Last boon.')).toBe(true);
  });
});

describe('extractFirstParagraph', () => {
  it('returns the first non-blank paragraph after the heading line', () => {
    const block =
      '## Extended Reach\n\nYour unarmed reach increases by 5 ft.\n\nMore detail.';
    expect(extractFirstParagraph(block)).toBe(
      'Your unarmed reach increases by 5 ft.',
    );
  });

  it('skips blank lines between heading and body', () => {
    const block = '## Boon\n\n\n\nFirst paragraph.';
    expect(extractFirstParagraph(block)).toBe('First paragraph.');
  });

  it('returns empty string when no body exists', () => {
    expect(extractFirstParagraph('## Heading only')).toBe('');
  });
});

describe('buildShardsFromSource', () => {
  it('builds shards with pre-populated cachedText', () => {
    const features = [{ level: 1, name: 'Extended Reach' }];
    const shards = buildShardsFromSource(
      'empyrean',
      'character-creation/bloodlines/empyrean.bloodline.mdx',
      SAMPLE_MDX,
      features,
      'boon',
    );
    expect(shards).toHaveLength(1);
    expect(shards[0].id).toBe('empyrean::1::Extended Reach');
    expect(shards[0].heading).toBe('Extended Reach');
    expect(shards[0].category).toBe('boon');
    expect(shards[0].level).toBe(1);
    expect(shards[0].cachedText).toContain('unarmed reach');
  });

  it('leaves cachedText undefined when heading is not found in source', () => {
    const features = [{ level: 1, name: 'Missing Feature' }];
    const shards = buildShardsFromSource(
      'voc',
      'file.mdx',
      SAMPLE_MDX,
      features,
      'vocation-feature',
    );
    expect(shards[0].cachedText).toBeUndefined();
  });

  it('sets the correct sourceFile on every shard', () => {
    const features = [
      { level: 1, name: 'Extended Reach' },
      { level: 3, name: 'Featherfall' },
    ];
    const shards = buildShardsFromSource(
      'emp',
      'some/file.mdx',
      SAMPLE_MDX,
      features,
      'boon',
    );
    expect(shards.every((s) => s.sourceFile === 'some/file.mdx')).toBe(true);
  });
});
