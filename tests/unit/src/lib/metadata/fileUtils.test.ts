/**
 * @fileoverview File Utilities Unit Tests
 * @description Tests for safe file I/O helpers with mocked fs.
 *
 * @module tests/unit/src/lib/metadata/fileUtils.test
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    ensureDirectory,
    safeReadFile,
    safeWriteFile,
} from '@scripts/metadata/fileUtils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
  },
}));

let fsMock: {
  readFile: ReturnType<typeof vi.fn>;
  writeFile: ReturnType<typeof vi.fn>;
  readdir: ReturnType<typeof vi.fn>;
  mkdir: ReturnType<typeof vi.fn>;
};

beforeEach(async () => {
  const fs = await import('fs/promises');
  fsMock = fs.default as unknown as typeof fsMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('safeReadFile', () => {
  it('should return file content on success', async () => {
    fsMock.readFile.mockResolvedValue('hello world');
    const result = await safeReadFile('/test/file.txt');
    expect(result).toBe('hello world');
    expect(fsMock.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf8');
  });

  it('should return null on read error', async () => {
    fsMock.readFile.mockRejectedValue(new Error('ENOENT'));
    const result = await safeReadFile('/missing.txt');
    expect(result).toBeNull();
  });

  it('should accept custom encoding', async () => {
    fsMock.readFile.mockResolvedValue('data');
    await safeReadFile('/test.txt', 'ascii');
    expect(fsMock.readFile).toHaveBeenCalledWith('/test.txt', 'ascii');
  });
});

describe('safeWriteFile', () => {
  it('should return true on success', async () => {
    fsMock.writeFile.mockResolvedValue(undefined);
    const result = await safeWriteFile('/out.txt', 'content');
    expect(result).toBe(true);
    expect(fsMock.writeFile).toHaveBeenCalledWith(
      '/out.txt',
      'content',
      'utf8',
    );
  });

  it('should return false on write error', async () => {
    fsMock.writeFile.mockRejectedValue(new Error('EACCES'));
    const result = await safeWriteFile('/readonly.txt', 'x');
    expect(result).toBe(false);
  });
});

describe('ensureDirectory', () => {
  it('should return true on success', async () => {
    fsMock.mkdir.mockResolvedValue(undefined);
    const result = await ensureDirectory('/new/dir');
    expect(result).toBe(true);
    expect(fsMock.mkdir).toHaveBeenCalledWith('/new/dir', { recursive: true });
  });

  it('should return false on error', async () => {
    fsMock.mkdir.mockRejectedValue(new Error('EPERM'));
    const result = await ensureDirectory('/protected');
    expect(result).toBe(false);
  });
});
