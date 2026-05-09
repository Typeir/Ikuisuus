/**
 * @fileoverview Embed Panel Module Export Tests
 * @description Smoke tests for barrel exports.
 *
 * @module tests/unit/src/lib/components/ui/embedPanel/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { GenericEmbedPanel } from '@/lib/components/ui/embedPanel';
import type { GenericEmbedPanelProps } from '@/lib/components/ui/embedPanel';
import { describe, expect, it } from 'vitest';

describe('embedPanel module exports', () => {
  it('exports GenericEmbedPanel component', () => {
    expect(GenericEmbedPanel).toBeDefined();
    expect(typeof GenericEmbedPanel).toBe('function');
  });

  it('exports GenericEmbedPanelProps type', () => {
    // Type checks are compile-time; this verifies the import succeeds
    const _: GenericEmbedPanelProps = {
      url: null,
      locale: 'en',
      initialPosition: () => ({ x: 0, y: 0 }),
      handleLabel: 'Test',
    };
    expect(_).toBeDefined();
  });
});

