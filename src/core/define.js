/**
 * defineAnimation(): turns a saved scene specification into a public
 * animation definition implementing docs/RUNTIME_CONTRACT.md.
 *
 * Pipeline: validated params + viewport + safe area + seed + time
 *   → layout (pure, cached per params/size) → frame record (pure, per time)
 *   → SVG renderer (DOM, applied to named nodes).
 *
 * The definition never owns a clock: time only enters through seek(),
 * renderFrame() or evaluate().
 * @module core/define
 */
import {clamp} from './time.js';
import {seeded} from './random.js';
import {makeView, fitDesign, designSize, classify} from './layout.js';
import {resolveTheme} from './theme.js';
import {strings} from './i18n.js';
import {fitText, measure} from './text.js';
import {h, mount, applyFrame, serializeFrame, safeId, SVG_NS} from './svg.js';
import {ParamError, applyPatch, buildParamsSchema, clone, schemaDefaults, validate, COMMON_KEYS} from './schema.js';

/**
 * @typedef {object} SceneContext
 * @property {Record<string, any>} params  validated params (common + scene)
 * @property {import('./layout.js').View} view
 * @property {ReturnType<typeof resolveTheme>} theme
 * @property {Record<string,string>} t   built-in strings for the locale
 * @property {ReturnType<typeof seeded>} rng
 * @property {boolean} reduced          reduced motion
 * @property {(level?: 'key'|'all') => boolean} show  label visibility test
 * @property {(local: string) => string} id    instance-scoped SVG id
 * @property {(local: string) => string} ref   url(#scoped-id)
 * @property {{w:number,h:number}} design   design-space size
 * @property {typeof fitText} fit
 * @property {typeof measure} measure
 */

/**
 * @typedef {object} SceneSpec
 * @property {{landscape:[number,number], portrait:[number,number], square:[number,number]}} sizes
 * @property {(ctx: SceneContext) => any} layout  pure layout; may measure text
 * @property {(ctx: SceneContext, L: any) => any} build  pure virtual node tree in design units
 * @property {(ctx: SceneContext, L: any, u: number, timeMs: number) => ({nodes: Record<string, any>, semantic?: Record<string, any>})} frame  pure per-time record
 */

let autoCounter = 0;
const liveIds = new Set();

