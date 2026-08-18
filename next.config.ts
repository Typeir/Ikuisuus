/**
 * @fileoverview Next.js 16 config: MDX, i18n, Turbopack loaders.
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

/* Turbopack requires loader names as strings, not functions; bundled in pre-init. */
const withMdx = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      "remark-gfm",
      "remark-math",
      path.join(__dirname, ".mdx-plugins/remarkAspect.mjs"),
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
  /* Sass 16 uses loadPaths; charset: false prevents BOM in output. */
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
  /* Exclude test/build/Foundry paths; content traced via outputFileTracingIncludes. */
  outputFileTracingExcludes: {
    "**/*": [
      "./tests/**",
      "./scripts/**",
      "./foundry/**",
      "./.github/**",
      "./.ignore/**",
    ],
  },
  /* Requires src/content in bundles for content routes. */
  outputFileTracingIncludes: {
    "**/*": ["./src/content/**"],
  },
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
  /* SVG and GLSL loaders; path aliases removed (use tsconfig paths). */
  turbopack: {
    rules: {
      "*.svg": {
        condition: { not: "foreign" },
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
      "*.glsl": {
        loaders: ["./scripts/build/glslRawLoader.cjs"],
        as: "*.js",
      },
    },
  },
};

/**
 * Resolve Next.js config by phase; build-time fetch for dev/prod, runtime for others.
 *
 * @param {string} phase - Next.js build phase
 * @param {object} options - Phase-specific options
 * @param {NextConfig} options.defaultConfig - Default Next.js configuration
 * @returns {NextConfig} Resolved configuration with plugins applied
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
