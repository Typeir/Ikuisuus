/**
 * Next.js Configuration
 *
 * @fileoverview Next.js 15 configuration with MDX, i18n, bundle analysis,
 * MikroORM server-side settings, SVG/GLSL loaders, and path aliases.
 *
 * @module next.config
 * @version 1.0.0
 * @author Typeir
 * @since 2026-07-10
 */

import withBundleAnalyzer from '@next/bundle-analyzer';
import withMDX from '@next/mdx';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from 'next/constants';
import path from 'path';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDiceRoll from './src/lib/md/remarkDiceRoll';

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withMdx = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkMath, remarkDiceRoll],
    rehypePlugins: [rehypeKatex],
  },
});

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
});

/**
 * Disables server-side webpack minimization in production.
 *
 * MikroORM relies on class constructor.name to register entities.
 * Next.js/SWC minifies class names in production (MonsterEntity → n,
 * HeirloomEntity → h, etc.), causing "Duplicate entity names" and
 * "type attribute missing in n.id" errors at runtime. Disabling server-side
 * minification preserves class names without affecting client bundles.
 *
 * @param {object} config - Webpack configuration object
 * @param {object} config.optimization - Webpack optimization settings
 * @param {boolean} config.optimization.minimize - Whether minimization is enabled
 * @param {object} options - Build context options
 * @param {boolean} options.isServer - Whether this is a server build
 * @param {boolean} options.dev - Whether this is a development build
 */
function disableServerMinification(
  config: { optimization: { minimize: boolean } },
  { isServer, dev }: { isServer: boolean; dev: boolean },
): void {
  if (isServer && !dev) {
    config.optimization.minimize = false;
  }
}

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles')],
  },
  serverExternalPackages: [
    '@mikro-orm/core',
    '@mikro-orm/postgresql',
    '@mikro-orm/knex',
    '@resvg/resvg-js',
  ],
  pageExtensions: ['ts', 'tsx', 'mdx'],
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
    ];
  },
  webpack(config, { isServer, dev }) {
    disableServerMinification(config, { isServer, dev });

    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });
    config.resolve.alias['@content'] = path.resolve(__dirname, 'src/content');
    config.resolve.alias['@lib'] = path.resolve(__dirname, 'src/lib');
    config.resolve.alias['@src'] = path.resolve(__dirname, 'src');
    config.resolve.alias['@app'] = path.resolve(__dirname, 'src');
    config.resolve.alias['@i18n'] = path.resolve(__dirname, 'src/lib/i18n');
    return config;
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
    process.env.CONTENT_FETCH_MODE = 'build';
    return withBundleAnalyzerConfig(withNextIntl(withMdx(nextConfig)));
  }

  process.env.CONTENT_FETCH_MODE = 'runtime';
  return withBundleAnalyzerConfig(withNextIntl(withMdx(nextConfig)));
}

export default resolveConfig;
