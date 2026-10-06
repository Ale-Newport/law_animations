/**
 * LAW-0384 — Copia de evidencia digital · inspect
 *
 * Storyboard (context: the state produced by the copying action on the evidence bench — the original back in its open
 * evidence bag with its tag on a ball chain, the duplicator dock with both bays empty and its lamps white, the empty
 * blank tray, and the copy on its spot with its block map written and its own tag clipped to its eyelet; a legend
 * lists the item, the context caption, the copy-tag rows, the before / now values, custodians, times, the marker label
 * and the key):
 *  0.00–0.20  context: the whole station enlarged on the bench; the copy tag's focus row carries its before value.
 *             The station steps aside (0.10–0.19), keeping well over half of the bench, to make room for the lens.
 *  0.20–0.45  a lens opens beside the station: a real magnified copy (same coordinates) of the copy's tag — every
 *             supplied row printed as text, the focus row ringed. The context copy of the focus datum goes blank in step
 *             with the lens appearing.
 *  0.45–0.75  one datum is substituted: the before value lifts and fades, a "before: …" trace stays under the tag, then
 *             the after value is written in and holds still.
 *  0.75–1.00  the lens closes back onto the tag; the context tag shows the after datum and the neutral changed-datum
 *             marker (Δ) sits beside it. Nothing is inferred about the copy's validity or any outcome; seeking back
 *             restores the before value exactly.
 * @module animations/evidence-custody/LAW-0384
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {measure} from '../../core/text.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  ecFields, localised, benchNode, fitG, textAt, bagBack, bagFront, chainNode, chainProps, tagArt, scribble, WRITE_INK,
} from './kits/evidence-art.js';
import {
  DC_EN, DC_ES, dcFields, dcRecords, dcRecordLine, dcStage, deviceArt, dockArt, dockFlowProps, trayArt, tagT, origTagArt,
  dcLegendFor, dcPanels,
} from './kits/copia-digital.js';

const ID = 'LAW-0384';
const DURATION = 8000;
const W = {aside: [0.1, 0.19], open: [0.2, 0.32], ring: [0.34, 0.4], fadeOld: [0.45, 0.51], trace: [0.5, 0.56], writeNew: [0.54, 0.62], close: [0.75, 0.81], back: [0.81, 0.9], marker: [0.82, 0.88], legend: [0.81, 0.86]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const ROWS = ['row1', 'row2', 'row3', 'row4', 'row5'];

const STRINGS = {
  en: {before: 'before', after: 'now', blankShort: 'blank'},
  es: {before: 'antes', after: 'ahora', blankShort: 'en blanco'},
};

const OWN_EN = {
  focusTarget: 'row1',
  beforeValue: 'D-01/C1',
  afterValue: 'D-01/C2',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'After the copy: the original in its bag, the copy with its own tag', marker: 'Only this datum was changed'},
};
const OWN_ES = {
  focusTarget: 'row1',
  beforeValue: 'D-01/C1',
  afterValue: 'D-01/C2',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'Tras la copia: el original en su bolsa, la copia con su propia etiqueta', marker: 'Solo este dato ha cambiado'},
};
const EN = {...DC_EN, ...OWN_EN};
const ES = {...DC_ES, ...OWN_ES};
const {items: _ei, records: _er, ...ecRest} = ecFields;

const sceneSchema = {
  ...ecRest,
  ...dcFields,
  focusTarget: oneOf('Row of the copy tag whose value is enlarged and substituted (row1 = top row; a row beyond the supplied rows falls back to the last row)', ROWS),
  beforeValue: str('Value of that row before the substitution (empty = left blank)', 24),
  afterValue: str('Value of that row after the substitution (the alternative datum; empty = blank)', 24),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Minimum magnification of the lens (the lens grows further when room allows)', 1.5, 4),
    placement: oneOf('Side where the lens opens (auto = right on wide benches, below on tall ones)', ['auto', 'left', 'right', 'top', 'bottom']),
  }, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
  }, ['context', 'marker']),
};
const defaultParams = {...EN};

const focusRow = (P, n) => Math.min(n - 1, ROWS.indexOf(P.focusTarget));

function legendRows(ctx, P, recs, fi) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const it = P.items[0];
  const rows = [];
  const bv = P.beforeValue.trim() ? P.beforeValue : P.labels.blank;
  const av = P.afterValue.trim() ? P.afterValue : P.labels.blank;
  if (showKey) rows.push({kind: 'heading', icon: `dc-orig-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showAll) rows.push({kind: 'item', icon: `dc-copy-${it.kind}`, text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) recs.forEach((rw, i) => { if (i !== fi) rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: dcRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}); });
  if (showKey) {
    rows.push({kind: 'item', icon: 'row-filled', text: `${recs[fi].field}: ${ctx.t.before} ${bv}`, name: 'lg-before'});
    rows.push({kind: 'item', icon: 'row-filled', text: `${recs[fi].field}: ${ctx.t.after} ${av}`, name: 'lg-after'});
  }
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, fi, F, LG, opt, vs) {
  const {bench, panel, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.5, y: bench.y + inset * 1.5, w: bench.w - inset * 3, h: bench.h - inset * 3};
  const wide = opt.orient === 'h';
  const pl = P.detailGeometry.placement;
  const lensFirst = wide ? pl === 'left' : pl === 'top';
  const split = opt.split;
  const zoneCtx = wide
    ? {x: lensFirst ? mat.x + mat.w * (1 - split) : mat.x, y: mat.y, w: mat.w * split, h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y + mat.h * (1 - split) : mat.y, w: mat.w, h: mat.h * split};
  const zoneLens = wide
    ? {x: lensFirst ? mat.x : mat.x + mat.w * split, y: mat.y, w: mat.w * (1 - split), h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y : mat.y + mat.h * split, w: mat.w, h: mat.h * (1 - split)};
  const G = dcStage(zoneCtx, {kind: P.items[0].kind, orient: opt.stage, rows: recs.length});
  const T0 = G.tagC;
  const hole = G.tagFinal;
  const pad = T0.h * 0.16;
  const traceH = T0.h * 0.42;
  // crop: the copy device (with its block map), its chain and its whole tag, plus room for the trace line
  const tagOnly = opt.crop === 'tag';
  const devTop = tagOnly ? hole.y - T0.h / 2 - pad : G.copySpot.y - G.M.h / 2 - pad;
  const sx0 = (tagOnly ? hole.x + T0.x0 : Math.min(hole.x + T0.x0, G.copySpot.x - G.M.w / 2)) - pad, sx1 = (tagOnly ? hole.x + T0.x1 : Math.max(hole.x + T0.x1, G.copySpot.x + G.M.w / 2)) + pad;
  const source = {x: sx0, y: devTop, w: sx1 - sx0, h: hole.y + T0.h / 2 + pad + traceH - devTop};
  if (tagOnly && source.h < source.w * 0.75) { const d = source.w * 0.75 - source.h; source.y -= d * 0.3; source.h += d; }
  if (!tagOnly && source.w < source.h) { const d = source.h - source.w; source.x -= d / 2; source.w = source.h; }
  const zoom = Math.min(zoneLens.w * 0.96 / source.w, zoneLens.h * 0.96 / source.h);
  const dest = {w: source.w * zoom, h: source.h * zoom};
  dest.x = zoneLens.x + (zoneLens.w - dest.w) / 2; dest.y = zoneLens.y + (zoneLens.h - dest.h) / 2;
  const zoomPx = zoom * vs;
  const floor = (opt.floorPx || 19.6) / zoomPx;
  const R0 = T0.rows[0];
  const size = Math.max(floor, Math.min(22 / zoomPx, T0.pitch * 0.62));
  const fieldW = Math.min((T0.rx1 - T0.rx0) * 0.46, Math.max(...recs.map(rw => measure(rw.field, size, 500))) + size * 0.2);
  const valueX = T0.rx0 + fieldW + size * 0.5;
  const valW = T0.rx1 - valueX - size * 0.2;
  let tOk = size <= T0.pitch * 0.86 && size >= floor - 1e-9;
  const fit = (text, w, weight) => { const f = fitG(text || ' ', {maxWidth: w, size, minSize: floor, maxLines: 1, weight}); if (!f.ok) tOk = false; return f; };
  const texts = recs.map((rw, i) => ({fieldFit: fit(rw.field, fieldW, 500), valueFit: fit(i === fi ? ' ' : rw.value, valW, 600)}));
  const bFit = fit(P.beforeValue, valW, 600), aFit = fit(P.afterValue, valW, 600);
  const trace = fitG(`${ctx.t.before}: ${P.beforeValue.trim() ? P.beforeValue : ctx.t.blankShort}`, {maxWidth: Math.min(source.w - pad, source.x + source.w - (hole.x + T0.x0) - size), size: Math.max(floor, size * 0.9), minSize: floor, maxLines: 1, weight: 500});
  if (!trace.ok) tOk = false;
  void R0;
  const showText = ctx.show('key');
  const textOk = !showText || tOk;
  const zoomOk = zoom >= P.detailGeometry.zoom - 1e-6 && zoom >= 1.5;
  const k = Math.min(ctx.view.width, ctx.view.height);
  const lensBig = Math.min(dest.w, dest.h) * vs * k / 1080 >= 0.355 * k;
  const E = G.ext;
  const rsc = clamp(Math.min(mat.h * 0.96 / E.h, mat.w * 0.96 / E.w), 1, 2.2);
  const stageOk = G.S >= 60 && G.S * rsc >= 80;
  const ctxOk = Math.max(E.w / mat.w, E.h / mat.h) >= 0.47;
  const ok = (!PL || PL.ok) && zoomOk && textOk && lensBig && stageOk && ctxOk;
  return {F, rsc, bench, mat, panel, PL, G, fi, source, dest, zoom, size, texts, valueX, bFit, aFit, trace, ok, kText: 16.3 / (Math.min(size, trace.size) * vs),
    zoneCtx, problems: [PL && !PL.ok && 'panel-text', !zoomOk && 'zoom', !textOk && 'lens-text', !lensBig && 'lens-small', !stageOk && 'stage-small', !ctxOk && 'context-small'].filter(Boolean)};
}

function lensParts(ctx, L) {
  const {C, P} = L;
  const G = C.G;
  const T0 = G.tagC;
  const hole = G.tagFinal;
  const showText = ctx.show('key');
  const R = T0.rows[C.fi];
  const vx = hole.x + C.valueX, vy = hole.y + R.y - C.size * 0.86;
  const rowsArt = L.recs.map((rw, i) => ({filled: i !== C.fi && rw.filled}));
  const val = (fitv, name, op, len) => g({name, opacity: op},
    showText ? textAt(fitv, {x: vx, y: vy, fill: WRITE_INK}) : h('path', {d: scribble(ctx, `lz-${name}`, vx, vx + (hole.x + T0.rx1 - vx) * len, hole.y + R.y, T0.pitch * 0.3), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2}));
  const content = g(null,
    h('rect', {x: r(C.source.x - 40), y: r(C.source.y - 40), width: r(C.source.w + 80), height: r(C.source.h + 80), fill: '#3f6b5a'}),
    g({transform: `translate(${r(G.copySpot.x)} ${r(G.copySpot.y)})`}, deviceArt(ctx, G.M, {prefix: 'lzc', role: 'copy', filled: true})),
    h('path', {d: `M${r(G.eyeOf(G.copySpot).x)} ${r(G.eyeOf(G.copySpot).y)}L${r(hole.x)} ${r(hole.y)}`, stroke: '#9ea5ab', 'stroke-width': r(Math.max(4, G.S * 0.04)), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(Math.max(5, G.S * 0.05))}`}),
    g({transform: tagT(hole)}, tagArt(ctx, T0, {prefix: 'lzt', rows: rowsArt, texts: null, seedKey: 'dc-copy'})),
    g({name: 'lv-text'},
      showText ? g({transform: tagT(hole)}, h('rect', {x: r(T0.rx0 - 2), y: r(-T0.h / 2 + T0.h * 0.1), width: r(T0.rx1 - T0.rx0 + 4), height: r(T0.h * 0.8), fill: '#ecd6a1'}),
        C.texts.map((t, i) => g(null,
          h('line', {x1: r(C.valueX - 4), x2: r(T0.rx1), y1: r(T0.rows[i].y + 2), y2: r(T0.rows[i].y + 2), stroke: '#c9ad6e', 'stroke-width': 1.2}),
          textAt(t.fieldFit, {x: T0.rx0, y: T0.rows[i].y - t.fieldFit.size * 0.86, fill: '#5b4a2a'}),
          i !== C.fi && L.recs[i].filled ? textAt(t.valueFit, {x: C.valueX, y: T0.rows[i].y - t.valueFit.size * 0.86, fill: WRITE_INK}) : null))) : null,
      P.beforeValue.trim() ? val(C.bFit, 'lv-before', 1, 0.55) : g({name: 'lv-before'}),
      P.afterValue.trim() ? val(C.aFit, 'lv-after', 0, 0.85) : g({name: 'lv-after', opacity: 0}),
      g({name: 'lv-trace', opacity: 0}, showText ? g(null,
        h('path', {d: `M${r(hole.x + T0.x0)} ${r(hole.y + T0.h / 2 + 4)}h${r(C.trace.width + C.size * 0.8)}v${r(C.trace.height + C.size * 0.5)}h${r(-(C.trace.width + C.size * 0.8))}Z`, fill: '#f4f1ea', opacity: 0.92}),
        textAt(C.trace, {x: hole.x + T0.x0 + C.size * 0.4, y: hole.y + T0.h / 2 + 4 + C.size * 0.25, fill: '#4a5560', italic: true})) : null),
    ),
    h('rect', {name: 'lv-ring', x: r(hole.x + C.valueX - C.size * 0.3), y: r(hole.y + R.top + 1), width: r(hole.x + T0.rx1 - (hole.x + C.valueX) + C.size * 0.3), height: r(R.h - 2), rx: 4, fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 2.5, opacity: 0}),
  );
  return lens(ctx, {name: 'lens', source: C.source, dest: C.dest, frame: C.bench, content, color: ctx.theme.accent2});
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = dcRecords(P);
    const fi = focusRow(P, recs.length);
    recs[fi] = {...recs[fi], value: P.beforeValue, filled: P.beforeValue.trim().length > 0};
    const shape = ctx.view.shape;
    const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.24}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.4}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.24}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.32}];
    const confs = [];
    for (const split of [0.62, 0.54, 0.46, 0.4]) for (const stage of ['h', 'v']) for (const crop of ['full', 'tag']) confs.push({orient: 'h', split, stage, crop});
    for (const split of [0.58, 0.5, 0.42]) for (const stage of ['h', 'v']) for (const crop of ['full', 'tag']) confs.push({orient: 'v', split, stage, crop});
    const rowsL = legendRows(ctx, P, recs, fi);
    let C = null, best = null, bestScore = -1;
    const lgs = new Map();
    // pass 1: lens text at the baseline size (>= 19.5 px); pass 2 (only when nothing fits): the 16 px floor
    for (const floorPx of [19.6, 16]) {
      if (best) break;
      let firstOk = -1;
      for (const [fj, F] of SIZES.entries()) {
        if (firstOk >= 0 && fj > firstOk + 1) break;
        for (const o0 of opts) {
          const key = `${F}|${o0.mode}|${o0.pw || o0.cols}`;
          if (!lgs.has(key)) lgs.set(key, dcLegendFor(ctx, rowsL, F, o0));
          const LG = lgs.get(key);
          if (LG.PL && !LG.PL.ok && C) continue;
          for (const cf of confs) {
            const c = compose(ctx, P, recs, fi, F, LG, {...cf, floorPx}, vs);
            const score = c.G.S * Math.sqrt(c.rsc) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * Math.min(1.3, c.zoom / 2.5) * (shape === 'square' && o0.mode === 'below' ? 0.7 : 1) * (cf.crop === 'tag' ? 0.8 : 1);
            if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fj;
            if (c.ok && score > bestScore) { best = c; bestScore = score; }
            if (!C || c.problems.length < C.problems.length) C = c;
          }
        }
      }
    }
    if (best) C = best;
    const M0 = C.mat, E = C.G.ext;
    const rs = C.rsc;
    const rest = {s: rs, dx: M0.x + M0.w / 2 - rs * (E.x + E.w / 2), dy: M0.y + M0.h / 2 - rs * (E.y + E.h / 2)};
    const L = {P, recs, C, rest};
    L.lensF = lensParts(ctx, L).frame;
    return L;
  },
  build(ctx, L) {
    const {C, P} = L;
    const G = C.G;
    const T0 = G.tagC;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const bw = Math.max(5, G.S * 0.045);
    const hole = G.tagFinal;
    const R = T0.rows[C.fi];
    const vx0 = hole.x + T0.rx0 + T0.stub + 8;
    const scr = (key, len) => h('path', {d: scribble(ctx, `ctx-${key}`, vx0, vx0 + (hole.x + T0.rx1 - vx0 - 4) * len, hole.y + R.y, Math.min(R.h * 0.4, T0.h * 0.09)), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.8, T0.h * 0.02), 2), 'stroke-linecap': 'round'});
    const mR = Math.max(16, G.S * 0.13);
    const mk = {x: hole.x + T0.x1 + mR * 1.3, y: hole.y};
    const lz = lensParts(ctx, L);
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        g({name: 'ctxMove'},
          g({transform: T(G.tray.x, G.tray.y)}, trayArt(ctx, G.tray.w, G.tray.h)),
          g({transform: T(G.dock.x, G.dock.y)}, dockArt(ctx, G.D, {prefix: 'dk'})),
          g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.bag.B, {})),
          g({transform: T(G.origRest.x, G.origRest.y)}, deviceArt(ctx, G.M, {prefix: 'o', role: 'original'})),
          g({transform: T(G.bag.x, G.bag.y)}, bagFront(ctx, G.bag.B, {})),
          chainNode('chO', {bead: bw}),
          g({transform: tagT(G.holeOf(G.origRest))}, origTagArt(ctx, G, 'tO')),
          g({transform: T(G.copySpot.x, G.copySpot.y)}, deviceArt(ctx, G.M, {prefix: 'cp', role: 'copy', filled: true})),
          chainNode('chC', {bead: bw}),
          g({transform: tagT(hole)}, tagArt(ctx, T0, {prefix: 'ctg', rows: L.recs.map((rw, i) => ({filled: i !== C.fi && rw.filled, len: 0.8})), seedKey: 'dc-copy'})),
          g({name: 'cf-before'}, P.beforeValue.trim() ? scr('b', 0.55) : null),
          g({name: 'cf-after', opacity: 0}, P.afterValue.trim() ? scr('a', 0.85) : null),
          changedMarker(ctx, {name: 'marker', x: mk.x, y: mk.y, radius: mR, opacity: 0}),
        ),
      ),
      bench.frame,
      lz.node,
      dcPanels(ctx, C),
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const G = C.G;
    const nodes = {};
    const hasB = P.beforeValue.trim().length > 0, hasA = P.afterValue.trim().length > 0;
    const pOpen = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    Object.assign(nodes, L.lensF(pOpen, pOpen));
    Object.assign(nodes, chainProps('chO', G.eyeOf(G.origRest), G.holeOf(G.origRest), G.S * 0.06));
    Object.assign(nodes, chainProps('chC', G.eyeOf(G.copySpot), G.tagFinal, G.S * 0.06));
    Object.assign(nodes, dockFlowProps('dk', G.D, 0, 0));
    const kOld = seg(u, ...W.fadeOld), kTrace = seg(u, ...W.trace), kNew = seg(u, ...W.writeNew);
    const ctxBefore = u < W.open[0] ? 1 : 0;
    const ctxAfter = u >= W.close[1] ? 1 : 0;
    nodes['cf-before'] = {opacity: hasB ? ctxBefore : 0};
    nodes['cf-after'] = {opacity: hasA ? ctxAfter : 0};
    nodes['lv-text'] = {opacity: lerp(1, C.zoom, pOpen) >= C.kText ? 1 : 0};
    nodes['lv-before'] = {opacity: r(1 - kOld, 3), transform: T(0, -kOld * C.size * 0.6)};
    nodes['lv-trace'] = {opacity: r(kTrace * 0.95, 3)};
    nodes['lv-after'] = {opacity: r(kNew, 3)};
    nodes['lv-ring'] = {opacity: r(seg(u, ...W.ring), 3)};
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3)};
    const kRest = 1 - ease.inOutCubic(seg(u, ...W.aside)) * (1 - ease.inOutCubic(seg(u, ...W.back)));
    const RS = L.rest;
    const sc = lerp(1, RS.s, kRest);
    nodes.ctxMove = {transform: T(RS.dx * kRest, RS.dy * kRest, 0, sc)};
    const tc = {x: G.tagFinal.x + G.tagC.w * 0.4, y: G.tagFinal.y};
    const focus = {x: tc.x * sc + RS.dx * kRest, y: tc.y * sc + RS.dy * kRest};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-after') nodes[row.name] = {opacity: r(kNew, 3)};
      if (row.name === 'lg-marker') nodes[row.name] = {opacity: r(seg(u, ...W.legend), 3)};
    }
    const shown = u < (W.fadeOld[0] + W.fadeOld[1]) / 2 ? 'before' : 'after';
    const phase = u < W.open[0] ? 'context' : u < W.open[1] ? 'open' : u < W.fadeOld[0] ? 'isolate' : u < W.writeNew[1] ? 'substitute' : u < W.close[0] ? 'hold-new' : u < W.close[1] ? 'close' : 'return';
    const Rb = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    const E = G.ext;
    return {
      nodes,
      semantic: {
        phase, shown, lensP: r(pOpen, 3), zoom: r(C.zoom, 3), focus: P.focusTarget, row: C.fi,
        value: shown === 'before' ? P.beforeValue : P.afterValue, ctxBefore, ctxAfter, lensBefore: r(1 - kOld, 3), lensAfter: r(kNew, 3),
        marker: r(mk, 3), focusTag: {x: r(focus.x), y: r(focus.y)}, restK: r(kRest, 3), ctxScale: r(sc, 3),
        ctxShare: r(Math.max((E.w * sc) / C.mat.w, (E.h * sc) / C.mat.h), 3),
        source: Rb(C.source), dest: Rb(C.dest), bench: Rb(C.bench),
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'evidence-custody-06-inspect',
    title: 'Digital evidence copy — a lens enlarges the tag that identifies the copy and one supplied row value is substituted, then the station returns with a changed-datum marker',
    titleEs: 'Copia de evidencia digital — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Copia de evidencia digital',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the imaging station after the copy — the original (fictional drive, stick or card) back in its open evidence bag with its tag, the duplicator dock with empty bays, and the copy with its block map written and its own tag on a ball chain. The station steps aside and a lens opens with a real magnified copy (same coordinates) of the copy\'s tag, every supplied row printed as text. One row value is substituted (before → now) with a "before" trace; the lens closes and a neutral Δ marker sits beside the tag. Nothing is inferred about validity or outcomes; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'digital evidence', 'copy', 'inspect', 'lens', 'changed datum', 'tag', 'identifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/copia-digital.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
