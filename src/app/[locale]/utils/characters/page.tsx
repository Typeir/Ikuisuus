/**
 * @fileoverview Characters Page
 * @description Dedicated page for the character creator and manager at /[locale]/utils/characters.
 * Renders the roster; character state comes from the global CharacterSheetProvider
 * mounted in ClientProviders.
 *
 * @module charactersPage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/components/characterSheet CharacterRoster component
 *
 * @example
 * ```
 * Route: /en/utils/characters
 * Route: /es/utils/characters
 * ```
 */

import { CharacterRoster } from '@/modules/character-builder';

/**
 * Page props interface.
 *
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
 * Characters page component.
 * Character state is available through the global CharacterSheetProvider.
 *
 * @async
 * @function CharactersPage
 * @param {PageProps} props - Page props with locale parameter
 * @returns {Promise<JSX.Element>} Rendered page with character roster
 */
export default async function CharactersPage({ params }: PageProps) {
  const { locale } = await params;

  return <CharacterRoster />;
}

/**
 * Generate metadata for the characters page.
 *
 * @function generateMetadata
 * @returns {Object} Metadata object with title and description
 */
export function generateMetadata() {
  return {
    title: 'Characters',
    description: 'Manage your character sheets',
  };
}
