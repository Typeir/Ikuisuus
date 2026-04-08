/**
 * @fileoverview Module for src/i18n/request.ts
 * @module src/i18n/request
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async (fullRequest) => {
  const { requestLocale: requested } = await fullRequest;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    timeZone: 'UTC',
    messages: (await import(`../../messages/${locale}/index.json`)).default,
  };
});
