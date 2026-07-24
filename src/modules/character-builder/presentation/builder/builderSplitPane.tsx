/**
 * @fileoverview Builder Split Pane
 * @description Viewport-aware wrapper around the two-pane builder layout.
 * On desktop it renders the shared `ResizablePane` exactly as before. On
 * phone viewports (≤768px) it renders only the left pane full-width and
 * summons the right pane in a console-skinned bottom sheet — either
 * controlled by the caller (focused-shard flow) or via a local trigger
 * button when `mobileTriggerLabel` is provided.
 *
 * @module lib/components/characterSheet/builder/builderSplitPane
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { MobileModal } from '@/lib/components/ui/modal';
import { ResizablePane } from '@/lib/components/ui/resizablePane';
import { useIsMobileViewport } from '@/lib/hooks/useMediaQuery';
import { SquareArrowOutUpRight } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import styles from './builderSplitPane.module.scss';

/**
 * Props for `<BuilderSplitPane>`.
 *
 * @interface BuilderSplitPaneProps
 * @property {string} id - ResizablePane persistence id (desktop only)
 * @property {ReactNode} left - Picker / editor pane content
 * @property {ReactNode} right - Preview pane content (bottom sheet body on phones)
 * @property {string} sheetTitle - Console-label title of the mobile bottom sheet
 * @property {boolean} [sheetOpen] - Controlled sheet-open state (e.g. focused shard present)
 * @property {() => void} [onSheetClose] - Called when the controlled sheet is dismissed
 * @property {string} [mobileTriggerLabel] - When set, renders a summon button under the primary pane on phones
 * @property {'left' | 'right'} [mobilePrimary='left'] - Which pane stays inline on phones; the other becomes the sheet body
 * @property {string} [ariaLabel] - Aria label forwarded to the ResizablePane wrapper
 * @property {number} [defaultLeftPercent] - ResizablePane default left width (desktop only)
 * @property {number} [minLeftPercent] - ResizablePane minimum left width (desktop only)
 */
export interface BuilderSplitPaneProps {
  id: string;
  left: ReactNode;
  right: ReactNode;
  sheetTitle: string;
  sheetOpen?: boolean;
  onSheetClose?: () => void;
  mobileTriggerLabel?: string;
  mobilePrimary?: 'left' | 'right';
  ariaLabel?: string;
  defaultLeftPercent?: number;
  minLeftPercent?: number;
}

/**
 * Two-pane builder layout that degrades to a single pane plus a summoned
 * bottom sheet on phone viewports. Desktop rendering is byte-identical to
 * the previous direct `ResizablePane` usage.
 *
 * @component
 * @param {BuilderSplitPaneProps} props - Component props
 * @returns {JSX.Element} Rendered split layout
 */
export const BuilderSplitPane: React.FC<BuilderSplitPaneProps> = ({
  id,
  left,
  right,
  sheetTitle,
  sheetOpen = false,
  onSheetClose,
  mobileTriggerLabel,
  mobilePrimary = 'left',
  ariaLabel,
  defaultLeftPercent,
  minLeftPercent,
}) => {
  const isMobile = useIsMobileViewport();
  const [localOpen, setLocalOpen] = useState(false);

  const handleClose = useCallback(() => {
    setLocalOpen(false);
    onSheetClose?.();
  }, [onSheetClose]);

  if (isMobile !== true) {
    return (
      <ResizablePane
        id={id}
        ariaLabel={ariaLabel}
        left={left}
        right={right}
        defaultLeftPercent={defaultLeftPercent}
        minLeftPercent={minLeftPercent}
      />
    );
  }

  const inline = mobilePrimary === 'left' ? left : right;
  const summoned = mobilePrimary === 'left' ? right : left;

  return (
    <div className={styles.mobilePane}>
      {mobileTriggerLabel && (
        <button
          type='button'
          className={styles.summonBtn}
          onClick={() => setLocalOpen(true)}>
          <SquareArrowOutUpRight size={14} aria-hidden='true' />
          {mobileTriggerLabel}
        </button>
      )}
      {inline}
      <MobileModal
        isOpen={sheetOpen || localOpen}
        onClose={handleClose}
        title={sheetTitle}
        variant='console'
        ariaLabel={sheetTitle}>
        {summoned}
      </MobileModal>
    </div>
  );
};
