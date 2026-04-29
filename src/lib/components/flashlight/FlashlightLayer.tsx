/**
 * @fileoverview Client wrapper to mount the flashlight reveal layer and pointer tracker
 * @module lib/components/flashlight/FlashlightLayer
 * @author Typeir
 * @version 0.1.0
 * @since 2026-04-29
 */

'use client';

import DotMatrixBackground from '@/lib/components/dotMatrix/DotMatrixBackground';
import MouseTracker from '@/lib/components/mouseTracker/MouseTracker';

type Props = {
  radius?: number;
};

export default function FlashlightLayer({ radius = 220 }: Props) {
  return (
    <>
      <DotMatrixBackground radius={radius} />
      <MouseTracker />
    </>
  );
}
