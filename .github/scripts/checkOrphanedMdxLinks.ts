/**
 * Orphaned MDX Links Check
 *
 * @fileoverview Scans MDX content links targeting /library routes and reports
 * links that do not resolve to a specific content file target.
 *
 * @module .github/scripts/check-orphaned-mdx-links
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { CONTENT_SUFFIXES } from '@/lib/constants/content';
import { getMatchingFiles } from '@/lib/utils/getMatchingFiles';
import { expandLibraryUrl } from '@/lib/md/libraryUrl';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CheckFailure,
  CheckOptions,
  CheckResult,
} from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const CONTENT_ROOT_REL = 'src/content';
const SUPPORTED_TARGET_EXTENSIONS = ['.sheet.mdx', '.mdx', '.md'];
const SEMANTIC_SUFFIXES: readonly string[] = CONTENT_SUFFIXES;

/**
 * Resolution state for a link target.
 */
type ResolvedState =
  | 'exact'
  | 'main'
  | 'unique-semantic'
  | 'ambiguous'
  | 'missing';

/**
 * Parsed link reference from a content file.
 *
 * @interface LinkReference
 * @property {number} line - 1-based line number
 * @property {string} rawTarget - Original link target text
 * @property {string} targetLocale - Resolved target locale
 * @property {string} slugPath - Slug path after /library/
 */
interface LinkReference {
  line: number;
  rawTarget: string;
  targetLocale: string;
  slugPath: string;
}

/**
 * Index of content files for link resolution.
 *
 * @interface ContentIndex
 * @property {Map<string, Set<string>>} exactSlugsByLocale - Locale → set of exact slugs
 * @property {Map<string, Map<string, string[]>>} fileNamesByLocaleDir - Locale → dir → filenames
 */
interface ContentIndex {
  exactSlugsByLocale: Map<string, Set<string>>;
  fileNamesByLocaleDir: Map<string, Map<string, string[]>>;
}

/**
 * Normalize path separators to POSIX style.
 *
 * @param {string} value - Path string
 * @returns Normalized path
 */
function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

/**
 * Strip a supported extension from a relative content path.
 *
 * @param {string} relativePath - Relative path with extension
 * @returns Relative path without extension
 */
function stripSupportedExtension(relativePath: string): string {
  for (const ext of SUPPORTED_TARGET_EXTENSIONS) {
    if (relativePath.endsWith(ext)) {
      return relativePath.slice(0, -ext.length);
    }
  }
  return relativePath;
}

/**
 * Build a locale-aware index of content files for link resolution.
 *
 * @param {string} rootDir - Project root
 * @returns Content index
 */
async function buildContentIndex(rootDir: string): Promise<ContentIndex> {
  const contentRoot = path.join(rootDir, CONTENT_ROOT_REL);
  const allFiles = await getMatchingFiles(
    contentRoot,
    /(?:\.sheet\.mdx|\.mdx|\.md)$/,
    true,
  );
  const exactSlugsByLocale = new Map<string, Set<string>>();
  const fileNamesByLocaleDir = new Map<string, Map<string, string[]>>();

  for (const absPath of allFiles) {
    const relFromRoot = toPosix(path.relative(rootDir, absPath));
    const match = /^src\/content\/([^/]+)\/(.+)$/.exec(relFromRoot);
    if (!match) continue;

    const locale = match[1];
    const relToLocale = match[2];
    const slug = stripSupportedExtension(relToLocale);
    const slugDir = path.posix.dirname(slug);
    const dirKey = slugDir === '.' ? '' : slugDir;
    const fileName = path.posix.basename(relToLocale);

    if (!exactSlugsByLocale.has(locale)) {
      exactSlugsByLocale.set(locale, new Set<string>());
    }
    exactSlugsByLocale.get(locale)!.add(slug);

    if (!fileNamesByLocaleDir.has(locale)) {
      fileNamesByLocaleDir.set(locale, new Map<string, string[]>());
    }
    if (!fileNamesByLocaleDir.get(locale)!.has(dirKey)) {
      fileNamesByLocaleDir.get(locale)!.set(dirKey, []);
    }
    fileNamesByLocaleDir.get(locale)!.get(dirKey)!.push(fileName);
  }

  return { exactSlugsByLocale, fileNamesByLocaleDir };
}

