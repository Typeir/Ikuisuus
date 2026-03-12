/**
 * @fileoverview Draft Content Overlay
 * @description Client component that queries the drafts API for an active draft
 * matching the current page's locale+slug. When a draft exists, it compiles the
 * MDX on the client and renders the result over the server-rendered static
 * content with a slide animation. A toggle button lets users dismiss the draft
 * (slides off-screen to the right) to see the underlying ISR content.
 *
 * The MDX compiler (`@mdx-js/mdx evaluate`) is dynamically imported so it
 * only loads when a draft actually exists, keeping the main bundle lean.
 *
 * @module lib/components/draftOverlay/draftOverlay
 * @version 3.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import DraftBanner from '@/lib/components/draftBanner/draftBanner';
import mdxComponents from '@/lib/components/mdx';
import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { useCallback, useEffect, useState } from 'react';
import * as runtime from 'react/jsx-runtime';
import styles from './draftOverlay.module.scss';

/**
 * Props for the DraftOverlay component.
 *
 * @property {string} locale - Content locale (e.g. 'en')
 * @property {string} slug - Content slug path (e.g. 'monsters/albedo')
 * @property {React.ReactNode} children - Static ISR page content
 */
interface DraftOverlayProps {
  /** @property {string} locale - Content locale */
  locale: string;
  /** @property {string} slug - Content slug path */
  slug: string;
  /** @property {React.ReactNode} children - Static ISR page content */
  children: React.ReactNode;
}

/**
 * Internal state for the draft fetch + compile lifecycle.
 *
 * @property {DraftMetadata | null} draft - Fetched draft or null
 * @property {React.ComponentType | null} MdxContent - Compiled MDX component
 * @property {boolean} loading - Whether the fetch/compile is in progress
 * @property {string | null} compileError - MDX compilation error message
 */
interface DraftState {
  /** @property {DraftMetadata | null} draft - Fetched draft or null */
  draft: DraftMetadata | null;
  /** @property {React.ComponentType | null} MdxContent - Compiled MDX component */
  MdxContent: React.ComponentType | null;
  /** @property {boolean} loading - Whether the fetch/compile is in progress */
  loading: boolean;
  /** @property {string | null} compileError - MDX compilation error message */
  compileError: string | null;
}

/**
 * Fetches the active draft for a locale+slug from the drafts API.
 *
 * @param {string} locale - Content locale
 * @param {string} slug - Content slug path
 * @returns {Promise<DraftMetadata | null>} Active draft or null
 */
const fetchDraft = async (
  locale: string,
  slug: string,
): Promise<DraftMetadata | null> => {
  try {
    const res = await fetch(
      `/api/drafts?locale=${encodeURIComponent(locale)}&slug=${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.draft ?? null;
  } catch {
    return null;
  }
};

/**
 * Compiles raw MDX source into a renderable React component using the
 * `@mdx-js/mdx` evaluate function. Dynamically imported to avoid pulling
 * the compiler into the main bundle.
 *
 * @param {string} source - Raw MDX content
 * @returns {Promise<React.ComponentType>} Compiled MDX component
 */
const compileMdx = async (source: string): Promise<React.ComponentType> => {
  const { evaluate } = await import('@mdx-js/mdx');
  const remarkGfm = (await import('remark-gfm')).default;

  const result = await evaluate(source, {
    ...(runtime as any),
    remarkPlugins: [remarkGfm],
    useMDXComponents: () => mdxComponents,
  });
  return result.default as React.ComponentType;
};

/**
 * Client-side overlay that renders compiled draft MDX over the static ISR page.
 * When an active draft exists, it slides in from the right and covers the
 * static content. A toggle button dismisses or restores the draft panel.
 *
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
  const [state, setState] = useState<DraftState>({
    draft: null,
    MdxContent: null,
    loading: true,
    compileError: null,
  });
  const [showDraft, setShowDraft] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchDraft(locale, slug).then(async (draft) => {
      if (cancelled || !draft) {
        if (!cancelled)
          setState({
            draft: null,
            MdxContent: null,
            loading: false,
            compileError: null,
          });
        return;
      }

      try {
        const MdxContent = await compileMdx(draft.content);
        if (!cancelled) {
          setState({ draft, MdxContent, loading: false, compileError: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            draft,
            MdxContent: null,
            loading: false,
            compileError: err instanceof Error ? err.message : String(err),
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale, slug]);

  const handleToggle = useCallback(() => {
    setShowDraft((prev) => !prev);
  }, []);

  if (state.loading || !state.draft) return <>{children}</>;

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
        <article className={styles.draftArticle}>
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
