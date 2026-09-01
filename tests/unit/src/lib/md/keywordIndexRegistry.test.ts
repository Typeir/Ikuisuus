/**
 * @fileoverview keywordIndexRegistry Unit Tests
 * @description Tests produced-key extraction from frontmatter declarations.
 *
 * @module tests/unit/src/lib/md/keywordIndexRegistry.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordIndexRegistry Module under test
 */

import { extractProducedKeys } from '@/lib/md/keywordIndexRegistry';
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
});
