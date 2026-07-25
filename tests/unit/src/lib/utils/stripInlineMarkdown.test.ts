/**
 * @fileoverview stripInlineMarkdown Unit Tests
 * @description Verifies inline markdown removal: paired emphasis/code/links and
 * stray unpaired bold markers split across values.
 *
 * @module tests/unit/src/lib/utils/stripInlineMarkdown
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { stripInlineMarkdown } from '@/lib/utils/stripInlineMarkdown';
import { describe, expect, it } from 'vitest';

describe('stripInlineMarkdown', () => {
  it('unwraps paired bold and italic', () => {
    expect(stripInlineMarkdown('**Light**, Medium, **Heavy**')).toBe(
      'Light, Medium, Heavy',
    );
    expect(stripInlineMarkdown('navigate *complex* structures')).toBe(
      'navigate complex structures',
    );
  });

  it('unwraps underscore emphasis and inline code', () => {
    expect(stripInlineMarkdown('__bold__ and `code`')).toBe('bold and code');
  });

  it('collapses links to their text', () => {
    expect(stripInlineMarkdown('see [the rules](/rules/x) now')).toBe(
      'see the rules now',
    );
  });

  it('clears a stray unpaired bold marker (split table cell)', () => {
    expect(stripInlineMarkdown('**Martial')).toBe('Martial');
    expect(stripInlineMarkdown('Simple**')).toBe('Simple');
    expect(stripInlineMarkdown('Medicine**')).toBe('Medicine');
  });

  it('leaves lone single asterisks and underscores untouched', () => {
    expect(stripInlineMarkdown('5 * 3 = 15')).toBe('5 * 3 = 15');
    expect(stripInlineMarkdown('snake_case_name')).toBe('snake_case_name');
  });

  it('returns plain text unchanged', () => {
    expect(stripInlineMarkdown('Light, Medium, Heavy')).toBe(
      'Light, Medium, Heavy',
    );
  });
});
