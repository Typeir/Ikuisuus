---
applyTo: 'src/lib/components/worldSim/**'
---

# World Sim Architecture Analysis

Before modifying the Three.js world simulation module, you MUST:

1. **Read** `.github/docs/world-sim-module.md` for the full architecture (mediator pattern, render lifecycle, celestial renderers, DOM overlay bridge).
2. **WorldSimMediator** is the single coordinator — subsystems NEVER communicate directly.
3. **RenderLifecycle** phases: PreUpdate → Update → PostUpdate → PreRender → render → PostRender. Subscribe with priority and label.
4. **DOM overlay** uses `ProjectionBridge.bindElement()` for direct style mutation at 60fps — no React re-renders.
5. **CameraController** composes orbit controls + follow system + command transitions. Follow delta only shifts orbit center.
6. **Celestial renderers** implement `ICelestialRenderer` strategy pattern in `celestials/`.

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which subsystem(s) are affected (scene, camera, projection, registry, lifecycle)
- Render phase subscriptions being added/modified
- DOM overlay interaction changes
- Performance impact assessment (60fps budget)

## Architecture Constraints

- All inter-subsystem communication goes through the mediator
- Labels positioned in PostRender phase only
- Camera position computed from `target + spherical offset` in a single write
