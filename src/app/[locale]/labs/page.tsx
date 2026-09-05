/**
 * @fileoverview Lab index at /[locale]/labs.
 * @description Lists every scratch route under the labs segment, discovered
 * from the filesystem so a new lab needs no entry adding here.
 *
 * @module app/[locale]/labs/page
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 *
 * @example
 * ```
 * Route: /en/labs
 * ```
 */

import type { Metadata } from 'next';
import { labRoutes } from './labIndex';
import styles from './page.module.scss';

/**
 * Page metadata for the lab index.
 *
 * @returns {Metadata} Page metadata.
 */
export const generateMetadata = (): Metadata => ({
  title: 'Labs | Library of Ikuisuus',
  robots: { index: false, follow: false },
});

/**
 * Props for the lab index page.
 *
 * @property {Promise<{ locale: string }>} params - Route params
 */
interface LabsIndexPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Lab index page.
 *
 * @param {LabsIndexPageProps} props - Page props
 * @returns {Promise<React.ReactElement>} The route list
 */
export default async function LabsIndexPage({
  params,
}: LabsIndexPageProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const routes = labRoutes();

  return (
    <div className={styles.page} data-testid='labs-index'>
      <h1 className={styles.heading}>Labs</h1>
      <p className={styles.blurb}>
        Scratch routes for working on components against real content. Nothing
        here ships.
      </p>
      {routes.length === 0 ? (
        <p className={styles.empty}>No labs yet.</p>
      ) : (
        <ul className={styles.list}>
          {routes.map((route) => (
            <li key={route.href} className={styles.item}>
              <a className={styles.link} href={`/${locale}/${route.href}`}>
                <span className={styles.name}>{route.name}</span>
                <span className={styles.route}>/{route.href}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
