/**
 * MDX Precompiler with SCSS Support
 *
 * @fileoverview Bundles all MDX files into JS using mdx-bundler + esbuild-sass-plugin.
 * This handles import/export and *.scss in MDX components.
 *
 * @module scripts/utils/precompileMdx
 * @version 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/precompileMdx.ts
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import { getContentFolder } from '@/lib/utils/getContentFolder';
import { getMatchingFiles } from '@/lib/utils/getMatchingFiles';
import { sassPlugin } from 'esbuild-sass-plugin';
import fs from 'fs/promises';
import { bundleMDX } from 'mdx-bundler';
import path from 'path';

const log = createLogger({ script: 'precompileMdx' });

if (process.platform === 'win32') {
  process.env.ESBUILD_BINARY_PATH = path.join(
    process.cwd(),
    'node_modules',
    'esbuild',
    'esbuild.exe',
  );
}

/**
 * Precompiles a single MDX file into JS, handling import/export and .scss.
 *
 * @param filePath - Path to the .mdx file
 * @param outPath - Output path for the compiled .js
 */
const precompileMdx = async (
  filePath: string,
  outPath: string,
): Promise<void> => {
  const { code } = await bundleMDX({
    file: filePath,
    cwd: path.dirname(filePath),
    esbuildOptions: (opts) => {
      opts.format = 'cjs';
      opts.platform = 'node';
      opts.target = 'esnext';

      opts.plugins = [
        ...(opts.plugins || []),
        sassPlugin({ type: 'css-text' }),
      ];

      return opts;
    },
    mdxOptions: (opts) => {
      opts.remarkPlugins = opts.remarkPlugins || [];
      opts.rehypePlugins = opts.rehypePlugins || [];
      return opts;
    },
  });

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, code, 'utf8');
};

/**
 * Main script execution: precompile all MDX files in src/content into src/compiled-content.
 */
const run = async (): Promise<void> => {
  const locales = ['en'];
  const outRoot = path.join(process.cwd(), 'src/compiled-content');

  for (const locale of locales) {
    const contentDir = getContentFolder(locale);
    const files = await getMatchingFiles(contentDir, /\.mdx$/, true);

    for (const file of files) {
      const relativePath = path
        .relative(contentDir, file)
        .replace(/\.mdx$/, '.js');
      const outPath = path.join(outRoot, locale, relativePath);

      log.message('📦 Bundling', { from: file, to: outPath });
      await precompileMdx(file, outPath);
    }
  }

  log.message('✅ MDX precompile complete');
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('❌ MDX precompile failed', { error: message });
  process.exit(1);
});
