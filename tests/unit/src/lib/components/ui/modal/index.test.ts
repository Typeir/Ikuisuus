/**
 * @fileoverview Tests for modal module barrel export
 * @module tests/unit/src/lib/components/ui/modal/index.test
 */

import { describe, it, expect } from 'vitest';
import { MobileModal } from '@/lib/components/ui/modal';

describe('Modal Module Exports', () => {
  it('exports MobileModal component', () => {
    expect(MobileModal).toBeDefined();
    expect(typeof MobileModal).toBe('object'); // React component
  });
});
