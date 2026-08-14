/**
 * @fileoverview Lazily-loaded client MDX fallback.
 * @description Wraps `ClientRenderer` in `next/dynamic` with `ssr: false`,
 * deferring chunk load until the fallback renders.
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
