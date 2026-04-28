/**
 * @fileoverview Unit tests for StreamBootstrap.
 * @description Verifies that the component sets --stream-px and --stream-speed
 * on sections with data-stream attributes after mount.
 */

import StreamBootstrap from '@/lib/components/stream/StreamBootstrap';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('StreamBootstrap', () => {
  it('renders null', () => {
    const { container } = render(<StreamBootstrap />);
    expect(container.firstChild).toBeNull();
  });

  it('sets --stream-px and --stream-speed on sections with data-stream', async () => {
    const sec = document.createElement('section');
    sec.setAttribute('data-stream', '// ALBEDO · CR:5 // // ALBEDO · CR:5 //');
    document.body.appendChild(sec);

    render(<StreamBootstrap />);

    await waitFor(() => {
      expect(sec.style.getPropertyValue('--stream-px')).not.toBe('');
      expect(sec.style.getPropertyValue('--stream-speed')).not.toBe('');
    });

    document.body.removeChild(sec);
  });
});
