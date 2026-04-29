import FlashlightLayer from '@/lib/components/flashlight/FlashlightLayer';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

declare const global: any;

describe('FlashlightLayer', () => {
  it('mounts background and mouse tracker and responds to pointer events', async () => {
    (global as any).innerWidth = 800;
    (global as any).innerHeight = 400;

    const { container } = render(<FlashlightLayer radius={220} />);
    const el = container.querySelector(
      '[data-flashlight="true"]',
    ) as HTMLElement | null;
    expect(el).toBeTruthy();

    // DotMatrixBackground should expose the radius via inline style
    expect(el?.style.getPropertyValue('--reveal-radius').trim()).toBe('220px');

    // Simulate pointermove and assert root CSS vars updated by MouseTracker
    const ev = new PointerEvent('pointermove', { clientX: 80, clientY: 200 });
    window.dispatchEvent(ev);

    await waitFor(() => {
      const x = document.documentElement.style
        .getPropertyValue('--mouse-x')
        .trim();
      const y = document.documentElement.style
        .getPropertyValue('--mouse-y')
        .trim();
      // clientX 80 / innerWidth 800 => 10%
      expect(x).toBe('10%');
      // clientY 200 / innerHeight 400 => 50%
      expect(y).toBe('50%');
    });
  });
});
