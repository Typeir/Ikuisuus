/**
 * @fileoverview Builder Split Pane
 * @description Viewport-aware wrapper around the two-pane builder layout.
 * Desktop (≥768px) renders `ResizablePane`; phone (≤768px) renders one
 * pane full-width and the other in a console-skinned `MobileModal` bottom
 * sheet.
 *
 * @module modules/character-builder/presentation/builder/builderSplitPane
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
 * Two-pane builder layout; single pane plus summoned bottom sheet on phone
 * viewports.
 *
 * @component
 * @param {BuilderSplitPaneProps} props - Component props
 * @param {string} props.id - ResizablePane persistence id (desktop only)
 * @param {ReactNode} props.left - Picker / editor pane content
 * @param {ReactNode} props.right - Preview pane content (bottom sheet body on phones)
 * @param {string} props.sheetTitle - Console-label title of the mobile bottom sheet
 * @param {boolean} [props.sheetOpen=false] - Controlled sheet-open state (e.g. focused shard present)
 * @param {() => void} [props.onSheetClose] - Called when the controlled sheet is dismissed
 * @param {string} [props.mobileTriggerLabel] - When set, renders a summon button under the primary pane on phones
 * @param {'left' | 'right'} [props.mobilePrimary='left'] - Which pane stays inline on phones; the other becomes the sheet body
 * @param {string} [props.ariaLabel] - Aria label forwarded to the ResizablePane wrapper
 * @param {number} [props.defaultLeftPercent] - ResizablePane default left width (desktop only)
 * @param {number} [props.minLeftPercent] - ResizablePane minimum left width (desktop only)
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
