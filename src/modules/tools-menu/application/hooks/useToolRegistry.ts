/**
 * @fileoverview i18n-aware hook that resolves the tool registry into renderable menu items.
 * @description Single supported entry point for obtaining the tools-menu item list.
 * Wraps `TOOL_REGISTRY` with `useTranslations` and `useLocale` from next-intl so
 * consumers never need to know about raw label keys or href builders.
 *
 * @module src/modules/tools-menu/application/hooks/useToolRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { ToolMenuItem } from '../../domain/toolMenuItem.types';
import { TOOL_REGISTRY } from '../../infrastructure/registry/toolRegistry.config';

/**
 * Returns the fully-resolved list of tool menu items for the current locale.
 *
 * Labels are translated via the `layout` i18n namespace. Hrefs include the
 * active locale segment. The returned array is memoized and only recomputed
 * when the locale or translation function reference changes.
 *
 * @function useToolRegistry
 * @returns {ToolMenuItem[]} Ordered array of resolved tool menu items ready for rendering.
 *
 * @example
 * ```tsx
 * const toolItems = useToolRegistry();
 * return <ToolsMenu items={toolItems} onSelect={handleSelect} trigger={…} />;
 * ```
 */
export function useToolRegistry(): ToolMenuItem[] {
  const t = useTranslations('layout');
  const locale = useLocale();

  return useMemo(
    () =>
      TOOL_REGISTRY.map((entry) => ({
        id: entry.id,
        label: t(entry.labelKey as Parameters<typeof t>[0]),
        href: entry.hrefBuilder(locale),
      })),
    [t, locale],
  );
}
