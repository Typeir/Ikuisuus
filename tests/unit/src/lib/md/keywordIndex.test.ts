/**
 * @fileoverview keywordIndex Unit Tests
 * @description Tests template id derivation for namespaced and bare references.
 *
 * @module tests/unit/src/lib/md/keywordIndex.test
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/keywordIndex Module under test
 */

import { BARE_NAMESPACE, keywordTemplateId } from '@/lib/md/keywordIndex';
import { describe, expect, it } from 'vitest';

describe('keywordTemplateId', () => {
  it('should derive a namespaced template id', () => {
    expect(keywordTemplateId('condition', 'blinded')).toBe(
      'kw-condition-blinded',
    );
  });

  it('should keep the namespace segment for a bare term', () => {
    expect(keywordTemplateId(undefined, 'accuracy')).toBe('kw--accuracy');
  });

  it('should treat the bare namespace and undefined alike', () => {
    expect(keywordTemplateId(BARE_NAMESPACE, 'accuracy')).toBe(
      keywordTemplateId(undefined, 'accuracy'),
    );
  });
});
