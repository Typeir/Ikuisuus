/**
 * @fileoverview Shared UI Components
 * @description Barrel export for all reusable UI primitives.
 * These components replace native browser elements with accessible, styled alternatives.
 * 
 * @module ui
 */

// FilterSelect - Accessible dropdown with mobile modal & virtualization
export { FilterSelect } from './filterSelect';
export type { FilterSelectProps, FilterSelectOption } from './filterSelect';

// NumericInput - Accessible number input with step buttons
export { NumericInput } from './numericInput';
export type { NumericInputProps } from './numericInput';

// Tooltip - Accessible tooltip with hover/focus activation
export { Tooltip, WithTooltip, withTooltip } from './tooltip';
export type { TooltipProps, TooltipPlacement } from './tooltip';

// PushNotification - Toast-style notification system
export { NotificationProvider, useNotifications } from './pushNotification';
export type { 
  NotificationConfig, 
  NotificationType, 
  NotificationPosition,
  NotificationProviderProps,
} from './pushNotification';

// MobileModal - Generic mobile-optimized modal with focus management
export { MobileModal } from './modal';
export type { MobileModalProps } from './modal';
export { Modal } from './modal';
export type { ModalProps } from './modal';

