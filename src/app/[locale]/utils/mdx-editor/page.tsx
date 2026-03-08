/**
 * @fileoverview MDX Editor Tool Page
 * @description Dedicated tool page for creating and editing MDX content files.
 * Accessible from the Tools menu and via the "Edit" button on library content pages.
 * When navigated to with `?slug=...&locale=...` query parameters, pre-loads the
 * file for editing. Without query parameters, presents a blank editor for new files.
 *
 * @module mdxEditorPage
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 *
 * @requires @/lib/components/mdxEditor Main MdxEditor component
 *
 * @example
 * ```
 * Route: /en/utils/mdx-editor                          — blank editor (new file)
 * Route: /en/utils/mdx-editor?slug=monsters/aboleth    — edit existing file
 * ```
 */

import { MdxEditor } from '@/lib/components/mdxEditor/mdxEditor';
import { Metadata } from 'next';
import styles from './page.module.scss';

/**
 * Page props interface
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
 * Generates page metadata for the MDX Editor tool.
 *
 * @returns {Metadata} Page metadata
 */
export const generateMetadata = (): Metadata => ({
  title: 'MDX Editor | Library of Ikuisuus',
});

/**
 * MDX Editor page component.
 * Renders the MdxEditor with locale from route parameters.
 * Uses a left-aligned, non-prose layout for tool-style display.
 *
 * @async
 * @param {PageProps} props - Page props with locale parameter
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
