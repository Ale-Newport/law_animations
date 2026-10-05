/**
 * LAW-0368 — Embalaje de prueba · inspect
 *
 * Storyboard (context: the state produced by the packing action — on the evidence bench a sealed evidence pouch lies
 * with the object inside, the flap folded over the mouth and the numbered seal strip pressed across the flap edge;
 * the flap's outer face carries two write-on lines (sealed by / seal state); the custody label and chain strip sit
 * on the body; a legend lists the item, context caption, rows, the before / now values, custodians, times, the
 * marker label and the key):
 *  0.00–0.20  context: the sealed pouch centred and enlarged on the bench; the focus datum shows its before state
 *             (seal state line written as supplied and the strip unbroken; or the plate's barcode for the before
 *             number). The pouch steps aside (0.10–0.19) to make room for the lens.
 *  0.20–0.45  a lens opens beside the pouch: a real magnified copy (same coordinates) of the seam — the flap's two
 *             lines printed as text, the strip with its number plate. The context copy of the datum is hidden in
 *             step with the lens appearing (the context line goes blank).
 *  0.45–0.75  one datum is substituted: the before value lifts and fades, a small "before: …" trace stays, then the
 *             after value is written in; for the seal state its dependent geometry follows (the supplied slit is
 *             drawn across the strip); for the seal number only the printed number changes. The new value holds.
 *  0.75–1.00  the lens closes back onto the seam; the context now shows the after state (line, slit or new plate
 *             pattern) and the neutral changed-datum marker (Δ) beside the strip. Nothing is inferred about
 *             tampering, validity, admissibility or custody. Seeking back restores the before value exactly.
 * @module animations/evidence-custody/LAW-0368
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {ecFields, localised, benchNode, panelLayout, R2, fitG, textAt, objectModel, objectArt, MAT, INK, WRITE_INK} from './kits/evidence-art.js';
import {
  EP_EN, EP_ES, epFields, epRecords, epRecordLine, pouchModel, pouchBack, pouchFront, flapNode, flapOutline, stripArt,
  plateBars, markerAt, epPanelNode, FLAP,
} from './kits/embalaje-prueba.js';

const ID = 'LAW-0368';
const DURATION = 8000;
const W = {aside: [0.1, 0.19], open: [0.2, 0.32], ring: [0.34, 0.4], fadeOld: [0.45, 0.51], trace: [0.5, 0.56], writeNew: [0.54, 0.62], close: [0.75, 0.85], back: [0.85, 0.93], marker: [0.86, 0.92], legend: [0.85, 0.9]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {before: 'before', after: 'now', blankShort: 'blank'},
  es: {before: 'antes', after: 'ahora', blankShort: 'en blanco'},
};

const OWN_EN = {
  focusTarget: 'sealState',
  beforeValue: 'Seal intact',
  afterValue: 'Alteration marked',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'The sealed pouch with the object inside', marker: 'Only this datum was changed', stateField: 'Seal state', byField: 'Sealed by'},
};
const OWN_ES = {
  focusTarget: 'sealState',
  beforeValue: 'Precinto íntegro',
  afterValue: 'Alteración señalada',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'La bolsa precintada con el objeto dentro', marker: 'Solo este dato ha cambiado', stateField: 'Estado del precinto', byField: 'Precintado por'},
};
const EN = {...EP_EN, ...OWN_EN};
const ES = {...EP_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...epFields,
  focusTarget: oneOf('Datum that is enlarged and substituted: sealState — the state line on the flap (its dependent geometry: the supplied slit on the strip); sealNumber — the number printed on the seal strip', ['sealState', 'sealNumber']),
  beforeValue: str('Value of that datum before the substitution (empty = left blank)', 40),
  afterValue: str('Value of that datum after the substitution (the alternative datum; empty = blank)', 40),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Minimum magnification of the lens (the lens grows further when room allows)', 1.5, 4),
    placement: oneOf('Side of the pouch where the lens opens (auto = the larger free side)', ['auto', 'left', 'right', 'top', 'bottom']),
  }, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view and the flap lines', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
    stateField: str('Name of the seal-state line on the flap', 30),
    byField: str('Name of the sealed-by line on the flap', 30),
  }, ['context', 'marker', 'stateField', 'byField']),
};

const defaultParams = {...EN};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  const num0 = P.focusTarget === 'sealNumber';
  const bv = P.beforeValue.trim() ? P.beforeValue : P.labels.blank;
  const av = P.afterValue.trim() ? P.afterValue : P.labels.blank;
  const fname = num0 ? P.labels.seal : P.contextLabels.stateField;
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showAll) rows.push({kind: 'item', icon: 'ep-pouch', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey && !num0) rows.push({kind: 'item', icon: 'ep-seal', text: `${P.labels.seal}: ${P.sealNumber}`, name: 'lg-seal-no'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: epRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showKey) {
    rows.push({kind: 'item', icon: num0 ? 'ep-seal' : 'row-filled', text: `${fname}: ${ctx.t.before} ${bv}`, name: 'lg-before'});
    rows.push({kind: 'item', icon: num0 ? 'ep-seal' : 'ep-alter', text: `${fname}: ${ctx.t.after} ${av}`, name: 'lg-after'});
  }
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function legendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  let bench, panel = null, PL = null;
  if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [panelLayout(ctx, rows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    PL = {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW};
    bench = {x: 0, y: 0, w: DW, h: DH - ph - gap};
    panel = {x: 4, y: DH - ph};
  } else {
    const PW = DW * opt.pw;
    const one = panelLayout(ctx, rows, {w: PW, F});
    PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
    bench = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
  }
  return {bench, panel, PL};
}

/** Lens texts (source units; rendered size = size × zoomPx). */
function lensTexts(ctx, P, S, zoomPx, src, x0) {
  const target = 24 / zoomPx, floor = 16 / zoomPx;
  const pitch = S * 0.13;
  const size = Math.min(Math.max(target, floor), pitch * 0.82);
  let ok = size >= floor - 1e-9;
  const maxW = src.x + src.w - x0 - S * 0.04;
  const fit = (text, weight, sz = size) => {
    const f = fitG(text || ' ', {maxWidth: maxW, size: sz, minSize: Math.max(floor, Math.min(sz * 0.85, target)), maxLines: 1, weight});
    if (!f.ok) ok = false;
    return f;
  };
  const by = `${P.contextLabels.byField}: ${P.custodians[0].name}`;
  const num0 = P.focusTarget === 'sealNumber';
  const lab = `${P.contextLabels.stateField}: `;
  const labFit = fit(lab, 600);
  const valW = maxW - labFit.width - 4;
  const fitV = text => {
    const f = fitG(text || ' ', {maxWidth: valW, size, minSize: Math.max(floor, Math.min(size * 0.85, target)), maxLines: 1, weight: 500});
    if (!f.ok) ok = false;
    return f;
  };
  const trace = `${ctx.t.before}: ${P.beforeValue.trim() ? P.beforeValue : ctx.t.blankShort}`;
  const traceFit = fit(trace, 500, Math.max(floor, size * 0.85));
  return {size, by: fit(by, 500), lab: labFit, before: num0 ? null : fitV(P.beforeValue), after: num0 ? null : fitV(P.afterValue), traceFit, ok};
}

