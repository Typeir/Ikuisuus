/**
 * @fileoverview File Processing Utilities
 * @description File I/O helpers wrapping fs/promises, returning null/false on error.
 *
 * @module scripts/metadata/fileUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

const log = createLogger({ component: 'metadata-file-utils' });

/**
 * Reads a file, returning null on error.
 *
 * @param {string} filePath - Path to the file
 * @param {BufferEncoding} [encoding='utf8'] - File encoding
 * @returns {Promise<string | null>} File content or null on error
 */
export async function safeReadFile(
  filePath: string,
  encoding: BufferEncoding = 'utf8',
): Promise<string | null> {
  try {
    return await fs.readFile(filePath, encoding);
  } catch (error) {
    log.error(`Error reading file ${filePath}`, {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Writes a file, returning true on success.
 *
 * @param {string} filePath - Path to write
 * @param {string} content - Content to write
 * @param {BufferEncoding} [encoding='utf8'] - File encoding
 * @returns {Promise<boolean>} True if successful
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  encoding: BufferEncoding = 'utf8',
): Promise<boolean> {
  try {
    await fs.writeFile(filePath, content, encoding);
    return true;
  } catch (error) {
    log.error(`Error writing file ${filePath}`, {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Creates a directory recursively; returns true if it exists or was created.
 *
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<boolean>} True if directory exists or was created
 */
export async function ensureDirectory(dirPath: string): Promise<boolean> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    log.error(`Error creating directory ${dirPath}`, {
      error: (error as Error).message,
    });
    return false;
  }
}
