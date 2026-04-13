/**
 * @fileoverview Unit Tests — DirectorySourceAdapter
 * @description Validates the hexagonal port contract for directory source adapters.
 *
 * @module tests/unit/lib/db/content/directorySourceAdapter
 */

import type {
  DirectoryEntry,
  DirectorySourceAdapter,
} from '@/lib/db/content/directorySourceAdapter';
import { describe, expect, it, vi } from 'vitest';

describe('DirectorySourceAdapter', () => {
  it('a conforming adapter lists directory entries', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([
        { name: 'monsters', isDirectory: true },
        { name: 'goblin.sheet.mdx', isDirectory: false },
      ]),
    };

    const entries = await adapter.listEntries('en', '');

    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('monsters');
    expect(entries[0].isDirectory).toBe(true);
    expect(entries[1].name).toBe('goblin.sheet.mdx');
    expect(entries[1].isDirectory).toBe(false);
  });

  it('a conforming adapter returns empty array when path does not exist', async () => {
    const adapter: DirectorySourceAdapter = {
      listEntries: vi.fn().mockResolvedValue([]),
    };

    const entries = await adapter.listEntries('en', 'nonexistent/path');

    expect(entries).toEqual([]);
  });

  it('listEntries is called with the provided locale and path', async () => {
    const mockListEntries = vi.fn().mockResolvedValue([]);
    const adapter: DirectorySourceAdapter = { listEntries: mockListEntries };

    await adapter.listEntries('es', 'items/heirlooms');

    expect(mockListEntries).toHaveBeenCalledWith('es', 'items/heirlooms');
  });

  it('DirectoryEntry shape has name and isDirectory fields', () => {
    const dirEntry: DirectoryEntry = { name: 'monsters', isDirectory: true };
    const fileEntry: DirectoryEntry = {
      name: 'goblin.sheet.mdx',
      isDirectory: false,
    };

    expect(dirEntry.name).toBe('monsters');
    expect(dirEntry.isDirectory).toBe(true);
    expect(fileEntry.isDirectory).toBe(false);
  });

  it('adapter can be called with nested relative paths', async () => {
    const mockListEntries = vi.fn().mockResolvedValue([]);
    const adapter: DirectorySourceAdapter = { listEntries: mockListEntries };

    await adapter.listEntries('en', 'items/heirlooms/legendary');

    expect(mockListEntries).toHaveBeenCalledWith(
      'en',
      'items/heirlooms/legendary',
    );
  });
});
