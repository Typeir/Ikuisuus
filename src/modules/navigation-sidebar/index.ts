/**
 * @fileoverview navigation-sidebar module barrel
 * @module modules/navigation-sidebar
 * @description Recursive library tree navigation. Public API surfaces presentation components,
 * state hooks, server-callable tree utilities, and domain types. Internal composition details,
 * infrastructure utilities, and deep application paths are not exported.
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

export { useSidebarExpansion, useSidebarExpansion as useSidebarExpansionActions } from './application/hooks/useSidebarExpansion';
export { useSidebarMenu } from './application/hooks/useSidebarMenu';
export { useSidebarMenuActions } from './application/hooks/useSidebarMenuActions';
export {
    shallowWalk as repositoryShallowWalk,
    walk as repositoryWalk
} from '@/modules/library/infrastructure/navigation/walk';
export { SidebarShell } from './presentation/components/SidebarShell';

export type {
    Item, LayoutItem, SidebarProps, SidebarItemProps, WalkNode
} from './domain/types';

