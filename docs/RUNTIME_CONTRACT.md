# Runtime contract v1 — requested implementation

This file defines the API that Claude must implement; the kit does not already supply this engine. Keep the names and units stable so that the library can be embedded later. Use JavaScript ES modules and JSDoc. The runtime should not depend on Vite, Node, React, Remotion, the local gallery, a server-side database or any AI service. Vite and test tools may be development dependencies.

## Public definition

Each animation entry exports a default definition with:

```js
export default {
  id: 'LAW-0441',
  version: '1.0.0',
  metadata,        // serializable; source/content/compatibility information
  defaultParams,  // safe fictional, explicitly illustrative example
  paramsSchema,   // runtime-validatable schema and field descriptions
  create,         // create(container, options) -> AnimationInstance
};
```

The snippet above is an API specification, not an implemented animation. Implement `create` and the complete specific scene; never save unresolved identifiers as if finished.

## Host usage to support

```js
const {default: definition} = await import('./animations/contract-formation/LAW-0441.js');
const instance = definition.create(document.querySelector('#animation'), {
  width: 1080,
  height: 1920,
  durationMs: 6000,
  background: 'transparent',
  locale: 'en',
  theme: 'editorial-flat',
  seed: 42,
  instanceId: 'offer-main',
  safeArea: {top: 0.06, right: 0.06, bottom: 0.20, left: 0.06},
  params: {
    // Validated, documented per-animation fields, not guessed fields.
  },
});
await instance.ready;
instance.seek(2400);                       // milliseconds, absolute time
instance.renderFrame(72, {fps: 30});       // exactly the same instant
instance.setParams({/* documented patch */});
instance.resize({width: 1920, height: 1080});
instance.destroy();
```

`ready` resolves after required local assets and fonts are ready; no remote fetch is permitted. The native SVG/runtime should have no external dependencies where practical. Use CSS/system fonts as a fallback; embed a font only after checking its licence and adding required notices in the user's project, not in this kit.

### Methods
- `seek(timeMs)` clamps finite time to `[0, durationMs]` and synchronously renders the state after readiness. Invalid non-finite values produce descriptive errors. Define behavior before `ready` explicitly; recommended: remember last requested time and apply on readiness.
- `renderFrame(frame, {fps})` checks a non-negative integer frame and positive finite fps, then calls `seek(frame * 1000 / fps)`. Overshoot clamps. Never assume 30 fps in the module.
- `setParams(patch)` validates a documented deep patch, recomputes layout if needed, does not mutate presets and preserves the current absolute time, clamped after duration change. Define how array fields replace rather than merge. Treat unsafe object keys defensively.
- `resize({width,height})` validates positive finite sizes, recomputes layout, retains the same scene time, and respects caption-safe areas.
- `destroy()` is idempotent; removes this instance's nodes/listeners/observers/resources. It must not remove other instances or change global styles. Subsequent methods should raise a clear disposed-instance error.
- `getState()` returns serializable diagnostic scene state for deterministic testing, not DOM nodes. Include animation ID, time, parameters, transforms and element bounds.

The host should be able to cache definitions and instantiate many independent scenes. Instances have isolated SVG identifiers. Supply deterministic `instanceId` in tests; do not use current time or random UUIDs inside normalized render state.

## Internal architecture
Separate pure scene evaluation from application to SVG DOM:

`validated params + viewport + safe area + seed + time → layout + scene state → SVG renderer`.

Build geometry/paths once where possible. Cache immutable geometry by parameters and dimensions. Per-frame work updates transforms, paths when necessary and visibility. Cache correctly: never reuse stale state after changing parameters. Do not precompute every frame for every preset.

Use a stable seed-derived pseudo-random value indexed by property/element for any variation. Avoid consuming one global random stream in render order. The same time and inputs must yield the same state even when seek order, mount order and preview speed differ.

## Timing
A gallery's requestAnimationFrame can drive time, but no animation entry owns a ticker, CSS animation, `setInterval`, running GSAP timeline or uncontrolled Web Animations timeline. Avoid Date.now/performance.now in scene state. A paused and explicitly seeked third-party timeline is an advanced option only with determinism tests; it is not needed for v1.

Use normalized progress and named phases. Default phase proportions come from the brief, not fixed 30-fps durations. Durations must remain meaningful at 2, 6 and 12 seconds. Support a reduced-motion state that removes decorative motion without hiding instructional information.

Default playback is finite, with a readable held final state. Gallery repeat is permitted but label it as replay. Do not claim a seamless loop unless start/end geometry and motion continuity actually match. Do not reverse a legal narrative just to close a loop. Truly periodic object motions may support an explicitly tested seamless-loop mode.

## Geometry and typography
Use responsive SVG viewBox and actual layout adaptation. Support 16:9, 9:16 and 1:1 without clipping or simply scaling an unreadable landscape design into portrait. Common safe-area defaults are a product choice, not a platform rule: 6% top/sides, 20% bottom, all editable.

Fit labels by measuring after font readiness, wrapping words and applying bounded size reduction. For extremely long inputs, either restructure, truncate with a documented full accessible label, or give a clear validation message. Never change the meaning silently. User content must enter through text nodes, not raw innerHTML. Any SVG string import must be trusted/sanitized, including removal of scripts, foreignObject and external references.

Use text layout consistently for screenshots. Same-browser same-font determinism is required; cross-platform pixel identity is not assumed. Record browser/font versions when comparing snapshots.

## Packaging and adapters
- Save a real `.js` entry for every ID and package-shared dependencies.
- Generate a lazy registry `ID -> () => import(module)`; do not eagerly import 2,000 modules into the gallery.
- Include serializable metadata separately for local search without loading source.
- A standalone export of one animation must include its transitive runtime/assets, presets, schema and licence notices; one dependent file copied alone is not standalone.
- Core browser/Node import boundaries must be tested. If using DOM APIs, perform them in `create`, not at import time, so importing metadata or definitions is possible without a document.
- React/Remotion adapters are optional later. Do not introduce a renderer or encoder in this phase. External video tools can later supply `frame` and `fps` to this API.