function numberFits(ctx, SM, P, zoomPx) {
  const floor = 16 / zoomPx;
  const size = Math.min(SM.plate.h * 0.7, 26 / zoomPx);
  const fit = t => fitG(t || ' ', {maxWidth: SM.plate.w * 0.9, size, minSize: floor, maxLines: 1, weight: 700, family: 'mono'});
  const num0 = P.focusTarget === 'sealNumber';
  const a = fit(num0 ? P.beforeValue : P.sealNumber), b = num0 ? fit(P.afterValue) : null;
  return {a, b, ok: size >= floor && a.ok && (!b || b.ok)};
}

function compose(ctx, P, recs, F, opt, LG) {
  const {bench, panel, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset, y: bench.y + inset, w: bench.w - inset * 2, h: bench.h - inset * 2};
  const wideMat = mat.w / mat.h > 1.05;
  const pl = P.detailGeometry.placement;
  const lensFirst = wideMat ? pl === 'left' : pl === 'top';
  const split = opt.split;
  const zoneBag = wideMat
    ? {x: lensFirst ? mat.x + mat.w * (1 - split) : mat.x, y: mat.y, w: mat.w * split, h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y + mat.h * (1 - split) : mat.y, w: mat.w, h: mat.h * split};
  const zoneLens = wideMat
    ? {x: lensFirst ? mat.x : mat.x + mat.w * split, y: mat.y, w: mat.w * (1 - split), h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y : mat.y + mat.h * split, w: mat.w, h: mat.h * (1 - split)};
  const S = Math.min(zoneBag.w * 0.94 / 2.18, zoneBag.h * 0.94 / 2.12);
  const PM = pouchModel(S, {rows: recs.length, chainN: P.custodians.length});
  const SM = PM.strip;
  const bag = {x: zoneBag.x + (zoneBag.w - PM.w) / 2, y: zoneBag.y + (zoneBag.h - PM.h) / 2};
  const M = objectModel(P.items[0].kind, S * 1.04);
  const objIn = {x: bag.x + PM.inner.x + PM.inner.w / 2, y: bag.y + PM.inner.y + PM.inner.h / 2};
  const cx = bag.x + PM.w / 2;
  const stripC = {x: cx, y: bag.y + PM.fh};
  const source = {x: cx - S * 0.56, y: bag.y + S * 0.03, w: S * 1.47, h: S * 0.635};
  const lw = zoneLens.w * 0.98, lh = zoneLens.h * 0.97;
  const zoom = Math.min(lw / source.w, lh / source.h);
  const dest = {w: source.w * zoom, h: source.h * zoom};
  dest.x = zoneLens.x + (zoneLens.w - dest.w) / 2; dest.y = zoneLens.y + (zoneLens.h - dest.h) / 2;
  const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const zoomPx = zoom * vs;
  const x0 = cx - S * 0.5;
  const showText = ctx.show('key');
  const TX = lensTexts(ctx, P, S, zoomPx, source, x0);
  const NF = numberFits(ctx, SM, P, zoomPx);
  const zoomOk = zoom >= P.detailGeometry.zoom - 1e-6 && zoom >= 1.5;
  const lensBig = Math.min(dest.w, dest.h) * vs * Math.min(ctx.view.width, ctx.view.height) / 1080 >= 0.355 * Math.min(ctx.view.width, ctx.view.height);
  const textOk = !showText || (TX.ok && NF.ok);
  const ok = (!PL || PL.ok) && M.w <= PM.inner.w && zoomOk && textOk && lensBig;
  return {F, bench, mat, panel, PL, S, PM, SM, M, bag, objIn, cx, stripC, source, dest, zoom, TX, NF, x0, ok,
    problems: [PL && !PL.ok && 'panel-text', !zoomOk && 'zoom', !textOk && 'lens-text', !lensBig && 'lens-small'].filter(Boolean)};
}

