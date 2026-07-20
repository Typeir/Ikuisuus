/**
 * @fileoverview Page Preview Host
 * @description Renders all currently-open library page previews as
 * `<GenericEmbedPanel>` iframes with `?embed=true`. Place once at the top of
 * the character sheet inside the `<PagePreviewProvider>` subtree.
 *
 * @module lib/components/characterSheet/pagePreviewHost
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { GenericEmbedPanel } from '@/lib/components/ui/embedPanel/GenericEmbedPanel';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import styles from './pagePreviewHost.module.scss';
import { usePagePreview } from './pagePreviewProvider';

const pathCache = new Map<string, string>();

async function fetchPath(kind: string, slug: string): Promise<string> {
  const key = `${kind}::${slug}`;
  if (pathCache.has(key)) return pathCache.get(key)!;
  const res = await fetch('/api/resolve-preview-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, slug }),
  });
  if (!res.ok) return `${kind}/${slug}`;
  const data = await res.json();
  pathCache.set(key, data.path);
  return data.path;
}

/**
 * Props for `<PagePreviewHost>`.
 *
 * @interface PagePreviewHostProps
 */
export interface PagePreviewHostProps {}

/**
 * Renders one `<GenericEmbedPanel>` per open preview entry.
 * Memoizes position functions by preview ID to prevent recreating
 * them on every render, which would cause jittery repositioning.
 *
 * @component
 * @param {PagePreviewHostProps} props - Component props
 * @returns {JSX.Element} Rendered host
 */
export const PagePreviewHost: React.FC<PagePreviewHostProps> = () => {
  const locale = useLocale();
  const { previews, close } = usePagePreview();

  /**
   * Memoize position functions per preview ID to prevent recreating
   * them on every render. This stabilizes positioning for the Draggable component.
   */
  const positionFunctions = useMemo(() => {
    const functions: Record<
      string,
      (b: { width: number; height: number }) => { x: number; y: number }
    > = {};

    previews.forEach((entry, idx) => {
      const key = `${entry.kind}::${entry.slug}`;
      functions[key] = (bounds) => ({
        x: Math.max(16, (bounds.width - 720) / 2 + idx * 32),
        y: Math.max(16, 80 + idx * 32),
      });
    });

    return functions;
  }, [previews]);

  const [resolvedPaths, setResolvedPaths] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    previews.forEach((entry) => {
      const key = `${entry.kind}::${entry.slug}`;
      if (!resolvedPaths[key]) {
        fetchPath(entry.kind, entry.slug).then((path) => {
          setResolvedPaths((prev) => ({ ...prev, [key]: path }));
        });
      }
    });
  }, [previews]);

  return (
    <div className={styles.host} aria-hidden={previews.length === 0}>
      {previews.map((entry) => {
        const key = `${entry.kind}::${entry.slug}`;
        const contentPath = resolvedPaths[key];
        if (!contentPath) return null;

        return (
          <GenericEmbedPanel
            key={key}
            handleLabel={entry.title}
            defaultWidth={720}
            defaultHeight={560}
            initialPosition={
              positionFunctions[key] || (() => ({ x: 16, y: 80 }))
            }
            url={contentPath}
            locale={locale}
            draggableClassName={styles.draggable}
            contentClassName={styles.content}
            loadingClassName={styles.loading}
            spinnerClassName={styles.spinner}
            iframeClassName={styles.frame}
            resizable
            onClosed={() => close(entry.kind, entry.slug)}
            testId={`page-preview-${entry.kind}-${entry.slug}`}
            contentRole='region'
            contentAriaLabel={`Preview: ${entry.title}`}
            iframeTitle={entry.title}
          />
        );
      })}
    </div>
  );
};
