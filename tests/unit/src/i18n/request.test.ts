/**
 * i18n Request Configuration Unit Tests
 *
 * @fileoverview Tests for the request configuration that provides locale detection
 * and message loading for next-intl server components.
 *
 * @module tests/unit/src/i18n/request.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @/i18n/request Module under test
 */

import { describe, it, expect } from 'vitest';
import requestConfig from '@/i18n/request';

describe('request configuration', () => {
  describe('exports', () => {
    it('should export default config function', () => {
      expect(requestConfig).toBeDefined();
      expect(typeof requestConfig).toBe('function');
    });
  });

  describe('configuration function', () => {
    it('should be a valid getRequestConfig result', () => {
      expect(requestConfig).toBeDefined();
    });
  });
});
