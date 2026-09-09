/**
 * @fileoverview Asks the cards on a page to collapse themselves.
 * @description A card's heading is drawn by the card, out of children nothing
 * else may rewrite
 *
 * @module modules/library/presentation/components/slots/cardFold
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * Whether the cards under this point collapse.
 */
const CardFoldContext = createContext(false);

/**
 * Turns card folding on for a subtree.
 */
export const CardFoldProvider = CardFoldContext.Provider;

/**
 * Whether the surrounding sheet asked cards to collapse.
 *
 * @returns {boolean} True when they should
 */
export function useCardFold(): boolean {
  return useContext(CardFoldContext);
}

/**
 * Whether a run of nodes holds a card of its own.
 *
 * @description The compiler files each card in a wrapper of its own before a
 * card ever renders
 *
 * @param {ReactNode[]} nodes - The card's body, as written
 * @returns {boolean} True when a card sits inside
 */
export function holdsCards(nodes: ReactNode[]): boolean {
  return nodes.some((node) => {
    if (!React.isValidElement(node)) return false;
    const props = node.props as { 'data-entry'?: unknown; children?: ReactNode };
    if (props['data-entry'] !== undefined) return true;
    return holdsCards(React.Children.toArray(props.children));
  });
}
