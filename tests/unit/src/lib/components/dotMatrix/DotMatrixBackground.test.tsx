import DotMatrixBackground from '@/lib/components/dotMatrix/DotMatrixBackground';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DotMatrixBackground', () => {
  it('renders the reveal element and applies radius as an inline CSS variable', () => {
    const { container } = render(<DotMatrixBackground radius={150} />);

    const el = container.querySelector(
      '[data-flashlight="true"]',
    ) as HTMLElement | null;
    expect(el).toBeTruthy();
    // inline style should contain the reveal radius we passed
    expect(el?.style.getPropertyValue('--reveal-radius').trim()).toBe('150px');
  });

  it('renders the counter-translate pair: an aperture wrapping the pattern field', () => {
    const { container } = render(<DotMatrixBackground />);

    const aperture = container.querySelector(
      '[data-flashlight-aperture="true"]',
    );
    const field = container.querySelector('[data-flashlight-field="true"]');
    expect(aperture).toBeTruthy();
    expect(field).toBeTruthy();
    // the field must live inside the aperture so the aperture clips it
    expect(aperture?.contains(field)).toBe(true);
  });
});
