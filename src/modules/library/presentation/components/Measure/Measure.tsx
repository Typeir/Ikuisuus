/**
 * @fileoverview Measure Component
 * @description Renders a stored measurement in the reader's chosen system.
 *
 * Metadata holds measures in the native form — `12 stride`, `Self (6 stride;ADJ
 * cone)` — because that is the fact the rules state. Turning it into metres or
 * feet is a display decision, and this is where it is made.
 *
 * The measures themselves are drawn by `Unit`, the same component the MDX
 * pipeline emits, so a range in a table and the identical range in an article
 * convert alike and link to the same definition. Everything between them is
 * prose and is passed through untouched: `Self` and `cone` carry meaning the
 * number does not.
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
}

/**
 * Renders a native measurement string, converting each measure it contains.
 *
 * @param {MeasureProps} props - Component props
 * @returns {React.ReactElement | null} The rendered measurement
 */
export const Measure: React.FC<MeasureProps> = ({ text, fallback = '—' }) => {
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
