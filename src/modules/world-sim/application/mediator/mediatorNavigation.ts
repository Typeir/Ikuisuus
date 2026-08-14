/**
 * @fileoverview Mediator Navigation Helpers
 * @description Pure functions for zooming the camera to a body, region, or local coordinate, accepting explicit dependencies.
 *
 * @module modules/world-sim/application/mediator/mediatorNavigation
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    ZoomToBodyCommand,
    ZoomToRegionCommand,
} from '@/modules/world-sim/application/commands/CameraCommand';
import {
    WorldSimActionType,
    type WorldSimAction,
} from '@/modules/world-sim/application/state/worldSimTypes';
import type { CelestialRegistry } from '@/modules/world-sim/domain/celestials/celestialRegistry';
import { surfacePositionToWorld } from '@/modules/world-sim/domain/celestials/orbitalMechanics';
import {
    LOCAL_COORD_VIEW_DISTANCE,
    REGION_VIEW_DISTANCE,
    VIEW_DISTANCE_MULTIPLIER,
} from '@/modules/world-sim/infrastructure/config/sceneTuning';
import type { CelestialEntry } from '@/modules/world-sim/infrastructure/geometry/factories/CelestialSceneBuilder';
import type { CameraController } from '@/modules/world-sim/infrastructure/input/CameraController';
import type React from 'react';

/**
 * Execute a zoom-to-body camera transition.
 * Updates the followed body ID via the provided setter and dispatches SelectBody.
 *
 * @param {string} bodyId - Target body ID
 * @param {Map<string, CelestialEntry>} celestials - Active celestial entries
 * @param {CameraController} cameraController - Camera controller
 * @param {React.Dispatch<WorldSimAction>} dispatch - State dispatch
 * @param {Function} setFollowed - Setter for the mediator's followedBodyId
 */
export function zoomToBodyImpl(
  bodyId: string,
  celestials: Map<string, CelestialEntry>,
  cameraController: CameraController,
  dispatch: React.Dispatch<WorldSimAction>,
  setFollowed: (id: string) => void,
): void {
  const entry = celestials.get(bodyId);
  if (!entry) return;

  const viewDistance = entry.data.radius * VIEW_DISTANCE_MULTIPLIER;
  const positionGetter = () => entry.mesh.position.clone();
  const command = new ZoomToBodyCommand(
    entry.mesh.position.clone(),
    viewDistance,
    bodyId,
  );

  setFollowed(bodyId);
  cameraController.setFollowTarget(positionGetter);
  cameraController.executeCommand(command);
  dispatch({ type: WorldSimActionType.SelectBody, bodyId });
}

/**
 * Execute a zoom-to-region camera transition on a body's surface.
 *
 * @param {string} bodyId - Parent body ID
 * @param {string} regionId - Target region ID
 * @param {Map<string, CelestialEntry>} celestials - Active celestial entries
 * @param {CelestialRegistry} registry - Body data registry
 * @param {CameraController} cameraController - Camera controller
 * @param {React.Dispatch<WorldSimAction>} dispatch - State dispatch
 * @param {Function} setFollowed - Setter for the mediator's followedBodyId
 */
export function zoomToRegionImpl(
  bodyId: string,
  regionId: string,
  celestials: Map<string, CelestialEntry>,
  registry: CelestialRegistry,
  cameraController: CameraController,
  dispatch: React.Dispatch<WorldSimAction>,
  setFollowed: (id: string) => void,
): void {
  const entry = celestials.get(bodyId);
  const region = registry.getRegion(bodyId, regionId);
  if (!entry || !region) return;

  const worldPos = surfacePositionToWorld(
    region.surfacePosition,
    entry.data.radius,
    entry.mesh.position,
  );
  const command = new ZoomToRegionCommand(
    worldPos,
    entry.mesh.position.clone(),
    REGION_VIEW_DISTANCE,
    regionId,
  );

  setFollowed(bodyId);
  const positionGetter = () => entry.mesh.position.clone();
  cameraController.setFollowTarget(positionGetter);
  cameraController.executeCommand(command);
  dispatch({ type: WorldSimActionType.SelectRegion, regionId, bodyId });
}

/**
 * Execute a zoom-to-local-coordinate camera transition on a body's surface.
 *
 * @param {string} bodyId - Parent body ID
 * @param {{ lat: number; lon: number }} localCoord - Surface coordinates in degrees
 * @param {number | undefined} viewDist - Optional view distance override
 * @param {Map<string, CelestialEntry>} celestials - Active celestial entries
 * @param {CameraController} cameraController - Camera controller
 * @param {React.Dispatch<WorldSimAction>} dispatch - State dispatch
 * @param {Function} setFollowed - Setter for the mediator's followedBodyId
 */
export function zoomToLocalCoordinateImpl(
  bodyId: string,
  localCoord: { lat: number; lon: number },
  viewDist: number | undefined,
  celestials: Map<string, CelestialEntry>,
  cameraController: CameraController,
  dispatch: React.Dispatch<WorldSimAction>,
  setFollowed: (id: string) => void,
): void {
  const entry = celestials.get(bodyId);
  if (!entry) return;

  const worldPos = surfacePositionToWorld(
    localCoord,
    entry.data.radius,
    entry.mesh.position,
  );
  const distance = viewDist ?? LOCAL_COORD_VIEW_DISTANCE;
  const command = new ZoomToRegionCommand(
    worldPos,
    entry.mesh.position.clone(),
    distance,
    `local-${bodyId}`,
  );

  setFollowed(bodyId);
  const positionGetter = () => entry.mesh.position.clone();
  cameraController.setFollowTarget(positionGetter);
  cameraController.executeCommand(command);
  dispatch({ type: WorldSimActionType.SelectBody, bodyId });
}
