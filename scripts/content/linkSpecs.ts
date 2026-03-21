/**
 * Link Specification Loader
 *
 * @fileoverview Shared JSON loading and validation utilities for link-driven
 * content scripts.
 *
 * @module content/linkSpecs
 * @version 1.0.0
 * @since 1.0.0
 */

import { readFile } from 'node:fs/promises';
import process from 'node:process';

/** Link specification entry */
export interface LinkSpec {
  /** Term or aliases to link */
  term: string | string[];
  /** Target URL path */
  path: string;
}

/**
 * Validates a parsed JSON payload as a LinkSpec array.
 *
 * @param data - Parsed JSON payload
 * @returns Strongly typed LinkSpec array
 */
export const parseLinkSpecs = (data: unknown): LinkSpec[] => {
  if (!Array.isArray(data)) {
    throw new Error('Links JSON must be an array.');
  }

  for (const [i, x] of data.entries()) {
    const termValid =
      typeof x?.term === 'string' ||
      (Array.isArray(x?.term) &&
        x.term.every((t: unknown) => typeof t === 'string'));
    if (!x || !termValid || typeof x.path !== 'string') {
      throw new Error(
        `Bad link spec at index ${i} — expected { term: string | string[], path: string }.`,
      );
    }
  }

  return data as LinkSpec[];
};

/**
 * Reads and validates link specs from a JSON file.
 *
 * @param file - Path to JSON file
 * @returns Parsed LinkSpec array
 */
export const readLinkSpecsFromFile = async (
  file: string,
): Promise<LinkSpec[]> => {
  const raw = await readFile(file, 'utf8');
  return parseLinkSpecs(JSON.parse(raw));
};

/**
 * Reads and validates link specs from stdin.
 *
 * @returns Parsed LinkSpec array
 */
export const readLinkSpecsFromStdin = async (): Promise<LinkSpec[]> => {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    throw new Error('No JSON on STDIN.');
  }
  return parseLinkSpecs(JSON.parse(raw));
};
