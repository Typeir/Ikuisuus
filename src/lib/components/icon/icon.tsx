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

import arrow from "./icons/arrow.svg";
import hamburger from "./icons/hamburger.svg";
import lock from "./icons/lock.svg";
import unlock from "./icons/unlock.svg";

import type { FC, SVGProps } from "react";

export type IconType = "arrow" | "hamburger" | "lock" | "unlock";

export interface IconProps extends SVGProps<SVGSVGElement> {
  type: IconType;
}

const iconMap: Record<IconType, FC<SVGProps<SVGSVGElement>>> = {
  arrow,
  hamburger,
  lock,
  unlock,
};

const Icon: FC<IconProps> = ({ type, className = "", ...rest }) => {
  const SvgIcon = iconMap[type];

  if (!SvgIcon) {
    console.warn(`⚠️ Unknown icon type: "${type}"`);
    return null;
  }

  return <SvgIcon className={className} {...rest} />;
};

export default Icon;
