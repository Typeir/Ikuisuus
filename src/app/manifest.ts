/**
 * @fileoverview Web app manifest.
 * @description Served at `/manifest.webmanifest`. `display: standalone` is the
 * only way to remove the browser's address bar outright, and it applies once a
 * reader installs the site to their home screen; everywhere else the UA simply
 * ignores the manifest and the site renders as a normal tab.
 *
 * @module app/manifest
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { MetadataRoute } from 'next';

/**
 * Builds the web app manifest.
 *
 * @returns {MetadataRoute.Manifest} Manifest served at /manifest.webmanifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Library of Ikuisuus',
    short_name: 'Ikuisuus',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '831x831',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
