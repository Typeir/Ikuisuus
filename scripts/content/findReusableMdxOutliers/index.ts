/**
 * Reusable MDX Component Detector — Orchestrator
 *
 * @fileoverview Coordinates the full pipeline: scan → identify → dependency graph
 * → topological sort → compile → emit. Delegates to focused utility modules.
 *
 * Requires the SCSS shim preload: --import ./scripts/utils/scssShim.ts
 *
 * @module findReusableMdxOutliers
 * @author Typeir
 * @version 4.0.0
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';

import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { extractTags } from './astExtractor';
import { compileOutliers } from './compiler';
import { topologicalSort } from './dependencyGraph';
import {
    OUTPUT_FILE,
    emitComponentsModule,
    ensureOutputExists,
} from './emitter';
import { findMdxFiles } from './mdxScanner';
import { componentNameFromPath } from './nameUtils';

const log = createLogger({ script: 'findReusableMdxOutliers' });

(async () => {
  const { compile } = await import('@mdx-js/mdx');

  await ensureOutputExists();

  const { components } = await import('@/lib/components/mdx');

  const contentRoot = path.join(process.cwd(), 'src/content');
  const mdxFiles = await findMdxFiles(contentRoot);

  /**
   * Phase 1: Build filename → PascalCase map
   */
  const mdxMap: Record<string, string> = {};
  for (const file of mdxFiles) {
    mdxMap[componentNameFromPath(file)] = file;
  }

  /**
   * Phase 2: Scan every MDX file for PascalCase tags and identify outliers
   * (files whose PascalCase name is referenced as a JSX tag in another file).
   */
  const outliers = new Set<string>();
  const tagsByFile = new Map<string, Set<string>>();

  for (const file of mdxFiles) {
    const rawContent = await fs.readFile(file, 'utf8');
    let compiled: Awaited<ReturnType<typeof compile>>;
    try {
      compiled = await compile(rawContent, {
        jsx: true,
        outputFormat: 'program',
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`MDX compile error in ${path.relative(process.cwd(), file)}:\n${msg}`);
    }

    const tags = extractTags(String(compiled.value));
    tagsByFile.set(file, tags);

    for (const tag of tags) {
      if (mdxMap[tag]) {
        outliers.add(tag);
      }
    }
  }

  log.message('Phase 1-2: Identified reusable MDX components', {
    count: outliers.size,
    names: [...outliers].join(', '),
  });

  /**
   * Phase 3: Build dependency graph among outliers.
   */
  const deps = new Map<string, Set<string>>();
  for (const name of outliers) {
    const filePath = mdxMap[name];
    const fileTags = tagsByFile.get(filePath) ?? new Set();
    const outlierDeps = new Set<string>();
    for (const tag of fileTags) {
      if (tag !== name && outliers.has(tag)) {
        outlierDeps.add(tag);
      }
    }
    deps.set(name, outlierDeps);
  }

  /**
   * Phase 4: Topological sort — leaves (no outlier deps) compile first.
   */
  const compileOrder = topologicalSort(deps);

  log.message('Phase 3-4: Dependency tree resolved', {
    order: compileOrder.join(' → '),
  });

  /**
   * Phase 5: Compile outliers in order.
   */
  const results = await compileOutliers(compileOrder, mdxMap, deps, components);

  for (const r of results) {
    log.message(`✅ ${r.tag}: compiled and rendered`, {
      path: r.filePath,
      deps: r.deps.join(', ') || 'none',
    });
  }

  /**
   * Phase 6: Emit mdxComponents.tsx.
   */
  const count = await emitComponentsModule(results);

  log.message('✨ Wrote compiled components', {
    path: OUTPUT_FILE,
    count,
  });
})();
