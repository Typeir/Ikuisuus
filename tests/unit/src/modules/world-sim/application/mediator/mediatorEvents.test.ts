/**
 * @fileoverview Unit tests for mediatorEvents helpers
 * @description Tests for createInputHandler factory.
 *
 * @module tests/unit/src/modules/world-sim/application/mediator/mediatorEvents.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createInputHandler } from '@/modules/world-sim/application/mediator/mediatorEvents';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/world-sim/infrastructure/input/CanvasInputHandler', () => ({
  CanvasInputHandler: vi.fn().mockImplementation(function () {
    return {
      attach: vi.fn(),
      detach: vi.fn(),
    };
  }),
}));

describe('createInputHandler', () => {
  it('constructs a CanvasInputHandler and calls attach', async () => {
    const canvas = document.createElement('canvas');
    const camera = {} as never;
    const getCanvasRect = () => canvas.getBoundingClientRect();
    const raycastService = {} as never;
    const isTransitioning = () => false;
    const onBodyClick = vi.fn();
    const onHoverChange = vi.fn();

    const { CanvasInputHandler } = vi.mocked(
      await import('@/modules/world-sim/infrastructure/input/CanvasInputHandler'),
    );

    const handler = createInputHandler(
      canvas,
      camera,
      getCanvasRect,
      raycastService,
      isTransitioning,
      onBodyClick,
      onHoverChange,
    );

    expect(CanvasInputHandler).toHaveBeenCalledOnce();
    expect(handler.attach).toHaveBeenCalledOnce();
  });
});
