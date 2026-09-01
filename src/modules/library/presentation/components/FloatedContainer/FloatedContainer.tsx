/**
 * @fileoverview Floated Container Component
 * @module modules/library/presentation/components/FloatedContainer/FloatedContainer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { toCssValue } from '@/lib/utils/toCssValue';
import React, { CSSProperties, ReactNode } from 'react';
import styles from './FloatedContainer.module.scss';

/**
 * Props for the FloatedContainer component.
 *
 * A container that floats its content to the specified side (left or right)
 * with configurable width and margin.
 * @property {ReactNode} [children] - The content to be wrapped in the floated container.
 * @property {('left' | 'right')} [side='right'] - The side to float the container.
 * @property {string | number} [width='40%'] - The CSS width of the container.
 * @property {string | number} [margin='24px'] - The CSS margin around the container.
 * @property {string} [className] - Additional CSS classes for the container.
 * @property {CSSProperties} [style] - Additional inline styles for the container.
 * @example
 * <FloatedContainer side="left" width="30%" margin="16px">
 *   <Image src="example.jpg" alt="Example" />
 * </FloatedContainer>
 */
export interface FloatedContainerProps {
  children?: ReactNode;
  side?: 'left' | 'right';
  width?: string | number;
  margin?: string | number;
  className?: string;
  style?: CSSProperties;
}

/**
 * @function FloatedContainer
 * @description A React component that wraps its children in a container floated to the specified side.
 * @param {FloatedContainerProps} props
 * @param {ReactNode} props.children - The content to be wrapped in the floated container.
 * @param {('left' | 'right')} [props.side='right'] - The side to float the container.
 * @param {string | number} [props.width='40%'] - The CSS width of the container.
 */
export const FloatedContainer: React.FC<FloatedContainerProps> = ({
  children,
  side = 'right',
  width = '40%',
  margin = '24px',
  className,
  style,
}) => {
  const floatStyle: CSSProperties = {
    float: side,
    width: toCssValue(width),
    marginLeft: side === 'right' ? toCssValue(margin) : undefined,
    marginRight: side === 'left' ? toCssValue(margin) : undefined,
    marginBottom: toCssValue(margin),
    ...style,
  };

  return (
    <div className={`${className} ${styles.floated}`} style={floatStyle}>
      {children}
    </div>
  );
};

export default FloatedContainer;
