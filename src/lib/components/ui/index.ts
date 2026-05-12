/**
 * @fileoverview Shared UI Components
 * @description Barrel export for all reusable UI primitives.
 * These components replace native browser elements with accessible, styled alternatives.
 *
 * @module ui
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/** FilterSelect — Accessible dropdown with mobile modal & virtualization */
export { FilterSelect } from './filterSelect';
export type { FilterSelectOption, FilterSelectProps } from './filterSelect';

/** NumericInput — Accessible number input with step buttons */
export { NumericInput } from './numericInput';
export type { NumericInputProps } from './numericInput';

/** TextInput — Accessible styled text input */
export { TextInput } from './textInput';
export type { TextInputProps } from './textInput';

/** TextArea — Accessible styled textarea */
export { TextArea } from './textArea';
export type { TextAreaProps } from './textArea';

/** Tooltip — Accessible tooltip with hover/focus activation */
export { Tooltip, WithTooltip, withTooltip } from './tooltip';
export type { TooltipPlacement, TooltipProps } from './tooltip';

/** PushNotification — Toast-style notification system */
export { NotificationProvider, useNotifications } from './pushNotification';
export type {
  NotificationConfig,
  NotificationPosition,
  NotificationProviderProps,
  NotificationType,
} from './pushNotification';

/** MobileModal — Generic mobile-optimized modal with focus management */
export { MobileModal, Modal } from './modal';
export type { MobileModalProps, ModalProps } from './modal';

/** Draggable — Generic moveable container with drag handle */
export { Draggable } from './draggable/Draggable';

/** GenericEmbedPanel — Generic draggable iframe wrapper container */
export { GenericEmbedPanel } from './embedPanel/GenericEmbedPanel';
export type { GenericEmbedPanelProps } from './embedPanel/GenericEmbedPanel';

/** GradientTabs — Spell-list-style tabbed container (gradient nav + surface panel) */
export { GradientTabs } from './gradientTabs';
export type { GradientTabItem, GradientTabsProps } from './gradientTabs';

/** AsyncTooltip — Lazy-fetching tooltip with single-flight content loading */
export { AsyncTooltip } from './asyncTooltip';
export type { AsyncTooltipProps } from './asyncTooltip';
