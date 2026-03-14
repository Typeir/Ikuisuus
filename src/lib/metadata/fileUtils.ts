/**
 * @fileoverview File Processing Utilities
 * @description Safe file I/O helpers for metadata generators. Wraps fs/promises
 * with structured logging and error handling.
 *
 * @module lib/metadata/fileUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

const log = createLogger({ component: 'metadata-file-utils' });

/**
 * Safely reads a file, returning null on failure.
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
 * Safely writes a file, returning success/failure.
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
 * Gets all files matching a pattern in a directory, excluding main.mdx.
 *
 * @param {string} directory - Directory to search
 * @param {RegExp} pattern - Pattern to match filenames against
 * @returns {Promise<string[]>} Matching file paths
 */
export async function getMatchingFiles(
  directory: string,
  pattern: RegExp,
): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() &&
          pattern.test(entry.name) &&
          entry.name !== 'main.mdx',
      )
      .map((entry) => path.join(directory, entry.name));
  } catch (error) {
    log.error(`Error reading directory ${directory}`, {
      error: (error as Error).message,
    });
    return [];
  }
}

/**
 * Ensures a directory exists, creating it recursively if necessary.
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
