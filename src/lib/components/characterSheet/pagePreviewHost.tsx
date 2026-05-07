/**
 * @fileoverview Page Preview Host
 * @description Renders all currently-open library page previews as
 * `<Draggable>` iframes. Place once at the top of the character sheet inside
 * the `<PagePreviewProvider>` subtree.
 *
 * @module lib/components/characterSheet/pagePreviewHost
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Draggable } from '@/lib/components/ui/draggable/Draggable';
import { usePagePreview } from './pagePreviewProvider';
import styles from './pagePreviewHost.module.scss';

/**
 * Props for `<PagePreviewHost>`.
 *
 * @interface PagePreviewHostProps
 * @property {string} [locale] - Content locale used to build iframe URLs (default `en`)
 */
export interface PagePreviewHostProps {
  locale?: string;
}

/**
 * Renders one `<Draggable>` per open preview entry.
 *
 * @component
 * @param {PagePreviewHostProps} props - Component props
 * @returns {JSX.Element} Rendered host
 */
export const PagePreviewHost: React.FC<PagePreviewHostProps> = ({
  locale = 'en',
}) => {
  const { previews, close } = usePagePreview();

  return (
    <div className={styles.host} aria-hidden={previews.length === 0}>
      {previews.map((entry, idx) => {
        const url = `/${locale}/library/character-creation/${entry.kind}/${entry.slug}`;
        return (
          <Draggable
            key={`${entry.kind}::${entry.slug}`}
            handleLabel={entry.title}
            defaultWidth='min(720px, 90vw)'
            defaultHeight='min(560px, 80vh)'
            initialPosition={(b) => ({
              x: Math.max(16, (b.width - 720) / 2 + idx * 32),
              y: Math.max(16, 80 + idx * 32),
            })}
            resizable
            onClose={() => close(entry.kind, entry.slug)}
            testId={`page-preview-${entry.kind}-${entry.slug}`}>
            <iframe
              src={url}
              title={entry.title}
              sandbox='allow-same-origin allow-scripts'
              className={styles.frame}
            />
          </Draggable>
        );
      })}
    </div>
  );
};
