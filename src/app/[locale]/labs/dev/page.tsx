/**
 * @fileoverview Dev scratch canvas at /[locale]/labs/dev.
 * @description Full-bleed surface for throwing components at while debugging.
 * Mount whatever is under test inside `<main>`; nothing here is shipped, since the
 * `labs` segment layout 404s outside development. Currently mounts the slot card
 * fixture preview while the heirloom page structure is worked on.
 *
 * @module app/[locale]/labs/dev/page
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * Route: /en/labs/dev
 * ```
 */

import type { Metadata } from 'next';
import styles from './page.module.scss';
import { SlotsPreview } from './slots/SlotsPreview';

/**
 * Page metadata for the dev canvas.
 *
 * @returns {Metadata} Page metadata.
 */
export const generateMetadata = (): Metadata => ({
  title: 'Labs · Dev Canvas | Library of Ikuisuus',
});

/**
 * Dev canvas page.
 *
 * @function LabsDevPage
 * @returns {React.ReactElement} Canvas surface with the current subject mounted.
 */
export default function LabsDevPage(): React.ReactElement {
  return (
    <div className={styles.page}>
      <span className={styles.tag}>labs/dev</span>
      <main className={styles.canvas} data-testid='labs-dev-canvas'>
        <SlotsPreview />
      </main>
    </div>
  );
}
