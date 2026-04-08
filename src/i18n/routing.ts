/**
 * @fileoverview Module for src/i18n/routing.ts
 * @module src/i18n/routing
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  /** All supported locales */
  locales: ['en', 'es', 'fi'],

  /** Fallback when no locale matches */
  defaultLocale: 'en',
});
