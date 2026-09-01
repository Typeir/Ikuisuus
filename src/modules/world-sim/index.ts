/**
 * @fileoverview World Sim public barrel
 * @description Re-exports all public components and types from the World Sim module.
 * @module modules/world-sim/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

export {
    useWorldSimDispatch,
    useWorldSimState,
    WorldSimProvider
} from '@/modules/world-sim/application/state/WorldSimContext';
export { ZoomLevel } from '@/modules/world-sim/application/state/worldSimTypes';
export type {
    WorldSimAction,
    WorldSimState
} from '@/modules/world-sim/application/state/worldSimTypes';
export type {
    CelestialBodyData,
    CelestialRegion,
    ICelestialRenderer,
    ProjectedPosition
} from '@/modules/world-sim/domain/celestials/celestialBody.types';

