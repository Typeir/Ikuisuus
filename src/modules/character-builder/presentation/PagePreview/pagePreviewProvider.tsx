/**
 * @fileoverview Page Preview Provider
 * @description Context provider that tracks open `<Draggable>` library-page
 * previews keyed by `kind+slug`. Allows `PagePreviewTooltip` instances scattered
 * across the character sheet to share preview state so the same library page
 * is never opened twice and previews persist across tab switches.
 *
 * @module lib/components/characterSheet/pagePreviewProvider
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Library page kind. Maps to a path segment under
 * `/{locale}/library/character-creation/{kind}/{slug}`.
 *
 * @typedef {'bloodlines'|'vocations'|'specializations'|'feats'} PreviewKind
 */
export type PreviewKind =
  | 'bloodlines'
  | 'vocations'
  | 'specializations'
  | 'feats'
  | 'spells'
  | 'heirlooms'
  | 'trinkets';

/**
 * A single open preview entry.
 *
 * @interface PreviewEntry
 * @property {PreviewKind} kind - Library kind
 * @property {string} slug - Page slug
 * @property {string} title - Display title shown on the draggable handle
 */
export interface PreviewEntry {
  kind: PreviewKind;
  slug: string;
  title: string;
}

/**
 * Context value exposed by `<PagePreviewProvider>`.
 *
 * @interface PagePreviewContextValue
 * @property {PreviewEntry[]} previews - Currently open previews
 * @property {(entry: PreviewEntry) => void} open - Open (or focus) a preview by kind+slug
 * @property {(kind: PreviewKind, slug: string) => void} close - Close a preview
 * @property {(kind: PreviewKind, slug: string) => boolean} isOpen - Whether a preview is open
 */
export interface PagePreviewContextValue {
  previews: PreviewEntry[];
  open: (entry: PreviewEntry) => void;
  close: (kind: PreviewKind, slug: string) => void;
  isOpen: (kind: PreviewKind, slug: string) => boolean;
}

const PagePreviewContext = createContext<PagePreviewContextValue | null>(null);

/**
 * Stable key for an entry.
 *
 * @function entryKey
 * @param {PreviewKind} kind - Library kind
 * @param {string} slug - Page slug
 * @returns {string} Composite key
 */
function entryKey(kind: PreviewKind, slug: string): string {
  return `${kind}::${slug}`;
}

/**
 * Props for `<PagePreviewProvider>`.
 *
 * @interface PagePreviewProviderProps
 * @property {ReactNode} children - Subtree that may consume the preview context
 */
export interface PagePreviewProviderProps {
  children: ReactNode;
}

/**
 * Provides preview state to descendants.
 *
 * @component
 * @param {PagePreviewProviderProps} props - Component props
 * @param {ReactNode} props.children - Subtree that may consume the preview context
 * @returns {JSX.Element} Provider element
 */
export const PagePreviewProvider: React.FC<PagePreviewProviderProps> = ({
  children,
}) => {
  const [previews, setPreviews] = useState<PreviewEntry[]>([]);

  const open = useCallback((entry: PreviewEntry) => {
    setPreviews((prev) => {
      if (prev.some((p) => p.kind === entry.kind && p.slug === entry.slug)) {
        return prev;
      }
      return [...prev, entry];
    });
  }, []);

  const close = useCallback((kind: PreviewKind, slug: string) => {
    setPreviews((prev) =>
      prev.filter((p) => !(p.kind === kind && p.slug === slug)),
    );
  }, []);

  const isOpen = useCallback(
    (kind: PreviewKind, slug: string): boolean =>
      previews.some((p) => p.kind === kind && p.slug === slug),
    [previews],
  );

  const value = useMemo<PagePreviewContextValue>(
    () => ({ previews, open, close, isOpen }),
    [previews, open, close, isOpen],
  );

  return (
    <PagePreviewContext.Provider value={value}>
      {children}
    </PagePreviewContext.Provider>
  );
};

/**
 * Read the page-preview context. Returns a no-op fallback when used outside
 * a provider so isolated tooltips degrade gracefully.
 *
 * @function usePagePreview
 * @returns {PagePreviewContextValue} Context value or a no-op stub
 */
export function usePagePreview(): PagePreviewContextValue {
  const ctx = useContext(PagePreviewContext);
  if (!ctx) {
    return {
      previews: [],
      open: () => undefined,
      close: () => undefined,
      isOpen: () => false,
    };
  }
  return ctx;
}

export { entryKey as previewKey };

