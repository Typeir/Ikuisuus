/**
 * @fileoverview Deed-costed monster preview at /[locale]/labs/dev/deeds.
 * @description The Tombsteel Wizard-Construct converted to slot forms, with
 * three deed-costed blocks added: one spell, one line effect, and one that
 * fires when the construct is destroyed. Renders through the real article
 * frame so the `◈` deed mark can be read against the action marks beside it.
 *
 * @module app/[locale]/labs/dev/deeds/page
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 *
 * @example
 * ```
 * Route: /en/labs/dev/deeds
 * ```
 */

import type { Metadata } from 'next';
import { SlotsPreview } from '../slots/SlotsPreview';

/**
 * Page metadata for the deed preview.
 *
 * @returns {Metadata} Page metadata.
 */
export const generateMetadata = (): Metadata => ({
  title: 'Labs · deeds | Library of Ikuisuus',
  robots: { index: false, follow: false },
});

/**
 * Deed-costed monster preview page.
 *
 * @returns {React.ReactElement} Rendered fixture
 */
export default function DeedsLabsPage(): React.ReactElement {
  return <SlotsPreview fixture='monster-deeds.mdx' />;
}
