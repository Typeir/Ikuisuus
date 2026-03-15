/**
 * Push Notification System
 *
 * @fileoverview Singleton notification manager with toast-style push notifications.
 * Supports multiple notification types, auto-dismiss, stacking, and ARIA live regions.
 *
 * @module pushNotification
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * A React context-based notification system that provides:
 * - Type-based styling (info, success, warning, error)
 * - Configurable auto-dismiss with explicit timing constants
 * - Manual dismissal with keyboard accessibility
 * - Stacking with configurable maximum visible count
 * - Position-aware entrance/exit animations
 * - ARIA live regions for screen reader announcements
 * - Portal-based rendering to document.body
 *
 * Timing Configuration:
 * - All durations are in milliseconds
 * - Duration of 0 disables auto-dismiss
 * - Exit animation duration: NOTIFICATION_EXIT_ANIMATION_MS (200ms)
 * - Default durations vary by type (see NOTIFICATION_DEFAULT_DURATIONS)
 *
 * @example
 * // Wrap your app with the provider
 * <NotificationProvider position="top-right">
 *   <App />
 * </NotificationProvider>
 *
 * @example
 * // Use in components
 * const { success, error } = useNotifications();
 * success('Document saved!');
 * error('Failed to save', { duration: 10000 });
 */

'use client';

import { logger } from '@/lib/logging/logger';
import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './pushNotification.module.scss';

const log = logger.child({ module: 'PushNotification' });

/* ============================================
   TIMING CONSTANTS (Named, Documented)
============================================ */

/**
 * Exit animation duration in milliseconds.
 * Must match the CSS animation duration in pushNotification.module.scss.
 *
 * @constant {number}
 * @default 200
 * @since 1.1.0
 */
export const NOTIFICATION_EXIT_ANIMATION_MS = 200;

/**
 * Default auto-dismiss durations by notification type (milliseconds).
 * A value of 0 disables auto-dismiss for that type.
 *
 * @constant {Record<NotificationType, number>}
 * @property {number} info - 5000ms (5 seconds)
 * @property {number} success - 4000ms (4 seconds)
 * @property {number} warning - 6000ms (6 seconds)
 * @property {number} error - 8000ms (8 seconds, longer for critical messages)
 * @since 1.0.0
 */
export const NOTIFICATION_DEFAULT_DURATIONS: Record<NotificationType, number> =
  {
    info: 5000,
    success: 4000,
    warning: 6000,
    error: 8000,
  };

/**
 * Maximum number of notifications visible simultaneously.
 * Older notifications are dismissed when this limit is exceeded.
 *
 * @constant {number}
 * @default 5
 * @since 1.0.0
 */
export const NOTIFICATION_MAX_VISIBLE = 5;

/**
 * Notification types with semantic meaning.
 * Each type has distinct styling and default duration.
 *
 * @typedef {'info' | 'success' | 'warning' | 'error'} NotificationType
 * @property {string} info - Informational messages (blue accent)
 * @property {string} success - Success confirmations (green accent)
 * @property {string} warning - Warning alerts (amber/yellow accent)
 * @property {string} error - Error messages (red accent, longer duration)
 * @since 1.0.0
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * Position where notifications appear on screen.
 * Affects entrance animation direction and stacking order.
 *
 * @typedef {string} NotificationPosition
 * @since 1.0.0
 */
export type NotificationPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Configuration options for creating a notification.
 *
 * @interface NotificationConfig
 * @description User-facing configuration for pushing notifications.
 * @property {string} [id] - Unique ID (auto-generated if not provided)
 * @property {NotificationType} [type='info'] - Notification type for styling
 * @property {ReactNode} message - Main message content (required)
 * @property {string} [title] - Optional title/heading above message
 * @property {number} [duration] - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @property {boolean} [dismissible=true] - Whether user can dismiss manually
 * @property {{ label: string; onClick: () => void }} [action] - Optional action button
 * @property {function} [onDismiss] - Callback when notification is dismissed
 * @since 1.0.0
 */
