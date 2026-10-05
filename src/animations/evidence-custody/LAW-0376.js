/**
 * LAW-0376 — Registro fotográfico · inspect
 *
 * Storyboard (context: the state produced by the photographing action — on the evidence bench the object with its tag
 * on a ball chain, the open bag and the laid photo scale; the camera rests on its stand arm at its last station; the
 * photo board holds one print per supplied view, each with a written caption tab, and a thread joins every print to
 * the same pin on the object; a legend lists the item, context caption, views, tag rows, the before / now values,
 * custodians, times, the marker label and the key):
 *  0.00–0.20  context: the whole bench centred and enlarged; the focus print shows its before datum (the caption
 *             written on its tab, or its photo number). The bench steps aside (0.10–0.19) to make room for the lens.
 *  0.20–0.45  a lens opens beside the board: a real magnified copy (same coordinates) of the focus print — its image
 *             of the framed field, its number badge and its caption tab printed as text. The context copy of the datum
 *             goes blank in step with the lens appearing.
 *  0.45–0.75  one datum is substituted: the before value lifts and fades, a small "before: …" trace stays, then the
 *             after value is written in. The new value holds.
 *  0.75–1.00  the lens closes back onto the print; the context shows the after datum and the neutral changed-datum
 *             marker (Δ) beside the print. Nothing is inferred about what the photograph shows or proves. Seeking back
 *             restores the before value exactly.
 * @module animations/evidence-custody/LAW-0376
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
import {ecFields, localised, benchNode, panelLayout, fitG, textAt, INK, WRITE_INK} from './kits/evidence-art.js';
import {
  RF_EN, RF_ES, rfFields, rfRecords, rfRecordLine, rfStage, subjectArt, cameraArt, standNodes, standProps, printArt,
  boardArt, threadD, pinNode, rfPanelNode, PRINT_AR, THREAD_COLOR,
} from './kits/registro-fotografico.js';

const ID = 'LAW-0376';
const DURATION = 8000;
const W = {aside: [0.1, 0.19], open: [0.2, 0.32], ring: [0.34, 0.4], fadeOld: [0.45, 0.51], trace: [0.5, 0.56], writeNew: [0.54, 0.62], close: [0.75, 0.85], back: [0.85, 0.93], marker: [0.86, 0.92], legend: [0.85, 0.9]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

const STRINGS = {
  en: {before: 'before', after: 'now', blankShort: 'blank'},
  es: {before: 'antes', after: 'ahora', blankShort: 'en blanco'},
};

const OWN_EN = {
  focusTarget: 'caption',
  beforeValue: 'Detail · with scale',
  afterValue: 'Detail · second angle',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'The photo board: every print joined to the same object', marker: 'Only this datum was changed', captionField: 'Caption on the print', numberField: 'Photo number'},
};
const OWN_ES = {
  focusTarget: 'caption',
  beforeValue: 'Detalle · con escala',
  afterValue: 'Detalle · segundo ángulo',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'El tablero de fotos: cada copia unida al mismo objeto', marker: 'Solo este dato ha cambiado', captionField: 'Pie escrito en la copia', numberField: 'Número de foto'},
};
const EN = {...RF_EN, ...OWN_EN};
const ES = {...RF_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...rfFields,
  focusTarget: oneOf('Datum on the focus print (the second view) that is enlarged and substituted: caption — the caption written on its tab; number — the photo number on its badge', ['caption', 'number']),
  beforeValue: str('Value of that datum before the substitution (empty = left blank)', 28),
  afterValue: str('Value of that datum after the substitution (the alternative datum; empty = blank)', 28),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Minimum magnification of the lens (the lens grows further when room allows)', 1.5, 4),
    placement: oneOf('Side of the board where the lens opens (auto = the larger free side)', ['auto', 'left', 'right', 'top', 'bottom']),
  }, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
    captionField: str('Name of the caption datum', 30),
    numberField: str('Name of the photo-number datum', 30),
  }, ['context', 'marker', 'captionField', 'numberField']),
};

const defaultParams = {...EN};
const focusIndex = P => Math.min(1, P.views.length - 1);

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  const num0 = P.focusTarget === 'number';
  const bv = P.beforeValue.trim() ? P.beforeValue : P.labels.blank;
  const av = P.afterValue.trim() ? P.afterValue : P.labels.blank;
  const fname = num0 ? P.contextLabels.numberField : P.contextLabels.captionField;
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showAll) rows.push({kind: 'item', icon: 'rf-thread', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) P.views.forEach((v, i) => rows.push({kind: 'item', icon: 'rf-print', text: v.label, name: `lg-view${i}`}));
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: rfRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showKey) {
    rows.push({kind: 'item', icon: 'rf-print', text: `${fname}: ${ctx.t.before} ${bv}`, name: 'lg-before'});
    rows.push({kind: 'item', icon: 'rf-print', text: `${fname}: ${ctx.t.after} ${av}`, name: 'lg-after'});
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
  if (!rows.length) return {bench: {x: 0, y: 0, w: DW, h: DH}, panel: null, PL: null};
  if (opt.mode === 'below') {
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
    return {bench: {x: 0, y: 0, w: DW, h: DH - ph - gap}, panel: {x: 4, y: DH - ph}, PL: {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW}};
  }
  const PW = DW * opt.pw;
  const one = panelLayout(ctx, rows, {w: PW, F});
  return {bench: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)}, PL: {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW}};
}

function compose(ctx, P, recs, F, opt, LG, vs) {
  const {bench, panel, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.5, y: bench.y + inset * 1.5, w: bench.w - inset * 3, h: bench.h - inset * 3};
  const wide = mat.w / mat.h > 1.05;
  const pl = P.detailGeometry.placement;
  const lensFirst = wide ? pl === 'left' : pl === 'top';
  const split = opt.split;
  const zoneCtx = wide
    ? {x: lensFirst ? mat.x + mat.w * (1 - split) : mat.x, y: mat.y, w: mat.w * split, h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y + mat.h * (1 - split) : mat.y, w: mat.w, h: mat.h * split};
  const zoneLens = wide
    ? {x: lensFirst ? mat.x : mat.x + mat.w * split, y: mat.y, w: mat.w * (1 - split), h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y : mat.y + mat.h * split, w: mat.w, h: mat.h * (1 - split)};
  const G = rfStage(zoneCtx, {kind: P.items[0].kind, targets: P.views.map(v => v.target), slots: P.views.length, rows: recs.length, tray: opt.tray, trayFrac: opt.trayFrac, approach: opt.approach || 'down', slotGap: 0.16});
  const fi = focusIndex(P);
  const slot = G.tray.slots[fi];
  const pw = G.tray.pw, ph = pw / PRINT_AR;
  const tabH = ph * 0.34;
  const card = {x: slot.x, y: slot.y, w: pw, h: ph + tabH};
  const pad = pw * 0.06;
  const source = {x: card.x - pad, y: card.y - pad * 2.2, w: card.w + pad * 2, h: card.h + pad * 3};
  const lw = zoneLens.w * 0.97, lh = zoneLens.h * 0.96;
  const zoom = Math.min(lw / source.w, lh / source.h);
  const dest = {w: source.w * zoom, h: source.h * zoom};
  dest.x = zoneLens.x + (zoneLens.w - dest.w) / 2; dest.y = zoneLens.y + (zoneLens.h - dest.h) / 2;
  const zoomPx = zoom * vs;
  // lens texts (source units): value line + trace line on the tab; badge number
  const floor = 16 / zoomPx;
  const size = Math.max(floor, Math.min(24 / zoomPx, tabH * 0.36));
  const maxW = pw * 0.92;
  let tOk = size >= floor - 1e-9;
  const fit = (text, weight, sz) => { const f = fitG(text || ' ', {maxWidth: maxW, size: sz, minSize: Math.max(floor, sz * 0.8), maxLines: 1, weight}); if (!f.ok) tOk = false; return f; };
  const num0 = P.focusTarget === 'number';
  const bFit = num0 ? null : fit(P.beforeValue, 600, size);
  const aFit = num0 ? null : fit(P.afterValue, 600, size);
  const tsz = Math.max(floor, size * 0.85);
  const trace = fit(`${ctx.t.before}: ${P.beforeValue.trim() ? P.beforeValue : ctx.t.blankShort}`, 500, tsz);
  if (!num0 && size * 1.15 + tsz * 1.1 > tabH * 0.98) tOk = false;
  const badgeR = Math.max(7, Math.min(pw, ph) * 0.1);
  const nsz = badgeR * 1.2;
  const nOk = !num0 || (nsz >= floor && [P.beforeValue, P.afterValue].every(v => fitG(v || ' ', {maxWidth: badgeR * 1.7, size: nsz * 0.8, minSize: Math.max(floor, nsz * 0.45), maxLines: 1, weight: 800}).ok));
  const nFits = num0 ? [P.beforeValue, P.afterValue].map(v => fitG(v || ' ', {maxWidth: badgeR * 1.7, size: nsz * 0.8, minSize: Math.max(floor, nsz * 0.45), maxLines: 1, weight: 800})) : null;
  const showText = ctx.show('key');
  const textOk = !showText || (tOk && nOk);
  const zoomOk = zoom >= P.detailGeometry.zoom - 1e-6 && zoom >= 1.5;
  const k = Math.min(ctx.view.width, ctx.view.height);
  const lensBig = Math.min(dest.w, dest.h) * vs * k / 1080 >= 0.355 * k;
  const ex0 = Math.min(G.stageBox.x, G.tray.x), ey0 = Math.min(G.stageBox.y, G.tray.y);
  const ew = Math.max(G.stageBox.x + G.stageBox.w, G.tray.x + G.tray.w) - ex0, eh = Math.max(G.stageBox.y + G.stageBox.h, G.tray.y + G.tray.h) - ey0;
  const rsc = clamp(Math.min(mat.h * 0.96 / eh, mat.w * 0.96 / ew), 1, 2.2);
  const restS = G.S * rsc;
  const stageOk = G.S >= 58 || restS >= 95;
  const ok = (!PL || PL.ok) && G.fits && zoomOk && textOk && lensBig && stageOk;
  const minT = Math.min(size, tsz, nsz, num0 ? Math.min(...nFits.map(f => f.size)) : size);
  return {F, rsc, bench, mat, panel, PL, G, fi, slot, pw, ph, tabH, card, source, dest, zoom, size, bFit, aFit, trace, tsz, badgeR, nFits, ok, kText: 16.3 / (minT * vs),
    problems: [PL && !PL.ok && 'panel-text', !zoomOk && 'zoom', !textOk && 'lens-text', !lensBig && 'lens-small', !stageOk && 'stage-small'].filter(Boolean)};
}

/** Tab (caption strip) under a print, local origin = the print card's top-left. */
function tabArt(L, o) {
  const {pw, ph, tabH} = L.C;
  return g({name: o.name},
    h('path', {d: roundRectPath(0, ph - 4, pw, tabH + 4, 4), fill: '#fbfaf6', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(pw * 0.04)} ${r(ph + tabH * 0.78)}H${r(pw * 0.96)}`, stroke: '#c9c2b0', 'stroke-width': 1.4}),
  );
}
function scribbleLine(x0, y, w, amp, key) {
  const n = Math.max(3, Math.round(w / (amp * 1.6)));
  let d = `M${r(x0)} ${r(y)}`;
  for (let i = 1; i <= n; i++) d += `Q${r(x0 + (w / n) * (i - 0.5))} ${r(y - amp * (((i + key) % 3) - 1 + 0.4))} ${r(x0 + (w / n) * i)} ${r(y)}`;
  return d;
}

function sceneParts(ctx, L) {
  const {C, P} = L;
  const th = ctx.theme;
  const G = C.G;
  const num0 = P.focusTarget === 'number';
  const showText = ctx.show('key');
  const hasB = P.beforeValue.trim().length > 0, hasA = P.afterValue.trim().length > 0;
  const {slot, pw, ph, tabH, size} = C;
  const F0 = G.fields[P.views[C.fi].target];
  const x0 = slot.x + pw * 0.05;
  const vy = slot.y + ph + tabH * 0.06;
  const bx = slot.x + pw - C.badgeR - Math.max(5, pw * 0.055) * 0.4, by = slot.y + C.badgeR + Math.max(5, pw * 0.055) * 0.4;
  const valB = num0 ? null : (showText ? textAt(C.bFit, {x: x0, y: vy, fill: WRITE_INK}) : h('path', {d: scribbleLine(x0, vy + tabH * 0.3, pw * 0.5, tabH * 0.12, 1), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.4}));
  const valA = num0 ? null : (showText ? textAt(C.aFit, {x: x0, y: vy, fill: WRITE_INK}) : h('path', {d: scribbleLine(x0, vy + tabH * 0.3, pw * 0.75, tabH * 0.12, 2), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.4}));
  const numNode = (f, name, op) => g({name, opacity: op},
    h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR), fill: '#4f6d8a', stroke: INK, 'stroke-width': 2}),
    showText ? textAt(f, {x: bx, y: by - f.height / 2, anchor: 'middle', fill: '#fff'}) : h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR * (op ? 0.25 : 0.45)), fill: '#fff'}));
  const lvBefore = num0 ? numNode(C.nFits[0], 'lv-before', 1) : g({name: 'lv-before'}, hasB ? valB : null);
  const lvAfter = num0 ? numNode(C.nFits[1], 'lv-after', 0) : g({name: 'lv-after', opacity: 0}, hasA ? valA : null);
  const lvTrace = g({name: 'lv-trace', opacity: 0}, showText ? textAt(C.trace, {x: x0, y: num0 ? vy : vy + size * 1.15, fill: th.fgSoft, italic: true}) : null);
  const content = g(null,
    h('rect', {x: r(C.source.x - 40), y: r(C.source.y - 40), width: r(C.source.w + 80), height: r(C.source.h + 80), fill: '#e8e4da'}),
    g({transform: T(slot.x, slot.y)}, tabArt(L, {})),
    g({transform: T(slot.x + pw / 2, slot.y + ph / 2)}, printArt(ctx, G, F0, {name: 'lzp', pw, ph, index: C.fi, rows: L.recs, ruler: true, numberText: showText && !num0 ? String(C.fi + 1) : null, badgeR: C.badgeR})),
    g({name: 'lv-text'}, lvBefore, lvAfter, lvTrace),
    h('rect', {name: 'lv-ring', x: r(num0 ? bx - C.badgeR - pw * 0.04 : slot.x + pw * 0.012), y: r(num0 ? by - C.badgeR : vy), width: r(pw * 0.022, 2), height: r(num0 ? C.badgeR * 2 : size * 1.2), rx: 2, fill: th.accent2, opacity: 0}),
  );
  const Lz = lens(ctx, {name: 'lens', source: C.source, dest: C.dest, frame: C.bench, content, color: th.accent2});
  return {Lz, bx, by, x0, vy};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = rfRecords(P);
    const shape = ctx.view.shape;
    const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'side', pw: 0.48}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.34}];
    const rowsL = legendRows(ctx, P, recs);
    let C = null, best = null, bestScore = -1, firstOk = -1;
    const lg = new Map();
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const o0 of opts) for (const split of [0.62, 0.55, 0.48, 0.42, 0.36]) for (const tr of [{tray: 'right', trayFrac: 0.34}, {tray: 'top', trayFrac: 0.3}, {tray: 'right', trayFrac: 0.26, approach: 'left'}]) {
        const key = `${F}|${JSON.stringify(o0)}`;
        if (!lg.has(key)) lg.set(key, legendFor(ctx, rowsL, F, o0));
        const LG = lg.get(key);
        if (LG.PL && !LG.PL.ok && C) continue;
        const c = compose(ctx, P, recs, F, {...o0, split, ...tr}, LG, vs);
        const score = c.G.S * Math.sqrt(c.rsc) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * Math.min(1.3, c.zoom / 2);
        if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
        if (c.ok && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    if (best) C = best;
    // at rest the stage (cluster + board) is centred and enlarged in the whole mat; it steps aside while the lens is open
    const M0 = C.mat, G = C.G;
    const ext = {x: Math.min(G.stageBox.x, G.tray.x), y: Math.min(G.stageBox.y, G.tray.y), w: 0, h: 0};
    ext.w = Math.max(G.stageBox.x + G.stageBox.w, G.tray.x + G.tray.w) - ext.x;
    ext.h = Math.max(G.stageBox.y + G.stageBox.h, G.tray.y + G.tray.h) - ext.y;
    const rs = clamp(Math.min(M0.h * 0.96 / ext.h, M0.w * 0.96 / ext.w), 1, 2.2);
    const rest = {s: rs, dx: M0.x + M0.w / 2 - rs * (ext.x + ext.w / 2), dy: M0.y + M0.h / 2 - rs * (ext.y + ext.h / 2)};
    const cam = G.stations[P.views[P.views.length - 1].target];
    const sag = G.S * 0.25;
    const threads = G.tray.slots.map(s => threadD({x: s.x + s.w / 2, y: s.y}, G.pin, sag));
    const L = {P, recs, C, rest, cam, threads};
    L.lensF = sceneParts(ctx, L).Lz.frame;
    return L;
  },
  build(ctx, L) {
    const {C, P} = L;
    const G = C.G;
    const {Lz, bx, by, x0, vy} = sceneParts(ctx, L);
    const num0 = P.focusTarget === 'number';
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, rfPanelNode(ctx, PLc))) : [];
    const pw = C.pw, ph = C.ph;
    const prints = P.views.map((v, i) => {
      const s = G.tray.slots[i];
      return g(null,
        g({transform: T(s.x, s.y)}, tabArt(L, {})),
        i === C.fi ? null : h('path', {d: scribbleLine(s.x + pw * 0.05, s.y + ph + C.tabH * 0.36, pw * (0.4 + 0.12 * i), C.tabH * 0.12, i), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.2}),
        g({transform: T(s.x + pw / 2, s.y + ph / 2)}, printArt(ctx, G, G.fields[v.target], {name: `cp${i}`, pw, ph, index: i, rows: L.recs, ruler: true, numberText: ctx.show('key') && pw >= 170 && !(num0 && i === C.fi) ? String(i + 1) : null})),
      );
    });
    const tabB = g({name: 'cf-before'}, num0 ? g(null, h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR), fill: '#4f6d8a', stroke: INK, 'stroke-width': 2}), h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR * 0.45), fill: '#fff'}))
      : P.beforeValue.trim() ? h('path', {d: scribbleLine(x0, vy + C.tabH * 0.3, pw * 0.5, C.tabH * 0.12, 1), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.2}) : null);
    const tabA = g({name: 'cf-after', opacity: 0}, num0 ? g(null, h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR), fill: '#4f6d8a', stroke: INK, 'stroke-width': 2}), h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR * 0.25), fill: '#fff'}))
      : P.afterValue.trim() ? h('path', {d: scribbleLine(x0, vy + C.tabH * 0.3, pw * 0.75, C.tabH * 0.12, 2), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.2}) : null);
    const blankBadge = num0 ? h('circle', {cx: r(bx), cy: r(by), r: r(C.badgeR), fill: '#4f6d8a', stroke: INK, 'stroke-width': 2}) : null;
    const s0 = G.tray.slots[C.fi];
    const mk = {x: s0.x - Math.max(18, G.S * 0.13), y: s0.y + ph + C.tabH * 0.5};
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        g({name: 'ctxMove'},
          boardArt(ctx, G, {}),
          subjectArt(ctx, G, {prefix: 'sc', rows: L.recs, ruler: true}),
          standNodes(ctx, G, 'stand'),
          g({transform: T(L.cam.x, L.cam.y, L.cam.a)}, cameraArt(ctx, G.CM, {name: 'camArt'})),
          prints,
          blankBadge,
          tabB, tabA,
          L.threads.map(d => h('path', {d, fill: 'none', stroke: THREAD_COLOR, 'stroke-width': Math.max(3, G.S * 0.025), 'stroke-linecap': 'round'})),
          g({opacity: 1}, pinNode(ctx, G, 'objpin')),
          changedMarker(ctx, {name: 'marker', x: mk.x, y: mk.y, radius: Math.max(16, G.S * 0.12), opacity: 0}),
        ),
      ),
      bench.frame,
      Lz.node,
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, P} = L;
    const num0 = P.focusTarget === 'number';
    const hasB = P.beforeValue.trim().length > 0, hasA = P.afterValue.trim().length > 0;
    const nodes = {};
    const pOpen = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    Object.assign(nodes, L.lensF(pOpen, pOpen));
    Object.assign(nodes, standProps('stand', C.G, L.cam));
    nodes.objpin = {opacity: 1};
    const kOld = seg(u, ...W.fadeOld), kTrace = seg(u, ...W.trace), kNew = seg(u, ...W.writeNew);
    const ctxBefore = u < W.open[0] ? 1 : 0;
    const ctxAfter = u >= W.close[1] ? 1 : 0;
    nodes['cf-before'] = {opacity: (hasB || num0) ? ctxBefore : 0};
    nodes['cf-after'] = {opacity: (hasA || num0) ? ctxAfter : 0};
    const textOn = lerp(1, C.zoom, pOpen) >= C.kText ? 1 : 0;
    nodes['lv-text'] = {opacity: textOn};
    const lift = C.size * 0.6;
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
    const cardC = {x: C.card.x + C.card.w / 2, y: C.card.y + C.card.h / 2};
    const focus = {x: cardC.x * sc + RS.dx * kRest, y: cardC.y * sc + RS.dy * kRest};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-after') nodes[row.name] = {opacity: r(kNew, 3)};
      if (row.name === 'lg-marker') nodes[row.name] = {opacity: r(seg(u, ...W.legend), 3)};
    }
    const shown = u < W.fadeOld[0] + (W.fadeOld[1] - W.fadeOld[0]) / 2 ? 'before' : 'after';
    const phase = u < W.open[0] ? 'context' : u < W.open[1] ? 'open' : u < W.fadeOld[0] ? 'isolate' : u < W.writeNew[1] ? 'substitute' : u < W.close[0] ? 'hold-new' : u < W.close[1] ? 'close' : 'return';
    const R = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    return {
      nodes,
      semantic: {
        phase, shown, lensP: r(pOpen, 3), zoom: r(C.zoom, 3), focus: P.focusTarget,
        value: shown === 'before' ? P.beforeValue : P.afterValue, ctxBefore, ctxAfter, lensBefore: r(1 - kOld, 3), lensAfter: r(kNew, 3),
        marker: r(mk, 3), focusPrint: {x: r(focus.x), y: r(focus.y)}, restK: r(kRest, 3),
        source: R(C.source), dest: R(C.dest), bench: R(C.bench),
        problems: C.problems, textPx: r(C.F, 1), S: r(C.G.S, 1),
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
    slug: 'evidence-custody-04-inspect',
    title: 'Photographic record — a lens enlarges one print on the photo board and one datum (its written caption or its photo number) is substituted, then the board returns with a changed-datum marker',
    titleEs: 'Registro fotográfico — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Registro fotográfico',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the evidence bench after the photographs — the object with its tag, the open bag and the laid scale; the camera on its stand arm; a photo board with one captioned print per view, each joined by a thread to the same pin on the object. A lens opens beside the board with a real magnified copy (same coordinates) of the second print: its image of the framed field, its number badge and its caption tab printed as text. One datum (the caption or the photo number) is substituted; a "before" trace stays. The lens closes and a neutral Δ marker sits beside the print. Nothing is inferred about what the photograph shows or proves; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'photography', 'inspect', 'lens', 'changed datum', 'print', 'caption', 'photo number', 'photo board'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/registro-fotografico.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
