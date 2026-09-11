/**
 * @fileoverview domEvents tests.
 * @module tests/unit/src/lib/constants/domEvents.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { DETAILS_OPENED_EVENT } from '@/lib/constants/domEvents';
import { describe, expect, it, vi } from 'vitest';

describe('domEvents', () => {
  it('should namespace the name, so nothing else on the page answers it', () => {
    expect(DETAILS_OPENED_EVENT.startsWith('ik:')).toBe(true);
  });

  it('should reach a listener when raised on the window', () => {
    const heard = vi.fn();
    window.addEventListener(DETAILS_OPENED_EVENT, heard);
    window.dispatchEvent(new Event(DETAILS_OPENED_EVENT));
    window.removeEventListener(DETAILS_OPENED_EVENT, heard);

    expect(heard).toHaveBeenCalledTimes(1);
  });
});