export interface NotificationConfig {
  id?: string;
  type?: NotificationType;
  message: ReactNode;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

/**
 * Internal notification with required fields
 */
interface Notification extends Required<
  Pick<
    NotificationConfig,
    'id' | 'type' | 'message' | 'duration' | 'dismissible'
  >
> {
  title?: string;
  action?: NotificationConfig['action'];
  onDismiss?: NotificationConfig['onDismiss'];
  createdAt: number;
}

/**
 * Context value for notification system
 */
interface NotificationContextValue {
  /** Push a new notification */
  push: (config: NotificationConfig) => string;
  /** Dismiss a notification by ID */
  dismiss: (id: string) => void;
  /** Dismiss all notifications */
  dismissAll: () => void;
  /** Shorthand for info notification */
  info: (message: ReactNode, options?: Partial<NotificationConfig>) => string;
  /** Shorthand for success notification */
  success: (
    message: ReactNode,
    options?: Partial<NotificationConfig>,
  ) => string;
  /** Shorthand for warning notification */
  warning: (
    message: ReactNode,
    options?: Partial<NotificationConfig>,
  ) => string;
  /** Shorthand for error notification */
  error: (message: ReactNode, options?: Partial<NotificationConfig>) => string;
}

/**
 * Default context value for when provider is missing.
 * All methods are no-ops that log warnings via useNotifications hook.
 *
 * @constant {NotificationContextValue}
 * @since 1.0.0
 */
const defaultContext: NotificationContextValue = {
  push: () => '',
  dismiss: () => {},
  dismissAll: () => {},
  info: () => '',
  success: () => '',
  warning: () => '',
  error: () => '',
};

const NotificationContext =
  createContext<NotificationContextValue>(defaultContext);

/**
 * Generates a unique notification ID using timestamp and random suffix.
 *
 * @function generateId
 * @returns {string} Unique notification ID (e.g., "notification-1704067200000-a1b2c3d4e")
 * @since 1.0.0
 */
function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Props for NotificationProvider component.
 *
 * @interface NotificationProviderProps
 * @description Configuration for the notification provider.
 * @property {ReactNode} children - Child components that can access notifications
 * @property {NotificationPosition} [position='top-right'] - Where notifications appear on screen
 * @property {number} [maxNotifications=NOTIFICATION_MAX_VISIBLE] - Maximum notifications to show at once
 * @since 1.0.0
 */
export interface NotificationProviderProps {
  children: ReactNode;
  position?: NotificationPosition;
  maxNotifications?: number;
}

/**
 * Provider component that manages notification state and renders portal.
 * Must wrap any components that use the useNotifications hook.
 *
 * @component NotificationProvider
 * @param {NotificationProviderProps} props - Provider configuration
 * @param {ReactNode} props.children - Child components that can access notifications
 * @param {NotificationPosition} [props.position='top-right'] - Where notifications appear on screen
 * @param {number} [props.maxNotifications=NOTIFICATION_MAX_VISIBLE] - Maximum notifications shown at once
 * @returns {JSX.Element} Provider with notification portal
 *
 * @description
 * Manages the notification lifecycle:
 * 1. Tracks active notifications in state
 * 2. Handles auto-dismiss timers with proper cleanup
 * 3. Renders notification portal to document.body
 * 4. Provides context to child components
 *
 * Timer Management:
 * - Auto-dismiss timers are tracked in a ref Map
 * - Timers are cleared on unmount to prevent memory leaks
 * - Manual dismissal cancels any pending auto-dismiss timer
 *
 * @example
 * <NotificationProvider position="bottom-right" maxNotifications={3}>
 *   <App />
 * </NotificationProvider>
 *
 * @since 1.0.0
 */
export const NotificationProvider = memo(function NotificationProvider({
  children,
  position = 'top-right',
  maxNotifications = NOTIFICATION_MAX_VISIBLE,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  /** Map of notification IDs to their auto-dismiss timer IDs for cleanup */
  const timerMapRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Client-side only initialization.
   * Copies ref to local variable per React lint rules for cleanup closure.
   * Clears all timers on unmount.
   */
  useEffect(() => {
    setIsMounted(true);
    const timers = timerMapRef.current;
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  /**
   * Dismiss a notification by ID.
   * Clears any pending auto-dismiss timer for this notification.
   */
  const dismiss = useCallback((id: string) => {
    const existingTimer = timerMapRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timerMapRef.current.delete(id);
    }

    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      if (notification?.onDismiss) {
        notification.onDismiss();
      }
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  /**
   * Dismiss all notifications.
   * Clears all pending auto-dismiss timers.
   */
  const dismissAll = useCallback(() => {
    timerMapRef.current.forEach((timerId) => clearTimeout(timerId));
    timerMapRef.current.clear();

    setNotifications((prev) => {
      prev.forEach((n) => n.onDismiss?.());
      return [];
    });
  }, []);

  /**
   * Push a new notification.
   * Sets up auto-dismiss timer if duration > 0.
   *
   * @param {NotificationConfig} config - Notification configuration
   * @returns {string} The notification ID (auto-generated if not provided)
   */
  const push = useCallback(
    (config: NotificationConfig): string => {
      const id = config.id || generateId();
      const type = config.type || 'info';

      const notification: Notification = {
        id,
        type,
        message: config.message,
        title: config.title,
        duration: config.duration ?? NOTIFICATION_DEFAULT_DURATIONS[type],
        dismissible: config.dismissible ?? true,
        action: config.action,
        onDismiss: config.onDismiss,
        createdAt: Date.now(),
      };

      setNotifications((prev) => {
        const newList = [...prev, notification];
        if (newList.length > maxNotifications) {
          const removed = newList.shift();
          if (removed) {
            const removedTimer = timerMapRef.current.get(removed.id);
            if (removedTimer) {
              clearTimeout(removedTimer);
              timerMapRef.current.delete(removed.id);
            }
            removed.onDismiss?.();
          }
        }
        return newList;
      });

      if (notification.duration > 0) {
        const timerId = setTimeout(() => {
          timerMapRef.current.delete(id);
          dismiss(id);
        }, notification.duration);
        timerMapRef.current.set(id, timerId);
      }

      return id;
    },
    [dismiss, maxNotifications],
  );

  /** Shorthand to push an info notification */
  const info = useCallback(
    (message: ReactNode, options?: Partial<NotificationConfig>) =>
      push({ ...options, message, type: 'info' }),
    [push],
  );

  const success = useCallback(
    (message: ReactNode, options?: Partial<NotificationConfig>) =>
      push({ ...options, message, type: 'success' }),
    [push],
  );

  const warning = useCallback(
    (message: ReactNode, options?: Partial<NotificationConfig>) =>
      push({ ...options, message, type: 'warning' }),
    [push],
  );

  const error = useCallback(
    (message: ReactNode, options?: Partial<NotificationConfig>) =>
      push({ ...options, message, type: 'error' }),
    [push],
  );

  const contextValue: NotificationContextValue = {
    push,
    dismiss,
    dismissAll,
    info,
    success,
    warning,
    error,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {isMounted &&
        createPortal(
          <div
            className={`${styles.container} ${styles[position.replace('-', '')]}`}
            role='region'
            aria-label='Notifications'>
            {/* ARIA live region for screen readers */}
            <div
              role='status'
              aria-live='polite'
              aria-atomic='true'
              className={styles.srOnly}>
              {notifications.length > 0 &&
                `${notifications.length} notification${notifications.length > 1 ? 's' : ''}`}
            </div>

            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDismiss={() => dismiss(notification.id)}
                position={position}
              />
            ))}
          </div>,
          document.body,
        )}
    </NotificationContext.Provider>
  );
});

/**
 * SVG path data for each notification type icon.
 * All icons use a 20x20 viewBox with evenodd fill/clip rules.
 */
const NOTIFICATION_ICON_PATHS: Record<NotificationType, string> = {
  info: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
  success:
    'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
  warning:
    'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  error:
    'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
};

/**
 * Individual notification item
 */
interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
  position: NotificationPosition;
}

const NotificationItem = memo(function NotificationItem({
  notification,
  onDismiss,
  position,
}: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  /** Triggers exit animation before calling onDismiss after 200ms animation completes */
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  /** Returns the appropriate SVG icon based on notification type */
  const getIcon = () => (
    <svg
      className={styles.icon}
      viewBox='0 0 20 20'
      fill='currentColor'
      aria-hidden='true'>
      <path
        fillRule='evenodd'
        d={NOTIFICATION_ICON_PATHS[notification.type ?? 'info']}
        clipRule='evenodd'
      />
    </svg>
  );

  const enterDirection = position.includes('left') ? 'Left' : 'Right';

  return (
    <div
      className={`${styles.notification} ${styles[notification.type]} ${isExiting ? styles.exiting : ''}`}
      role='alert'
      aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
      style={
        {
          '--enter-direction': enterDirection === 'Left' ? '-100%' : '100%',
        } as React.CSSProperties
      }>
      <div className={styles.iconWrapper}>{getIcon()}</div>

      <div className={styles.content}>
        {notification.title && (
          <div className={styles.title}>{notification.title}</div>
        )}
        <div className={styles.message}>{notification.message}</div>

        {notification.action && (
          <button
            className={styles.actionButton}
            onClick={() => {
              notification.action?.onClick();
              handleDismiss();
            }}>
            {notification.action.label}
          </button>
        )}
      </div>

      {notification.dismissible && (
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label='Dismiss notification'>
          <svg viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
            <path
              fillRule='evenodd'
              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      )}
    </div>
  );
});

/**
 * Hook to access notification system
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const notifications = useNotifications();
 *
 *   const handleSave = () => {
 *     notifications.success('Document saved successfully!');
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (context === defaultContext) {
    log.warning('useNotifications must be used within a NotificationProvider', {
      message: 'Notifications will not be displayed',
    });
  }

  return context;
}

export default NotificationProvider;
