/**
 * @fileoverview keywordIndexRegistry Unit Tests
 * @description Tests produced-key extraction from frontmatter declarations,
 * including a term borne by a heading of another name.
 *
 * @module tests/unit/src/lib/md/keywordIndexRegistry.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordIndexRegistry Module under test
 */

import {
  bearingAnchor,
  declaredTerms,
  extractProducedKeys,
} from '@/lib/md/keywordIndexRegistry';
import { describe, expect, it } from 'vitest';

describe('extractProducedKeys', () => {
  it('should key every declared term by its shard id', () => {
    const source = [
      '---',
      'keywords:',
      '  - briefly',
      '  - resist',
      '---',
      '',
      '### Briefly',
      '',
      '### Resist',
    ].join('\n');

    expect(extractProducedKeys(source)).toEqual(['kw--briefly', 'kw--resist']);
  });

  it('should key every heading under a declared namespace', () => {
    const source = [
      '---',
      'keywordIndex: condition',
      '---',
      '',
      '## Prone',
      '',
      '## Blinded',
    ].join('\n');

    expect(extractProducedKeys(source)).toEqual([
      'kw-condition-blinded',
      'kw-condition-prone',
    ]);
  });

  it('should skip a declared term with no matching heading', () => {
    const source = ['---', 'keywords:', '  - resist', '---', '', '### Briefly'].join(
      '\n',
    );

    expect(extractProducedKeys(source)).toEqual([]);
  });

  it('should return nothing when the file declares nothing', () => {
    const source = ['---', 'contentType: rules', '---', '', '## Prone'].join('\n');

    expect(extractProducedKeys(source)).toEqual([]);
  });

  it('should meet a consumer key for a multi-word term', () => {
    const source = [
      '---',
      'keywords:',
      '  - damage bonus',
      '---',
      '',
      '## Damage Bonus',
    ].join('\n');

    expect(extractProducedKeys(source)).toEqual(['kw--damage-bonus']);
  });

  it('should key a term by its own name when a heading of another name bears it', () => {
    const source = [
      '---',
      'keywords:',
      '  - disposition: Disposition, Reputation and Attitude',
      '---',
      '',
      '# Disposition, Reputation and Attitude',
    ].join('\n');

    expect(extractProducedKeys(source)).toEqual(['kw--disposition']);
  });

  it('should skip a borne term whose bearing heading is absent', () => {
    const source = [
      '---',
      'keywords:',
      '  - disposition: Disposition and Reputation',
      '---',
      '',
      '# Disposition, Reputation and Attitude',
    ].join('\n');

    expect(extractProducedKeys(source)).toEqual([]);
  });

  it('should key plain and borne terms side by side', () => {
    const source = [
      '---',
      'keywords:',
      '  - disposition: The Whole Track',
      '  - the track',
      '---',
      '',
      '# The Whole Track',
      '',
      '## The Track',
    ].join('\n');

    expect(extractProducedKeys(source)).toEqual([
      'kw--disposition',
      'kw--the-track',
    ]);
  });
});

describe('declaredTerms', () => {
  it('should read a plain term as its own bearer', () => {
    expect(declaredTerms(['resist'])).toEqual([
      { term: 'resist', heading: 'resist' },
    ]);
  });

  it('should read a mapping as a term with another bearer', () => {
    expect(declaredTerms([{ disposition: 'Disposition, Reputation' }])).toEqual([
      { term: 'disposition', heading: 'Disposition, Reputation' },
    ]);
  });

  it('should read a comma-separated string', () => {
    expect(declaredTerms('briefly, resist')).toEqual([
      { term: 'briefly', heading: 'briefly' },
      { term: 'resist', heading: 'resist' },
    ]);
  });

  it('should ignore a declaration that is neither', () => {
    expect(declaredTerms(undefined)).toEqual([]);
  });
});

describe('bearingAnchor', () => {
  const source = [
    '---',
    'keywords:',
    '  - disposition: Disposition, Reputation and Attitude',
    '  - the track',
    '---',
    '',
    '# Disposition, Reputation and Attitude',
  ].join('\n');

  it('should remap a term to the heading that bears it', () => {
    expect(bearingAnchor(source, 'disposition')).toBe(
      'disposition-reputation-and-attitude',
    );
  });

  it('should leave a plainly declared term alone', () => {
    expect(bearingAnchor(source, 'the-track')).toBe('the-track');
  });

  it('should leave an undeclared anchor alone', () => {
    expect(bearingAnchor(source, 'blinded')).toBe('blinded');
  });
});
