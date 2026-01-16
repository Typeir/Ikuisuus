/**
 * @fileoverview Tests for Sidebar Active Path Store
 * @module tests/unit/src/lib/components/sidebar/store/sidebarActivePath
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/components/sidebar/store/sidebarActivePath
 */

import { describe, it, expect, vi } from 'vitest';
import SidebarActivePathStore from '@/lib/components/sidebar/store/sidebarActivePath';

describe('SidebarActivePathStore', () => {
  describe('Class export', () => {
    it('should export default class', () => {
      expect(SidebarActivePathStore).toBeDefined();
      expect(typeof SidebarActivePathStore).toBe('function');
    });

    it('should be instantiable', () => {
      const store = new SidebarActivePathStore();
      expect(store).toBeInstanceOf(SidebarActivePathStore);
    });
  });

  describe('Store methods', () => {
    it('should have subscribe method', () => {
      const store = new SidebarActivePathStore();
      expect(typeof store.subscribe).toBe('function');
    });

    it('should have set method', () => {
      const store = new SidebarActivePathStore();
      expect(typeof store.set).toBe('function');
    });

    it('should have get method', () => {
      const store = new SidebarActivePathStore();
      expect(typeof store.get).toBe('function');
    });

    it('should have getOpenCount method', () => {
      const store = new SidebarActivePathStore();
      expect(typeof store.getOpenCount).toBe('function');
    });
  });

  describe('Store behavior', () => {
    it('should initialize with null value', () => {
      const store = new SidebarActivePathStore();
      expect(store.get()).toBeNull();
    });

    it('should update value on set', () => {
      const store = new SidebarActivePathStore();
      store.set('/test/path');
      expect(store.get()).toBe('/test/path');
    });

    it('should notify subscribers on set', () => {
      const store = new SidebarActivePathStore();
      const callback = vi.fn();
      
      store.subscribe(callback);
      expect(callback).toHaveBeenCalledWith(null);
      
      store.set('/new/path');
      expect(callback).toHaveBeenCalledWith('/new/path');
    });

    it('should return unsubscribe function', () => {
      const store = new SidebarActivePathStore();
      const callback = vi.fn();
      
      const unsubscribe = store.subscribe(callback);
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      store.set('/test');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should track subscriber count', () => {
      const store = new SidebarActivePathStore();
      expect(store.getOpenCount()).toBe(0);
      
      const unsubscribe1 = store.subscribe(() => {});
      expect(store.getOpenCount()).toBe(1);
      
      const unsubscribe2 = store.subscribe(() => {});
      expect(store.getOpenCount()).toBe(2);
      
      unsubscribe1();
      expect(store.getOpenCount()).toBe(1);
      
      unsubscribe2();
      expect(store.getOpenCount()).toBe(0);
    });

    it('should handle multiple subscribers', () => {
      const store = new SidebarActivePathStore();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      store.subscribe(callback1);
      store.subscribe(callback2);
      
      store.set('/shared/path');
      
      expect(callback1).toHaveBeenCalledWith('/shared/path');
      expect(callback2).toHaveBeenCalledWith('/shared/path');
    });

    it('should handle null values', () => {
      const store = new SidebarActivePathStore();
      store.set('/some/path');
      store.set(null);
      expect(store.get()).toBeNull();
    });
  });
});
