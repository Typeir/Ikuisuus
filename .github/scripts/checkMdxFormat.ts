/**
 * MDX Format Check
 *
 * @fileoverview Scans MDX content files for format violations: naming conventions,
 * structural issues, broken component usage, image path errors, and content
 * type-specific format rules (monster sheets, spells, heirlooms).
 *
 * @module .github/scripts/check-mdx-format
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGEX_CONTENT_SUFFIX } from '@/lib/constants/content';
import { toKebabCase } from '@/lib/utils/toKebabCase';
import { getMatchingFiles } from '@/lib/utils/getMatchingFiles';
import type {
  CheckFailure,
  CheckOptions,
  CheckResult,
} from './health-check-types';

/** Matches a content filename's extension together with any content-type suffix. */
const REGEX_CONTENT_FILE = new RegExp(
  `(${REGEX_CONTENT_SUFFIX.source.replace(/\$$/, '')})?\\.mdx$`,
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * Path segments relative to the project root that registry content renders
 * through.
 */
const SLOT_SCHEMA_SEGMENTS = [
  'src',
  'modules',
  'library',
  'domain',
  'slots.ts',
];

const SLOT_REGISTRY_SEGMENTS = [
  'src',
  'modules',
  'library',
  'presentation',
  'components',
  'slots',
  'index.ts',
];

const MDX_REGISTRY_SEGMENTS = [
  'src',
  'modules',
  'library',
  'presentation',
  'components',
  'index.tsx',
] as const;

/**
 * Callable that checks a file's content for a rule violation.
 */
type CheckFn = (content: string, rel: string) => boolean | string;

/**
 * A single MDX format rule definition.
 */
interface FormatRule {
  /** Rule identifier */
  name: string;
  /** Regex, function, or the sentinel string "__dynamic__" for component checks */
  check: RegExp | CheckFn | '__dynamic__';
  /** Default violation message */
  message: string;
  /** Fix suggestion */
  suggestion: string;
  /** Rule severity */
  severity: 'critical' | 'warning';
  /** Content types this rule applies to — omit to apply to all */
  appliesTo?: string[];
}

/**
 * Build a set of kebab-cased MDX basenames from discovered content files.
 *
 * @param files Absolute MDX file paths
 * @returns Set of kebab-cased file basenames (without extension)
 */
function buildContentBasenameSet(files: string[]): Set<string> {
  const basenames = new Set<string>();
  for (const absPath of files) {
    const base = path
      .basename(absPath)
      .replace(
        REGEX_CONTENT_FILE,
        '',
      );
    basenames.add(base.toLowerCase());
  }
  return basenames;
}

const RULES: FormatRule[] = [
  {
    name: 'non-kebab-filename',
    check: (_content: string, rel: string) =>
      /[A-Z_]/.test(
        path
          .basename(rel)
          .replace(
            REGEX_CONTENT_FILE,
            '',
          ),
      ),
    message: 'Filename is not kebab-case',
    suggestion:
      'Rename to kebab-case: lowercase letters, numbers, and hyphens only',
    severity: 'critical',
  },
  {
    name: 'fullsize-image-path',
    check: /src=["']\/full-size\//,
    message: 'Image references /full-size/ path — use /library/ path instead',
    suggestion: 'Change src="/full-size/..." to src="/library/..."',
    severity: 'critical',
  },
  {
    name: 'raw-img-tag',
    check: /<img\s/,
    message: 'Raw <img> tag — use <Image> or <BlendedImage> component',
    suggestion: 'Replace <img> with the Image or BlendedImage MDX component',
    severity: 'critical',
  },
  {
    name: 'unregistered-component',
    check: '__dynamic__',
    message: 'Uses unregistered MDX component',
    suggestion:
      'Register the component in src/modules/library/presentation/components/index.tsx or use a registered component',
    severity: 'critical',
  },
  {
    name: 'missing-h1',
    check: (content: string, rel: string) =>
      !path.basename(rel).startsWith('main') && !content.match(/^#\s+.+/m),
    message: 'Missing top-level heading (# Title)',
    suggestion: 'Add a # heading as the first line of the file',
    severity: 'warning',
  },
  {
    name: 'multiple-h1',
    check: (content: string) => {
      const h1s = content.match(/^#\s+.+/gm);
      return h1s !== null && h1s.length > 1;
    },
    message: 'Multiple # headings — only one H1 per file',
    suggestion: 'Use ## or lower for subsequent sections',
    severity: 'warning',
    appliesTo: ['spells', 'world', 'items'],
  },
  {
    name: 'color-literal-in-mdx',
    check: /style=["'][^"']*#[0-9a-fA-F]{3,8}/,
    message: 'Inline color literal in style attribute',
    suggestion:
      'Use CSS variables via className instead of inline color styles',
    severity: 'warning',
  },
  {
    name: 'hardcoded-locale-path',
    check: /\]\(\/es\/|\]\(\/fi\//,
    message: 'Hardcoded non-English locale prefix in link path',
    suggestion: 'Use /en/library/... paths; es/fi content does not exist yet',
    severity: 'warning',
  },
  {
    name: 'empty-blockquote',
    check: (content: string) => {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/^>\s*$/.test(lines[i])) {
          const prev = i > 0 ? lines[i - 1] : '';
          const next = i < lines.length - 1 ? lines[i + 1] : '';
          if (!prev.startsWith('>') && !next.startsWith('>')) return true;
        }
      }
      return false;
    },
    message:
      'Isolated empty blockquote line (not part of multi-line blockquote)',
    suggestion:
      'Remove orphaned > lines or connect them to adjacent blockquote content',
    severity: 'warning',
  },
  {
    name: 'missing-alt-text',
    check: /<Image[^>]*alt=["']["']/,
    message: 'Image component with empty alt text',
    suggestion: 'Provide descriptive alt text for accessibility',
    severity: 'warning',
  },
  {
    name: 'monster-sheet-missing-stat-table',
    check: (content: string, rel: string) =>
      rel.endsWith('.sheet.mdx') &&
      !content.match(/\|\s*\*{0,2}STR\*{0,2}\s*\|/),
    message: 'Monster sheet missing ability score table (| STR | DEX | ...)',
    suggestion: 'Add the standard 6-ability stat table',
    severity: 'critical',
    appliesTo: ['monsters'],
  },
  {
    name: 'monster-sheet-missing-cr',
    check: (content: string, rel: string) =>
      rel.endsWith('.sheet.mdx') && !content.match(/\*\*Challenge\*\*.*\d/),
    message: 'Monster sheet missing Challenge line',
    suggestion: 'Add **Challenge**: X (Y XP) line',
    severity: 'warning',
    appliesTo: ['monsters'],
  },
  {
    name: 'spell-missing-blockquote-stat-block',
    check: (content: string) => !content.match(/^>\s+\*\*/m),
    message: 'Spell file missing blockquote stat block (> **Spell Name**)',
    suggestion:
      'Spell files should contain a blockquote (>) section with the spell stat block',
    severity: 'warning',
    appliesTo: ['spells'],
  },
];

/**
 * Component names the slot schema generates. The registry spreads
 * `slotComponents`, whose keys are derived from the slot tables at runtime, so
 * a regex over the registry cannot see them. Reading the schema is how those
 * names become visible to a static check.
 *
 * @param {string} schemaFile - Path to the slot schema
 * @param {string} registryFile - Path to the slot component registry
 * @returns Set of element and block component names, empty when unreadable
 */
async function loadSlotComponents(
  schemaFile: string,
  registryFile: string,
): Promise<Set<string>> {
  const names = new Set<string>();

  let registry = '';
  try {
    registry = await fs.readFile(registryFile, 'utf-8');
  } catch {
    registry = '';
  }
  const registryBlock = registry.match(
    /slotComponents:\s*Record<string,\s*unknown>\s*=\s*\{([\s\S]*?)^\};/m,
  );
  for (const match of (registryBlock?.[1] ?? '').matchAll(
    /^\s*([A-Z][\w$]*)\s*,\s*$/gm,
  )) {
    names.add(match[1]);
  }

  let content: string;
  try {
    content = await fs.readFile(schemaFile, 'utf-8');
  } catch {
    return names;
  }

  /* Every slot table maps a slot name to its authored element name, and the
     schema file holds nothing else shaped that way. */
  for (const match of content.matchAll(/:\s*'([A-Z][\w$]*)'/g)) {
    names.add(match[1]);
  }

  const blocks = content.match(
    /BLOCK_COMPONENTS\s*=\s*\[([\s\S]*?)\]/,
  );
  for (const match of (blocks?.[1] ?? '').matchAll(/'([A-Z][\w$]*)'/g)) {
    names.add(match[1]);
  }

  return names;
}

/**
 * Load registered MDX component names from `export const components = { ... }`
 * in the live registry.
 *
 * Throws when the registry cannot be read or yields nothing.
 *
 * @param {string} indexFile - Path to the registry index.tsx
 * @returns Set of registered component names that can appear as MDX tags
 * @throws {Error} When the registry is missing, moved, or parses to no components
 */
async function loadRegisteredComponents(
  indexFile: string,
): Promise<Set<string>> {
  let content: string;
  try {
    content = await fs.readFile(indexFile, 'utf-8');
  } catch {
    throw new Error(
      `MDX component registry not readable at ${indexFile}. ` +
        'Update MDX_REGISTRY_SEGMENTS if the registry moved.',
    );
  }

  const names = new Set<string>();
  const blockMatch = content.match(
    /export\s+const\s+components\s*=\s*\{([\s\S]*?)^\};/m,
  );
  const scope = blockMatch?.[1] ?? content;

  for (const match of scope.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) {
    names.add(match[1]);
  }

  for (const match of scope.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*,\s*$/gm)) {
    names.add(match[1]);
  }

  const registered = new Set(
    [...names].filter((name) => /^[A-Z]/.test(name)),
  );

  if (registered.size === 0) {
    throw new Error(
      `MDX component registry at ${indexFile} parsed to zero components. ` +
        'The `export const components = { ... }` shape likely changed.',
    );
  }

  return registered;
}

/**
 * Derive content type from a relative file path.
 *
 * Matches on path segments (e.g. `/spells/`), not basenames.
 *
 * @param relPath Relative path from project root
 * @returns Content type identifier string
 */
function getContentType(relPath: string): string {
  if (relPath.includes('/monsters/')) return 'monsters';
  if (relPath.includes('/spells/')) return 'spells';
  if (relPath.includes('/items/')) return 'items';
  if (relPath.includes('/world/')) return 'world';
  if (relPath.includes('/rules/')) return 'rules';
  if (relPath.includes('/character-creation/')) return 'character-creation';
  return 'other';
}

/**
 * Parse health-check ignore directives from the first 20 lines of a file.
 *
 * Recognizes three directive formats:
 *   <!-- health:check-ignore <rule> -->
 *   {/* health:check-ignore <rule> *\/}
 *   {/* paw:gate:content-format:<rule-key> ignore *\/}
 *
 * @param content MDX file content
 * @returns Set of rule names that should be ignored
 */
function getIgnoredRules(content: string): Set<string> {
  const ignored = new Set<string>();
  const head = content.split('\n').slice(0, 20).join('\n');
  const htmlPattern =
    /<!---?\s*health:check-ignore\s+([a-z0-9-]+?)(?:\s*)--+>/gi;
  const mdxPattern = /\{\/\*\s*health:check-ignore\s+([a-z0-9-]+)\s*\*\/\}/gi;
  // paw:gate:content-format:<rule> ignore  (e.g. "paw:gate:content-format:missing-h1 ignore")
  const pawGatePattern = /\{\/\*\s*paw:gate:content-format:([a-z0-9-]+)\s+ignore\s*\*\/\}/gi;
  for (const match of head.matchAll(htmlPattern)) ignored.add(match[1]);
  for (const match of head.matchAll(mdxPattern)) ignored.add(match[1]);
  for (const match of head.matchAll(pawGatePattern)) ignored.add(match[1]);
  return ignored;
}

/**
 * Recursively find all MDX files under a directory, skipping hidden folders.
 *
 * @param dir Directory to scan
 * @returns Absolute file paths
 */
async function findMdxFiles(dir: string): Promise<string[]> {
  const files = await getMatchingFiles(dir, /\.mdx$/, true);
  const hiddenSegment = /(^|[\\/])\.[^\\/]*[\\/]/;
  return files.filter((file) => !hiddenSegment.test(file));
}
/**
 * Check all applicable rules against a single MDX file.
 *
 * @param absPath Absolute file path
 * @param content File content
 * @param relPath Relative path from project root
 * @param allComponents Known MDX component names
 * @returns Array of violations found
 */
function checkFile(
  absPath: string,
  content: string,
  relPath: string,
  allComponents: Set<string>,
  contentBasenames: Set<string>,
): CheckFailure[] {
  const contentType = getContentType(relPath);
  const ignoredRules = getIgnoredRules(content);
  const violations: CheckFailure[] = [];

  for (const rule of RULES) {
    if (ignoredRules.has(rule.name)) continue;
    if (rule.appliesTo && !rule.appliesTo.includes(contentType)) continue;

    let triggered = false;
    let detail = '';

    if (rule.check === '__dynamic__') {
      const componentRegex = /<([A-Z][A-Za-z]+)[\s/>]/g;
      for (const match of content.matchAll(componentRegex)) {
        const componentName = match[1];
        const kebabEquivalent = toKebabCase(componentName);
        const hasContentEquivalent = contentBasenames.has(kebabEquivalent);
        if (!allComponents.has(componentName) && !hasContentEquivalent) {
          triggered = true;
          detail = `Unregistered component: <${componentName}>`;
          break;
        }
      }
    } else if (typeof rule.check === 'function') {
      const checkResult = rule.check(content, relPath);
      if (checkResult) {
        triggered = true;
        detail = typeof checkResult === 'string' ? checkResult : '';
      }
    } else if (rule.check instanceof RegExp) {
      triggered = rule.check.test(content);
    }

    if (triggered) {
      violations.push({
        file: relPath.replace(/\\/g, '/'),
        rule: rule.name,
        message: detail || rule.message,
        suggestion: rule.suggestion,
        severity: rule.severity,
      });
    }
  }

  return violations;
}

/**
 * Execute the mdx-format check and return a structured result.
 * When options.rootDir is provided, uses that instead of auto-detected ROOT.
 * When options.readFile is provided, uses that instead of fs.readFile.
 *
 * @param {CheckOptions} [options] - Optional execution context from PAW gates
 * @returns Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const contentDir = path.join(rootDir, 'src', 'content', 'en');
  const readFile =
    options?.readFile ??
    ((rel: string) => fs.readFile(path.join(rootDir, rel), 'utf-8'));
  const allComponents = await loadRegisteredComponents(
    path.join(rootDir, ...MDX_REGISTRY_SEGMENTS),
  );
  for (const name of await loadSlotComponents(
    path.join(rootDir, ...SLOT_SCHEMA_SEGMENTS),
    path.join(rootDir, ...SLOT_REGISTRY_SEGMENTS),
  )) {
    allComponents.add(name);
  }

  const files = await findMdxFiles(contentDir);
  const contentBasenames = buildContentBasenameSet(files);
  const allFailures: CheckFailure[] = [];
  let criticalCount = 0;

  for (const absPath of files) {
    const relPath = path.relative(rootDir, absPath).replace(/\\/g, '/');
    const content = await readFile(relPath);
    const violations = checkFile(
      absPath,
      content,
      relPath,
      allComponents,
      contentBasenames,
    );
    for (const v of violations) {
      allFailures.push(v);
      if (v.severity === 'critical') criticalCount++;
    }
  }

  return {
    check: 'mdx-format',
    severity: criticalCount > 0 ? 'critical' : 'warning',
    passed: allFailures.length === 0,
    failures: allFailures,
    stats: {
      total_files_checked: files.length,
      violations_found: allFailures.length,
      critical_violations: criticalCount,
      warning_violations: allFailures.length - criticalCount,
    },
  };
}

/**
 * Standalone entry point.
 */
async function main(): Promise<void> {
  const result = await runCheck();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.stats.critical_violations > 0 ? 1 : 0);
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
