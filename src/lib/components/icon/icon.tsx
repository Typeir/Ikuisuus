/**
 * Icon Component
 *
 * @fileoverview Generic SVG icon wrapper with type-safe icon selection.
 * Maps icon type strings to imported SVG components.
 *
 * @module icon
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { logger } from '@/lib/logging/logger';
import arrow from './icons/arrow.svg';
import hamburger from './icons/hamburger.svg';

import type { FC, SVGProps } from 'react';

export type IconType = 'arrow' | 'hamburger';

export interface IconProps extends SVGProps<SVGSVGElement> {
  type: IconType;
}

const iconMap: Record<IconType, FC<SVGProps<SVGSVGElement>>> = {
  arrow,
  hamburger,
};

const Icon: FC<IconProps> = ({ type, className = '', ...rest }) => {
  const SvgIcon = iconMap[type];

  if (!SvgIcon) {
    logger.warning('Unknown icon type', { type });
    return null;
  }

  return <SvgIcon className={className} {...rest} />;
};

export default Icon;
