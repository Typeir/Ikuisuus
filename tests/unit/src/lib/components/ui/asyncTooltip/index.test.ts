/**
 * @fileoverview Smoke test for asyncTooltip barrel export.
 * @description Verifies that the asyncTooltip index re-exports correctly.
 *
 * @module tests/unit/src/lib/components/ui/asyncTooltip/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { AsyncTooltip } from '@/lib/components/ui/asyncTooltip';
import { describe, expect, it } from 'vitest';

describe('asyncTooltip/index barrel', () => {
  it('exports AsyncTooltip', () => {
    expect(AsyncTooltip).toBeDefined();
  });
});
