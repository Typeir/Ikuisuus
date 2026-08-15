/**
 * @fileoverview Parsing Utils Tests
 * @description Locale-aware reading time estimation.
 *
 * @module tests/unit/scripts/metadata/parsingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { calculateReadingTime } from '@scripts/metadata/parsingUtils';
import { describe, expect, it } from 'vitest';

const WORDS_400 = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ');
const WORDS_40 = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');

describe('calculateReadingTime', () => {
  it('formats English minutes by default', () => {
    expect(calculateReadingTime(WORDS_400)).toBe('2 min read');
  });

  it('formats English seconds under a minute', () => {
    expect(calculateReadingTime(WORDS_40)).toBe('12 sec read');
  });

  it('localizes label and speed for Finnish', () => {
    expect(calculateReadingTime(WORDS_400, 'fi')).toBe('3 min lukuaika');
    expect(calculateReadingTime(WORDS_40, 'fi')).toBe('15 s lukuaika');
  });

  it('localizes label and speed for Spanish', () => {
    expect(calculateReadingTime(WORDS_400, 'es')).toBe('2 min de lectura');
  });

  it('falls back to English for unknown locales', () => {
    expect(calculateReadingTime(WORDS_400, 'xx')).toBe('2 min read');
  });
});
