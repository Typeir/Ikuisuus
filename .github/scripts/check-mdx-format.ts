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
import type { CheckFailure, CheckResult } from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'en');
const MDX_COMPONENTS_FILE = path.join(
  ROOT,
  'src',
  'lib',
  'components',
  'mdx',
  'mdxComponents.tsx',
);
const MDX_INDEX_FILE = path.join(
  ROOT,
  'src',
  'lib',
  'components',
  'mdx',
  'index.tsx',
);

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
 * Convert a PascalCase or camelCase component name to kebab-case.
 *
 * @param value Component name
 * @returns Kebab-cased string
 */
function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
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
    const base = path.basename(absPath).replace(/\.sheet\.mdx$|\.mdx$/, '');
    basenames.add(base.toLowerCase());
  }
  return basenames;
}

const RULES: FormatRule[] = [
  {
    name: 'non-kebab-filename',
    check: (_content: string, rel: string) =>
      /[A-Z_]/.test(path.basename(rel).replace(/\.sheet\.mdx$|\.mdx$/, '')),
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
      'Register the component in src/lib/components/mdx/index.tsx or use a registered component',
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
    message: 'Monster sheet missing Challenge Rating line',
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
 * Load component names auto-generated in mdxComponents.tsx and index.tsx.
 *
 * @returns Set of all known component names
 */
async function loadAutoGeneratedComponents(): Promise<Set<string>> {
  const names = new Set<string>();
  const readComponentsFile = async (
    filePath: string,
    pattern: RegExp,
  ): Promise<void> => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      for (const match of content.matchAll(pattern)) {
        names.add(match[1]);
      }
    } catch {
      // File may not exist yet; skip gracefully
    }
  };
  await readComponentsFile(MDX_COMPONENTS_FILE, /mdxComponents\["(\w+)"\]/g);
  return names;
}

/**
 * Load registered MDX component names from `export const components = { ... }`
 * in `src/lib/components/mdx/index.tsx`.
 *
 * @returns Set of registered component names that can appear as MDX tags
 */
async function loadRegisteredComponents(): Promise<Set<string>> {
  const names = new Set<string>();
  try {
    const content = await fs.readFile(MDX_INDEX_FILE, 'utf-8');
    const blockMatch = content.match(
      /export\s+const\s+components\s*=\s*\{([\s\S]*?)^\};/m,
    );
    const scope = blockMatch?.[1] ?? content;

    // Explicit keys: `Name: value,`
    for (const match of scope.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) {
      names.add(match[1]);
    }

    // Shorthand keys: `Name,`
    for (const match of scope.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*,\s*$/gm)) {
      names.add(match[1]);
    }
  } catch {
    // File may not exist yet; skip gracefully
  }

  // MDX component tags are PascalCase by convention. Lowercase tags (h1/table)
  // are handled by markdown parsing and are out of scope for this rule.
  return new Set([...names].filter((name) => /^[A-Z]/.test(name)));
}

/**
 * Load all known component names for dynamic component validation.
 *
 * @returns Set combining registered and auto-generated component names
 */
async function loadKnownComponents(): Promise<Set<string>> {
  const registered = await loadRegisteredComponents();
  const autoGenerated = await loadAutoGeneratedComponents();
  return new Set([...registered, ...autoGenerated]);
}

/**
 * Derive content type from a relative file path.
 *
 * @param relPath Relative path from content root
 * @returns Content type identifier string
 */
function getContentType(relPath: string): string {
  if (relPath.includes('monsters')) return 'monsters';
  if (relPath.includes('spells')) return 'spells';
  if (relPath.includes('items')) return 'items';
  if (relPath.includes('world')) return 'world';
  if (relPath.includes('rules')) return 'rules';
  if (relPath.includes('character-creation')) return 'character-creation';
  return 'other';
}

/**
 * Parse health-check ignore directives from the first 20 lines of a file.
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
  for (const match of head.matchAll(htmlPattern)) ignored.add(match[1]);
  for (const match of head.matchAll(mdxPattern)) ignored.add(match[1]);
  return ignored;
}

/**
 * Recursively find all MDX files under a directory.
 *
 * @param dir Directory to scan
 * @param results Accumulator
 * @returns Absolute file paths
 */
async function findMdxFiles(
  dir: string,
  results: string[] = [],
): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      await findMdxFiles(full, results);
    } else if (entry.name.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
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
      if (checkResult && checkResult !== false) {
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
 *
 * @returns Check result with any violations
 */
export async function runCheck(): Promise<CheckResult> {
  const allComponents = await loadKnownComponents();

  const files = await findMdxFiles(CONTENT_DIR);
  const contentBasenames = buildContentBasenameSet(files);
  const allFailures: CheckFailure[] = [];
  let criticalCount = 0;

  for (const absPath of files) {
    const content = await fs.readFile(absPath, 'utf-8');
    const relPath = path.relative(ROOT, absPath);
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
