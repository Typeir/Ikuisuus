/**
 * @fileoverview Unit tests for the lore mark.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/utils/Lore.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

import Lore from '@/modules/library/presentation/components/slots/utils/Lore';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('Lore', () => {
  it('marks the run, so a reader scanning for rules can skip it', () => {
    const html = renderToStaticMarkup(<Lore>A red-haired dwarf.</Lore>);

    expect(html).toContain('data-lore');
    expect(html).toContain('A red-haired dwarf.');
  });

  it('prints no prose of its own', () => {
    const html = renderToStaticMarkup(<Lore />);

    expect(html.replace(/<[^>]*>/g, '')).toBe('');
  });
});
