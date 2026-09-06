/**
 * @fileoverview Tests for the DataTable barrel.
 *
 * @module tests/unit/src/lib/components/ui/dataTable/index.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import * as barrel from '@/lib/components/ui/dataTable';
import { describe, expect, it } from 'vitest';

describe('dataTable barrel', () => {
  it('exports the component', () => {
    expect(typeof barrel.DataTable).toBe('function');
  });
});
