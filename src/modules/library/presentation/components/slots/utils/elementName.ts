/**
 * @fileoverview Reads the authored name of an MDX element.
 * @description The compile step stamps the name on every component; this reads
 * it back, so a parent can recognise its children without their component
 *
 * @module modules/library/presentation/components/slots/utils/elementName
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

import { ELEMENT_NAME_ATTRIBUTE } from '@/lib/constants/mdxElement';
import React, { type ReactNode } from 'react';

/**
 * The authored name of a node.
 *
 * @description Read from the attribute the compile step stamped, or from the
 * component itself for an element built in code rather than written in MDX. A
 * client component carries no name on the server, so the stamp is the only
 * answer there.
 *
 * @param {ReactNode} node - Node to read
 * @returns {string} Authored name, or an empty string for anything else
 */
export function elementNameOf(node: ReactNode): string {
  if (!React.isValidElement(node)) return '';

  const stamped = (node.props as Record<string, unknown>)?.[
    ELEMENT_NAME_ATTRIBUTE
  ];
  if (typeof stamped === 'string' && stamped !== '') return stamped;

  const type = node.type as { displayName?: string; name?: string } | string;
  return typeof type === 'string' ? type : type.displayName || type.name || '';
}
