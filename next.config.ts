/**
 * Next.js Configuration
 *
 * @fileoverview Next.js 16 configuration with MDX, i18n, bundle analysis,
 * MikroORM server-side settings, and Turbopack SVG/GLSL loader rules.
 *
 * @module next.config
 * @version 2.0.0
 * @author Typeir
 * @since 2026-07-10
 */

import withBundleAnalyzer from "@next/bundle-analyzer";
import withMDX from "@next/mdx";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import path from "path";

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/* Turbopack runs loaders in Rust and cannot receive JavaScript functions, so
   plugins must be named as resolvable strings rather than imported. Local
   plugins are bundled to plain ESM by `scripts/build/bundleMdxPlugins.ts`
   during pre-init, because the loader imports these paths in a bare Node ESM
   context that cannot follow extensionless TypeScript specifiers. */
const withMdx = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      "remark-gfm",
      "remark-math",
      path.join(__dirname, ".mdx-plugins/remarkDiceRoll.mjs"),
      path.join(__dirname, ".mdx-plugins/remarkUnit.mjs"),
    ],
    rehypePlugins: ["rehype-katex"],
  },
});

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
});

const nextConfig: NextConfig = {
  /* Next 16 ships sass-loader 16, which drives the modern Sass API where
     `includePaths` is spelled `loadPaths`.

     `charset: false` stops Dart Sass prepending a BOM to compressed output,
     which it does whenever a stylesheet contains a non-ASCII character — the
     box-drawing separators in these files are enough to trigger it. Webpack's
     CSS parser skipped the BOM; Turbopack's rejects it with
     `Unexpected token AtKeyword`. */
  sassOptions: {
    loadPaths: [path.join(__dirname, "src/styles")],
    charset: false,
  },
  serverExternalPackages: [
    "@mikro-orm/core",
    "@mikro-orm/postgresql",
    "@mikro-orm/knex",
    "@resvg/resvg-js",
  ],
  pageExtensions: ["ts", "tsx", "mdx"],
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`;
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
    ];
  },
  /* Replaces the former `webpack()` hook. Entity class names no longer need
     protecting from minification — `src/lib/db/orm/schema` declares them as
     literal strings — so only the two loaders remain.

     Path aliases are intentionally absent: the former `resolve.alias` entries
     (@content, @lib, @src, @app, @i18n) had no importers anywhere in `src`,
     and the aliases that are used resolve through `tsconfig.json` `paths`,
     which Turbopack honours natively. */
  turbopack: {
    rules: {
      "*.svg": {
        condition: { not: "foreign" },
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
      "*.glsl": { type: "raw" },
    },
  },
};

/**
 * Resolves the Next.js configuration based on the current build phase.
 *
 * During development and production builds, content is fetched at build time.
 * For all other phases (runtime server, test, export), content is fetched at runtime.
 *
 * @param {string} phase - The current Next.js build phase
 * @param {object} options - Phase-specific options
 * @param {NextConfig} options.defaultConfig - The default Next.js configuration
 * @returns {NextConfig} The resolved Next.js configuration with all plugins applied
 */
function resolveConfig(
  phase: string,
  { defaultConfig }: { defaultConfig: NextConfig },
): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    process.env.CONTENT_FETCH_MODE = "build";
    return withBundleAnalyzerConfig(withNextIntl(withMdx(nextConfig)));
  }

  process.env.CONTENT_FETCH_MODE = "runtime";
  return withBundleAnalyzerConfig(withNextIntl(withMdx(nextConfig)));
}

export default resolveConfig;
