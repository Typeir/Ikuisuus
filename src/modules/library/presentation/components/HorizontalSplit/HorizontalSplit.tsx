/**
 * @file horizontalSplit.tsx
 * @description Two-column horizontal split layout for Wikipedia-style headers.
 *
 * @module modules/library/presentation/components/HorizontalSplit/HorizontalSplit
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @fileoverview Module for src/lib/components/mdx/horizontalSplit/horizontalSplit.tsx
 */

import type { JSX } from 'react';
import { toCssValue } from '@/lib/utils/toCssValue';
import React, { CSSProperties, ReactNode } from 'react';
import styles from './HorizontalSplit.module.scss';

type HorizontalSplitWidth = string | number;
type HorizontalSplitGap = string | number;
type HorizontalSplitPadding = string | number;

/**
 * Props for the HorizontalSplit component.
 *
 * Configures two-column widths, padding, and inter-column gap. Content passed via props or slots.
 *
 * @property {ReactNode} left - Left slot content (typically text/prose)
 * @property {ReactNode} right - Right slot content (typically description/infobox)
 * @property {HorizontalSplitWidth} [leftWidth] - CSS width for left column (e.g. '65%', 640)
 * @property {HorizontalSplitWidth} [rightWidth] - CSS width for right column (e.g. '35%', 320)
 * @property {HorizontalSplitPadding} [leftPadding] - CSS padding for left column
 * @property {HorizontalSplitPadding} [rightPadding] - CSS padding for right column
 * @property {HorizontalSplitGap} [gap] - CSS gap between columns
 * @property {string} [className] - Additional CSS classes for the root container
 *
 * @example
 * <HorizontalSplit
 *   leftWidth="68%"
 *   rightWidth="32%"
 *   gap="24px"
 *   leftPadding="0"
 *   rightPadding="0"
 *   left={<><H1>Dog</H1><p>Prose...</p></>}
 *   right={<InfoboxDog />}
 * />
 *
 * @example
 * // MDX usage (slots)
 * <HorizontalSplit leftWidth="70%" rightWidth="30%" gap="20px">
 *   <HorizontalSplit.Left>
 *     <H1>Title</H1>
 *     <p>Text...</p>
 *   </HorizontalSplit.Left>
 *   <HorizontalSplit.Right>
 *     <MyInfobox />
 *   </HorizontalSplit.Right>
 * </HorizontalSplit>
 */
export interface HorizontalSplitProps {
  left?: ReactNode;
  right?: ReactNode;
  leftWidth?: HorizontalSplitWidth;
  rightWidth?: HorizontalSplitWidth;
  leftPadding?: HorizontalSplitPadding;
  rightPadding?: HorizontalSplitPadding;
  gap?: HorizontalSplitGap;
  className?: string;
  children?: ReactNode;
}

/**
 * Props for a HorizontalSplit slot (Left/Right).
 *
 * @interface HorizontalSplitSlotProps
 */
interface HorizontalSplitSlotProps {
  children?: ReactNode;
  width?: string | number;
  height?: string | number;
  padding?: string | number;
  style?: CSSProperties;
  float?: 'left' | 'right';
  className?: string;
}

/**
 * HorizontalSplit component augmented with Left/Right slot components.
 *
 * @interface HorizontalSplitComponent
 * @extends {React.FC<HorizontalSplitProps>}
 */
interface HorizontalSplitComponent extends React.FC<HorizontalSplitProps> {
  Left: React.FC<HorizontalSplitSlotProps>;
  Right: React.FC<HorizontalSplitSlotProps>;
}

/**
 * @function HorizontalSlot
 * @description Renders a slot (div) within HorizontalSplit with configurable width/height/padding/float.
 *
 * @param {HorizontalSplitSlotProps} props
 * @param {ReactNode} props.children - Slot content
 * @param {string | number} [props.width] - CSS width for the slot
 * @param {string | number} [props.height] - CSS height for the slot
 * @param {string | number} [props.padding] - CSS padding for the slot
 * @param {CSSProperties} [props.style] - Additional inline styles
 * @param {('left' | 'right')} [props.float] - Float direction for the slot
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} The horizontal slot component
 *
 */
export const HorizontalSlot: React.FC<HorizontalSplitSlotProps> = ({
  children,
  width,
  height,
  padding,
  style,
  className,
  float,
}) => {
  const slotStyle: CSSProperties = {
    width: toCssValue(width),
    height: toCssValue(height),
    padding: toCssValue(padding),
    float: float,
    ...style,
  };

  return (
    <div className={className} style={{ ...slotStyle }}>
      {children}
    </div>
  );
};

/**
 * @function HorizontalSplit
 * @description Two-column horizontal split layout with configurable gap.
 * @param {HorizontalSplitProps} props - Component props.
 * @param {ReactNode} [props.left] - Content for the left column (prop-based API)
 * @param {ReactNode} [props.right] - Content for the right column (prop-based API)
 * @param {HorizontalSplitWidth} [props.leftWidth] - CSS width for the left column
 * @param {HorizontalSplitWidth} [props.rightWidth] - CSS width for the right column
 * @param {HorizontalSplitPadding} [props.leftPadding] - CSS padding for the left column
 * @param {HorizontalSplitPadding} [props.rightPadding] - CSS padding for the right column
 * @param {HorizontalSplitGap} [props.gap='24px'] - CSS gap between columns
 * @param {string} [props.className] - Additional CSS classes for the root container
 * @param {ReactNode} [props.children] - Child nodes for slot-based content
 * @returns {JSX.Element} The horizontal split layout component
 * @example
 * <HorizontalSplit
 * leftWidth="68%"
 * rightWidth="32%"
 * gap="24px"
 * leftPadding="0"
 * rightPadding="0"
 * left={<><H1>Dog</H1><p>Prose...</p></>
 * right={<InfoboxDog />}
 * />
 *
 */
export const HorizontalSplit: HorizontalSplitComponent = ({
  gap = '24px',
  className,
  children,
}: HorizontalSplitProps): JSX.Element => {
  const containerStyle: React.CSSProperties = {
    gap: toCssValue(gap) ?? '24px',
  };

  return (
    <div
      className={`${styles.horizontalSplit} ${className}`}
      style={containerStyle}>
      {children}
    </div>
  );
};

HorizontalSplit.Left = HorizontalSlot;
HorizontalSplit.Right = (props: HorizontalSplitSlotProps) => (
  <HorizontalSlot {...props} float='right' />
);
HorizontalSplit.Right.displayName = 'HorizontalSplit.Right';

export default HorizontalSplit;