/**
 * Parse a raw URL-like target into locale and slug path.
 *
 * @param {string} target - Raw target from markdown or href
 * @param {string} sourceLocale - Locale inferred from current source file
 * @returns Parsed link route info or null when irrelevant
 */
function parseLibraryTarget(
  target: string,
  sourceLocale: string,
): { targetLocale: string; slugPath: string } | null {
  const firstToken = target.trim().replace(/^<|>$/g, '').split(/\s+/)[0];
  const cleaned = firstToken.split('#')[0].split('?')[0];

  if (!cleaned.startsWith('/')) return null;
  if (/^(\/\/|\/https?:|\/mailto:|\/tel:)/i.test(cleaned)) return null;

  const explicitLocaleMatch = /^\/([a-z]{2})\/library\/(.+)$/i.exec(cleaned);
  if (explicitLocaleMatch) {
    return {
      targetLocale: explicitLocaleMatch[1].toLowerCase(),
      slugPath: explicitLocaleMatch[2].replace(/\/+$/, ''),
    };
  }

  /* Shorthand: the renderer expands a bare root-relative path into a library
     route, so the same link has to validate as one. */
  const expanded = expandLibraryUrl(cleaned, sourceLocale);
  const shorthandMatch = /^\/([a-z]{2})\/library\/(.+)$/i.exec(expanded);
  if (!shorthandMatch) return null;

  return {
    targetLocale: shorthandMatch[1].toLowerCase(),
    slugPath: shorthandMatch[2].replace(/\/+$/, ''),
  };
}

/**
 * Extract library-targeting links from a markdown line.
 *
 * @param {string} lineText - One line of MDX content
 * @param {number} lineNumber - 1-based line number
 * @param {string} sourceLocale - Locale of the source file
 * @returns Extracted link references
 */
function extractLinksFromLine(
  lineText: string,
  lineNumber: number,
  sourceLocale: string,
): LinkReference[] {
  const refs: LinkReference[] = [];
  const markdownLinkRegex = /(!?)\[[^\]]*\]\(([^)]+)\)/g;
  const hrefRegex = /\bhref\s*=\s*["']([^"']+)["']/g;

  for (const match of lineText.matchAll(markdownLinkRegex)) {
    if (match[1] === '!') continue;
    const parsed = parseLibraryTarget(match[2], sourceLocale);
    if (parsed && parsed.slugPath.length > 0) {
      refs.push({
        line: lineNumber,
        rawTarget: match[2],
        targetLocale: parsed.targetLocale,
        slugPath: parsed.slugPath,
      });
    }
  }

  for (const match of lineText.matchAll(hrefRegex)) {
    const parsed = parseLibraryTarget(match[1], sourceLocale);
    if (parsed && parsed.slugPath.length > 0) {
      refs.push({
        line: lineNumber,
        rawTarget: match[1],
        targetLocale: parsed.targetLocale,
        slugPath: parsed.slugPath,
      });
    }
  }

  return refs;
}

/**
 * Resolve a slug target against indexed content.
 *
 * @param {ContentIndex} index - Content index
 * @param {string} locale - Target locale
 * @param {string} slugPath - Slug path after /library/
 * @returns Resolution state
 */
