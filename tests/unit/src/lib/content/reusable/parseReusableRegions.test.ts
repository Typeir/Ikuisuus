/**
 * @fileoverview parseReusableRegions Unit Tests
 * @description Tests the frontmatter opt-in, named region extraction,
 * whole-body fallback with title and lede removal, and heading normalisation.
 *
 * @module tests/unit/lib/content/reusable/parseReusableRegions
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 *
 * @requires vitest Testing framework
 * @requires @/lib/content/reusable/parseReusableRegions Module under test
 */

import {
  normaliseHeadings,
  parseReusableRegions,
} from '@/lib/content/reusable/parseReusableRegions';
import { describe, expect, it } from 'vitest';

const START = '{/* reusable:start statBlock */}';
const END = '{/* reusable:end */}';

describe('parseReusableRegions', () => {
  describe('opt-in', () => {
    it('should not treat a file without the flag as reusable', () => {
      const doc = '---\ncontentType: spells\n---\n\n# Title\n\nbody';
      expect(parseReusableRegions(doc).isReusable).toBe(false);
    });

    it('should not treat a file without frontmatter as reusable', () => {
      expect(parseReusableRegions('# Title\n\nbody').isReusable).toBe(false);
    });

    it('should opt in on reusable: true', () => {
      const doc = '---\nreusable: true\n---\n\nbody';
      expect(parseReusableRegions(doc).isReusable).toBe(true);
    });

    it('should not opt in on reusable: false', () => {
      const doc = '---\nreusable: false\n---\n\nbody';
      expect(parseReusableRegions(doc).isReusable).toBe(false);
    });

    it('should return empty results when not opted in', () => {
      const result = parseReusableRegions('---\na: b\n---\n\n# T\n\nbody');
      expect(result.regions).toEqual({});
      expect(result.body).toBeNull();
    });
  });

  describe('heading offset', () => {
    it('should default to one', () => {
      const doc = '---\nreusable: true\n---\n\nbody';
      expect(parseReusableRegions(doc).headingOffset).toBe(1);
    });

    it('should read an explicit offset', () => {
      const doc = '---\nreusable: true\nheadingOffset: 2\n---\n\nbody';
      expect(parseReusableRegions(doc).headingOffset).toBe(2);
    });

    it('should accept a zero offset', () => {
      const doc = '---\nreusable: true\nheadingOffset: 0\n---\n\nbody';
      expect(parseReusableRegions(doc).headingOffset).toBe(0);
    });
  });

  describe('whole-body fallback', () => {
    it('should strip the title heading and flavour lede', () => {
      const doc = [
        '---',
        'reusable: true',
        'headingOffset: 0',
        '---',
        '',
        '# Lesser Mooncleave',
        '',
        'Flavour text that should not travel.',
        '',
        '---',
        '',
        '> **Lesser Mooncleave**',
      ].join('\n');

      const { body } = parseReusableRegions(doc);

      expect(body).toBe('> **Lesser Mooncleave**');
      expect(body).not.toContain('Flavour text');
      expect(body).not.toContain('# Lesser Mooncleave');
    });

    it('should keep the body when there is no title heading', () => {
      const doc = '---\nreusable: true\nheadingOffset: 0\n---\n\n<Collapsible>\n\ncontent';
      const { body } = parseReusableRegions(doc);
      expect(body).toContain('<Collapsible>');
      expect(body).toContain('content');
    });

    it('should keep content when a title has no lede separator', () => {
      const doc = '---\nreusable: true\nheadingOffset: 0\n---\n\n# Title\n\njust body';
      expect(parseReusableRegions(doc).body).toBe('just body');
    });

    it('should return null regions for a whole-body file', () => {
      const doc = '---\nreusable: true\n---\n\nbody';
      expect(parseReusableRegions(doc).regions).toEqual({});
    });
  });

  describe('named regions', () => {
    it('should extract a single named region', () => {
      const doc = [
        '---',
        'reusable: true',
        'headingOffset: 0',
        '---',
        '',
        '# Title',
        '',
        'lede',
        '',
        START,
        'the stat block',
        END,
        '',
        'trailing prose',
      ].join('\n');

      const { regions, body } = parseReusableRegions(doc);

      expect(regions.statBlock).toBe('the stat block');
      expect(body).toBeNull();
    });

    it('should exclude content outside the markers', () => {
      const doc = `---\nreusable: true\n---\n\nbefore\n\n${START}\ninside\n${END}\n\nafter`;
      expect(parseReusableRegions(doc).regions.statBlock).toBe('inside');
    });

    it('should extract multiple named regions', () => {
      const doc = [
        '---',
        'reusable: true',
        '---',
        '',
        '{/* reusable:start alpha */}',
        'first',
        END,
        '{/* reusable:start beta */}',
        'second',
        END,
      ].join('\n');

      const { regions } = parseReusableRegions(doc);

      expect(Object.keys(regions).sort()).toEqual(['alpha', 'beta']);
      expect(regions.alpha).toBe('first');
      expect(regions.beta).toBe('second');
    });

    it('should ignore an unterminated region rather than swallow the file', () => {
      const doc = `---\nreusable: true\n---\n\n${START}\nno end marker here`;
      const { regions, body } = parseReusableRegions(doc);

      expect(regions).toEqual({});
      expect(body).not.toBeNull();
    });

    it('should tolerate whitespace variance in markers', () => {
      const doc = `---\nreusable: true\n---\n\n{ /*  reusable:start  statBlock  */ }\nx\n{ /* reusable:end */ }`;
      expect(parseReusableRegions(doc).regions.statBlock).toBe('x');
    });
  });

  describe('normaliseHeadings', () => {
    it('should lift the shallowest heading to level one plus offset', () => {
      expect(normaliseHeadings('##### A', 0)).toBe('# A');
      expect(normaliseHeadings('##### A', 1)).toBe('## A');
    });

    it('should preserve relative structure', () => {
      const out = normaliseHeadings('##### A\n\n###### B', 1);
      expect(out).toContain('## A');
      expect(out).toContain('### B');
    });

    it('should leave text without headings untouched', () => {
      expect(normaliseHeadings('just prose', 2)).toBe('just prose');
    });

    it('should normalise a lone deep heading up to level one plus offset', () => {
      expect(normaliseHeadings('###### Deep', 3)).toBe('#### Deep');
    });

    it('should clamp when the shift would exceed level six', () => {
      const out = normaliseHeadings('# A\n\n###### B', 3);
      expect(out).toContain('#### A');
      expect(out).toContain('###### B');
    });

    it('should not treat a hash inside prose as a heading', () => {
      expect(normaliseHeadings('a # b', 1)).toBe('a # b');
    });

    it('should apply through the parser', () => {
      const doc = '---\nreusable: true\n---\n\n##### Selenic Boons\n\n###### Settled Shape';
      const { body } = parseReusableRegions(doc);

      expect(body).toContain('## Selenic Boons');
      expect(body).toContain('### Settled Shape');
    });
  });
});
