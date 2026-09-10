/**
 * @fileoverview domEvents tests.
 * @module tests/unit/src/lib/constants/domEvents.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  CONTENT_CHANGED_EVENT,
  DETAILS_OPENED_EVENT,
} from '@/lib/constants/domEvents';
import { describe, expect, it, vi } from 'vitest';

describe('domEvents', () => {
  it('should keep the names distinct', () => {
    expect(CONTENT_CHANGED_EVENT).not.toBe(DETAILS_OPENED_EVENT);
  });

  it('should namespace both, so nothing else on the page answers them', () => {
    for (const name of [CONTENT_CHANGED_EVENT, DETAILS_OPENED_EVENT]) {
      expect(name.startsWith('ik:')).toBe(true);
    }
  });

  it('should reach a listener when raised on the window', () => {
    const heard = vi.fn();
    window.addEventListener(CONTENT_CHANGED_EVENT, heard);
    window.dispatchEvent(new Event(CONTENT_CHANGED_EVENT));
    window.removeEventListener(CONTENT_CHANGED_EVENT, heard);

    expect(heard).toHaveBeenCalledTimes(1);
  });
});
