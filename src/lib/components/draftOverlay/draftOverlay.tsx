/**
 * @fileoverview Draft Content Overlay
 * @description Client component that queries the drafts API for an active draft
 * matching the current page's locale+slug. When a draft exists, it renders
 * the draft MDX content with the DraftBanner indicator, replacing the
 * server-rendered content visually.
 *
 * This component is mounted on content pages and performs a client-only
 * fetch — draft data never participates in static generation.
 *
 * @module lib/components/draftOverlay/draftOverlay
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

'use client';

import DraftBanner from '@/lib/components/draftBanner/draftBanner';
import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { useEffect, useState } from 'react';

/**
 * Props for the DraftOverlay component.
 *
 * @param {string} props.locale - Content locale (e.g. 'en')
 * @param {string} props.slug - Content slug path (e.g. 'monsters/albedo')
 */
interface DraftOverlayProps {
  /** @property {string} locale - Content locale */
  locale: string;
  /** @property {string} slug - Content slug path */
  slug: string;
}

/**
 * Internal state for the draft fetch lifecycle.
 *
 * @property {DraftMetadata | null} draft - Fetched draft or null
 * @property {boolean} loading - Whether the fetch is in progress
 */
interface DraftState {
  draft: DraftMetadata | null;
  loading: boolean;
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
 * Client-side overlay that shows draft content when an active draft exists
 * for the current page. Renders draft MDX as raw preformatted content with
 * the DraftBanner indicator.
 *
 * @param {DraftOverlayProps} props - Component props
 * @param {string} props.locale - Content locale
 * @param {string} props.slug - Content slug path
 * @returns {JSX.Element | null} Draft overlay or null if no draft
 */
const DraftOverlay: React.FC<DraftOverlayProps> = ({ locale, slug }) => {
  const [state, setState] = useState<DraftState>({
    draft: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetchDraft(locale, slug).then((draft) => {
      if (!cancelled) {
        setState({ draft, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale, slug]);

  if (state.loading || !state.draft) return null;

  return (
    <div>
      <DraftBanner
        createdAt={state.draft.createdAt}
        updatedAt={state.draft.updatedAt}
      />
      <div className='prose prose-invert mx-auto'>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {state.draft.content}
        </pre>
      </div>
    </div>
  );
};

export default DraftOverlay;
