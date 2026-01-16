/**
 * @fileoverview PushNotification barrel export tests
 * @description Smoke tests for PushNotification exports
 */

import { describe, it, expect } from 'vitest';
import {
  NotificationProvider,
  useNotifications,
} from '@/lib/components/ui/pushNotification';

describe('PushNotification barrel export', () => {
  it('exports NotificationProvider component', () => {
    expect(NotificationProvider).toBeDefined();
    // memo-wrapped components might be objects with $$typeof
    expect(NotificationProvider).toBeTruthy();
  });

  it('exports useNotifications hook', () => {
    expect(useNotifications).toBeDefined();
    expect(typeof useNotifications).toBe('function');
  });
});
