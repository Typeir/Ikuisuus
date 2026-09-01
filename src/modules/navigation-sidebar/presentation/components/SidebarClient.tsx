/**
 * @fileoverview Interactive sidebar client entry. Exports the Sidebar component
 * as the default export so it can be lazily loaded via next/dynamic from SidebarShell.
 *
 * @module modules/navigation-sidebar/presentation/components/SidebarClient
 * @author Typeir
 * @version 1.0.0
 * @since 2.1.0
 */

'use client';

import type {
    Item,
    LayoutItem,
    SidebarProps,
} from '@/modules/navigation-sidebar/domain/types';
import { Sidebar } from './sidebar';

export default Sidebar;
export type { Item, LayoutItem, SidebarProps };

