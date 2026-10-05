/**
 * In-browser contract battery (Gate B). Runs inside tests/harness/host.html
 * and returns plain results that the Playwright test asserts on.
 * Every check here exercises the REAL module through its public API.
 */

const NORMALIZED = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1];
const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};

function slot() {
  const el = document.createElement('div');
  el.className = 'slot';
  document.getElementById('slots').appendChild(el);
  return el;
}

function shuffle(list, seed) {
  const out = list.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const norm = st => JSON.stringify({nodes: st.nodes, semantic: st.semantic});

/** DOM integrity checks for one rendered instance. */
export function inspectDom(svg, instance) {
  const problems = [];
  const vb = svg.viewBox.baseVal;
  const W = vb.width, H = vb.height;
  for (const el of svg.querySelectorAll('*')) {
    for (const attr of ['transform', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'width', 'height', 'opacity']) {
      const v = el.getAttribute(attr);
      if (v && /NaN|Infinity|undefined/.test(v)) problems.push(`${el.tagName}[${el.getAttribute('data-node') || ''}] ${attr}="${v.slice(0, 60)}"`);
    }
  }
  for (const tag of ['script', 'foreignObject', 'image', 'iframe']) {
    if (svg.querySelector(tag)) problems.push(`forbidden <${tag}> element present`);
  }
  for (const el of svg.querySelectorAll('[href], [*|href]')) {
    const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (href && !href.startsWith('#')) problems.push(`external reference ${href}`);
  }
  // Visible text must stay inside the frame and inside the caption-safe box.
  const st = instance.getState({bounds: false});
  const sa = st.params.safeArea;
  const safe = {x0: W * sa.left - 2, y0: H * sa.top - 2, x1: W * (1 - sa.right) + 2, y1: H * (1 - sa.bottom) + 2};
  const outsideFrame = [];
  const outsideSafe = [];
  for (const t of svg.querySelectorAll('text')) {
    if (!visible(t)) continue;
    let b = boxIn(svg, t);
    if (!b || (b.w === 0 && b.h === 0)) continue;
    // Respect clip paths: only the clipped (actually visible) part of the text counts.
    const clip = clipBoxFor(svg, t);
    if (clip) {
      b = intersect(b, clip);
      if (!b) continue;
    }
    const label = (t.textContent || '').slice(0, 40);
    if (b.x < -1 || b.y < -1 || b.x + b.w > W + 1 || b.y + b.h > H + 1) outsideFrame.push(label);
    if (b.x < safe.x0 || b.y < safe.y0 || b.x + b.w > safe.x1 || b.y + b.h > safe.y1) outsideSafe.push(`${label} @${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.w)}x${Math.round(b.h)}`);
  }
  return {problems, outsideFrame, outsideSafe};
}

/**
 * Heuristic layout warnings (non-blocking): overlapping visible text blocks
 * and how much of the caption-safe box the scene actually uses.
 */
export function layoutWarnings(svg, instance, allowOverlap = []) {
  const vb = svg.viewBox.baseVal;
  const st = instance.getState({bounds: false});
  const sa = st.params.safeArea;
  const safe = {x: vb.width * sa.left, y: vb.height * sa.top, w: vb.width * (1 - sa.left - sa.right), h: vb.height * (1 - sa.top - sa.bottom)};
  const boxes = [];
  const truncated = [];
  const small = [];
  const orphans = [];
  const splits = [];
  let suppliedCache = null;
  const supplied = () => suppliedCache || (suppliedCache = collectStrings(st.params));
  // Opaque overlays (lens windows, detail panels) may declare
  // data-occludes="1": text drawn EARLIER in document order and lying fully
  // under such a visible overlay is hidden from the viewer, so it is skipped
  // by the overlap/size/truncation heuristics.
  const occluders = [...svg.querySelectorAll('[data-occludes="1"]')].filter(visible)
    .map(el => ({el, b: boxIn(svg, el)})).filter(o => o.b);
  const occluded = t => {
    const tb = boxIn(svg, t);
    if (!tb) return false;
    return occluders.some(o => !o.el.contains(t)
      && (t.compareDocumentPosition(o.el) & Node.DOCUMENT_POSITION_FOLLOWING)
      && tb.x >= o.b.x - 1 && tb.y >= o.b.y - 1 && tb.x + tb.w <= o.b.x + o.b.w + 1 && tb.y + tb.h <= o.b.y + o.b.h + 1);
  };
  for (const t of svg.querySelectorAll('text')) {
    if (!visible(t)) continue;
    if (occluders.length && occluded(t)) continue;
    // text.js fitText ends a shortened line with "…" (full text kept in <title>)
    const tc = (t.textContent || '').trim();
    if (tc.includes('…') && !t.closest('[data-layer="content-notice"]')) truncated.push(tc.slice(0, 40));
    // Orphan fragments (AUTHORING item 13): a wrapped continuation line of only
    // 1–2 characters — ")", ".", "d)", a split syllable — reads as a broken word.
    const lines = [...t.querySelectorAll('tspan')];
    if (lines.length > 1) {
      for (let li = 1; li < lines.length; li++) {
        const s = (lines[li].textContent || '').trim();
        // Digit-only lines are fine as list numbers, but "Language / 1" (a number
        // torn from the word before it) is an orphan too.
        const prevT = (lines[li - 1].textContent || '').trim();
        if (s && s.length <= 2 && (!/^\d+$/.test(s) || /\p{L}$/u.test(prevT))) { orphans.push(`${prevT.slice(-14)} / ${s}`); break; }
      }
      // Mid-word breaks (AUTHORING item 13): "observació / n", "commit / tee".
      // Only line-start tspans (x/y/dy set) count as wrapped lines.
      const starts = lines.filter((ln, li) => li === 0 || ln.hasAttribute('x') || ln.hasAttribute('y') || ln.hasAttribute('dy'));
      for (let li = 1; li < starts.length; li++) {
        const hit = splitWord((starts[li - 1].textContent || '').trim(), (starts[li].textContent || '').trim(), supplied());
        if (hit) { splits.push(hit); break; }
      }
    }
    // Rendered size: the viewBox is in output pixels (1080p in the harness), so
    // font px = computed font-size × the element's scale to the root viewBox.
    const sm0 = svg.getScreenCTM(), em = t.getScreenCTM();
    const m = sm0 && em ? sm0.inverse().multiply(em) : null;
    const fs = parseFloat(getComputedStyle(t).fontSize);
    if (m && fs && tc) {
      const px = fs * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
      if (px < 14 && !t.closest('[data-layer="content-notice"]')) small.push({text: tc.slice(0, 30), px: +px.toFixed(1)});
    }
    let b = boxIn(svg, t);
    if (!b || b.w < 1 || b.h < 1) continue;
    const clip = clipBoxFor(svg, t);
    if (clip) { b = intersect(b, clip); if (!b) continue; }
    if (t.closest('[data-layer="content-notice"]')) continue;
    // Texts on a rotated/skewed parent (a tilted sheet) are compared in that
    // parent's own coordinates; root-space axis-aligned boxes of rotated text
    // would report false overlaps between adjacent lines.
    const frameEl = rotatedAncestor(svg, t);
    const local = frameEl ? boxRel(frameEl, t) : null;
    boxes.push({b, local, frameEl, text: (t.textContent || '').trim().slice(0, 30)});
  }
  // Wrapped lines drawn as sibling <text> elements (one per line): same parent,
  // same x and size, next baseline one line below.
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && !(occluders.length && occluded(t)));
  for (let i = 1; i < texts.length; i++) {
    const p0 = texts[i - 1], p1 = texts[i];
    if (p0.parentNode !== p1.parentNode || p0.getAttribute('x') !== p1.getAttribute('x')) continue;
    const f0 = parseFloat(p0.getAttribute('font-size')), f1 = parseFloat(p1.getAttribute('font-size'));
    const dy = parseFloat(p1.getAttribute('y')) - parseFloat(p0.getAttribute('y'));
    if (!(f0 > 0) || f0 !== f1 || !(dy > 0.9 * f0 && dy < 2.2 * f0)) continue;
    const hit = splitWord((p0.textContent || '').trim(), (p1.textContent || '').trim(), supplied());
    if (hit && !splits.includes(hit)) splits.push(hit);
  }
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], c = boxes[j];
      if (allowOverlap.some(s => a.text.includes(s) || c.text.includes(s))) continue;
      const sameFrame = a.frameEl && a.frameEl === c.frameEl && a.local && c.local;
      const ov = sameFrame ? intersect(a.local, c.local) : intersect(a.b, c.b);
      if (sameFrame) {
        if (ov && ov.w * ov.h > 0.15 * Math.min(a.local.w * a.local.h, c.local.w * c.local.h)) overlaps.push([a.text, c.text]);
        continue;
      }
      if (ov && ov.w * ov.h > 0.15 * Math.min(a.b.w * a.b.h, c.b.w * c.b.h)) overlaps.push([a.text, c.text]);
    }
  }
  let coverage = null;
  const scene = svg.querySelector('[data-layer="scene"]');
  if (scene) {
    const sb = boxIn(svg, scene);
    if (sb) coverage = {w: +(Math.min(sb.w, safe.w) / safe.w).toFixed(2), h: +(Math.min(sb.h, safe.h) / safe.h).toFixed(2)};
  }
  return {overlaps: overlaps.slice(0, 6), coverage, truncated, small, orphans, splits};
}

