import MouseTracker from '@/lib/components/mouseTracker/MouseTracker';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

declare const global: any;

describe('MouseTracker', () => {
  it('writes --mouse-x and --mouse-y CSS vars on pointer move', async () => {
    // deterministic viewport for percentage math
    (global as any).innerWidth = 1000;
    (global as any).innerHeight = 500;

    render(<MouseTracker />);

    // dispatch a pointermove at 100, 250 -> x = 10%, y = 50%
    const ev = new PointerEvent('pointermove', {
      clientX: 100,
      clientY: 250,
    });
    window.dispatchEvent(ev);

    await waitFor(() => {
      const x = document.documentElement.style
        .getPropertyValue('--mouse-x')
        .trim();
      const y = document.documentElement.style
        .getPropertyValue('--mouse-y')
        .trim();
      expect(x).toBe('10%');
      expect(y).toBe('50%');
    });
  });
});
