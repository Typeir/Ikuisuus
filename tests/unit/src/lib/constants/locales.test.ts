import {
  DEFAULT_KEYWORD_LOCALE,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from '@/lib/constants/locales';
import { describe, expect, it } from 'vitest';

describe('locales', () => {
  it('routes under English only until launch', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en']);
  });

  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(DEFAULT_KEYWORD_LOCALE).toBe('en');
  });

  it('lists the default among the supported locales', () => {
    expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
  });
});
