const path = require('path');
const remarkGfm = require('remark-gfm').default || require('remark-gfm');
const createNextIntlPlugin = require('next-intl/plugin');
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
  },
});
const withNextIntl = createNextIntlPlugin({ requestConfig: './src/i18n/request.ts' });

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    config.resolve.alias['@content'] = path.resolve(__dirname, 'src/content');
    config.resolve.alias['@lib'] = path.resolve(__dirname, 'src/lib');
    config.resolve.alias['@i18n'] = path.resolve(__dirname, 'src/lib/i18n');
    return config;
  },
};

module.exports = withNextIntl(withMDX(nextConfig));