/** All string values in a params object (recursively). */
function collectStrings(o, out = []) {
  // camelCase option values ("milestoneDay") are identifiers, not display text
  if (typeof o === 'string') { if (/\s/.test(o) || (o.length > 3 && !/^[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/.test(o))) out.push(o); }
  else if (Array.isArray(o)) o.forEach(v => collectStrings(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach(v => collectStrings(v, out));
  return out;
}

/**
 * A wrapped line pair splits a word when the previous line ends in a letter,
 * the next starts with one, and the JOINED word occurs whole in some supplied
 * string while the two pieces never occur there as separate words.
 * Returns "tail / head" or null. Exported for unit tests.
 */
export function splitWord(prev, next, strings) {
  const L = '\\p{L}\\p{M}';
  const a = (prev.match(/[\p{L}\p{M}'’]+$/u) || [])[0];
  const b = (next.match(/^[\p{L}\p{M}'’]+/u) || [])[0];
  if (!a || !b || /[-‐‑–]$/.test(prev)) return null;
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const whole = new RegExp(`(^|[^${L}])${esc(a + b)}([^${L}]|$)`, 'iu');
  const apart = new RegExp(`(^|[^${L}])${esc(a)}[^${L}]+${esc(b)}([^${L}]|$)`, 'iu');
  if (strings.some(s => whole.test(s)) && !strings.some(s => apart.test(s))) return `${prev.slice(-14)} / ${next.slice(0, 14)}`;
  return null;
}

function visible(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentNode) {
    const op = n.getAttribute && n.getAttribute('opacity');
    if (op !== null && op !== undefined && Number(op) === 0) return false;
    const disp = n.getAttribute && n.getAttribute('display');
    if (disp === 'none') return false;
    if (n.tagName === 'svg') break;
  }
  return true;
}

/** Nearest ancestor whose transform relative to the root rotates or skews. */
function rotatedAncestor(svg, el) {
  const root = svg.getScreenCTM();
  if (!root) return null;
  const inv = root.inverse();
  let found = null;
  for (let n = el.parentNode; n && n !== svg; n = n.parentNode) {
    if (!n.getScreenCTM) continue;
    const m = inv.multiply(n.getScreenCTM());
    if (Math.abs(m.b) > 1e-3 || Math.abs(m.c) > 1e-3) found = n; // keep climbing: outermost rotated frame
  }
  return found;
}

/** Bounding box of el expressed in ancestor's user space. */
function boxRel(ancestor, el) {
  try {
    const bb = el.getBBox();
    const m = ancestor.getScreenCTM().inverse().multiply(el.getScreenCTM());
    const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
      .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  } catch {
    return null;
  }
}

function intersect(a, b) {
  const x0 = Math.max(a.x, b.x), y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w), y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 + 0.5 && y1 > y0 + 0.5 ? {x: x0, y: y0, w: x1 - x0, h: y1 - y0} : null;
}

/** Intersection of all ancestor clip regions, in root viewBox units (null = unclipped). */
function clipBoxFor(svg, el) {
  let box = null;
  for (let n = el; n && n !== svg; n = n.parentNode) {
    const ref = n.getAttribute && n.getAttribute('clip-path');
    if (!ref) continue;
    const m = /url\(#([^)]+)\)/.exec(ref);
    const cp = m && svg.querySelector(`[id="${m[1]}"]`);
    if (!cp) continue;
    let cb = null;
    for (const child of cp.children) {
      try {
        const bb = child.getBBox();
        const mm = svg.getScreenCTM().inverse().multiply(n.getScreenCTM());
        const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
          .map(([x, y]) => [mm.a * x + mm.c * y + mm.e, mm.b * x + mm.d * y + mm.f]);
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        const b = {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
        cb = cb ? {x: Math.min(cb.x, b.x), y: Math.min(cb.y, b.y), w: Math.max(cb.x + cb.w, b.x + b.w) - Math.min(cb.x, b.x), h: Math.max(cb.y + cb.h, b.y + b.h) - Math.min(cb.y, b.y)} : b;
      } catch { /* ignore */ }
    }
    if (cb) box = box ? intersect(box, cb) || {x: 0, y: 0, w: 0, h: 0} : cb;
  }
  return box;
}

function boxIn(svg, el) {
  try {
    const bb = el.getBBox();
    // element user space -> root viewBox units
    const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
    const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]
      .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  } catch {
    return null;
  }
}

async function expectThrow(fn) {
  try {
    await fn();
    return {threw: false};
  } catch (e) {
    return {threw: true, message: String(e && e.message || e)};
  }
}

function deepFreeze(o) {
  if (o && typeof o === 'object') {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

/**
 * Run the contract battery for one ID.
 * @param {string} id
 * @param {{presets: Array<{name:string, params:object}>, semantic?: Array<{at:number, fn:string}>, continuity?: string[], attach?: Array<{from:number,to:number,a:string,b:string,tol:number}>, continuityLimit?: number}} spec
 */
export async function contract(id, spec) {
  const {load} = window.__lib;
  const results = [];
  const warnings = [];
  const add = (name, pass, detail) => results.push({name, pass: Boolean(pass), detail: detail === undefined ? null : detail});
  const def = await load(id);

  // --- definition shape
  add('definition exports id/version/metadata/defaultParams/paramsSchema/create',
    def.id === id && typeof def.version === 'string' && def.metadata && def.defaultParams && def.paramsSchema && typeof def.create === 'function',
    {id: def.id, version: def.version});
  add('metadata declares illustrative-unverified content and unspecified jurisdiction',
    def.metadata.content && def.metadata.content.legalStatus === 'illustrative-unverified' && def.metadata.content.jurisdiction === 'unspecified');

  // --- lifecycle
  const c1 = slot();
  const inst = def.create(c1, {width: 1920, height: 1080, instanceId: 'contract-a'});
  inst.seek(1234); // before ready: remembered
  await inst.ready;
  add('pre-ready seek is applied on readiness', Math.abs(inst.getState({bounds: false}).timeMs - 1234) < 1e-6);
  const D = inst.durationMs;

  // --- determinism: ordered / reverse / shuffled + repeated requests
  const times = NORMALIZED.map(u => u * D);
  const capture = order => {
    const out = {};
    for (const t of order) {
      inst.seek(t);
      out[t] = norm(inst.getState({bounds: false}));
    }
    return out;
  };
  const ordered = capture(times);
  const reversed = capture(times.slice().reverse());
  const shuffled = capture(shuffle(times, 7));
  const again = capture(shuffle(times, 99));
  const mism = times.filter(t => ordered[t] !== reversed[t] || ordered[t] !== shuffled[t] || ordered[t] !== again[t]);
  add('determinism across ordered/reverse/shuffled/repeated seeks', mism.length === 0, {mismatchedTimes: mism});
  // DOM-level seek order (non-blocking warning): the RENDERED markup at a time
  // must not depend on which time was shown before (a frame record that omits
  // an attribute at some times leaves a stale value in the DOM).
  {
    const denseTimes = Array.from({length: 21}, (_, i) => (i / 20) * D);
    const dom = order => { const o = {}; for (const t of order) { inst.seek(t); o[t] = inst.element.outerHTML; } return o; };
    const dOrdered = dom(denseTimes);
    const dReversed = dom(denseTimes.slice().reverse());
    const dShuffled = dom(shuffle(denseTimes, 13));
    const bad = denseTimes.filter(t => dOrdered[t] !== dReversed[t] || dOrdered[t] !== dShuffled[t]);
    if (bad.length) warnings.push({kind: 'dom-seek-order', times: bad.slice(0, 6).map(t => +(t / D).toFixed(2))});
  }
  const distinctStates = new Set(Object.values(ordered)).size;
  add('scene state changes over time (not a static card)', distinctStates >= 4, {distinctStates});

  // --- frame mapping
  const fm = [];
  for (const fps of [24, 30, 60]) {
    for (const f of [0, 1, Math.floor(D / 1000 * fps / 2), Math.ceil(D / 1000 * fps)]) {
      inst.renderFrame(f, {fps});
      const a = norm(inst.getState({bounds: false}));
      inst.seek(Math.min(D, f * 1000 / fps));
      const b = norm(inst.getState({bounds: false}));
      if (a !== b) fm.push({fps, f});
    }
  }
  inst.renderFrame(100000, {fps: 30});
  add('renderFrame(n,{fps}) equals seek(n*1000/fps) at 24/30/60 fps; overshoot clamps', fm.length === 0 && inst.getState({bounds: false}).timeMs === D, {mismatches: fm});

  // --- invalid inputs
  const inv = [];
  for (const [label, fn] of [
    ['seek(NaN)', () => inst.seek(NaN)],
    ['seek(Infinity)', () => inst.seek(Infinity)],
    ['seek("1")', () => inst.seek('1')],
    ['renderFrame(-1)', () => inst.renderFrame(-1, {fps: 30})],
    ['renderFrame(1.5)', () => inst.renderFrame(1.5, {fps: 30})],
    ['renderFrame fps 0', () => inst.renderFrame(1, {fps: 0})],
    ['renderFrame no fps', () => inst.renderFrame(1)],
    ['resize(0,100)', () => inst.resize({width: 0, height: 100})],
    ['resize(NaN)', () => inst.resize({width: NaN, height: 100})],
    ['setParams unknown key', () => inst.setParams({notAField: 1})],
    ['setParams __proto__', () => inst.setParams(JSON.parse('{"__proto__": {"x": 1}}'))],
    ['setParams durationMs -5', () => inst.setParams({durationMs: -5})],
    ['setParams locale xx', () => inst.setParams({locale: 'xx'})],
    ['create width -1', () => def.create(slot(), {width: -1, height: 10})],
    ['create unknown option', () => def.create(slot(), {bogus: true})],
    ['create duplicate instanceId', () => def.create(slot(), {instanceId: 'contract-a'})],
  ]) {
    const r = await expectThrow(fn);
    if (!r.threw) inv.push(label);
  }
  add('invalid dimensions/duration/fps/params/ids raise descriptive errors', inv.length === 0, {notRejected: inv});

  // --- setParams preserves absolute time and does not mutate the caller's object
  inst.seek(D * 0.5);
  const patch = deepFreeze({seed: 77, reducedMotion: true});
  let setErr = null;
  try { inst.setParams(patch); } catch (e) { setErr = String(e.message); }
  const afterSet = inst.getState({bounds: false});
  add('setParams keeps absolute time and accepts a frozen patch (no mutation)', !setErr && Math.abs(afterSet.timeMs - D * 0.5) < 1e-6 && afterSet.params.seed === 77, {setErr});
  inst.setParams({durationMs: D / 4});
  add('shortening duration clamps current time', inst.getState({bounds: false}).timeMs === D / 4);
  inst.setParams({durationMs: D, seed: 1, reducedMotion: false});

  // --- resize keeps time
  inst.seek(D * 0.6);
  inst.resize({width: 1080, height: 1920});
  const rs = inst.getState({bounds: false});
  add('resize recomputes layout and keeps scene time', Math.abs(rs.timeMs - D * 0.6) < 1e-6 && rs.width === 1080 && rs.orientation === 'portrait');

  // --- getState is serializable and includes bounds
  const full = inst.getState();
  let serializable = true;
  try { JSON.parse(JSON.stringify(full)); } catch { serializable = false; }
  add('getState() is serializable and includes transforms and bounds', serializable && full.bounds && Object.keys(full.bounds).length > 0 && Object.keys(full.nodes).length > 0);

  // --- ratios × presets × backgrounds matrix: layout & DOM integrity
  const matrix = [];
  const presets = [{name: 'default', params: {}}, ...spec.presets];
  for (const preset of presets) {
    for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
      const el = slot();
      let x;
      try {
        x = def.create(el, {width: w, height: h, instanceId: `m-${preset.name}-${ratio.replace(':', 'x')}`, params: preset.params});
        await x.ready;
        for (const u of [0, 0.35, 0.7, 1]) {
          x.seek(u * x.durationMs);
          const r = inspectDom(x.element, x);
          if (r.problems.length || r.outsideFrame.length || r.outsideSafe.length) matrix.push({preset: preset.name, ratio, u, ...r});
          const lw = layoutWarnings(x.element, x, spec.allowTextOverlap || []);
          if (lw.overlaps.length) warnings.push({kind: 'text-overlap', preset: preset.name, ratio, u, pairs: lw.overlaps});
          if (u === 1 && lw.coverage && Math.max(lw.coverage.w, lw.coverage.h) < 0.8) warnings.push({kind: 'low-frame-coverage', preset: preset.name, ratio, coverage: lw.coverage});
          // Ellipsised text at the hold (AUTHORING item 2). Decorative text may be
          // allow-listed per test with allowTruncation: ['substring', ...].
          if (u === 1) {
            const tr = lw.truncated.filter(s => !(spec.allowTruncation || []).some(a => s.includes(a)));
            if (tr.length) warnings.push({kind: 'truncated-text', preset: preset.name, ratio, texts: tr.slice(0, 6)});
            if (lw.orphans.length) warnings.push({kind: 'orphan-fragment', preset: preset.name, ratio, lines: lw.orphans.slice(0, 6)});
            if (lw.splits.length) warnings.push({kind: 'split-word', preset: preset.name, ratio, lines: lw.splits.slice(0, 6)});
            // Visible text under 14 px at 1080p at the hold (AUTHORING items 10 and
            // 17). Decorative micro-text may be allow-listed with allowSmallText.
            const sm = lw.small.filter(s => !(spec.allowSmallText || []).some(a => s.text.includes(a)));
            if (sm.length) warnings.push({kind: 'small-text', preset: preset.name, ratio, texts: sm.sort((a, b) => a.px - b.px).slice(0, 6)});
          }
        }
      } catch (e) {
        matrix.push({preset: preset.name, ratio, error: String(e.message || e)});
      } finally {
        if (x) x.destroy();
        el.remove();
      }
    }
  }
  add('presets × 16:9/9:16/1:1: no NaN, no forbidden/external elements, visible text inside frame and caption-safe area', matrix.length === 0, matrix.slice(0, 12));

  // --- stress preset strength (non-blocking warning, AUTHORING item 20): every
  // supplied string in long-labels-stress must be at least as long as the same
  // field in the baseline (defaultParams merged with baseline-illustrative).
  const stress = spec.presets.find(p => p.name === 'long-labels-stress');
  if (stress) {
    const merge = (a, b) => {
      if (b === undefined) return a;
      if (Array.isArray(b) || typeof b !== 'object' || b === null) return b;
      const o = {...(a && typeof a === 'object' && !Array.isArray(a) ? a : {})};
      for (const k of Object.keys(b)) o[k] = merge(a ? a[k] : undefined, b[k]);
      return o;
    };
    const baseP = spec.presets.find(p => p.name === 'baseline-illustrative');
    const B = merge(def.defaultParams, baseP ? baseP.params : {});
    const S = merge(def.defaultParams, stress.params);
    const shorter = [];
    const walk = (a, b, path) => {
      if (a == null || b == null) return;
      if (typeof a === 'string' && typeof b === 'string') { if (b.length >= 20 && a.length < b.length) shorter.push(`${path} (${a.length} < ${b.length})`); }
      else if (Array.isArray(a) && Array.isArray(b)) a.forEach((x, i) => walk(x, b[i], `${path}[${i}]`));
      else if (typeof a === 'object' && typeof b === 'object') for (const k of Object.keys(a)) walk(a[k], b[k], path ? `${path}.${k}` : k);
    };
    walk(S, B, '');
    if (shorter.length) warnings.push({kind: 'weak-stress', fields: shorter.slice(0, 8)});
  }

  // --- labels-hidden coverage (non-blocking warning, AUTHORING item 11): with
  // textVisibility 'none' the scene must still fill the caption-safe box.
  for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
    const el = slot();
    let x;
    try {
      x = def.create(el, {width: w, height: h, instanceId: `nolab-${ratio.replace(':', 'x')}`, params: {textVisibility: 'none'}});
      await x.ready;
      x.seek(x.durationMs);
      const lw = layoutWarnings(x.element, x, []);
      if (lw.coverage && Math.max(lw.coverage.w, lw.coverage.h) < 0.8) warnings.push({kind: 'low-frame-coverage-nolabels', ratio, coverage: lw.coverage});
    } catch { /* covered elsewhere */ } finally {
      if (x) x.destroy();
      el.remove();
    }
  }

  // --- readable hold (non-blocking warning, AUTHORING item 19): with
  // decorative motion off, the frame 300 ms before the end must already equal
  // the final frame (everything fully visible for the last ~300 ms).
  for (const preset of presets) {
    const el = slot();
    let x;
    try {
      x = def.create(el, {width: 1920, height: 1080, instanceId: `hold-${preset.name}`, params: {...preset.params, reducedMotion: true}});
      await x.ready;
      const d = x.durationMs;
      x.seek(d);
      const end = x.element.outerHTML;
      const probe = Math.max(0, d - 300);
      x.seek(probe);
      if (x.element.outerHTML !== end) {
        // find roughly when the scene stops changing (coarse 50 ms scan)
        let settled = d;
        for (let t = d - 50; t >= probe; t -= 50) { x.seek(t); if (x.element.outerHTML !== end) break; settled = t; }
        warnings.push({kind: 'short-hold', preset: preset.name, ratio: '16:9', holdMs: Math.round(d - settled), durationMs: d});
      }
    } catch { /* covered by the matrix check */ } finally {
      if (x) x.destroy();
      el.remove();
    }
  }

  // --- backgrounds, themes, locales, label visibility, seeds, reduced motion
  const variants = [];
  for (const params of [{background: 'paper'}, {background: 'charcoal'}, {background: '#ffffff'}, {locale: 'es'}, {textVisibility: 'none'}, {textVisibility: 'key'}, {reducedMotion: true}, {seed: 12345}, {palette: 'mono'}, {contentNotice: false}]) {
    const el = slot();
    let x;
    try {
      x = def.create(el, {width: 1920, height: 1080, params});
      await x.ready;
      x.seek(x.durationMs * 0.5);
      const r = inspectDom(x.element, x);
      if (r.problems.length || r.outsideFrame.length) variants.push({params, ...r});
    } catch (e) {
      variants.push({params, error: String(e.message || e)});
    } finally {
      if (x) x.destroy();
      el.remove();
    }
  }
  add('backgrounds, locale es, label visibility, reduced motion, seeds and palettes render cleanly', variants.length === 0, variants);

  // --- text-only labels hidden: no <text> visible
  {
    const el = slot();
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none', contentNotice: false}});
    await x.ready;
    x.seek(x.durationMs * 0.8);
    const vis = [...x.element.querySelectorAll('text')].filter(visible).map(t => t.textContent.slice(0, 30));
    add('textVisibility "none" hides all labels (action must read without them)', vis.length === 0, vis.slice(0, 5));
    x.destroy();
    el.remove();
  }

  // --- unsafe text is rendered as text, never markup
  {
    const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    const el = slot();
    const strings = findStringPaths(def.defaultParams, def.paramsSchema);
    let ok = true;
    let detail = null;
    if (strings.length) {
      const params = {};
      setPath(params, strings[0], evil, def.defaultParams);
      try {
        const x = def.create(el, {width: 1920, height: 1080, params});
        await x.ready;
        x.seek(x.durationMs);
        ok = !x.element.querySelector('img, script') && !document.querySelector('#slots img, #slots script');
        detail = {field: strings[0].join('.')};
        x.destroy();
      } catch (e) {
        detail = {field: strings[0].join('.'), rejected: String(e.message)};
      }
    }
    add('user text is inserted as text nodes (no markup injection)', ok, detail);
    el.remove();
  }

  // --- two simultaneous instances are isolated; unique SVG ids
  {
    const a = def.create(slot(), {width: 1920, height: 1080, instanceId: 'twin-a'});
    const b = def.create(slot(), {width: 1080, height: 1920, instanceId: 'twin-b', params: {seed: 9}});
    await Promise.all([a.ready, b.ready]);
    a.seek(D * 0.3);
    b.seek(D * 0.8);
    const sa1 = norm(a.getState({bounds: false}));
    b.seek(D * 0.1);
    const sa2 = norm(a.getState({bounds: false}));
    const ids = [...document.querySelectorAll('#slots [id]')].map(e => e.id);
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    add('two simultaneous instances: independent state and no duplicate SVG ids', sa1 === sa2 && dup.length === 0, {duplicates: dup.slice(0, 5)});
    a.destroy();
    b.destroy();
  }

  // --- destroy idempotent, removes only own nodes, later calls error
  {
    const other = def.create(slot(), {width: 800, height: 450, instanceId: 'survivor'});
    await other.ready;
    const host = inst.element.parentNode;
    inst.destroy();
    inst.destroy();
    const after = await expectThrow(() => inst.seek(0));
    add('destroy() is idempotent, removes its nodes, keeps other instances, and later calls raise', host.childNodes.length === 0 && other.element.isConnected && after.threw && /destroyed/.test(after.message));
    other.destroy();
    const remount = def.create(host, {width: 1920, height: 1080, instanceId: 'contract-a'});
    await remount.ready;
    add('instance id can be reused after disposal (remount)', remount.element.isConnected);
    remount.destroy();
  }

  // --- continuity (no teleporting), attachment and reach — in all three ratios
  {
    const jumps = [];
    const attachFails = [];
    const unreached = [];
    for (const [ratio, [w, hh]] of Object.entries(RATIOS)) {
      const x = def.create(slot(), {width: w, height: hh, instanceId: `continuity-${ratio.replace(':', 'x')}`});
      await x.ready;
      const fps = 60;
      const frames = Math.ceil(x.durationMs / 1000 * fps);
      const tracks = spec.continuity || [];
      const limit = spec.continuityLimit ?? 90;
      if (limit > 90 && !warnings.some(w => w.kind === 'relaxed-continuity')) warnings.push({kind: 'relaxed-continuity', limit, note: 'test raises the per-frame motion limit above the default 90; motion this fast strobes or jumps — reviewers must check the fast beat frame by frame'});
      let prev = null;
      for (let f = 0; f <= frames; f++) {
        x.renderFrame(f, {fps});
        const s = x.getState({bounds: false}).semantic;
        if (s.allReached === false) unreached.push({ratio, f, reach: s.reach});
        if (prev) {
          for (const k of tracks) {
            const a = prev[k], b = s[k];
            if (!a || !b) continue;
            const d = Math.hypot(b.x - a.x, b.y - a.y);
            if (d > limit) jumps.push({ratio, k, f, d: Math.round(d)});
          }
        }
        const u = f / frames;
        for (const at of spec.attach || []) {
          if (u >= at.from && u <= at.to) {
            const a = s[at.a], b = s[at.b];
            if (a && b && Math.hypot(a.x - b.x, a.y - b.y) > at.tol) attachFails.push({ratio, u: +u.toFixed(3), a: at.a, b: at.b});
          }
        }
        prev = s;
      }
      x.destroy();
    }
    add('tracked points move continuously at 60 fps in 16:9, 9:16 and 1:1 (no teleport)', jumps.length === 0, jumps.slice(0, 8));
    add('attached pairs coincide during their attachment windows (all ratios)', attachFails.length === 0, attachFails.slice(0, 8));
    add('every IK target is within arm reach on every frame in all ratios (hands never stretch off their props)', unreached.length === 0, unreached.slice(0, 5));
  }

  // --- ID-specific semantic assertions
  {
    const x = def.create(slot(), {width: 1920, height: 1080, instanceId: 'semantic'});
    await x.ready;
    for (const check of spec.semantic || []) {
      x.setParams(check.params || {});
      x.seek(check.at * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      let pass = false;
      let err = null;
      try {
        pass = Boolean(new Function('s', `return (${check.fn});`)(s));
      } catch (e) {
        err = String(e.message);
      }
      add(`semantic: ${check.label || check.fn} @${check.at}`, pass, err ? {err} : {semantic: s});
      if (check.params) x.setParams(resetPatch(def.defaultParams, check.params));
    }
    x.destroy();
  }

  document.getElementById('slots').innerHTML = '';
  return {id, results, warnings, durationMs: D};
}

function resetPatch(defaults, params) {
  const out = {};
  for (const k of Object.keys(params)) out[k] = JSON.parse(JSON.stringify(defaults[k]));
  return out;
}

/** Find a path to a user string field in default params. */
function findStringPaths(obj, schema, path = [], out = []) {
  if (typeof obj === 'string') {
    const leaf = path[path.length - 1];
    if (!['locale', 'theme', 'palette', 'background', 'textVisibility', 'jurisdiction', 'finalState', 'focusTarget', 'focusElement'].includes(leaf) && !/^(id|kind|from|to|target|hair)$/.test(leaf)) out.push(path);
  } else if (Array.isArray(obj)) obj.forEach((v, i) => findStringPaths(v, schema, [...path, i], out));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) findStringPaths(v, schema, [...path, k], out);
  return out;
}

function setPath(target, path, value, defaults) {
  // Rebuild the top-level field from defaults so arrays replace predictably.
  const top = path[0];
  target[top] = JSON.parse(JSON.stringify(defaults[top]));
  let o = target;
  for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
  const leafPath = path[path.length - 1];
  const maxLen = 60;
  o[leafPath] = value.slice(0, maxLen);
}
