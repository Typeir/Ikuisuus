const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm'],
  },
});
const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
});
const {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} = require('next/constants');

const stylesPath = path.join(__dirname, 'src/styles');

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: [stylesPath],
    loadPaths: [stylesPath],
  },
  serverExternalPackages: [
    '@mikro-orm/core',
    '@mikro-orm/postgresql',
    '@mikro-orm/knex',
  ],
  pageExtensions: ['ts', 'tsx', 'mdx'],
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
    // MikroORM relies on class constructor.name to register entities.
    // Next.js/SWC minifies class names in production (MonsterEntity → n,
    // HeirloomEntity → h, etc.), causing "Duplicate entity names" and
    // "type attribute missing in n.id" errors at runtime. Disabling server-side
    // minification preserves class names without affecting client bundles.
    if (isServer && !dev) {
      config.optimization.minimize = false;
    }

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
    config.resolve.alias['@i18n'] = path.resolve(__dirname, 'src/lib/i18n');
    return config;
  },
};

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    // Development or build-time specific config may be applied here.
    // Expose a build-time marker so server-side build steps can detect
    // build/dev mode deterministically without requiring CI changes.
    // This value is assigned here (during config evaluation) and will be
    // available to Node code that runs at build time (e.g. `next build`).
    process.env.CONTENT_FETCH_MODE = 'build';
    return withNextIntl(withMDX(nextConfig));
  }

  // Default config for other phases (production server, test, export, etc.)
  process.env.CONTENT_FETCH_MODE = 'runtime';
  return withNextIntl(withMDX(nextConfig));
};
