/**
 * @fileoverview Interactive sidebar client entry. Re-exports the Sidebar component
 * as the default export so it can be lazily loaded via next/dynamic from SidebarShell.
 *
 * @module lib/components/sidebar/SidebarClient
 * @author Typeir
 * @version 1.0.0
 * @since 2.1.0
 */

'use client';

export { Sidebar as default } from './sidebar';
export type { Item } from './sidebar';

