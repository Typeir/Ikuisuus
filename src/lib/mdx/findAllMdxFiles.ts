/**
 * @fileoverview MDX File Finder - Recursive directory scanner for MDX content files
 * @description Traverses directory trees to locate all .mdx files for static site generation.
 * Used by generateStaticParams() to build route manifests at compile time. Returns absolute
 * file paths for further processing by content loaders and metadata extractors.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs/promises
 * @requires path
 * 
 * @example
 * ```typescript
 * import { findAllMdxFiles } from '@/lib/mdx/findAllMdxFiles';
 * 
 * const mdxFiles = await findAllMdxFiles('/path/to/content/en');
 * // Returns: ['/path/to/content/en/monsters/albedo.sheet.mdx', ...]
 * ```
 */
import fs from "fs/promises";
import path from "path";
/**
 * Recursively finds all `.mdx` files in a directory.
 *
 * @param {string} dir - Directory path to search.
 * @returns {Promise<string[]>} Array of absolute paths to `.mdx` files.
 */
const findAllMdxFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return findAllMdxFiles(res);
      if (res.endsWith(".mdx")) return res;
      return [];
    })
  );
  return files.flat();
};

export default findAllMdxFiles;
