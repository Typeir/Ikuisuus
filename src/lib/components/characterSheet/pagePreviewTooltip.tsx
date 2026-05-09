/**
 * @fileoverview Page Preview Tooltip
 * @description Small icon button rendered next to combobox options and identity
 * pills. On hover, shows a `<Tooltip>` with the entity title; on click, toggles
 * a shared `<Draggable>` iframe (managed by `PagePreviewProvider`) that loads
 * the library page for the entity.
 *
 * @module lib/components/characterSheet/pagePreviewTooltip
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import { CircleHelp } from 'lucide-react';
import type { MouseEvent } from 'react';
import { usePagePreview, type PreviewKind } from './pagePreviewProvider';
import styles from './pagePreviewTooltip.module.scss';

/**
 * Props for `<PagePreviewTooltip>`.
 *
 * @interface PagePreviewTooltipProps
 * @property {PreviewKind} kind - Library kind
 * @property {string} slug - Page slug
 * @property {string} title - Display title for the draggable handle
 * @property {string} [tooltipLabel] - Tooltip body shown on hover; defaults to `title`
 * @property {string} [locale] - Content locale (default `en`)
 * @property {string} [ariaLabel] - Accessible label override for the icon button
 */
export interface PagePreviewTooltipProps {
  kind: PreviewKind;
  slug: string;
  title: string;
  tooltipLabel?: string;
  locale?: string;
  ariaLabel?: string;
}

/**
 * Icon button that hover-shows a tooltip and click-toggles a draggable
 * library-page preview managed by the surrounding `PagePreviewProvider`.
 *
 * @component
 * @param {PagePreviewTooltipProps} props - Component props
 * @returns {JSX.Element} Rendered icon button
 */
export const PagePreviewTooltip: React.FC<PagePreviewTooltipProps> = ({
  kind,
  slug,
  title,
  tooltipLabel,
  locale = 'en',
  ariaLabel,
}) => {
  const preview = usePagePreview();
  const open = preview.isOpen(kind, slug);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) {
      preview.close(kind, slug);
    } else {
      preview.open({ kind, slug, title });
    }
  };

  return (
    <Tooltip
      content={tooltipLabel ?? `${title} source page`}
      placement='top'
      showDelay={250}
      showClickIcon={false}>
      <button
        type='button'
        className={`${styles.previewBtn} ${open ? styles.active : ''}`}
        onClick={handleClick}
        aria-label={ariaLabel ?? `Preview ${title}`}
        aria-pressed={open}
        data-locale={locale}>
        <CircleHelp size={14} aria-hidden='true' />
      </button>
    </Tooltip>
  );
};
