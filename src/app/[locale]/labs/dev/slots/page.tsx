/**
 * @fileoverview Slot card fixture preview at /[locale]/labs/dev/slots.
 * @description Renders the heirloom fixture through the real wiki article
 * frame; see `SlotsPreview`.
 *
 * @module app/[locale]/labs/dev/slots/page
 * @version 0.5.0
 * @author Typeir
 * @since 2026-09-02
 */

import type { Metadata } from 'next';
import { CONTENT_V2_FIXTURES, SlotsPreview } from './SlotsPreview';

/**
 * Page metadata for the fixture preview.
 *
 * @returns {Metadata} Page metadata.
 */
export const generateMetadata = (): Metadata => ({
  title: 'Labs · slots | Library of Ikuisuus',
  robots: { index: false, follow: false },
});

/**
 * Slot card fixture preview page.
 *
 * @returns {React.ReactElement} Rendered fixture
 */
export default function SlotsLabsPage(): React.ReactElement {
  return (
    <>
      <SlotsPreview />
      {CONTENT_V2_FIXTURES.map((fixture) => (
        <SlotsPreview key={fixture} fixture={fixture} />
      ))}
    </>
  );
}
