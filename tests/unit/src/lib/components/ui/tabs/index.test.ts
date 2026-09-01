/**
 * @fileoverview Tabs barrel re-export test
 * @description Smoke test ensuring `Tabs`, `TabList`, `Tab`, `TabPanel` are
 * re-exported from the index module.
 *
 * @module tests/unit/src/lib/components/ui/tabs/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import * as Tabs from '@/lib/components/ui/tabs';
import { describe, expect, it } from 'vitest';

describe('tabs barrel exports', () => {
  it('exports Tabs, TabList, Tab, TabPanel', () => {
    expect(Tabs.Tabs).toBeTypeOf('function');
    expect(Tabs.TabList).toBeTypeOf('function');
    expect(Tabs.Tab).toBeTypeOf('function');
    expect(Tabs.TabPanel).toBeTypeOf('function');
  });
});
