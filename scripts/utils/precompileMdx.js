/**
 * MDX Precompiler with SCSS Support (CommonJS)
 *
 * Bundles all MDX files into JS using mdx-bundler + esbuild-sass-plugin.
 * This handles `import/export` and `*.scss` in MDX components.
 */

// Node core modules
const path = require('path');
const fs = require('fs/promises');

// Third-party modules
const { bundleMDX } = require('mdx-bundler');
const { sassPlugin } = require('esbuild-sass-plugin');

// Windows fix for esbuild binary in Next.js
if (process.platform === 'win32') {
  process.env.ESBUILD_BINARY_PATH = path.join(
    process.cwd(),
    'node_modules',
    'esbuild',
    'esbuild.exe'
  );
}

/**
 * Precompiles a single MDX file into JS, handling `import/export` and `.scss`.
 *
 * @param {string} filePath - Path to the `.mdx` file.
 * @param {string} outPath - Output path for the compiled `.js`.
 * @returns {Promise<void>}
 */
const precompileMdx = async (filePath, outPath) => {
  const { code } = await bundleMDX({
    file: filePath,
    cwd: path.dirname(filePath),
    esbuildOptions: (opts) => {
      opts.format = 'cjs'; // ✅ CommonJS output
      opts.platform = 'node';
      opts.target = 'esnext';

      opts.plugins = [
        ...(opts.plugins || []),
        sassPlugin({ type: 'css-text' }),
      ];

      return opts;
    },
    mdxOptions: (opts) => {
      // Disable recma plugins that wrap things weirdly
      opts.remarkPlugins = opts.remarkPlugins || [];
      opts.rehypePlugins = opts.rehypePlugins || [];

      // Important: Do NOT use recmaPlugins unless you know what you’re doing.
      return opts;
    },
  });

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, code, 'utf8');
};

/**
 * Recursively scans a directory for `.mdx` files.
 *
 * @param {string} dir - Directory to scan.
 * @returns {Promise<string[]>} Flat list of `.mdx` file paths.
 */
const walkDir = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files = await Promise.all(
    entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return walkDir(res);
      if (res.endsWith('.mdx')) return res;
      return [];
    })
  );

  return files.flat();
};

/**
 * Main script execution: precompile all MDX files in `src/content` into `src/compiled-content`.
 *
 * @returns {Promise<void>}
 */
const run = async () => {
  const locales = ['en']; // Adjust as needed
  const contentRoot = path.join(process.cwd(), 'src/content');
  const outRoot = path.join(process.cwd(), 'src/compiled-content');

  for (const locale of locales) {
    const contentDir = path.join(contentRoot, locale);
    const files = await walkDir(contentDir);

    for (const file of files) {
      const relativePath = path
        .relative(contentDir, file)
        .replace(/\.mdx$/, '.js');
      const outPath = path.join(outRoot, locale, relativePath);

      console.log(`📦 Bundling: ${file} -> ${outPath}`);
      await precompileMdx(file, outPath);
    }
  }

  console.log('✅ MDX precompile complete');
};

// Run the script
run().catch((err) => {
  console.error('❌ MDX precompile failed:', err);
  process.exit(1);
});
