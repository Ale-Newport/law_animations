# Using the animation library

Every implemented catalog ID is a standalone ES module under
`src/animations/<category>/LAW-xxxx.js` that exports a definition
implementing `docs/RUNTIME_CONTRACT.md`. Nothing needs an LLM, a server or a
network connection at runtime; the modules only need a browser DOM when you
call `create()`.

## Embedding one animation

```js
import def from './src/animations/documents/LAW-0001.js';

const instance = def.create(document.querySelector('#stage'), {
  width: 1920, height: 1080,          // or aspectRatio: '9:16'
  instanceId: 'signing-main',         // unique per live instance (SVG ids)
  locale: 'es',                       // built-in labels only
  background: 'transparent',
  safeArea: {top: 0.06, right: 0.06, bottom: 0.2, left: 0.06},
  params: {documentTitle: 'Contrato de servicios'},   // documented fields only
});
await instance.ready;
instance.seek(2400);                  // absolute ms; host owns the clock
instance.renderFrame(72, {fps: 30});  // same instant as seek(2400)
instance.setParams({finalState: 'pending'});   // deep patch, arrays replace
instance.resize({width: 1080, height: 1920});
const state = instance.getState();    // serializable diagnostics
instance.destroy();
```

- `def.paramsSchema` documents every field (JSON-schema subset with
  descriptions); `def.defaultParams` is a fictional illustrative example.
- `LAW-xxxx.presets.json` holds saved presets (baseline, substantive
  alternative, long-label stress, Spanish). Pass `preset.params` as `params`.
- `LAW-xxxx.meta.json` is serializable metadata for search without loading
  code (generated from the module).
- `src/registry.js` maps IDs to lazy `import()` loaders for hosts that list
  many animations; `load(id)` returns the definition.

## Driving frames from a video tool later
The modules never own a ticker. Any external renderer can loop over frames
and call `renderFrame(n, {fps})`, then capture the SVG (`instance.element`).
No encoder is part of this project.

## Content status
All shipped examples are fictional and `illustrative-unverified`
(`jurisdiction: "unspecified"`). Replace text through params; engineering
acceptance is not legal verification (see `docs/LEGAL_CONTENT_POLICY.md`).

## Gallery
`npm run dev` serves the local inspection gallery on http://127.0.0.1:5178/
(loopback only). It lists all 2,000 catalog IDs, shows planned ones as
pending, and lazy-loads only the selected implementation.
