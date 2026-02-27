# World Sim Module — Architecture & Implementation Plan

> **Purpose**: A Three.js-powered interactive solar system renderer for the Black Cradle, with zoomable celestial bodies, clickable landmasses that surface DOM panels anchored to 3D positions, and deep-links into the existing library content.

---

## Table of Contents

1. [Narrative Scope](#1-narrative-scope)
2. [Module Overview](#2-module-overview)
3. [Technology Choices](#3-technology-choices)
4. [Architecture — Design Patterns & Principles](#4-architecture--design-patterns--principles)
5. [Directory Structure](#5-directory-structure)
6. [Data Model — Celestial Registry](#6-data-model--celestial-registry)
7. [Core Systems](#7-core-systems)
8. [Component Hierarchy](#8-component-hierarchy)
9. [Three.js ↔ DOM Bridge](#9-threejs--dom-bridge)
10. [Camera & Navigation](#10-camera--navigation)
11. [Rendering Pipeline](#11-rendering-pipeline)
12. [Interaction Model](#12-interaction-model)
13. [Accessibility & Responsiveness](#13-accessibility--responsiveness)
14. [Integration with Existing Systems](#14-integration-with-existing-systems)
15. [Phased Implementation Plan](#15-phased-implementation-plan)
16. [Testing Strategy](#16-testing-strategy)
17. [Performance Budget](#17-performance-budget)

---

## 1. Narrative Scope

The **Black Cradle** is the solar system forged from the remains of the Golden One. It includes celestial bodies of wildly varied shapes and metaphysical properties. From the attached lore ("The Great Tale of Everything"), the following bodies are catalogued:

### Celestial Bodies (Orbital Objects)

| Body                      | Lore Origin                     | Shape/Type                          | Content Path                               |
| ------------------------- | ------------------------------- | ----------------------------------- | ------------------------------------------ |
| **Kultharja** ("The Sun") | The Golden One's mane           | Star (central)                      | `world/the-lands-of-damocles/kultharja`    |
| **Damocles** (Taiva)      | The Golden One's heart          | Terrestrial planet (main world)     | `world/the-lands-of-damocles/damocles`     |
| **Opaline Belt**          | The Golden One's tears          | Asteroid ring                       | `world/the-lands-of-damocles/opaline-belt` |
| **Länsihenki**            | The Golden One's lungs (west)   | Gas giant (contradicting orbit)     | `world/the-lands-of-damocles/lansihenki`   |
| **Itähenki**              | The Golden One's lungs (east)   | Gas giant (contradicting orbit)     | `world/the-lands-of-damocles/itahenki`     |
| **Kalmora**               | The Golden One's liver          | Rotworld (decayed planet)           | `world/the-lands-of-damocles/kalmora`      |
| **Selkara**               | The Golden One's marrow & spine | Tower-world (vertical structure)    | `world/the-lands-of-damocles/selkara`      |
| **Mana**                  | The Golden One's shadow         | Ring-worlds (multiple nested rings) | `world/the-lands-of-damocles/mana`         |

### Boundary Layer

| Body         | Lore Origin     | Type                           |
| ------------ | --------------- | ------------------------------ |
| **Everdark** | Dragon's breath | Enclosing sphere of black fire |

### Landmasses on Damocles (clickable regions)

| Region              | Content Path                                      |
| ------------------- | ------------------------------------------------- |
| Thule               | `world/the-lands-of-damocles/thule`               |
| Thealas             | `world/the-lands-of-damocles/thealas`             |
| Ordovica            | `world/the-lands-of-damocles/ordovica`            |
| Pyknos              | `world/the-lands-of-damocles/pyknos`              |
| Binturia            | `world/the-lands-of-damocles/binturia`            |
| Borossa             | `world/the-lands-of-damocles/borossa`             |
| Brume Empire        | `world/the-lands-of-damocles/brume-empire`        |
| Brine Pools         | `world/the-lands-of-damocles/brine-pools`         |
| Elû                 | `world/the-lands-of-damocles/elu`                 |
| Library of Ikuisuus | `world/the-lands-of-damocles/library-of-ikuisuus` |

### Special Structures (potential deep-zoom targets)

| Structure                      | Content Path                       |
| ------------------------------ | ---------------------------------- |
| Plato Tower (Station)          | `world/structures/plato-tower`     |
| Scala Ad Caelum                | `world/structures/scala-ad-caelum` |
| Acheron (Dreadlord's fortress) | `world/structures/acheron`         |

---

## 2. Module Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    WorldSim Module                              │
│                                                                 │
│  ┌───────────────┐   ┌────────────────┐   ┌─────────────────┐  │
│  │  Three.js     │   │  Bridge Layer  │   │  DOM Overlay    │  │
│  │  Scene Graph  │◄──┤  (projection   ├──►│  (React panels, │  │
│  │  (WebGL)      │   │   + events)    │   │   info cards)   │  │
│  └───────────────┘   └────────────────┘   └─────────────────┘  │
│         ▲                    ▲                     ▲            │
│         │                    │                     │            │
│  ┌──────┴───────┐   ┌───────┴────────┐   ┌────────┴────────┐  │
│  │ Celestial     │   │ Camera         │   │ Content         │  │
│  │ Registry      │   │ Controller     │   │ Resolver        │  │
│  │ (data)        │   │ (navigation)   │   │ (MDX links)     │  │
│  └──────────────┘   └────────────────┘   └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Idea**: Three.js owns the 3D canvas. React owns all DOM UI. A thin **Bridge Layer** projects 3D world-space positions to 2D screen coordinates every frame, so DOM panels can follow celestial bodies or landmasses without being rendered inside WebGL.

---

## 3. Technology Choices

| Concern           | Choice                                                       | Rationale                                                                            |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 3D rendering      | **Three.js** (vanilla, no R3F)                               | Maximum control over render loop, no abstraction overhead, better for custom shaders |
| React integration | **Imperative bridge** via `useRef` + `requestAnimationFrame` | Avoids R3F dependency; keeps React and Three.js lifecycles separate                  |
| State management  | **React Context + useReducer**                               | Matches existing `PersistentUiContext` pattern                                       |
| Styling           | **SCSS Modules**                                             | Project convention                                                                   |
| Content links     | **Next.js router** (`useRouter`)                             | Deep-link to existing MDX library pages                                              |
| Orbit math        | **Keplerian utilities** (custom)                             | Simple elliptical orbits; no physics engine needed                                   |

### New Dependencies

```json
{
  "three": "^0.170.0",
  "@types/three": "^0.170.0"
}
```

No other new dependencies. The bridge, controls, and projection math will be implemented from scratch for maximum control.

---

## 4. Architecture — Design Patterns & Principles

### SOLID Mapping

| Principle                     | Application                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** — Single Responsibility | Each class/hook owns exactly one concern: `CelestialBody` = mesh + orbit; `CameraController` = camera only; `ProjectionBridge` = 3D→2D only                       |
| **O** — Open/Closed           | `CelestialRegistry` accepts new body definitions via data (JSON), not code changes. Body renderers use a `CelestialBodyRenderer` strategy interface               |
| **L** — Liskov Substitution   | All body types (`Planet`, `Ring`, `Star`, `TowerWorld`) implement `ICelestialBody` and can be used interchangeably in the scene graph                             |
| **I** — Interface Segregation | Separate interfaces: `IRenderable` (mesh concerns), `IInteractable` (click/hover), `IOrbitable` (orbital mechanics), `ILabelable` (DOM projection target)         |
| **D** — Dependency Inversion  | Components depend on abstractions (`ICelestialBody`, `ICameraController`) not concrete classes. The scene manager receives dependencies via constructor injection |

### Design Patterns Used

| Pattern      | Where                   | Purpose                                                                            |
| ------------ | ----------------------- | ---------------------------------------------------------------------------------- |
| **Strategy** | `CelestialBodyRenderer` | Different rendering strategies per body type (sphere, rings, tower, asteroid belt) |
| **Observer** | `SceneEventBus`         | Decouple Three.js interactions (click, hover) from React UI updates                |
| **Mediator** | `WorldSimMediator`      | Coordinate camera, scene, and DOM overlay without cross-dependencies               |
| **Factory**  | `CelestialBodyFactory`  | Create appropriate Three.js meshes from registry data                              |
| **Adapter**  | `ProjectionBridge`      | Adapt Three.js world coordinates to CSS `transform` positions                      |
| **Registry** | `CelestialRegistry`     | Central data store for all celestial bodies, queried by ID                         |
| **Command**  | `CameraCommand`         | Encapsulate camera transitions (zoom-to-body, orbit, reset) as replayable objects  |

---

## 5. Directory Structure

```
src/lib/components/worldSim/
├── index.ts                              # Barrel exports
├── WorldSim.tsx                          # Root component (canvas + overlay container)
├── worldSim.module.scss                  # Root styles
│
├── canvas/                               # Three.js scene ownership
│   ├── SceneManager.ts                   # Creates scene, renderer, lights, animation loop
│   ├── CameraController.ts              # Orbit controls + animated transitions
│   ├── CameraCommand.ts                  # Command pattern for camera transitions
│   └── useWorldSimCanvas.ts             # Hook: mount Three.js into a React ref
│
├── celestials/                           # Celestial body system
│   ├── interfaces.ts                     # ICelestialBody, IRenderable, IInteractable, IOrbitable, ILabelable
│   ├── CelestialRegistry.ts             # Data registry (loaded from JSON)
│   ├── CelestialBodyFactory.ts          # Factory: registry entry → Three.js mesh
│   ├── renderers/                        # Strategy pattern implementations
│   │   ├── StarRenderer.ts              # Kultharja — emissive sphere + glow shader
│   │   ├── PlanetRenderer.ts            # Damocles, Kalmora — textured sphere + atmosphere
│   │   ├── GasGiantRenderer.ts          # Länsihenki, Itähenki — banded sphere + cloud layers
│   │   ├── RingWorldRenderer.ts         # Mana — nested torus geometry
│   │   ├── TowerWorldRenderer.ts        # Selkara — vertical cylindrical structure
│   │   ├── AsteroidBeltRenderer.ts      # Opaline Belt — instanced particles
│   │   └── EverdarkRenderer.ts          # Enclosing sphere with fire shader
│   └── OrbitalMechanics.ts             # Keplerian ellipse computations
│
├── bridge/                               # Three.js ↔ DOM bridge
│   ├── ProjectionBridge.ts              # 3D world-space → 2D screen-space projection
│   ├── SceneEventBus.ts                 # Observer: interaction events
│   └── WorldSimMediator.ts             # Mediator: coordinates subsystems
│
├── overlay/                              # React DOM components (positioned over canvas)
│   ├── OverlayContainer.tsx             # Positions children via CSS transforms from bridge
│   ├── OverlayContainer.module.scss
│   ├── CelestialLabel.tsx               # Floating name label for a body
│   ├── CelestialLabel.module.scss
│   ├── InfoPanel.tsx                     # Expanded info card (description, links)
│   ├── InfoPanel.module.scss
│   ├── LandmassMarker.tsx               # Clickable dot on planet surface
│   ├── LandmassMarker.module.scss
│   ├── RegionPanel.tsx                  # Panel for a specific landmass (links to MDX)
│   └── RegionPanel.module.scss
│
├── context/                              # State management
│   ├── WorldSimContext.tsx               # React context + reducer
│   ├── worldSimReducer.ts               # Reducer: selection, zoom level, active panel
│   └── worldSimTypes.ts                 # State & action type definitions
│
├── data/                                 # Static data (celestial definitions)
│   ├── blackCradleRegistry.json         # All celestial bodies, orbits, regions
│   └── landmassRegions.json             # Per-planet landmass definitions with 3D coords
│
└── hooks/                                # Composable hooks
    ├── useCelestialHover.ts             # Hover detection via raycasting
    ├── useCelestialClick.ts             # Click/tap detection via raycasting
    ├── useProjectedPosition.ts          # Subscribe to projected 2D position of a 3D point
    └── useZoomLevel.ts                  # Track zoom level for LOD and UI visibility
```

### Route Integration

```
src/app/[locale]/utils/world-sim/
└── page.tsx                              # Page component (mirrors encounter-planner pattern)
```

---

## 6. Data Model — Celestial Registry

### `blackCradleRegistry.json`

```jsonc
{
  "bodies": [
    {
      "id": "kultharja",
      "name": "Kultharja",
      "subtitle": "The Sun",
      "loreOrigin": "The Golden One's mane",
      "type": "star",
      "contentPath": "world/the-lands-of-damocles/kultharja",
      "orbit": null,
      "radius": 50,
      "renderConfig": {
        "renderer": "star",
        "emissiveColor": "var(--worldsim-star-emissive)",
        "glowIntensity": 2.5,
        "coronaScale": 1.8,
      },
      "regions": [],
    },
    {
      "id": "damocles",
      "name": "Damocles",
      "subtitle": "The Heart-World",
      "loreOrigin": "The Golden One's heart",
      "type": "planet",
      "contentPath": "world/the-lands-of-damocles/damocles",
      "orbit": {
        "semiMajorAxis": 400,
        "eccentricity": 0.02,
        "inclination": 0,
        "period": 365,
        "phase": 0,
      },
      "radius": 20,
      "renderConfig": {
        "renderer": "planet",
        "surfaceTexture": "damocles-surface",
        "atmosphereColor": "var(--worldsim-atmosphere)",
        "atmosphereOpacity": 0.3,
        "hasAtmosphere": true,
      },
      "regions": [
        {
          "id": "thule",
          "name": "Thule",
          "contentPath": "world/the-lands-of-damocles/thule",
          "surfacePosition": { "lat": -45, "lon": 30 },
          "areaScale": 0.15,
        },
        {
          "id": "thealas",
          "name": "Thealas",
          "contentPath": "world/the-lands-of-damocles/thealas",
          "surfacePosition": { "lat": 10, "lon": -20 },
          "areaScale": 0.12,
        },
        // ... other regions
      ],
    },
    // ... other bodies
  ],
  "boundary": {
    "id": "everdark",
    "name": "The Everdark",
    "type": "boundary",
    "contentPath": "world/gods-and-demigods/everdark",
    "radius": 2000,
    "renderConfig": {
      "renderer": "everdark",
      "fireIntensity": 0.8,
      "opacity": 0.15,
    },
  },
}
```

### TypeScript Interfaces

```typescript
/** Orbital parameters for Keplerian motion */
interface OrbitalParameters {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  period: number;
  phase: number;
}

/** Surface position on a spherical body (lat/lon in degrees) */
interface SurfacePosition {
  lat: number;
  lon: number;
}

/** A clickable region on a celestial body's surface */
interface CelestialRegion {
  id: string;
  name: string;
  contentPath: string;
  surfacePosition: SurfacePosition;
  areaScale: number;
}

/** Renderer-specific configuration */
interface RenderConfig {
  renderer:
    | 'star'
    | 'planet'
    | 'gasGiant'
    | 'ringWorld'
    | 'towerWorld'
    | 'asteroidBelt'
    | 'everdark';
  [key: string]: unknown;
}

/** A celestial body in the Black Cradle */
interface CelestialBodyData {
  id: string;
  name: string;
  subtitle: string;
  loreOrigin: string;
  type:
    | 'star'
    | 'planet'
    | 'gasGiant'
    | 'ring'
    | 'towerWorld'
    | 'asteroidBelt'
    | 'boundary';
  contentPath: string;
  orbit: OrbitalParameters | null;
  radius: number;
  renderConfig: RenderConfig;
  regions: CelestialRegion[];
}
```

---

## 7. Core Systems

### 7.1 SceneManager

Owns the Three.js lifecycle. Receives a DOM element ref, creates `WebGLRenderer`, `Scene`, `PerspectiveCamera`, ambient/point lights, and runs the animation loop.

```
Responsibilities:
  - Create and dispose renderer, scene, camera
  - Run requestAnimationFrame loop
  - Resize handling
  - Provide scene/camera refs to other systems

Does NOT:
  - Handle user input (delegated to CameraController)
  - Manage React state (delegated to Context)
  - Create celestial meshes (delegated to Factory)
```

### 7.2 CameraController

Wraps camera logic with smooth animated transitions. Exposes a `Command` interface for programmatic camera movements.

```typescript
/** Command interface for camera transitions */
interface ICameraCommand {
  execute(controller: CameraController): Promise<void>;
  undo(controller: CameraController): Promise<void>;
}

/** Concrete commands */
class ZoomToBodyCommand implements ICameraCommand {
  /* ... */
}
class OrbitAroundCommand implements ICameraCommand {
  /* ... */
}
class ResetViewCommand implements ICameraCommand {
  /* ... */
}
class ZoomToRegionCommand implements ICameraCommand {
  /* ... */
}
```

Camera modes:

- **System View**: See entire Black Cradle, all bodies visible with labels
- **Body View**: Zoomed to a single body, surface details visible, regions appear
- **Region View**: Close-up on a region, DOM panel anchored to surface point

### 7.3 ProjectionBridge

The critical integration piece. Every frame, projects a set of tracked 3D points to 2D screen coordinates using `Vector3.project(camera)` and updates subscribers.

```
Input:  Map<id, Vector3>   (world-space positions)
Output: Map<id, {x, y, visible, scale}>  (screen-space positions + occlusion + distance-based scale)

Features:
  - Frustum culling (hide labels behind camera)
  - Occlusion (body behind another body → hidden)
  - Distance-based scaling (farther = smaller labels)
  - Batched updates (one projection pass per frame, not per label)
```

### 7.4 SceneEventBus

Typed event emitter that decouples Three.js interactions from React.

```typescript
type WorldSimEvents = {
  'body:hover': { bodyId: string; screenPos: { x: number; y: number } };
  'body:click': { bodyId: string };
  'body:unhover': void;
  'region:hover': { regionId: string; bodyId: string };
  'region:click': { regionId: string; bodyId: string };
  'camera:moved': { zoomLevel: ZoomLevel; targetBody: string | null };
  'camera:transition:start': { command: string };
  'camera:transition:end': { command: string };
};
```

### 7.5 WorldSimMediator

Coordinates all subsystems without letting them reference each other directly.

```
SceneManager ─────┐
CameraController ──┤
ProjectionBridge ──┼── WorldSimMediator ──► React Context dispatch
SceneEventBus ─────┤
CelestialRegistry ─┘
```

---

## 8. Component Hierarchy

```tsx
<WorldSim locale={locale}>                     {/* Root: mounts canvas + overlay */}
  <WorldSimProvider>                            {/* Context provider */}
    <WorldSimCanvas />                          {/* Three.js canvas (useRef mount) */}
    <OverlayContainer>                          {/* Absolute-positioned DOM layer */}
      {bodies.map(body => (
        <CelestialLabel                         {/* Floating label per body */}
          key={body.id}
          bodyId={body.id}
          onCLick={handleZoomToBody}
        />
      ))}
      {activeBody?.regions.map(region => (
        <LandmassMarker                         {/* Surface dot per region */}
          key={region.id}
          regionId={region.id}
          bodyId={activeBody.id}
          onClick={handleOpenRegion}
        />
      ))}
      {selectedRegion && (
        <RegionPanel                            {/* Info panel anchored to region */}
          regionId={selectedRegion.id}
          bodyId={selectedRegion.bodyId}
          onNavigate={handleNavigateToContent}
          onClose={handleClosePanel}
        />
      )}
      {selectedBody && !selectedRegion && (
        <InfoPanel                              {/* Body info panel */}
          bodyId={selectedBody}
          onNavigate={handleNavigateToContent}
          onClose={handleClosePanel}
        />
      )}
    </OverlayContainer>
  </WorldSimProvider>
</WorldSim>
```

---

## 9. Three.js ↔ DOM Bridge

This is the most critical architectural piece. The bridge must:

1. **Track positions** — For each labeled entity, store its 3D `Vector3`
2. **Project per frame** — In the animation loop, batch-project all tracked points
3. **Notify React** — Via a shared ref (not state!) to avoid re-render storms
4. **CSS transform** — Overlay components read from ref and apply `transform: translate(x, y)`

### Implementation Pattern

```typescript
/**
 * ProjectionBridge — Projects 3D world positions to 2D screen coordinates.
 * Uses a shared ref pattern to avoid re-render storms.
 */
class ProjectionBridge {
  private trackedPoints: Map<string, Vector3> = new Map();
  private projectedPositions: Map<string, ProjectedPosition> = new Map();
  private subscribers: Map<string, Set<(pos: ProjectedPosition) => void>> =
    new Map();

  /** Called once per frame from the animation loop */
  update(camera: PerspectiveCamera, canvasRect: DOMRect): void {
    for (const [id, worldPos] of this.trackedPoints) {
      const projected = worldPos.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * canvasRect.width;
      const y = (-projected.y * 0.5 + 0.5) * canvasRect.height;
      const visible = projected.z < 1; // Behind camera check
      const distance = camera.position.distanceTo(worldPos);

      const pos = {
        x,
        y,
        visible,
        distance,
        scale: this.distanceToScale(distance),
      };
      this.projectedPositions.set(id, pos);
      this.notifySubscribers(id, pos);
    }
  }

  /** React hook subscribes to a specific point's projection */
  subscribe(
    id: string,
    callback: (pos: ProjectedPosition) => void,
  ): () => void {
    /* ... */
  }
}
```

### React Hook for Consumers

```typescript
/**
 * useProjectedPosition — Subscribes a DOM element to a 3D point's screen position.
 * Updates via ref mutation (no re-renders) + CSS transform for 60fps performance.
 */
function useProjectedPosition(pointId: string): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  const bridge = useWorldSimBridge();

  useEffect(() => {
    return bridge.subscribe(pointId, (pos) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      ref.current.style.opacity = pos.visible ? '1' : '0';
      ref.current.style.setProperty('--label-scale', String(pos.scale));
    });
  }, [pointId, bridge]);

  return ref;
}
```

---

## 10. Camera & Navigation

### Zoom Levels

```typescript
enum ZoomLevel {
  /** Full system view — all bodies visible */
  System = 'system',
  /** Zoomed to single body — surface details visible */
  Body = 'body',
  /** Close-up on region — DOM panel anchored */
  Region = 'region',
}
```

### Transition System

Camera transitions use lerped animation with easing:

```
System View ──[click body]──► Body View ──[click region]──► Region View
     ▲                            │                              │
     └────────[back/escape]───────┴──────────[back/escape]───────┘
```

Each transition is a `CameraCommand`:

- Stores `from` and `to` positions + look-at targets
- Animates over ~800ms with ease-in-out
- Cancellable (new click during transition replaces target)
- Undoable (back button pops command stack)

### Orbit Controls (System View)

Custom orbit implementation (not OrbitControls from Three.js examples — too heavy, hard to animate):

- Mouse drag → rotate around system center
- Scroll → dolly in/out
- Touch: pinch to zoom, drag to orbit
- Bounds clamped to prevent zooming past Everdark or inside Kultharja

---

## 11. Rendering Pipeline

### Per-Body Renderers (Strategy Pattern)

Each renderer implements:

```typescript
interface ICelestialRenderer {
  createMesh(data: CelestialBodyData): Object3D;
  update(mesh: Object3D, time: number, deltaTime: number): void;
  dispose(mesh: Object3D): void;
  getLODDistance(): { near: number; far: number };
}
```

| Renderer               | Geometry                           | Material                                     | Animation                        |
| ---------------------- | ---------------------------------- | -------------------------------------------- | -------------------------------- |
| `StarRenderer`         | `SphereGeometry`                   | Custom `ShaderMaterial` (emissive + flicker) | Pulsating glow, corona shimmer   |
| `PlanetRenderer`       | `SphereGeometry`                   | `MeshStandardMaterial` + atmosphere shell    | Slow rotation, cloud layer drift |
| `GasGiantRenderer`     | `SphereGeometry`                   | Banded `ShaderMaterial`                      | Band animation, storm spots      |
| `RingWorldRenderer`    | `TorusGeometry` (nested)           | `MeshStandardMaterial`                       | Slow counter-rotation per ring   |
| `TowerWorldRenderer`   | `CylinderGeometry` stack           | `MeshStandardMaterial`                       | Beacon pulse at apex             |
| `AsteroidBeltRenderer` | `InstancedMesh` + `BufferGeometry` | `MeshLambertMaterial`                        | Individual rock rotation         |
| `EverdarkRenderer`     | Inverted `SphereGeometry`          | `ShaderMaterial` (fire noise)                | Animated flame texture           |

### LOD (Level of Detail)

At system view, planets render as simple spheres (low poly). As camera zooms in:

1. Higher-poly geometry swaps in
2. Surface textures load (lazy)
3. Region markers appear (DOM)
4. Atmosphere effects activate

---

## 12. Interaction Model

### Raycasting

A single `Raycaster` in the animation loop (throttled to every 3rd frame for performance):

- On hover: highlight body, show tooltip label
- On click: dispatch `body:click` event → mediator → camera command + state update

### Hit Detection for Regions

When zoomed to body view, regions are represented as invisible `Mesh` objects on the planet surface (small spheres at lat/lon coordinates). Raycaster hits these → `region:click` event.

### Event Flow

```
Mouse Event (DOM)
  ↓
Raycaster (Three.js)
  ↓
SceneEventBus.emit('body:click', { bodyId })
  ↓
WorldSimMediator
  ├─► CameraController.execute(new ZoomToBodyCommand(bodyId))
  └─► Context dispatch({ type: 'SELECT_BODY', bodyId })
       ↓
     React re-render
       ↓
     OverlayContainer shows CelestialLabels + LandmassMarkers
       ↓
     ProjectionBridge updates positions each frame
```

---

## 13. Accessibility & Responsiveness

### Keyboard Navigation

- `Tab` cycles through celestial bodies (in orbital order)
- `Enter` selects/zooms to focused body
- `Escape` backs out one zoom level
- `Arrow keys` orbit camera in system view

### Screen Reader

- Canvas has `role="application"` with `aria-label`
- Each DOM overlay element has proper `aria-label` and `role="button"`
- Body selection announced via `aria-live` region

### Responsive

- Canvas fills container (100% width/height)
- Info panels: side panel on desktop (>1024px), bottom sheet on mobile
- Labels scale based on viewport width + camera distance
- Touch controls: pinch/drag/tap

### Mobile Considerations

- Detect `pointer: coarse` → larger hit targets for regions
- Reduce particle count (asteroid belt) on mobile GPUs
- Lower shadow resolution / disable post-processing on low-end

---

## 14. Integration with Existing Systems

### Route & Navigation

Add to tools menu in `responsiveLayoutShell.tsx`:

```typescript
const toolItems: ToolMenuItem[] = [
  {
    id: 'encounter-creator',
    label: t('tools.encounterCreator'),
    href: `/${locale}/utils/encounter-planner`,
  },
  {
    id: 'world-sim',
    label: t('tools.worldSim'),
    href: `/${locale}/utils/world-sim`,
  },
];
```

### Content Deep-Links

Region panels link to existing library content:

```typescript
const handleNavigateToContent = (contentPath: string) => {
  router.push(`/${locale}/library/${contentPath}`);
};
```

### Theme Integration

All World Sim colors use CSS variables declared in `globals.scss`:

```scss
/* World Sim theme tokens */
--worldsim-bg: var(--color-bg);
--worldsim-panel-bg: var(--color-surface);
--worldsim-panel-border: var(--color-border);
--worldsim-label-text: var(--color-text);
--worldsim-label-accent: var(--color-accent);
--worldsim-star-emissive: #ffcc44; /* Only in globals.scss */
--worldsim-atmosphere: #6fa8dc; /* Only in globals.scss */
--worldsim-everdark-fire: #1a0a00; /* Only in globals.scss */
```

### Translation Keys

Add namespace `messages/en/worldSim.json`:

```json
{
  "title": "The Black Cradle",
  "subtitle": "Solar System of Damocles",
  "zoomIn": "Zoom In",
  "zoomOut": "Zoom Out",
  "resetView": "Reset View",
  "viewInLibrary": "View in Library",
  "regions": "Regions",
  "loreOrigin": "Origin",
  "back": "Back"
}
```

---

## 15. Phased Implementation Plan

### Phase 0 — Foundation (Pre-requisites)

- [ ] Install `three` and `@types/three`
- [ ] Add World Sim CSS variables to `globals.scss`
- [ ] Create route `src/app/[locale]/utils/world-sim/page.tsx`
- [ ] Add tool menu entry in `responsiveLayoutShell.tsx`
- [ ] Create translation namespace `messages/en/worldSim.json`
- [ ] Create `blackCradleRegistry.json` data file

### Phase 1 — Core Three.js Scaffold

- [ ] `SceneManager` — renderer, scene, camera, animation loop, resize
- [ ] `useWorldSimCanvas` hook — mount Three.js into React ref
- [ ] `WorldSim.tsx` root component — canvas element + basic overlay div
- [ ] Basic starfield background (particle system)
- [ ] single test sphere to validate rendering pipeline

**Milestone**: A spinning sphere renders in the page, resizes correctly.

### Phase 2 — Celestial Bodies

- [ ] `ICelestialRenderer` interface + `CelestialBodyFactory`
- [ ] `StarRenderer` — Kultharja with glow shader
- [ ] `PlanetRenderer` — Damocles as textured sphere
- [ ] `GasGiantRenderer` — Länsihenki / Itähenki
- [ ] `AsteroidBeltRenderer` — Opaline Belt (instanced mesh)
- [ ] `TowerWorldRenderer` — Selkara
- [ ] `RingWorldRenderer` — Mana
- [ ] `EverdarkRenderer` — boundary sphere
- [ ] `OrbitalMechanics` — animate bodies along elliptical paths
- [ ] `CelestialRegistry` — load from JSON, provide to scene

**Milestone**: All 8+ bodies orbit Kultharja with correct relative sizes and distinct visual identities.

### Phase 3 — Camera & Navigation

- [ ] Custom orbit controls (drag, scroll, pinch)
- [ ] `CameraController` with command pattern
- [ ] `ZoomToBodyCommand` — smooth transitions
- [ ] `ResetViewCommand` — back to system view
- [ ] Zoom level tracking (`System` / `Body` / `Region`)
- [ ] Bounds clamping

**Milestone**: Can orbit freely, click a body to zoom in, press Escape to zoom out.

### Phase 4 — Projection Bridge & DOM Overlay

- [ ] `ProjectionBridge` — batch projection per frame
- [ ] `SceneEventBus` — typed event emitter
- [ ] `useProjectedPosition` hook — subscribe DOM elements to 3D points
- [ ] `CelestialLabel` component — floating name labels
- [ ] `OverlayContainer` — absolute-positioned container synced to canvas
- [ ] Visibility culling (behind camera, too far, occluded)

**Milestone**: Body names float in correct positions, track camera movement at 60fps.

### Phase 5 — Interactions & Panels

- [ ] Raycaster integration (hover highlight + click detection)
- [ ] `WorldSimContext` + reducer — selection state
- [ ] `WorldSimMediator` — coordinate events → camera + state
- [ ] `InfoPanel` — body info card (name, subtitle, lore origin, "View in Library" link)
- [ ] `LandmassMarker` — clickable region dots on Damocles surface
- [ ] `RegionPanel` — region info card with library deep-link
- [ ] `ZoomToRegionCommand` — camera close-up on region

**Milestone**: Full flow — click Damocles → zoom in → see region dots → click Thule → info panel → navigate to library page.

### Phase 6 — Polish & Performance

- [ ] LOD system for geometry swaps
- [ ] Lazy texture loading
- [ ] Mobile touch controls + responsive panels
- [ ] Keyboard navigation (Tab, Enter, Escape, arrows)
- [ ] Accessibility (aria labels, live regions)
- [ ] Post-processing effects (bloom on Kultharja, subtle vignette)
- [ ] Performance profiling + GPU memory budget

### Phase 7 — Testing

- [ ] Unit tests for `OrbitalMechanics`, `ProjectionBridge`, `CelestialRegistry`
- [ ] Unit tests for `worldSimReducer`
- [ ] Component tests for overlay components (`InfoPanel`, `RegionPanel`, `CelestialLabel`)
- [ ] Integration test for mediator event flow
- [ ] E2E test for navigation flow (system → body → region → library)

---

## 16. Testing Strategy

### Unit Tests

```
tests/unit/src/lib/components/worldSim/
├── celestials/
│   ├── CelestialRegistry.test.ts
│   ├── OrbitalMechanics.test.ts
│   └── CelestialBodyFactory.test.ts
├── bridge/
│   ├── ProjectionBridge.test.ts
│   └── SceneEventBus.test.ts
├── context/
│   └── worldSimReducer.test.ts
├── overlay/
│   ├── CelestialLabel.test.tsx
│   ├── InfoPanel.test.tsx
│   ├── LandmassMarker.test.tsx
│   └── RegionPanel.test.tsx
└── hooks/
    ├── useProjectedPosition.test.ts
    └── useZoomLevel.test.ts
```

### Testing Considerations

- **Three.js mocking**: Mock `WebGLRenderer` and `Scene` in unit tests — avoid actual WebGL context
- **ProjectionBridge**: Test with mock camera matrices — verify screen coordinates
- **Overlay components**: Standard RTL testing with mocked bridge positions
- **Reducer**: Pure function tests (input state + action → output state)
- **No `act()` warnings**: Follow existing fake timer patterns from `testing-rules.md`

---

## 17. Performance Budget

| Metric                              | Target                          | Measurement                  |
| ----------------------------------- | ------------------------------- | ---------------------------- |
| Initial JS bundle (World Sim chunk) | < 200KB gzipped                 | Next.js bundle analyzer      |
| Three.js scene draw calls           | < 50 in system view             | `renderer.info.render.calls` |
| Animation loop frame time           | < 12ms (83fps headroom)         | `performance.now()` delta    |
| DOM overlay update time             | < 2ms per frame                 | Profiler                     |
| GPU memory                          | < 128MB textures                | `renderer.info.memory`       |
| Time to interactive                 | < 3s on mid-range device        | Lighthouse                   |
| Asteroid belt instances             | ≤ 500 (desktop), ≤ 150 (mobile) | Config toggle                |

### Lazy Loading Strategy

- Three.js imported dynamically (`next/dynamic` with `ssr: false`)
- Textures loaded on-demand as camera approaches body
- Registry JSON loaded at mount, not bundled into page JS

---

## Appendix A — State Shape

```typescript
interface WorldSimState {
  /** Currently selected celestial body, or null */
  selectedBodyId: string | null;
  /** Currently selected region within a body, or null */
  selectedRegionId: string | null;
  /** Current zoom level */
  zoomLevel: ZoomLevel;
  /** Whether camera is mid-transition */
  isTransitioning: boolean;
  /** Hovered body (for highlight) */
  hoveredBodyId: string | null;
  /** Whether overlay labels are visible */
  labelsVisible: boolean;
  /** Whether orbit animation is paused */
  orbitsPaused: boolean;
}

type WorldSimAction =
  | { type: 'SELECT_BODY'; bodyId: string }
  | { type: 'SELECT_REGION'; regionId: string; bodyId: string }
  | { type: 'DESELECT' }
  | { type: 'SET_ZOOM_LEVEL'; level: ZoomLevel }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'HOVER_BODY'; bodyId: string | null }
  | { type: 'TOGGLE_LABELS' }
  | { type: 'TOGGLE_ORBITS' }
  | { type: 'RESET' };
```

## Appendix B — Shader Notes

### Kultharja (Star) Shader

```glsl
// Fragment shader sketch — animated emissive glow
uniform float uTime;
uniform vec3 uEmissiveColor;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  float pulse = sin(uTime * 0.5) * 0.1 + 0.9;
  float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
  vec3 glow = uEmissiveColor * pulse * (1.0 + fresnel * 2.0);
  gl_FragColor = vec4(glow, 1.0);
}
```

### Everdark (Fire Boundary) Shader

```glsl
// Fragment shader sketch — animated fire noise on inside of sphere
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;

// Simplex noise function (import or inline)
float noise(vec2 p) { /* ... */ }

void main() {
  vec2 uv = vUv;
  float n = noise(uv * 4.0 + uTime * 0.3) * 0.5 +
            noise(uv * 8.0 - uTime * 0.5) * 0.25;
  float fire = smoothstep(0.3, 0.7, n) * uIntensity;
  vec3 color = mix(vec3(0.05, 0.0, 0.0), vec3(0.8, 0.2, 0.0), fire);
  gl_FragColor = vec4(color, fire * 0.3);
}
```
