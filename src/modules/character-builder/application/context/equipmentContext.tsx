/**
 * @fileoverview Equipment Context
 * @description React context exposing derived equipment totals.
 *
 * @module modules/character-builder/application/context/equipmentContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { createContext, useContext } from 'react';

/**
 * Values derived from the equipment item list.
 *
 * @interface EquipmentContextValue
 * @property {number} totalWeight - Sum of (quantity × weightLb) for every item
 * @property {number} totalCount - Total number of distinct item rows
 */
export interface EquipmentContextValue {
  totalWeight: number;
  totalCount: number;
}

const EquipmentContext = createContext<EquipmentContextValue>({
  totalWeight: 0,
  totalCount: 0,
});

/**
 * Consume the nearest Equipment context value.
 *
 * @function useEquipmentContext
 * @returns {EquipmentContextValue} Derived equipment totals
 */
export const useEquipmentContext = (): EquipmentContextValue =>
  useContext(EquipmentContext);

export const EquipmentProvider = EquipmentContext.Provider;
