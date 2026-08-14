/**
 * @fileoverview MDX Editor tool page.
 * @description Creates and edits MDX content files. With `?slug=...&locale=...`
 * query params, pre-loads a file for editing; without them, shows a blank editor for new files.
 *
 * @module mdxEditorPage
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 *
 * @requires @/modules/mdx-editor Renders the MdxEditor component
 *
 * @example
 * ```
 * Route: /en/utils/mdx-editor                          — blank editor (new file)
 * Route: /en/utils/mdx-editor?slug=monsters/aboleth    — edit existing file
 * ```
 */

import { MdxEditor } from '@/modules/mdx-editor';
import { Metadata } from 'next';
import styles from './page.module.scss';

/**
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
 * Generates page metadata for the MDX Editor tool.
 *
 * @returns {Metadata} Page metadata
 */
export const generateMetadata = (): Metadata => ({
  title: 'MDX Editor | Library of Ikuisuus',
});

/**
 * MDX Editor page component.
 * Renders MdxEditor with locale from route params.
 *
 * @async
 * @param {PageProps} props - Page props with locale parameter
 * @param {Promise<{ locale: string }>} props.params - Async route parameters
 * @returns {Promise<JSX.Element>} Rendered page with MDX editor
 */
export default async function MdxEditorPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div className={styles.editorPage}>
      <MdxEditor locale={locale} />
    </div>
  );
}
