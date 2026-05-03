/**
 * @fileoverview Integration smoke test — fileTreeService
 */

import fileTreeService from '@/lib/db/content/fileTreeService';
import { describe, expect, it } from 'vitest';

describe('fileTreeService integration smoke', () => {
  it('exports the expected methods', () => {
    expect(typeof fileTreeService.listDirectory).toBe('function');
    expect(typeof fileTreeService.getFile).toBe('function');
    expect(typeof fileTreeService.statPath).toBe('function');
    expect(typeof fileTreeService.clearCache).toBe('function');
  });
});
