/**
 * @fileoverview Tests for SidebarActivePathStore
 * @module tests/unit/modules/navigation-sidebar/infrastructure/store/sidebarActivePath.test.ts
 */

import { describe, it, expect, vi } from 'vitest';
import SidebarActivePathStore from '@/modules/navigation-sidebar/infrastructure/store/sidebarActivePath';

describe('SidebarActivePathStore', () => {
  it('should create instance', () => {
    const store = new SidebarActivePathStore();
    expect(store).toBeDefined();
  });

  it('should subscribe to changes', () => {
    const store = new SidebarActivePathStore();
    const callback = vi.fn();
    store.subscribe(callback);
    store.set('/test/path');
    expect(callback).toHaveBeenCalled();
  });

  it('should get current path', () => {
    const store = new SidebarActivePathStore();
    store.set('/test/path');
    expect(store.get()).toBe('/test/path');
  });

  it('should count open paths', () => {
    const store = new SidebarActivePathStore();
    store.set('/test/path');
    const count = store.getOpenCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
