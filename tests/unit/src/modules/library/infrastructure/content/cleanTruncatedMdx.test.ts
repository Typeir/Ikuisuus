/**
 * @fileoverview cleanTruncatedMdx Tests
 * @description Verifies tail-only cleanup of fixed-length MDX truncations:
 * incomplete tags / links, unbalanced inline delimiters, and trailing pipes
 * or dashes are all removed without disturbing the leading content.
 *
 * @module tests/unit/lib/utils/cleanTruncatedMdx
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { cleanTruncatedMdx } from '@/modules/library/infrastructure/content/cleanTruncatedMdx';
import { describe, expect, it } from 'vitest';

describe('cleanTruncatedMdx', () => {
  it('returns empty input unchanged', () => {
    expect(cleanTruncatedMdx('')).toBe('');
  });

  it('leaves a fully-balanced fragment untouched', () => {
    const src = 'A **bold** word and `code`.';
    expect(cleanTruncatedMdx(src)).toBe('A **bold** word and `code`.');
  });

  it('strips an incomplete HTML tag at the tail', () => {
    expect(cleanTruncatedMdx('Hello <a href="http')).toBe('Hello');
  });

  it('strips an incomplete markdown link at the tail', () => {
    expect(cleanTruncatedMdx('See [the docs](https://exam')).toBe('See');
  });

  it('strips an incomplete markdown link with closed bracket only', () => {
    expect(cleanTruncatedMdx('See [the docs')).toBe('See');
  });

  it('strips an incomplete image embed', () => {
    expect(cleanTruncatedMdx('Look ![alt](/pic')).toBe('Look');
  });

  it('balances an unmatched double-emphasis run', () => {
    expect(cleanTruncatedMdx('Story so far: **the dawn was')).toBe(
      'Story so far: the dawn was',
    );
  });

  it('balances an unmatched single-emphasis run', () => {
    expect(cleanTruncatedMdx('chant of *forgotten')).toBe('chant of forgotten');
  });

  it('balances an unmatched code span', () => {
    expect(cleanTruncatedMdx('run `npm test')).toBe('run npm test');
  });

  it('trims trailing table pipes and dashes', () => {
    expect(cleanTruncatedMdx('| col | col | -')).toBe('| col | col');
  });

  it('trims trailing em/en dashes and commas', () => {
    expect(cleanTruncatedMdx('alpha, beta — ')).toBe('alpha, beta');
  });

  it('handles compound trailing damage: tag + delimiter + pipe', () => {
    expect(cleanTruncatedMdx('Row **bold | <span class="x')).toBe('Row bold');
  });

  it('does not strip balanced bold even when followed by pipes', () => {
    expect(cleanTruncatedMdx('**bold** | trailing')).toBe(
      '**bold** | trailing',
    );
  });

  it('removes an orphaned opening JSX tag whose closer was lost', () => {
    expect(
      cleanTruncatedMdx('Intro <Collapsible>Hidden details about the topic'),
    ).toBe('Intro Hidden details about the topic');
  });

  it('removes a stray closing JSX tag whose opener was lost', () => {
    expect(cleanTruncatedMdx('continuing text</Collapsible> and more')).toBe(
      'continuing text and more',
    );
  });

  it('preserves a balanced JSX element', () => {
    expect(
      cleanTruncatedMdx('Before <Collapsible>inner</Collapsible> after'),
    ).toBe('Before <Collapsible>inner</Collapsible> after');
  });

  it('preserves self-closing tags', () => {
    expect(cleanTruncatedMdx('line one<br/>line two')).toBe(
      'line one<br/>line two',
    );
  });

  it('removes only the unmatched outer tag in a nested unbalanced case', () => {
    expect(
      cleanTruncatedMdx(
        '<Outer><Inner>kept</Inner> trailing words after the inner',
      ),
    ).toBe('<Inner>kept</Inner> trailing words after the inner');
  });
});
