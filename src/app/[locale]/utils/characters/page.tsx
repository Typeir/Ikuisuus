/**
 * @fileoverview Characters Page
 * @description Dedicated page for the character creator and manager at /[locale]/utils/characters.
 * Provides the full character sheet roster wrapped in the CharacterSheetProvider context.
 *
 * @module charactersPage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/components/characterSheet CharacterRoster component
 * @requires @/lib/context/CharacterSheetContext Provider
 *
 * @example
 * ```
 * Route: /en/utils/characters
 * Route: /es/utils/characters
 * ```
 */

import { CharacterSheetProvider } from '@/lib/context/CharacterSheetContext';
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
 * Wraps CharacterRoster in CharacterSheetProvider so all character state
 * is available through context.
 *
 * @async
 * @function CharactersPage
 * @param {PageProps} props - Page props with locale parameter
 * @returns {Promise<JSX.Element>} Rendered page with character roster
 */
export default async function CharactersPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <CharacterSheetProvider>
      <CharacterRoster />
    </CharacterSheetProvider>
  );
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