function deepFreeze(o) {
  if (o && typeof o === 'object') {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

/**
 * @param {object} spec
 * @param {string} spec.id
 * @param {string} spec.version
 * @param {object} spec.metadata
 * @param {number} spec.defaultDurationMs
 * @param {Record<string, any>} spec.sceneSchema  JSON-schema properties for scene fields
 * @param {Record<string, any>} spec.defaultParams  scene field defaults (fictional, illustrative)
 * @param {Record<string, Record<string,string>>} [spec.strings] scene-specific built-in strings
 * @param {SceneSpec} spec.scene
 */
export function defineAnimation(spec) {
  const paramsSchema = buildParamsSchema(spec.defaultDurationMs, spec.sceneSchema);
  const commonDefaults = schemaDefaults({type: 'object', properties: Object.fromEntries(COMMON_KEYS.map(k => [k, paramsSchema.properties[k]]))});
  const defaults = {...commonDefaults, ...clone(spec.defaultParams)};
  const problems = validate(paramsSchema, defaults);
  if (problems.length) throw new Error(`${spec.id}: default params do not satisfy the schema:\n${problems.join('\n')}`);
  deepFreeze(defaults);
  deepFreeze(paramsSchema);

  const definition = {
    id: spec.id,
    version: spec.version,
    metadata: deepFreeze(clone(spec.metadata)),
    defaultParams: defaults,
    paramsSchema,
    /**
     * @param {Element} container
     * @param {object} [options]
     */
    create(container, options = {}) {
      return createInstance(spec, definition, container, options);
    },
    /**
     * Pure diagnostic evaluation without a DOM: returns the serialized frame
     * record for given params, size and time. Text is measured with the
     * approximation used outside browsers.
     */
    evaluate({width = 1920, height = 1080, params = {}, timeMs = 0} = {}) {
      const merged = mergeParams(paramsSchema, defaults, params);
      const ctx = makeContext(spec, merged, width, height, 'eval');
      const L = spec.scene.layout(ctx);
      const d = merged.durationMs;
      const t = clamp(timeMs, 0, d);
      const rec = normalizeRecord(spec.scene.frame(ctx, L, d ? t / d : 1, t));
      return {animationId: spec.id, timeMs: t, nodes: serializeFrame(rec.nodes), semantic: clone(rec.semantic || {})};
    },
  };
  return Object.freeze(definition);
}

function mergeParams(schema, defaults, patch) {
  const merged = patch && Object.keys(patch).length ? applyPatch(defaults, patch, schema) : clone(defaults);
  const problems = validate(schema, merged);
  if (problems.length) throw new ParamError(problems);
  return merged;
}

function normalizeRecord(rec) {
  if (!rec || typeof rec !== 'object') throw new Error('Scene frame() must return an object');
  if (rec.nodes) return rec;
  return {nodes: rec, semantic: {}};
}

const NOTICE_FRACTION = 0.03;

function makeContext(spec, params, width, height, iid) {
  const noticeOn = params.contentNotice;
  const view = makeView(width, height, params.safeArea);
  if (noticeOn) {
    const nh = Math.min(width, height) * NOTICE_FRACTION * 1.9;
    view.content = {...view.content, y: view.content.y + nh, h: Math.max(1, view.content.h - nh)};
  }
  view.shape = classify(view.content.w / view.content.h);
  const [dw, dh] = designSize(view, spec.scene.sizes);
  const labels = params.textVisibility;
  return {
    params,
    view,
    theme: resolveTheme(params),
    t: strings(params.locale, spec.strings),
    rng: seeded(params.seed),
    reduced: params.reducedMotion,
    labels,
    show: (level = 'all') => labels === 'all' || (labels === 'key' && level === 'key'),
    id: local => `${iid}-${local}`,
    ref: local => `url(#${iid}-${local})`,
    design: {w: dw, h: dh},
    fit: fitText,
    measure,
    durationMs: params.durationMs,
  };
}

function checkSize(width, height) {
  if (!(typeof width === 'number' && Number.isFinite(width) && width > 0)) throw new RangeError(`width must be a positive finite number (received ${width})`);
  if (!(typeof height === 'number' && Number.isFinite(height) && height > 0)) throw new RangeError(`height must be a positive finite number (received ${height})`);
  if (width > 16384 || height > 16384) throw new RangeError('width/height must be <= 16384');
}

const INSTANCE_OPTION_KEYS = new Set(['width', 'height', 'instanceId', 'params', 'aspectRatio', ...COMMON_KEYS]);
const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};

function createInstance(spec, def, container, options) {
  if (!container || typeof container.appendChild !== 'function' || !container.ownerDocument) {
    throw new TypeError(`${spec.id}.create(container): container must be a DOM element`);
  }
  if (options === null || typeof options !== 'object') throw new TypeError('options must be an object');
  for (const key of Object.keys(options)) {
    if (!INSTANCE_OPTION_KEYS.has(key)) throw new ParamError([`options: unknown option "${key}"`]);
  }
  const doc = container.ownerDocument;
  let [width, height] = options.aspectRatio && RATIOS[options.aspectRatio] ? RATIOS[options.aspectRatio] : [1920, 1080];
  if (options.aspectRatio && !RATIOS[options.aspectRatio]) throw new ParamError([`options.aspectRatio must be one of ${Object.keys(RATIOS).join(', ')}`]);
  if (options.width !== undefined) width = options.width;
  if (options.height !== undefined) height = options.height;
  checkSize(width, height);

  const iid = safeId(options.instanceId ?? `law-anim-${++autoCounter}`);
  if (liveIds.has(iid)) throw new Error(`instanceId "${iid}" is already used by a live instance; SVG ids must be unique`);

  const patch = {};
  for (const key of COMMON_KEYS) if (options[key] !== undefined) patch[key] = options[key];
  let params = mergeParams(def.paramsSchema, def.defaultParams, {...patch, ...(options.params || {})});
  liveIds.add(iid);

  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img');
  svg.setAttribute('data-animation-id', spec.id);
  svg.setAttribute('data-instance-id', iid);
  svg.style.display = 'block';
  svg.style.overflow = 'hidden';
  const titleEl = doc.createElementNS(SVG_NS, 'title');
  svg.appendChild(titleEl);
  container.appendChild(svg);

  let destroyed = false;
  let isReady = false;
  let timeMs = 0;
  let ctx = null;
  let L = null;
  let registry = new Map();
  let cache = new Map();
  let lastRecord = {nodes: {}, semantic: {}};
  let sceneRoot = null;

  const alive = () => {
    if (destroyed) throw new Error(`${spec.id} instance "${iid}" has been destroyed`);
  };

  function rebuild() {
    ctx = makeContext(spec, params, width, height, iid);
    L = spec.scene.layout(ctx);
    const fit = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    titleEl.textContent = `${def.metadata.title || spec.id} (${ctx.t.illustrative})`;
    if (sceneRoot) sceneRoot.remove();
    registry = new Map();
    cache = new Map();
    const tree = h('g', {'data-layer': 'root'},
      ctx.theme.background ? h('rect', {x: 0, y: 0, width, height, fill: ctx.theme.background, 'data-layer': 'background'}) : null,
      h('g', {transform: fit.transform, 'data-layer': 'scene'}, spec.scene.build(ctx, L)),
      params.contentNotice ? notice(ctx, width, height) : null,
    );
    const holder = doc.createElementNS(SVG_NS, 'g');
    mount(tree, holder, registry, doc);
    sceneRoot = holder.firstChild;
    svg.appendChild(sceneRoot);
  }

  function evaluate(t) {
    const d = params.durationMs;
    return normalizeRecord(spec.scene.frame(ctx, L, d ? t / d : 1, t));
  }

  function render() {
    lastRecord = evaluate(timeMs);
    applyFrame(lastRecord.nodes, registry, cache);
  }

  const ready = (async () => {
    try {
      if (doc.fonts && doc.fonts.ready) await doc.fonts.ready;
    } catch { /* fonts API unavailable: system fonts are used */ }
    if (destroyed) return;
    rebuild();
    isReady = true;
    render();
  })();

  const instance = {
    get id() { return spec.id; },
    get instanceId() { return iid; },
    get ready() { return ready; },
    get durationMs() { return params.durationMs; },
    get isReady() { return isReady; },
    /**
     * Absolute time in ms, clamped to [0, durationMs]. Before readiness the
     * time is remembered and applied when ready resolves.
     * @param {number} t
     */
    seek(t) {
      alive();
      if (typeof t !== 'number' || !Number.isFinite(t)) throw new TypeError(`seek(timeMs) requires a finite number (received ${t})`);
      timeMs = clamp(t, 0, params.durationMs);
      if (isReady) render();
      return instance;
    },
    /**
     * @param {number} frame non-negative integer
     * @param {{fps:number}} opts
     */
    renderFrame(frame, opts) {
      alive();
      if (!Number.isInteger(frame) || frame < 0) throw new TypeError(`renderFrame(frame) requires a non-negative integer (received ${frame})`);
      const fps = opts && opts.fps;
      if (typeof fps !== 'number' || !Number.isFinite(fps) || fps <= 0) throw new TypeError(`renderFrame requires {fps} as a positive finite number (received ${fps})`);
      return instance.seek((frame * 1000) / fps);
    },
    /**
     * Deep patch: objects merge per property; arrays replace. Presets and
     * previous params are never mutated. Absolute time is preserved (clamped).
     * @param {Record<string, any>} p
     */
    setParams(p) {
      alive();
      const next = mergeParams(def.paramsSchema, params, p);
      params = next;
      timeMs = clamp(timeMs, 0, params.durationMs);
      if (isReady) {
        rebuild();
        render();
      }
      return instance;
    },
    /** @param {{width:number,height:number}} size */
    resize(size) {
      alive();
      if (!size || typeof size !== 'object') throw new TypeError('resize({width,height}) requires an object');
      checkSize(size.width, size.height);
      width = size.width;
      height = size.height;
      if (isReady) {
        rebuild();
        render();
      }
      return instance;
    },
    /** Serializable diagnostic state (no DOM nodes). */
    getState(opts = {}) {
      alive();
      const state = {
        animationId: spec.id,
        version: spec.version,
        instanceId: iid,
        ready: isReady,
        timeMs,
        progress: params.durationMs ? timeMs / params.durationMs : 1,
        durationMs: params.durationMs,
        width,
        height,
        orientation: ctx ? ctx.view.orientation : null,
        layoutShape: ctx ? ctx.view.shape : null,
        params: clone(params),
        nodes: serializeFrame(lastRecord.nodes),
        semantic: clone(lastRecord.semantic || {}),
      };
      if (opts.bounds !== false && isReady) state.bounds = bounds();
      return state;
    },
    /** Idempotent cleanup of this instance only. */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      liveIds.delete(iid);
      svg.remove();
      registry = new Map();
      cache = new Map();
      ctx = null;
      L = null;
    },
    get destroyed() { return destroyed; },
    /** The root <svg> element (for hosts that need to style or capture it). */
    get element() { return svg; },
  };

  function bounds() {
    const out = {};
    for (const [name, el] of registry) {
      try {
        const bb = /** @type {SVGGraphicsElement} */ (el).getBBox();
        const own = /** @type {SVGGraphicsElement} */ (el).getScreenCTM();
        const rootM = svg.getScreenCTM();
        if (!own || !rootM) continue;
        // element user space -> root viewBox units (independent of CSS size)
        const m = rootM.inverse().multiply(own);
        const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
          .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
        const xs = pts.map(p => p[0]);
        const ys = pts.map(p => p[1]);
        const x = Math.min(...xs), y = Math.min(...ys);
        out[name] = {x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: Math.round((Math.max(...xs) - x) * 10) / 10, h: Math.round((Math.max(...ys) - y) * 10) / 10};
      } catch { /* non-rendered node */ }
    }
    return out;
  }

  return instance;
}

/** Small "illustrative example" tag in the top of the caption-safe area. */
function notice(ctx, width, height) {
  const s = Math.min(width, height) * NOTICE_FRACTION * 0.62;
  const x = width * ctx.params.safeArea.left;
  const y = height * ctx.params.safeArea.top;
  const j = ctx.params.jurisdiction === 'unspecified' ? ctx.t.jurisdictionUnspecified : `${ctx.t.jurisdiction}: ${ctx.params.jurisdiction}`;
  const label = `${ctx.t.illustrative} · ${ctx.t.fictional} · ${j}`;
  const tw = measure(label, s, 500, 'sans');
  return h('g', {'data-layer': 'content-notice', transform: `translate(${x} ${y})`},
    h('rect', {x: 0, y: 0, width: tw + s * 1.6, height: s * 1.9, rx: s * 0.95, fill: ctx.theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(31,35,40,0.06)'}),
    h('text', {x: s * 0.8, y: s * 1.32, 'font-size': s, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: ctx.theme.fgSoft}, label),
  );
}
