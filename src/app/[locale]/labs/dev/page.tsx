/**
 * @fileoverview Dev scratch canvas at /[locale]/labs/dev.
 * @description Empty full-bleed surface for throwing components at while debugging.
 * Mount whatever is under test inside `<main>`; nothing here is shipped, since the
 * `labs` segment layout 404s outside development. Discard edits before committing.
 *
 * @module app/[locale]/labs/dev/page
 * @version 1.0.0
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
 * @returns {React.ReactElement} Blank canvas surface.
 */
export default function LabsDevPage(): React.ReactElement {
  return (
    <div className={styles.page}>
      <span className={styles.tag}>labs/dev</span>
      <main className={styles.canvas} data-testid='labs-dev-canvas' />
    </div>
  );
}
