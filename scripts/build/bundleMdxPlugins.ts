#!/usr/bin/env tsx
/**
 * @fileoverview Bundles local remark/rehype plugins for the `@next/mdx` loader.
 * Emits one self-contained `.mjs` per plugin so `next.config.ts` can reference
 * a stable absolute path.
 *
 * @module scripts/build/bundleMdxPlugins
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-28
 */

import { build } from 'esbuild';
import { mkdir } from 'fs/promises';
import path from 'path';

/** Directory holding the generated plugin bundles. */
const OUTPUT_DIR = path.join(process.cwd(), '.mdx-plugins');

/** Local plugin entry points that `next.config.ts` references by path. */
const PLUGINS = [
  { entry: 'src/lib/md/remarkDiceRoll.ts', out: 'remarkDiceRoll.mjs' },
  { entry: 'src/lib/md/remarkUnit.ts', out: 'remarkUnit.mjs' },
];

/**
 * Bundles every local MDX plugin into `.mdx-plugins/`.
 *
 * Leaves resolvable dependencies external.
 */
const main = async (): Promise<void> => {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const plugin of PLUGINS) {
    await build({
      entryPoints: [path.join(process.cwd(), plugin.entry)],
      outfile: path.join(OUTPUT_DIR, plugin.out),
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node20',
      packages: 'external',
      logLevel: 'warning',
    });

    process.stdout.write(
      `[bundleMdxPlugins] ${plugin.entry} -> .mdx-plugins/${plugin.out}\n`,
    );
  }
};

main().catch((err: unknown) => {
  process.stderr.write(
    `[bundleMdxPlugins] failed: ${err instanceof Error ? err.stack : String(err)}\n`,
  );
  process.exit(1);
});
