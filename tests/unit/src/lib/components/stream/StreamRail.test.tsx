/**
 * @fileoverview Unit tests for StreamRail and streamStyle.
 * @description The rail is an aria-hidden span keyed by side; streamStyle
 * quotes the text as a CSS string and derives a clamped loop duration.
 *
 * @module tests/unit/src/lib/components/stream/StreamRail.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-28
 */

import {
  StreamRail,
  cssString,
  streamStyle,
} from '@/lib/components/stream/StreamRail';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const vars = (text: string): Record<string, string> =>
  streamStyle(text) as unknown as Record<string, string>;

describe('StreamRail', () => {
  it('renders an aria-hidden rail keyed by side', () => {
    const { container } = render(<StreamRail side='right' />);
    const rail = container.querySelector('[data-stream-rail]');
    expect(rail?.getAttribute('data-stream-rail')).toBe('right');
    expect(rail?.getAttribute('aria-hidden')).toBe('true');
    expect(rail?.textContent).toBe('');
  });

  it('defaults to the left side', () => {
    const { container } = render(<StreamRail />);
    expect(container.querySelector('[data-stream-rail="left"]')).not.toBeNull();
  });
});

describe('cssString', () => {
  it('quotes and escapes into one CSS string token', () => {
    expect(cssString('He said "hi" \\ there')).toBe(
      '"He said \\"hi\\" \\\\ there"',
    );
  });

  it('collapses whitespace runs, since a raw newline ends a CSS string', () => {
    expect(cssString('A\n   B\tC')).toBe('"A B C"');
  });
});

describe('streamStyle', () => {
  it('sets the quoted text and a length-derived duration', () => {
    const text = '// Mucklord · CR:28 · GARGANTUAN · CONSTRUCT · HP:999 //';
    const style = vars(text);
    expect(style['--stream-text']).toBe(`"${text}"`);
    expect(style['--stream-speed']).toBe('8.7s');
  });

  it('scales the duration with the text length', () => {
    expect(parseFloat(vars('X'.repeat(200))['--stream-speed'])).toBeGreaterThan(
      parseFloat(vars('X'.repeat(100))['--stream-speed']),
    );
  });

  it('clamps the duration to the 4s–120s range', () => {
    expect(vars('X')['--stream-speed']).toBe('4.0s');
    expect(vars('X'.repeat(2000))['--stream-speed']).toBe('120.0s');
  });
});
