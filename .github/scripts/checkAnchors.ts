/**
 * @fileoverview Anchor coverage check
 * @description Compares generator anchors to rendered elements; gaps are warnings.
 *
 * @module .github/scripts/checkAnchors
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

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

/** Content folders whose sidecars carry anchored shards, with the shard fields to read. */
const KINDS: Array<{ dir: string[]; suffix: RegExp; fields: string[] }> = [
  { dir: ['monsters'], suffix: /\.sheet\.mdx$/, fields: ['features'] },
  {
    dir: ['character-creation', 'bloodlines'],
    suffix: /\.bloodline\.mdx$/,
    fields: ['boons', 'features'],
  },
  { dir: ['character-creation', 'vocations'], suffix: /main\.mdx$/, fields: ['features'] },
  {
    dir: ['character-creation', 'vocations'],
    suffix: /\.specialization\.mdx$/,
    fields: ['features'],
  },
  { dir: ['character-creation', 'feats'], suffix: /\.mdx$/, fields: ['features'] },
];

/**
 * Walks a directory for files matching a suffix.
 *
 * @param {string} dir - Directory to walk
 * @param {RegExp} suffix - File name test
 * @returns {Promise<string[]>} Absolute file paths
 */
async function walk(dir: string, suffix: RegExp): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, suffix)));
    else if (suffix.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Sidecar path of a content file.
 *
 * @param {string} file - `.mdx` path
 * @returns {string} `.metadata.json` path
 */
function sidecarOf(file: string): string {
  return file
    .replace(/\.(sheet|bloodline|specialization)\.mdx$/, '.metadata.json')
    .replace(/\.mdx$/, '.metadata.json');
}

/**
 * Extracts anchors from sidecar shards.
 *
 * @param {unknown} sidecar - Parsed sidecar (record or record array)
 * @param {string[]} fields - Shard fields to read
 * @returns {Set<string>} Anchors
 */
function extractorAnchors(sidecar: unknown, fields: string[]): Set<string> {
  const anchors = new Set<string>();
  const records = Array.isArray(sidecar) ? sidecar : [sidecar];
  for (const record of records) {
    if (!record || typeof record !== 'object') continue;
    for (const field of fields) {
      const shards = (record as Record<string, unknown>)[field];
      if (!Array.isArray(shards)) continue;
      for (const shard of shards) {
        const anchor = (shard as { anchor?: unknown })?.anchor;
        if (typeof anchor === 'string' && anchor) anchors.add(anchor);
        const subs = (shard as { subOptions?: unknown[] })?.subOptions;
        for (const sub of subs ?? []) {
          const a = (sub as { anchor?: unknown })?.anchor;
          if (typeof a === 'string' && a) anchors.add(a);
        }
      }
    }
  }
  return anchors;
}

/**
 * Extracts rendered anchors from compiled MDX sections and Collapsible headings.
 *
 * @param {string} source - MDX source
 * @returns {Promise<Set<string>>} Rendered anchors
 */
async function renderedAnchors(source: string): Promise<Set<string>> {
  const [{ compile }, remarkGfm, sectionize, { headingAnchor }] = await Promise.all([
    import('@mdx-js/mdx'),
    import('remark-gfm').then((m) => m.default),
    import('@/modules/library/infrastructure/compile/rehypeSectionize').then(
      (m) => m.default,
    ),
    import('@/modules/library/infrastructure/compile/rehypeSectionize'),
  ]);
  const found = new Set<string>();
  const collect = () => (tree: { children: unknown[] }) => {
    const walkNode = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const n = node as {
        type?: string;
        tagName?: string;
        data?: { slug?: string };
        children?: unknown[];
      };
      if (n.data?.slug) found.add(n.data.slug);
      if (n.type === 'mdxJsxFlowElement') {
        const lead = n.children?.[0] as { type?: string; tagName?: string } | undefined;
        if (lead?.type === 'element' && /^h[1-6]$/.test(lead.tagName ?? '')) {
          found.add(headingAnchor(lead as never));
        }
      }
      for (const child of n.children ?? []) walkNode(child);
    };
    walkNode(tree);
  };
  await compile(source.replace(/^---[\s\S]*?---\r?\n/, ''), {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [sectionize, collect],
  });
  return found;
}

/**
 * Runs the anchor coverage check.
 *
 * @param {CheckOptions} [options] - Optional root override
 * @returns {Promise<CheckResult>} Result with one failure per uncovered anchor
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const contentRoot = path.join(rootDir, 'src', 'content', 'en');
  const failures: CheckFailure[] = [];
  let files = 0;
  let anchors = 0;
  let compileErrors = 0;

  for (const kind of KINDS) {
    const dir = path.join(contentRoot, ...kind.dir);
    for (const file of await walk(dir, kind.suffix)) {
      let sidecar: unknown;
      try {
        sidecar = JSON.parse(await fs.readFile(sidecarOf(file), 'utf8'));
      } catch {
        continue;
      }
      const expected = extractorAnchors(sidecar, kind.fields);
      if (expected.size === 0) continue;
      files++;
      anchors += expected.size;
      let rendered: Set<string>;
      try {
        rendered = await renderedAnchors(await fs.readFile(file, 'utf8'));
      } catch {
        compileErrors++;
        continue;
      }
      for (const anchor of expected) {
        if (rendered.has(anchor)) continue;
        failures.push({
          file: path.relative(rootDir, file).replace(/\\/g, '/'),
          rule: 'anchor-unrendered',
          message: `Extractor anchor "${anchor}" has no rendered section or article`,
          suggestion:
            'The heading text and the extracted name disagree, or the entry is not a heading/bold-led entry the sectionizer recognises.',
        });
      }
    }
  }

  return {
    check: 'anchors',
    severity: 'info',
    passed: failures.length === 0,
    failures,
    stats: { files, anchors, uncovered: failures.length, compileErrors },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCheck().then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  });
}
