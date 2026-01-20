import React, { CSSProperties } from 'react';
import { toCssValue } from '../../../utils/toCssValue';
import styles from './clearFloats.module.scss';

export type ClearSide = 'left' | 'right' | 'both' | 'none';

export interface ClearFloatsProps {
  side?: ClearSide;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}

/**
 * @function ClearFloats
 * @description A React component that clears floated elements on the specified side.
 *
 * @param {ClearFloatsProps} props
 * @param {('left' | 'right' | 'both' | 'none')} [props.side='both'] - The side to clear floats.
 * @param {string | number} [props.height] - The CSS height of the clearing element.
 * @param {string} [props.className] - Additional CSS classes for the clearing element.
 * @param {CSSProperties} [props.style] - Additional inline styles for the clearing element.
 * @returns {JSX.Element} The ClearFloats component.
 * @example
 * <ClearFloats side="left" height={20} className="my-clear" />
 * This will create a div that clears left floats with a height of 20px and an additional class "my-clear".
 *
 */
export const ClearFloats: React.FC<ClearFloatsProps> = ({
  side = 'both',
  height,
  className,
  style,
}) => {
  const clearStyle: CSSProperties = {
    clear: side,
    height: toCssValue(height),
    ...style,
  };

  return <div className={`${className} ${styles.clear}`} style={clearStyle} />;
};

export default ClearFloats;