function sceneParts(ctx, L) {
  const {C, P} = L;
  const th = ctx.theme;
  const {S, PM, SM, M, bag, objIn, cx, stripC, TX, NF, x0} = C;
  const num0 = P.focusTarget === 'sealNumber';
  const showText = ctx.show('key');
  const hasB = P.beforeValue.trim().length > 0, hasA = P.afterValue.trim().length > 0;
  const rowY = k => bag.y + PM.fh * k;
  // lens content: the seam at the context's coordinates, lines printed as text
  const face = g({transform: T(cx, bag.y)},
    h('path', {d: flapOutline(PM.w, PM.fh, -1), fill: FLAP, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
  );
  const rowsT = showText ? g(null,
    textAt(TX.by, {x: x0, y: rowY(0.24) - TX.by.size * 0.86, fill: WRITE_INK}),
    textAt(TX.lab, {x: x0, y: rowY(0.5) - TX.lab.size * 0.86, fill: '#4a5560'}),
  ) : g(null,
    h('path', {d: `M${r(x0)} ${r(rowY(0.24))}h${r(S * 0.7)}M${r(x0)} ${r(rowY(0.5))}h${r(S * 0.3)}`, stroke: '#7d8a94', 'stroke-width': 3, 'stroke-linecap': 'round'}),
  );
  const vx = x0 + (showText ? TX.lab.width + 4 : S * 0.36);
  const vy = rowY(0.5);
  const scrib = (w0) => h('path', {d: `M${r(vx)} ${r(vy)}q${r(w0 * 0.12)} ${r(-S * 0.05)} ${r(w0 * 0.25)} 0t${r(w0 * 0.25)} 0t${r(w0 * 0.25)} 0t${r(w0 * 0.25)} 0`, fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.4, 'stroke-linecap': 'round'});
  let lvBefore, lvAfter, lvTrace;
  const plate = SM.plate;
  if (!num0) {
    lvBefore = g({name: 'lv-before'}, hasB ? (showText ? textAt(TX.before, {x: vx, y: vy - TX.before.size * 0.86, fill: WRITE_INK}) : scrib(S * 0.3)) : null);
    lvAfter = g({name: 'lv-after', opacity: 0}, hasA ? (showText ? textAt(TX.after, {x: vx, y: vy - TX.after.size * 0.86, fill: WRITE_INK}) : scrib(S * 0.45)) : null);
  } else {
    const pos = (f) => ({x: stripC.x, y: stripC.y - f.height / 2});
    lvBefore = g({name: 'lv-before'}, showText ? textAt(NF.a, {...pos(NF.a), anchor: 'middle', fill: INK}) : g({transform: T(stripC.x, stripC.y)}, plateBars(SM, P.beforeValue)));
    lvAfter = g({name: 'lv-after', opacity: 0}, showText ? textAt(NF.b, {...pos(NF.b), anchor: 'middle', fill: INK}) : g({transform: T(stripC.x, stripC.y)}, plateBars(SM, P.afterValue)));
  }
  lvTrace = g({name: 'lv-trace', opacity: 0}, showText ? textAt(TX.traceFit, {x: x0, y: rowY(0.5) + S * 0.025, fill: th.fgSoft, italic: true}) : null);
  const lensStrip = g({transform: T(stripC.x, stripC.y)},
    stripArt(ctx, SM, {name: 'ls', numberFit: !num0 && showText ? NF.a : null, blank: num0, barSeed: P.sealNumber, slit: false}),
  );
  const content = g(null,
    h('rect', {x: r(C.source.x - 30), y: r(C.source.y - 30), width: r(C.source.w + 60), height: r(C.source.h + 60), fill: MAT}),
    g({transform: T(bag.x, bag.y)}, pouchBack(ctx, PM, {})),
    g({transform: T(objIn.x, objIn.y)}, objectArt(ctx, M)),
    g({transform: T(bag.x, bag.y)}, pouchFront(ctx, PM, {rows: L.recs, chainN: P.custodians.length, seedKey: 'ep-inspect'})),
    face, rowsT, lensStrip, lvBefore, lvAfter, lvTrace,
    h('rect', {name: 'lv-ring', x: r(x0 - S * 0.04), y: r(num0 ? stripC.y - plate.h / 2 : rowY(0.5) - S * 0.09), width: 4, height: r(num0 ? plate.h : S * 0.1), rx: 2, fill: th.accent2, opacity: 0}),
  );
  const Lz = lens(ctx, {name: 'lens', source: C.source, dest: C.dest, frame: C.bench, content, color: th.accent2});
  return {Lz};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = epRecords(P);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'side', pw: 0.48}, {mode: 'below', cols: 2}, {mode: 'below', cols: 1}]
        : [{mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.32}, {mode: 'side', pw: 0.36}];
    const rowsL = legendRows(ctx, P, recs);
    let C = null, best = null, bestScore = -1, firstOk = -1;
    const lgCache = new Map();
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const o0 of opts) for (const split of [0.5, 0.44, 0.38, 0.32]) {
        const key = `${F}|${JSON.stringify(o0)}`;
        if (!lgCache.has(key)) lgCache.set(key, legendFor(ctx, rowsL, F, o0));
        const LG = lgCache.get(key);
        if (LG.PL && !LG.PL.ok && C) continue;
        const c = compose(ctx, P, recs, F, {...o0, split}, LG);
        const score = c.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * Math.min(1.3, c.zoom / 2);
        if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
        if (c.ok && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    if (best) C = best;
    // at rest (context / return) the pouch is centred and enlarged; it steps aside only while the lens is open, so
    // the lens source keeps its exact coordinates
    const M0 = C.mat, PM = C.PM;
    const ext = {x: C.bag.x - C.S * 0.13, y: C.bag.y, w: PM.w + C.S * 0.26, h: PM.h};
    const rs = clamp(Math.min(M0.h * 0.94 / ext.h, M0.w * 0.8 / ext.w), 1, 2.4);
    const rest = {s: rs, dx: M0.x + M0.w / 2 - rs * (ext.x + ext.w / 2), dy: M0.y + M0.h / 2 - rs * (ext.y + ext.h / 2)};
    const L = {P, recs, C, rest};
    L.lensF = sceneParts(ctx, L).Lz.frame;
    return L;
  },
  build(ctx, L) {
    const {C, P} = L;
    const {Lz} = sceneParts(ctx, L);
    const {S, PM, SM, M, bag, objIn, cx, stripC} = C;
    const num0 = P.focusTarget === 'sealNumber';
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, epPanelNode(ctx, PLc))) : [];
    const mk = markerAt({SM, S}, stripC, 0);
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        g({name: 'ctxMove'},
          g({transform: T(bag.x, bag.y)}, pouchBack(ctx, PM, {})),
          g({transform: T(objIn.x, objIn.y)}, g({opacity: 0.2}, h('ellipse', {cx: 6, cy: 10, rx: r(M.w * 0.5), ry: r(M.h * 0.5), fill: '#000'})), objectArt(ctx, M)),
          g({transform: T(bag.x, bag.y)}, pouchFront(ctx, PM, {rows: L.recs, chainN: P.custodians.length, seedKey: 'ep-inspect'})),
          g({transform: `${T(cx, bag.y)} scale(1 -1)`}, flapNode(ctx, PM, {name: 'cf', seedKey: 'ep-inspect'})),
          g({transform: T(stripC.x, stripC.y)},
            stripArt(ctx, SM, {name: 'cs', numberFit: null, blank: num0, barSeed: P.sealNumber, slit: false}),
            num0 ? plateBars(SM, P.beforeValue, {name: 'ctx-pb'}) : null,
            num0 ? plateBars(SM, P.afterValue, {name: 'ctx-pa', opacity: 0}) : null,
          ),
          changedMarker(ctx, {name: 'marker', x: mk.x, y: mk.y, radius: Math.max(16, S * 0.11), opacity: 0}),
        ),
      ),
      bench.frame,
      Lz.node,
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const num0 = P.focusTarget === 'sealNumber';
    const hasB = P.beforeValue.trim().length > 0, hasA = P.afterValue.trim().length > 0;
    const nodes = {};
    const pOpen = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    Object.assign(nodes, L.lensF(pOpen, pOpen));
    const kOld = seg(u, ...W.fadeOld), kTrace = seg(u, ...W.trace), kNew = seg(u, ...W.writeNew);
    const ctxBefore = u < W.open[0] ? 1 : 0;
    const ctxAfter = u >= W.close[1] ? 1 : 0;
    // context copies of the datum (the flap's state line, the strip's slit, or the plate pattern)
    nodes['cf-in'] = {opacity: 0};
    nodes['cf-out'] = {opacity: 1};
    if (!num0) {
      nodes['cf-st0'] = {opacity: hasB ? ctxBefore : 0};
      nodes['cf-st1'] = {opacity: hasA ? ctxAfter : 0};
      nodes['cs-slit'] = {opacity: ctxAfter};
      nodes['ls-slit'] = {opacity: r(kNew, 3)};
    } else {
      nodes['cf-st0'] = {opacity: 1};
      nodes['cf-st1'] = {opacity: 0};
      nodes['cs-slit'] = {opacity: 0};
      nodes['ls-slit'] = {opacity: 0};
      nodes['ctx-pb'] = {opacity: ctxBefore};
      nodes['ctx-pa'] = {opacity: ctxAfter};
    }
    const lift = num0 ? C.SM.plate.h * 0.4 : C.S * 0.05;
    nodes['lv-before'] = {opacity: r(1 - kOld, 3), transform: T(0, -kOld * lift)};
    nodes['lv-trace'] = {opacity: r(kTrace * 0.95, 3)};
    nodes['lv-after'] = {opacity: r(kNew, 3)};
    nodes['lv-ring'] = {opacity: r(seg(u, ...W.ring), 3)};
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3)};
    const kRest = 1 - ease.inOutCubic(seg(u, ...W.aside)) * (1 - ease.inOutCubic(seg(u, ...W.back)));
    const RS = L.rest;
    const sc = lerp(1, RS.s, kRest);
    nodes.ctxMove = {transform: T(RS.dx * kRest, RS.dy * kRest, 0, sc)};
    const seam = {x: C.stripC.x * sc + RS.dx * kRest, y: C.stripC.y * sc + RS.dy * kRest};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-after') nodes[row.name] = {opacity: r(kNew, 3)};
      if (row.name === 'lg-marker') nodes[row.name] = {opacity: r(seg(u, ...W.legend), 3)};
    }
    const shown = u < W.fadeOld[0] + (W.fadeOld[1] - W.fadeOld[0]) / 2 ? 'before' : 'after';
    const phase = u < W.open[0] ? 'context' : u < W.open[1] ? 'open' : u < W.fadeOld[0] ? 'isolate' : u < W.writeNew[1] ? 'substitute' : u < W.close[0] ? 'hold-new' : u < W.close[1] ? 'close' : 'return';
    return {
      nodes,
      semantic: {
        phase, shown, lensP: r(pOpen, 3), zoom: r(C.zoom, 3), focus: P.focusTarget,
        value: shown === 'before' ? P.beforeValue : P.afterValue, ctxBefore, ctxAfter, lensBefore: r(1 - kOld, 3), lensAfter: r(kNew, 3),
        slitLens: num0 ? 0 : r(kNew, 3), slitCtx: num0 ? 0 : ctxAfter,
        marker: r(mk, 3), seam: R2(seam), restK: r(kRest, 3),
        source: {x: r(C.source.x), y: r(C.source.y), w: r(C.source.w), h: r(C.source.h)},
        dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)}, bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
        problems: C.problems, textPx: r(C.F, 1), S: r(C.S, 1),
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
    slug: 'evidence-custody-02-inspect',
    title: 'Evidence packing — a lens enlarges the seam of a sealed pouch and one datum (seal state or seal number) is substituted, then the scene returns with a changed-datum marker',
    titleEs: 'Embalaje de prueba — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Embalaje de prueba',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: a sealed evidence pouch on the bench — the object inside, the flap folded, a numbered seal strip pressed across the flap edge. A lens opens beside it with a real magnified copy of the seam (same coordinates): the flap\'s sealed-by and seal-state lines printed, the strip with its number. One datum is substituted (seal state, with its dependent geometry — a supplied slit drawn across the strip — or the seal number); a "before" trace stays. The lens closes, the context shows the after state and a neutral Δ marker. Nothing is inferred about tampering, validity, admissibility or custody; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'packing', 'seal', 'tamper-evident', 'inspect', 'lens', 'changed datum', 'pouch', 'seal number'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/embalaje-prueba.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
