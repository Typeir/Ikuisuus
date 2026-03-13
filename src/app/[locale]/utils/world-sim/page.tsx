/**
 * @fileoverview World Sim Page
 * @description Dedicated page for the World Sim tool at /[locale]/utils/world-sim.
 * Renders a Three.js-powered interactive solar system visualization of the Black Cradle.
 *
 * @module worldSimPage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/components/worldSim Main World Sim component
 *
 * @example
 * ```
 * Route: /en/utils/world-sim
 * Route: /es/utils/world-sim
 * ```
 */

import { WorldSim } from '@/lib/components/worldSim';

/**
 * Page props interface
 * @interface PageProps
 * @property {Promise<Object>} params - Route parameters (async in Next.js 15)
 * @property {string} params.locale - Current locale from route segment
 */
interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * World Sim page component.
 * Renders the WorldSim interactive solar system.
 *
 * @async
 * @function WorldSimPage
 * @param {PageProps} props - Page props with locale parameter
 * @param {Promise<{ locale: string }>} props.params - Route parameters (async in Next.js 15)
 * @returns {Promise<JSX.Element>} Rendered page with World Sim
 */
export default async function WorldSimPage({ params }: PageProps) {
  const { locale: _locale } = await params;

  return (
    <div>
      <WorldSim />
    </div>
  );
}

/**
 * Generate metadata for the World Sim page.
 * Sets page title and description for SEO and browser tabs.
 *
 * @function generateMetadata
 * @returns {Object} Metadata object with title and description
 */
export function generateMetadata() {
  return {
    title: 'World Sim — The Black Cradle | Library of Ikuisuus',
    description:
      'Interactive 3D visualization of the Black Cradle solar system. Explore celestial bodies, regions, and the lore of Damocles.',
  };
}
