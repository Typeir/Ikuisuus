/**
 * @fileoverview Lazily-loaded client MDX fallback.
 * @description Wraps `ClientRenderer` so the MDX toolchain it needs is fetched
 * only when the fallback actually renders.
 *
 * `ClientRenderer` imports content with a fully dynamic specifier, so the
 * bundler builds a context over every MDX file and pulls the compiler — acorn,
 * micromark, mdast-util, katex — into the browser graph. Imported directly from
 * the route, that ships to every visitor to serve a path that only runs when
 * server compilation has already failed. Behind `next/dynamic` it becomes a
 * separate chunk that is requested on demand and, in practice, never.
 *
 * The wrapper exists because `ssr: false` is not permitted in a Server
 * Component, and the library route is one.
 *
 * @module src/app/[locale]/utils/clientRendererLazy
 * @author Typeir
 * @version 1.0.0
 * @since 2026-08-04
 */

'use client';

import dynamic from 'next/dynamic';

/**
 * Props for the lazy client renderer.
 *
 * @property {string} locale - Current locale
 * @property {string} slug - Content path relative to the content root
 */
export interface ClientRendererLazyProps {
  locale: string;
  slug: string;
}

const ClientRenderer = dynamic(() => import('./clientRenderer'), {
  ssr: false,
});

/**
 * Renders the client MDX fallback, loading its chunk on demand.
 *
 * @param {ClientRendererLazyProps} props - Component props
 * @returns {React.ReactElement} The lazily-loaded renderer
 */
export default function ClientRendererLazy({
  locale,
  slug,
}: ClientRendererLazyProps) {
  return <ClientRenderer locale={locale} slug={slug} />;
}
