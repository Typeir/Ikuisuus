/**
 * @fileoverview Content Shard Resolver Unit Tests
 * @description Tests for `resolveShards` from contentShardResolver.ts.
 *
 * @module tests/unit/lib/utils/contentShardResolver
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { resolveShards } from '@/lib/utils/contentShardResolver';
import { describe, expect, it } from 'vitest';

/** Sample MDX file with a description section and two Collapsible boon blocks. */
const SAMPLE_MDX = `# Empyrean Bloodline

You descend from celestial beings of pure light.

<Collapsible heading="Extended Reach" bpCost={3}>

Your unarmed strikes gain +5 ft. reach.

Second paragraph of reach.

</Collapsible>

<Collapsible heading="Featherfall" bpCost={2}>

You fall safely from any height.

</Collapsible>
`;

/** Sample MDX that uses markdown headings instead of Collapsible. */
const HEADING_MDX = `# Berserker

A fierce warrior of the wilderness.

## Rage

While raging you gain bonus damage.

More rage text here.

## Unarmored Defense

When not wearing armor, your AC is better.
`;

describe('resolveShards', () => {
  describe('main key', () => {
    it('returns content before the first Collapsible', () => {
      const result = resolveShards(SAMPLE_MDX, [], ['main']);
      expect(result['main']).toContain('celestial beings');
      expect(result['main']).not.toContain('Extended Reach');
    });

    it('returns full content when no Collapsible is present', () => {
      const result = resolveShards(HEADING_MDX, [], ['main']);
      expect(result['main']).toContain('A fierce warrior');
      expect(result['main']).toContain('Rage');
    });
  });

  describe('line-range resolution', () => {
    it('extracts a boon by startLine/endLine and strips the heading line', () => {
      const lines = HEADING_MDX.split('\n');
      const rageStart = lines.findIndex((l) => l.startsWith('## Rage')) + 1;
      const rageEnd = lines.findIndex((l) =>
        l.startsWith('## Unarmored Defense'),
      );

      const entries = [
        { name: 'Rage', startLine: rageStart, endLine: rageEnd },
      ];
      const result = resolveShards(HEADING_MDX, entries, ['Rage']);

      expect(result['Rage']).not.toContain('## Rage');
      expect(result['Rage']).toContain('bonus damage');
      expect(result['Rage']).toContain('More rage text here.');
    });
  });

  describe('heading-text fallback', () => {
    it('resolves a named key by heading text when no line anchors exist', () => {
      const entries = [{ name: 'Rage' }];
      const result = resolveShards(HEADING_MDX, entries, ['Rage']);

      expect(result['Rage']).toContain('bonus damage');
      expect(result['Rage']).not.toContain('## Rage');
    });

    it('is case-insensitive when matching headings', () => {
      const entries = [{ name: 'rage' }];
      const result = resolveShards(HEADING_MDX, entries, ['rage']);
      expect(result['rage']).toContain('bonus damage');
    });

    it('strips HTML tags from heading line before matching', () => {
      const mdxWithSpan = `## Reinforced Joints <span>2 BP</span>\n\nYour joints are reinforced.\n`;
      const entries = [{ name: 'Reinforced Joints' }];
      const result = resolveShards(mdxWithSpan, entries, ['Reinforced Joints']);
      expect(result['Reinforced Joints']).toContain('joints are reinforced');
    });

    it('omits a key from the result when the heading is not found', () => {
      const entries = [{ name: 'Nonexistent Boon' }];
      const result = resolveShards(HEADING_MDX, entries, ['Nonexistent Boon']);
      expect(result['Nonexistent Boon']).toBeUndefined();
    });

    it('matches a feature name used as a suffix after a level prefix', () => {
      const levelPrefixMdx = `# Wizard\n\n## 5th Level \u2013 Memorize Spell\n\nYou can memorize any spell.\n\n## 9th Level \u2013 Arcane Mastery\n\nYou master the arcane arts.\n`;
      const entries = [{ name: 'Memorize Spell' }];
      const result = resolveShards(levelPrefixMdx, entries, ['Memorize Spell']);
      expect(result['Memorize Spell']).toContain('memorize any spell');
      expect(result['Memorize Spell']).not.toContain('Arcane Mastery');
    });
  });

  describe('key filtering', () => {
    it('resolves all entries plus main when keys is empty', () => {
      const entries = [{ name: 'Rage' }, { name: 'Unarmored Defense' }];
      const result = resolveShards(HEADING_MDX, entries);
      expect(result['main']).toBeDefined();
      expect(result['Rage']).toBeDefined();
      expect(result['Unarmored Defense']).toBeDefined();
    });

    it('resolves only requested keys', () => {
      const entries = [{ name: 'Rage' }, { name: 'Unarmored Defense' }];
      const result = resolveShards(HEADING_MDX, entries, ['Rage']);
      expect(result['Rage']).toBeDefined();
      expect(result['Unarmored Defense']).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('handles CRLF line endings', () => {
      const crlf = HEADING_MDX.replace(/\n/g, '\r\n');
      const entries = [{ name: 'Rage' }];
      const result = resolveShards(crlf, entries, ['Rage']);
      expect(result['Rage']).toContain('bonus damage');
    });

    it('returns empty object for empty content', () => {
      const result = resolveShards('', [], ['main']);
      expect(result['main']).toBe('');
    });
  });

  describe('anchor keys', () => {
    const entries = [
      { name: 'Rage', anchor: 'rage', startLine: 5, endLine: 9 },
      { name: 'Unarmored Defense', anchor: 'unarmored-defense', startLine: 11, endLine: 13 },
    ];

    it('resolves an anchor key to its entry range and echoes the key', () => {
      const result = resolveShards(HEADING_MDX, entries, ['unarmored-defense']);
      expect(result['unarmored-defense']).toContain('your AC is better');
      expect(result['unarmored-defense']).not.toContain('Rage');
    });

    it('still resolves a name key for older callers', () => {
      const result = resolveShards(HEADING_MDX, entries, ['Rage']);
      expect(result['Rage']).toContain('bonus damage');
    });

    it('slugs a name key when only anchors are known', () => {
      const result = resolveShards(HEADING_MDX, [{ name: 'x', anchor: 'unarmored-defense', startLine: 11, endLine: 13 }], ['Unarmored Defense']);
      expect(result['Unarmored Defense']).toContain('your AC is better');
    });
  });
});
