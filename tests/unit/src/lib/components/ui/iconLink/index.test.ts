/**
 * @fileoverview IconLink barrel re-export test
 * @module tests/unit/src/lib/components/ui/iconLink/index
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

import { IconLink } from '@/lib/components/ui/iconLink';
import { describe, expect, it } from 'vitest';

describe('iconLink barrel exports', () => {
  it('exports IconLink', () => {
    expect(IconLink).toBeTypeOf('function');
  });
});
