import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  /** All supported locales */
  locales: ['en', 'es', 'fi'],

  /** Fallback when no locale matches */
  defaultLocale: 'en',
});
