/**
 * @fileoverview Shared UI Components
 * @description Barrel export for all reusable UI primitives.
 * These components replace native browser elements with accessible, styled alternatives.
 *
 * @module ui
 */

// FilterSelect - Accessible dropdown with mobile modal & virtualization
export { FilterSelect } from './filterSelect';
export type { FilterSelectOption, FilterSelectProps } from './filterSelect';

// NumericInput - Accessible number input with step buttons
export { NumericInput } from './numericInput';
export type { NumericInputProps } from './numericInput';

// Tooltip - Accessible tooltip with hover/focus activation
export { Tooltip, WithTooltip, withTooltip } from './tooltip';
export type { TooltipPlacement, TooltipProps } from './tooltip';

// PushNotification - Toast-style notification system
export { NotificationProvider, useNotifications } from './pushNotification';
export type {
    NotificationConfig, NotificationPosition,
    NotificationProviderProps, NotificationType
} from './pushNotification';

// MobileModal - Generic mobile-optimized modal with focus management
export { MobileModal, Modal } from './modal';
export type { MobileModalProps, ModalProps } from './modal';

// Draggable - Generic moveable container with drag handle
export { Draggable } from './draggable/Draggable';
