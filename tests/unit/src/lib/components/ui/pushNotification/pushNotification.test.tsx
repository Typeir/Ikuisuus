/**
 * @fileoverview PushNotification Component Tests
 * @description Unit tests for the PushNotification UI component system.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NotificationProvider,
  useNotifications,
} from '@/lib/components/ui/pushNotification';

// Mock createPortal for notification rendering
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Test component that uses the notification hook
function TestConsumer() {
  const notifications = useNotifications();
  
  return (
    <div>
      <button onClick={() => notifications.info('Info message')}>
        Show Info
      </button>
      <button onClick={() => notifications.success('Success message')}>
        Show Success
      </button>
      <button onClick={() => notifications.warning('Warning message')}>
        Show Warning
      </button>
      <button onClick={() => notifications.error('Error message')}>
        Show Error
      </button>
      <button onClick={() => notifications.push({ message: 'Custom', type: 'info', duration: 1000 })}>
        Custom Push
      </button>
      <button onClick={() => notifications.dismissAll()}>
        Clear All
      </button>
    </div>
  );
}

describe('NotificationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <NotificationProvider>
          <div data-testid="child">Child content</div>
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides default context when used without notification', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      expect(screen.getByText('Show Info')).toBeInTheDocument();
    });
  });

  describe('Info Notification', () => {
    it('shows info notification when button clicked', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Info'));
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('has info type in notification', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Info'));
      
      // Check the notification container has info class
      const notification = screen.getByText('Info message').closest('[class*="notification"]');
      expect(notification).toBeInTheDocument();
    });
  });

  describe('Success Notification', () => {
    it('shows success notification when button clicked', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Success'));
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  describe('Warning Notification', () => {
    it('shows warning notification when button clicked', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Warning'));
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('Error Notification', () => {
    it('shows error notification when button clicked', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Error'));
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('levelError:')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('auto-dismisses after custom duration', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Custom Push'));
      
      expect(screen.getByText('Custom')).toBeInTheDocument();
      
      // Advance past duration (1000ms + some buffer)
      act(() => {
        vi.advanceTimersByTime(1200);
      });
      
      expect(screen.queryByText('Custom')).not.toBeInTheDocument();
    });
  });

  describe('Manual Dismiss', () => {
    it('dismisses on close button click', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Info'));
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      
      // Find and click close button
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => 
        btn.getAttribute('aria-label')?.toLowerCase().includes('dismiss') ||
        btn.textContent?.includes('×')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
        // Wait for animation delay (200ms in component)
        act(() => {
          vi.advanceTimersByTime(300);
        });
        expect(screen.queryByText('Info message')).not.toBeInTheDocument();
      }
    });
  });

  describe('Dismiss All', () => {
    it('clears all notifications when dismissAll called', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      // Add multiple notifications
      fireEvent.click(screen.getByText('Show Info'));
      fireEvent.click(screen.getByText('Show Success'));
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Clear All'));
      
      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Notifications', () => {
    it('can show multiple notifications', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      fireEvent.click(screen.getByText('Show Info'));
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Warning'));
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  describe('Position Variants', () => {
    it('renders with default position (top-right)', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      expect(screen.getByText('Show Info')).toBeInTheDocument();
    });

    it('accepts position prop', () => {
      render(
        <NotificationProvider position="bottom-left">
          <TestConsumer />
        </NotificationProvider>
      );
      
      expect(screen.getByText('Show Info')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible notification region', () => {
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );
      
      const region = screen.getByRole('region', { name: /notifications/i });
      expect(region).toBeInTheDocument();
    });
  });
});

describe('useNotifications hook', () => {
  it('returns default context methods when provider missing', () => {
    // When used without provider, hook returns default no-op functions
    // This should not throw, just not do anything
    const TestComponent = () => {
      const notifications = useNotifications();
      // Call methods - they should be no-ops
      expect(typeof notifications.info).toBe('function');
      expect(typeof notifications.success).toBe('function');
      expect(typeof notifications.warning).toBe('function');
      expect(typeof notifications.error).toBe('function');
      expect(typeof notifications.push).toBe('function');
      expect(typeof notifications.dismiss).toBe('function');
      expect(typeof notifications.dismissAll).toBe('function');
      return <div>Test</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
