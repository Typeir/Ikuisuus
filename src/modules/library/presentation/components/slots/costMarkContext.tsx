/**
 * @fileoverview The action cost a block sits inside.
 * @description A block that states no cost of its own is not free — it is part
 * of whatever costs the block or card around it
 *
 * @module modules/library/presentation/components/slots/costMarkContext
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import type { CostMark } from '@/modules/library/domain/costMark';
import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * The enclosing cost.
 */
const CostMarkContext = createContext<CostMark>('other');

/**
 * Props of the provider.
 *
 * @property {CostMark} mark - The mark blocks inside this one inherit
 * @property {ReactNode} children - The blocks it encloses
 */
export interface CostMarkProviderProps {
  mark: CostMark;
  children: ReactNode;
}

/**
 * Announces the cost that blocks inside this one are spent within.
 *
 * @param {CostMarkProviderProps} props - Provider props
 * @returns {JSX.Element} The provider
 */
export const CostMarkProvider: React.FC<CostMarkProviderProps> = ({
  mark,
  children,
}) => (
  <CostMarkContext.Provider value={mark}>{children}</CostMarkContext.Provider>
);

CostMarkProvider.displayName = 'CostMarkProvider';

/**
 * The cost a block would inherit where it states none.
 *
 * @returns {CostMark} The enclosing mark
 */
export function useCostMark(): CostMark {
  return useContext(CostMarkContext);
}
