/**
 * @fileoverview Draft Content Overlay
 * @description Client component that queries the drafts API for an active draft
 * matching the current page's locale+slug. When a draft exists, it compiles the
 * MDX on the client and renders the result over the server-rendered static
 * content with a slide animation. A toggle button lets users dismiss the draft
 * to see the underlying ISR content.
 *
 * @module lib/components/draftOverlay/draftOverlay
 */

'use client';

import DraftBanner from '@/lib/components/draftBanner/draftBanner';
import mdxComponents from '@/lib/components/mdx';
import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { useActiveDraft } from '@/lib/hooks/data/useDraftAndRouteData';
import contentStyles from '@/styles/mdxContent.module.scss';
import { useCallback, useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime';
import styles from './draftOverlay.module.scss';

/**
 * Props for the DraftOverlay component.
 *
 * @interface DraftOverlayProps
 * @property {string} locale - Content locale
 * @property {string} slug - Content slug path
 * @property {React.ReactNode} children - Static ISR page content
 */
interface DraftOverlayProps {
  locale: string;
  slug: string;
  children: React.ReactNode;
}

/**
 * Internal state for draft compile lifecycle.
 *
 * @interface DraftState
 * @property {DraftMetadata | null} draft - Fetched draft or null
 * @property {React.ComponentType | null} MdxContent - Compiled MDX component
 * @property {boolean} loading - Whether the fetch/compile is in progress
 * @property {string | null} compileError - MDX compilation error message
 */
interface DraftState {
  draft: DraftMetadata | null;
  MdxContent: React.ComponentType | null;
  loading: boolean;
  compileError: string | null;
}

/**
 * Compiles raw MDX source into a renderable React component using dynamic imports.
 *
 * @param {string} source - Raw MDX content
 * @returns {Promise<React.ComponentType>} Compiled MDX component
 */
const compileMdx = async (source: string): Promise<React.ComponentType> => {
  const { evaluate } = await import('@mdx-js/mdx');
  const remarkGfm = (await import('remark-gfm')).default;

  const result = await evaluate(source, {
    Fragment: runtime.Fragment,
    jsx: runtime.jsx,
    jsxs: runtime.jsxs,
    remarkPlugins: [remarkGfm],
    useMDXComponents: () => mdxComponents,
  });

  return result.default as React.ComponentType;
};

/**
 * Client-side overlay that renders compiled draft MDX over the static ISR page.
 *
 * @component
 * @param {DraftOverlayProps} props - Component props
 * @param {string} props.locale - Content locale
 * @param {string} props.slug - Content slug path
 * @param {React.ReactNode} props.children - Static ISR page content
 * @returns {JSX.Element} Page content with optional draft overlay
 */
const DraftOverlay: React.FC<DraftOverlayProps> = ({
  locale,
  slug,
  children,
}) => {
  const { draft, loading: draftLoading } = useActiveDraft(locale, slug);
  const [state, setState] = useState<DraftState>({
    draft: null,
    MdxContent: null,
    loading: true,
    compileError: null,
  });
  const [showDraft, setShowDraft] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const compile = async () => {
      if (!draft) {
        if (!cancelled) {
          setState({
            draft: null,
            MdxContent: null,
            loading: draftLoading,
            compileError: null,
          });
        }
        return;
      }

      try {
        const MdxContent = await compileMdx(draft.content);
        if (!cancelled) {
          setState({ draft, MdxContent, loading: false, compileError: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            draft,
            MdxContent: null,
            loading: false,
            compileError:
              error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    compile();

    return () => {
      cancelled = true;
    };
  }, [draft, draftLoading]);

  const handleToggle = useCallback(() => {
    setShowDraft((prev) => !prev);
  }, []);

  if (state.loading || !state.draft) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      {children}

      <div
        className={`${styles.draftPanel} ${showDraft ? styles.visible : styles.hidden}`}
        aria-hidden={!showDraft}>
        <DraftBanner
          createdAt={state.draft.createdAt}
          updatedAt={state.draft.updatedAt}
        />
        <article
          className={`prose prose-invert ${contentStyles.mdxContent} ${styles.draftArticle}`}>
          {state.MdxContent ? (
            <state.MdxContent />
          ) : (
            <pre className={styles.draftFallback} data-testid='draft-fallback'>
              {state.compileError
                ? `MDX compilation failed:\n${state.compileError}\n\n---\n\n${state.draft.content}`
                : state.draft.content}
            </pre>
          )}
        </article>
      </div>

      <button
        className={styles.toggleButton}
        onClick={handleToggle}
        aria-label={showDraft ? 'Show published content' : 'Show draft'}
        type='button'>
        {showDraft ? 'View Published' : 'View Draft'}
      </button>
    </div>
  );
};

export default DraftOverlay;
