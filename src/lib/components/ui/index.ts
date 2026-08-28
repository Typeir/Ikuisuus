/**
 * @fileoverview UI components.
 * @description Barrel export for UI primitives.
 *
 * @module ui
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/** FilterSelect — dropdown with mobile modal & virtualization */
export { FilterSelect } from './filterSelect';
export type { FilterSelectOption, FilterSelectProps } from './filterSelect';

/** NumericInput — number input with step buttons */
export { NumericInput } from './numericInput';
export type { NumericInputProps } from './numericInput';

/** TextInput — styled text input */
export { TextInput } from './textInput';
export type { TextInputProps } from './textInput';

/** TextArea — styled textarea */
export { TextArea } from './textArea';
export type { TextAreaProps } from './textArea';

/** Tooltip — tooltip with hover/focus activation */
export { Tooltip, WithTooltip, withTooltip } from './tooltip';
export type { TooltipPlacement, TooltipProps } from './tooltip';

/** Tooltip primitives — hover lifecycle and anchoring, for custom surfaces */
export {
  useEscapeDismiss,
  useTooltipAnchor,
  useTooltipVisibility,
} from './tooltip';
export type { TooltipAnchor, TooltipVisibility } from './tooltip';

/** DetachableTooltip — hover tooltip that parks as a draggable panel on shift-leave */
export { DetachableTooltip } from './detachableTooltip';
export type { DetachableTooltipProps } from './detachableTooltip';

/** PushNotification — toast-style notification system */
export { NotificationProvider, useNotifications } from './pushNotification';
export type {
    NotificationConfig,
    NotificationPosition,
    NotificationProviderProps,
    NotificationType
} from './pushNotification';

/** MobileModal — mobile-optimized modal with focus management */
export { MobileModal, Modal } from './modal';
export type { MobileModalProps, ModalProps } from './modal';

/** Draggable — moveable container with drag handle */
export { Draggable } from './draggable/Draggable';

/** GenericEmbedPanel — draggable iframe wrapper container */
export { GenericEmbedPanel } from './embedPanel/GenericEmbedPanel';
export type { GenericEmbedPanelProps } from './embedPanel/GenericEmbedPanel';

/** ResizablePane — two-pane horizontal split with a draggable handle */
export { ResizablePane } from './resizablePane';
export type { ResizablePaneProps } from './resizablePane';

/** GradientTabs — spell-list-style tabbed container (gradient nav + surface panel) */
export { GradientTabs } from './gradientTabs';
export type { GradientTabItem, GradientTabsProps } from './gradientTabs';

/** AsyncTooltip — lazy-fetching tooltip with single-flight content loading */
export { AsyncTooltip } from './asyncTooltip';
export type { AsyncTooltipProps } from './asyncTooltip';

