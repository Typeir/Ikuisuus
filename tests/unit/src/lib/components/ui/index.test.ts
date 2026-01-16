/**
 * @fileoverview UI Components barrel export tests
 * @description Smoke tests for all UI component exports
 */

import { describe, it, expect } from 'vitest';
import {
  FilterSelect,
  NumericInput,
  Tooltip,
  withTooltip,
  NotificationProvider,
  useNotifications,
} from '@/lib/components/ui';

describe('UI components barrel export', () => {
  describe('FilterSelect', () => {
    it('exports FilterSelect component', () => {
      expect(FilterSelect).toBeDefined();
      // forwardRef components are objects
      expect(FilterSelect).toBeTruthy();
    });
  });

  describe('NumericInput', () => {
    it('exports NumericInput component', () => {
      expect(NumericInput).toBeDefined();
      // forwardRef components are objects
      expect(NumericInput).toBeTruthy();
    });
  });

  describe('Tooltip', () => {
    it('exports Tooltip component', () => {
      expect(Tooltip).toBeDefined();
      // forwardRef/memo components are objects
      expect(Tooltip).toBeTruthy();
    });

    it('exports withTooltip HOC', () => {
      expect(withTooltip).toBeDefined();
      expect(typeof withTooltip).toBe('function');
    });
  });

  describe('PushNotification', () => {
    it('exports NotificationProvider component', () => {
      expect(NotificationProvider).toBeDefined();
      // memo components are objects
      expect(NotificationProvider).toBeTruthy();
    });

    it('exports useNotifications hook', () => {
      expect(useNotifications).toBeDefined();
      expect(typeof useNotifications).toBe('function');
    });
  });
});