function resolveSlug(
  index: ContentIndex,
  locale: string,
  slugPath: string,
): ResolvedState {
  const exact = index.exactSlugsByLocale.get(locale);
  if (!exact) return 'missing';

  if (exact.has(slugPath)) return 'exact';
  if (exact.has(`${slugPath}/main`)) return 'main';

  const slugLeaf = path.posix.basename(slugPath);

  /* A folder-named index stands for its folder, the same rule the app's
     resolveIndexFile follows: `berserker/berserker.vocation.mdx` answers
     `…/vocations/berserker`. */
  const nestedNames = index.fileNamesByLocaleDir.get(locale)?.get(slugPath) ?? [];
  const hasFolderIndex = nestedNames.some((fileName) => {
    const stem = stemOf(fileName);
    if (stem === null) return false;
    return (
      stem === slugLeaf ||
      SEMANTIC_SUFFIXES.some((suffix) => stem === `${slugLeaf}${suffix}`)
    );
  });
  if (hasFolderIndex) return 'main';

  const slugDir = path.posix.dirname(slugPath);
  const dirKey = slugDir === '.' ? '' : slugDir;
  const fileNames = index.fileNamesByLocaleDir.get(locale)?.get(dirKey) ?? [];

  const semanticMatches = fileNames.filter((fileName) => {
    const stem = stemOf(fileName);
    if (stem === null) return false;
    return SEMANTIC_SUFFIXES.some((suffix) => stem === `${slugLeaf}${suffix}`);
  });

  if (semanticMatches.length === 1) return 'unique-semantic';
  return semanticMatches.length > 1 ? 'ambiguous' : 'missing';
}

/**
 * File stem without its supported extension, or null for other files.
 *
 * @param {string} fileName - Base file name
 * @returns {string | null} Stem, or null when the extension is unsupported
 */
function stemOf(fileName: string): string | null {
  const matchedExt = SUPPORTED_TARGET_EXTENSIONS.find((ext) =>
    fileName.endsWith(ext),
  );
  return matchedExt ? fileName.slice(0, -matchedExt.length) : null;
}

/**
 * Execute the orphaned-mdx-links check and return a structured result.
 * When options.rootDir is provided, uses that instead of auto-detected ROOT.
 * When options.readFile is provided, uses that instead of fs.readFile.
 *
 * @param {CheckOptions} [options] - Optional execution context from PAW gates
 * @returns Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const readFile =
    options?.readFile ??
    ((rel: string) => fs.readFile(path.join(rootDir, rel), 'utf-8'));
  const contentRoot = path.join(rootDir, CONTENT_ROOT_REL);
  const failures: CheckFailure[] = [];

  const index = await buildContentIndex(rootDir);
  const allMdxFiles = await getMatchingFiles(contentRoot, /\.mdx$/, true);
  const contentFiles = allMdxFiles
    .map((f) => toPosix(path.relative(rootDir, f)))
    .filter((f) => f.startsWith('src/content/'));

  for (const relPath of contentFiles) {
    const localeMatch = /^src\/content\/([^/]+)\//.exec(relPath);
    if (!localeMatch) continue;

    const sourceLocale = localeMatch[1].toLowerCase();
    const content = await readFile(relPath);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const refs = extractLinksFromLine(lines[i], i + 1, sourceLocale);
      for (const ref of refs) {
        const state = resolveSlug(index, ref.targetLocale, ref.slugPath);
        if (
          state === 'exact' ||
          state === 'main' ||
          state === 'unique-semantic'
        ) {
          continue;
        }

        failures.push({
          file: relPath,
          line: ref.line,
          rule:
            state === 'ambiguous'
              ? 'ambiguous-library-link-target'
              : 'missing-library-link-target',
          message:
            state === 'ambiguous'
              ? `Library link target is ambiguous: ${ref.rawTarget}`
              : `Library link target does not resolve: ${ref.rawTarget}`,
          suggestion:
            state === 'ambiguous'
              ? 'Use a specific semantic slug segment (for example, .specialization or .list)'
              : 'Point to an existing content slug or create the target content file',
          severity: 'warning',
        });
      }
    }
  }

  return {
    check: 'orphaned-mdx-links',
    severity: failures.length > 0 ? 'warning' : 'info',
    passed: failures.length === 0,
    failures,
    stats: {
      total_files_checked: contentFiles.length,
      violations_found: failures.length,
    },
  };
}

/**
 * Standalone entry point.
 */
async function main(): Promise<void> {
  const result = await runCheck();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  main().catch((err: Error) => {
    console.error('\u274c Fatal:', err.message);
    process.exit(1);
  });
}
