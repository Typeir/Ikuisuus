/**
 * @fileoverview Measure Component
 * @description Renders a stored measurement in the reader's chosen system.
 *
 * Metadata stores measures in native form (`12 stride`, `Self (6 stride;ADJ
 * cone)`); metres or feet conversion happens at display time here.
 * Measures are drawn by the `Unit` component; prose segments pass through.
 *
 * @module modules/library/presentation/components/Measure/Measure
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 */

'use client';

import { splitMeasures } from '@/lib/units/nativeMeasure';
import React from 'react';
import Unit from '../Unit';

/**
 * Props for the Measure component.
 *
 * @property {string | null} [text] - A stored measurement in native form
 * @property {string} [fallback] - Rendered when there is no measurement
 */
export interface MeasureProps {
  text?: string | null;
  fallback?: string;
  /** When true, renders measures as `<span>` instead of `<a>`. */
  noLink?: boolean;
}

/**
 * Renders a native measurement string, converting each measure it contains.
 *
 * @param {MeasureProps} props - Component props
 * @returns {React.ReactElement | null} The rendered measurement
 */
export const Measure: React.FC<MeasureProps> = ({ text, fallback = '—', noLink = false }) => {
  if (!text) return <>{fallback}</>;

  const segments = splitMeasures(text);

  return (
    <>
      {segments.map((segment, index) =>
        segment.unit ? (
          <Unit
            key={`${segment.text}-${index}`}
            value={String(segment.numerator)}
            unit={segment.unit}
            denominator={
              segment.denominator !== 1
                ? String(segment.denominator)
                : undefined
            }
            flags={segment.flags}
            noLink={noLink}
          />
        ) : (
          <React.Fragment key={`${segment.text}-${index}`}>
            {segment.text}
          </React.Fragment>
        ),
      )}
    </>
  );
};

export default Measure;
