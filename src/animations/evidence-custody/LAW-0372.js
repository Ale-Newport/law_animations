/**
 * LAW-0372 — Transferencia de custodia · inspect
 *
 * Storyboard (context: the state produced by the hand-off — the top-down hand-off room with custodian A and custodian B
 * at opposite ends, the sealed bag (object, tag, chain) now on B's desk, sheet A written and sheet B written as supplied
 * (ink scribbles); a legend lists item, context caption, the rows of both sheets, the focus row's before / now values,
 * custodians, times, the marker label and the key):
 *  0.00–0.20  context: the room centred and enlarged; 0.10–0.19 it steps aside to make room for the lens.
 *  0.20–0.45  a lens opens beside the room: a real magnified copy (same coordinates) of the focus sheet (by default sheet
 *             B) with its rows printed as text — the record that tells "transferencia registrada" from "hueco
 *             documental". The context copy of the focus row is blanked in step with the lens appearing; a thin ring
 *             marks the focus row.
 *  0.45–0.75  one datum is substituted: the before value lifts and fades, a small "before: …" trace stays, then the
 *             after value is written in (an empty after value leaves the row blank, labelled as supplied). Only that
 *             row's ink changes. The new value holds.
 *  0.75–1.00  the lens closes back onto the sheet; the room returns to its centred size; the context row shows the after
 *             state (new ink or a blank line) and the neutral changed-datum marker (Δ) sits beside it. Nothing is
 *             inferred about validity, responsibility or outcome. Seeking back restores the before value exactly.
 * @module animations/evidence-custody/LAW-0372
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
import {localised, fitG, textAt, scribble, WRITE_INK} from './kits/evidence-art.js';
import {
  TC_EN, TC_ES, tcFields, tcLogs, tcRecordLine, tcStage, tcPose, tcArms, bagUnit, tcSceneNodes, tcFrameNodes, tcWriteProps,
  tcPanelLayout, tcPanelNode, sheetArt, sheetRowPoints,
} from './kits/transferencia-custodia.js';

const ID = 'LAW-0372';
const DURATION = 8000;
const W = {aside: [0.1, 0.19], open: [0.2, 0.32], ring: [0.34, 0.4], fadeOld: [0.45, 0.51], trace: [0.5, 0.56], writeNew: [0.54, 0.62], close: [0.75, 0.84], back: [0.85, 0.93], marker: [0.86, 0.92], legend: [0.54, 0.6]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const TARGETS = ['b1', 'b2', 'b3', 'a1', 'a2', 'a3'];
/** Story pose windows used only to place everything at the end of the hand-off (u = 1). */
const WS = {aReach: [0.15, 0.2], aCarry: [0.2, 0.3], bReach: [0.25, 0.3], aBack: [0.35, 0.41], bCarry: [0.35, 0.45], bBack: [0.45, 0.51], aWrite: [0.43, 0.58], bWrite: [0.57, 0.72]};

const STRINGS = {en: {before: 'before', after: 'now'}, es: {before: 'antes', after: 'ahora'}};

const OWN_EN = {
  focusTarget: 'b1',
  beforeValue: 'L. Moreau',
  afterValue: '',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'The bag is with B; each custodian keeps an own sheet', marker: 'Only this datum was changed'},
};
const OWN_ES = {
  focusTarget: 'b1',
  beforeValue: 'L. Moreau',
  afterValue: '',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'La bolsa queda con B; cada custodio lleva su propia hoja', marker: 'Solo ha cambiado este dato'},
};
const EN = {...TC_EN, ...OWN_EN};
const ES = {...TC_ES, ...OWN_ES};

const sceneSchema = {
  ...tcFields,
  focusTarget: oneOf('Row that is enlarged and substituted: b1..b3 = row 1..3 of sheet B, a1..a3 = row 1..3 of sheet A (counted among that sheet\'s rows; the first row of that sheet when the row does not exist)', TARGETS),
  beforeValue: str('Value of that row before the substitution (replaces the row\'s supplied value; empty = left blank)', 50),
  afterValue: str('Value of that row after the substitution (the alternative datum; empty = left blank, e.g. a documentary gap as supplied)', 50),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Minimum magnification of the lens (the lens grows further when room allows)', 1.5, 4),
    placement: oneOf('Side of the room where the lens opens (auto = the larger free side)', ['auto', 'left', 'right', 'top', 'bottom']),
  }, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
  }, ['context', 'marker']),
};

const defaultParams = {...EN};

/** Focus sheet, row index and the rows as drawn before the substitution. */
function focusOf(P) {
  const rows = tcLogs(P);
  const key = P.focusTarget[0] === 'a' ? 'a' : 'b';
  const want = Number(P.focusTarget[1]) - 1;
  const n = rows[key].length;
  const idx = n ? (want < n ? want : 0) : -1;
  const bv = String(P.beforeValue ?? ''), av = String(P.afterValue ?? '');
  if (idx >= 0) rows[key][idx] = {...rows[key][idx], value: bv, filled: bv.trim().length > 0, len: clamp(0.35 + bv.trim().length / 26, 0.35, 1)};
  return {rows, key, idx, bv, av, hasB: bv.trim().length > 0, hasA: av.trim().length > 0};
}

function legendRows(ctx, P, Fo) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const out = [];
  const {rows, key, idx} = Fo;
  const field = idx >= 0 ? rows[key][idx].field : '';
  const bv = Fo.hasB ? Fo.bv : P.labels.blank, av = Fo.hasA ? Fo.av : P.labels.blank;
  if (showKey) out.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showAll) out.push({kind: 'item', icon: 'counter', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) for (const k of ['a', 'b']) {
    const others = rows[k].filter((rw, i) => !(k === key && i === idx));
    if (others.length) out.push({kind: 'item', icon: `log-${k}`, text: `${k === 'a' ? P.labels.logA : P.labels.logB} · ${others.map(rw => tcRecordLine(rw, P.labels.blank)).join(' · ')}`, name: `lg-rec-${k}`});
  }
  const sheet = key === 'a' ? P.labels.logA : P.labels.logB;
  if (showKey && idx >= 0) {
    out.push({kind: 'item', icon: `log-${key}`, text: `${sheet} · ${field}: ${ctx.t.before} ${bv}`, name: 'lg-before'});
    out.push({kind: 'item', icon: Fo.hasA ? `log-${key}` : 'blank-row', text: `${sheet} · ${field}: ${ctx.t.after} ${av}`, name: 'lg-after'});
  }
  if (showAll) P.custodians.forEach((c, i) => out.push({kind: 'item', icon: i === 0 ? 'cus-a' : 'cus-b', text: `${i === 0 ? 'A' : 'B'} · ${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => out.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) out.push({kind: 'state', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) out.push({kind: 'key', text: P.labels.key, name: 'key'});
  return out;
}

function legendFor(ctx, lrows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  if (!lrows.length) return {area: {x: 0, y: 0, w: DW, h: DH}, PL: null, panel: null};
  if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [tcPanelLayout(ctx, lrows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < lrows.length; i++) {
        const a = tcPanelLayout(ctx, lrows.slice(0, i), {w: colW, F}), b = tcPanelLayout(ctx, lrows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    return {area: {x: 0, y: 0, w: DW, h: DH - ph - gap}, PL: {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW}, panel: {x: 4, y: DH - ph}};
  }
  const PW = DW * opt.pw;
  const one = tcPanelLayout(ctx, lrows, {w: PW, F});
  return {area: {x: 0, y: 0, w: DW - PW - gap, h: DH}, PL: {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW}, panel: {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)}};
}

/** Lens texts for the focus sheet (source units = rendered / zoom). */
function lensTexts(P, Fo, SM, F, zoom) {
  const rs = Fo.rows[Fo.key];
  const f = F / zoom;
  const maxW = SM.paper.w * 0.9;
  let ok = true;
  const texts = rs.map((rw, i) => {
    const fieldFit = fitG(rw.field, {maxWidth: maxW, size: f, minSize: f, maxLines: 1, weight: 600});
    const valueFit = fitG(i === Fo.idx ? '' : (rw.filled ? rw.value : P.labels.blank), {maxWidth: maxW, size: f, minSize: f, maxLines: 2, weight: 500});
    if (!fieldFit.ok || !valueFit.ok) ok = false;
    const R = SM.rows[i];
    if (R && (fieldFit.height + valueFit.height + f * 0.5 > R.h)) ok = false;
    return {fieldFit, valueFit};
  });
  const vb = fitG(Fo.hasB ? Fo.bv : P.labels.blank, {maxWidth: maxW, size: f, minSize: f, maxLines: 2, weight: 500});
  const va = fitG(Fo.hasA ? Fo.av : P.labels.blank, {maxWidth: maxW, size: f, minSize: f, maxLines: 2, weight: 500});
  const FR = SM.rows[Fo.idx];
  if (FR && Math.max(vb.height, va.height) + texts[Fo.idx].fieldFit.height + f * 0.45 > FR.h) ok = false;
  // the before-trace sits on a note below the sheet (inside the lens crop), up to two lines
  const tr = fitG(`${P.__before}: ${Fo.hasB ? Fo.bv : P.labels.blank}`, {maxWidth: SM.w * 0.94, size: Math.max(16, F * 0.85) / zoom, minSize: 16 / zoom, maxLines: 2, weight: 500});
  const head = fitG(Fo.key === 'a' ? P.labels.logA : P.labels.logB, {maxWidth: SM.head.w * 0.62, size: f, minSize: f, maxLines: 1, weight: 700});
  if (!vb.ok || !va.ok || !tr.ok || !head.ok) ok = false;
  return {texts, vb, va, tr, head, ok, f};
}

function compose(ctx, P, Fo, F, opt, LG) {
  const A = LG.area;
  const wide = A.w / A.h > 1.15;
  const pl = P.detailGeometry.placement;
  const row = pl === 'left' || pl === 'right' ? true : pl === 'top' || pl === 'bottom' ? false : wide;
  const lensFirst = pl === 'left' || pl === 'top';
  const gap = F * 1.2;
  const sp = opt.split;
  let sR, lR;
  if (row) {
    const sw = A.w * (1 - sp) - gap / 2;
    sR = {x: A.x + (lensFirst ? A.w - sw : 0), y: A.y, w: sw, h: A.h};
    lR = {x: lensFirst ? A.x : A.x + sw + gap, y: A.y, w: A.w - sw - gap, h: A.h};
  } else {
    const sh = A.h * (1 - sp) - gap / 2;
    sR = {x: A.x, y: A.y + (lensFirst ? A.h - sh : 0), w: A.w, h: sh};
    lR = {x: A.x, y: lensFirst ? A.y : A.y + sh + gap, w: A.w, h: A.h - sh - gap};
  }
  // the room keeps the whole area's proportions (so at rest it fills the area) and is scaled down into its region
  const k = Math.min(sR.w / A.w, sR.h / A.h, 1);
  const rb = {w: A.w * k, h: A.h * k};
  const room = {x: row ? (lensFirst ? sR.x + sR.w - rb.w : sR.x) : sR.x + (sR.w - rb.w) / 2, y: row ? sR.y + (sR.h - rb.h) / 2 : (lensFirst ? sR.y + sR.h - rb.h : sR.y), ...rb};
  const orient = A.w >= A.h * 0.9 ? 'h' : 'v';
  const G = room.w > 160 && room.h > 140 ? tcStage(room, orient, {kind: P.items[0].kind, rowsA: Fo.rows.a.length, rowsB: Fo.rows.b.length, minRows: 2, headFrac: 0.14}) : null;
  if (!G) return {ok: false, problems: ['stage-fit'], F, LG};
  const SM = G.sheets[Fo.key];
  const pad = Math.max(8, G.S * 0.04);
  const source = {x: SM.x - pad, y: SM.y - pad, w: SM.w + pad * 2, h: SM.h + pad * 2};
  // room below the sheet for the before-trace note (two passes: the band depends on the zoom)
  const traceH = ctx.show('key') ? Math.max(16, F * 0.85) * 2.5 + 12 : 0;
  let zoom = Math.min(lR.w * 0.98 / source.w, lR.h * 0.98 / source.h, 4);
  for (let k = 0; k < 2; k++) {
    const hh = SM.h + pad * 2 + traceH / zoom;
    zoom = Math.min(lR.w * 0.98 / source.w, lR.h * 0.98 / hh, 4);
  }
  source.h = SM.h + pad * 2 + traceH / zoom;
  const dest = {w: source.w * zoom, h: source.h * zoom};
  dest.x = lR.x + (lR.w - dest.w) / 2;
  dest.y = lR.y + (lR.h - dest.h) / 2;
  const LT = ctx.show('key') ? lensTexts(P, Fo, SM, F, zoom) : {ok: true};
  const minZ = Math.max(1.5, P.detailGeometry.zoom);
  const short = Math.min(dest.w, dest.h) / Math.min(ctx.design.w, ctx.design.h);
  const ok = (!LG.PL || LG.PL.ok) && G.fits && zoom >= minZ && LT.ok && short >= 0.34;
  return {F, LG, G, sR, lR, source, dest, zoom, LT, ok, S: G.S, short, problems: [LG.PL && !LG.PL.ok && 'panel-text', !G.fits && 'stage-fit', zoom < minZ && 'zoom', !LT.ok && 'lens-text', short < 0.34 && 'lens-small'].filter(Boolean)};
}

/** The lens: the focus sheet redrawn in the same (aside) coordinates, rows printed at the lens's rendered size. */
function lensParts(ctx, L) {
  const {C, G, Fo} = L;
  const th = ctx.theme;
  const SM = G.sheets[Fo.key];
  const R = Fo.idx >= 0 ? SM.rows[Fo.idx] : null;
  const mkR = clamp(G.S * 0.075, 14, 24);
  if (!R) return null;
  {
      const LT = C.LT;
      const show = ctx.show('key');
      const f = show ? LT.f : 0;
      const content = g(null,
        h('rect', {x: r(C.source.x - 40), y: r(C.source.y - 40), width: r(C.source.w + 80), height: r(C.source.h + 80), fill: '#3f6b5a'}),
        sheetArt(ctx, SM, Fo.key, Fo.rows[Fo.key].map((rw, i) => (i === Fo.idx ? {...rw, filled: false} : rw)), {prefix: 'lv', name: 'lv-sheet', seed: `tci-${Fo.key}`, texts: show ? LT.texts : null, headText: show ? LT.head : null, written: true}),
        show ? g(null,
          g({name: 'lv-before'}, textAt(LT.vb, {x: R.x0 + R.h * 0.1, y: R.top + R.h - LT.vb.height - R.h * 0.1, fill: Fo.hasB ? WRITE_INK : '#6b6f73', italic: !Fo.hasB})),
          g({name: 'lv-after', opacity: 0}, textAt(LT.va, {x: R.x0 + R.h * 0.1, y: R.top + R.h - LT.va.height - R.h * 0.1, fill: Fo.hasA ? WRITE_INK : '#6b6f73', italic: !Fo.hasA})),
          g({name: 'lv-trace', opacity: 0},
            h('path', {d: roundRectPath(SM.x, SM.y + SM.h + 4 / C.zoom, Math.min(SM.w, LT.tr.width + 16 / C.zoom), LT.tr.height + 10 / C.zoom, 6 / C.zoom), fill: th.card, stroke: th.accent2, 'stroke-width': r(2 / C.zoom, 3)}),
            textAt(LT.tr, {x: SM.x + 8 / C.zoom, y: SM.y + SM.h + 9 / C.zoom, fill: th.accent2, italic: true})),
        ) : g(null,
          g({name: 'lv-before'}, Fo.hasB ? h('path', {d: scribble(ctx, `tci-${Fo.key}-${Fo.idx}`, R.stubX + R.h * 0.1, R.stubX + (R.x1 - R.stubX) * 0.7, R.y, R.h * 0.3), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.4 / C.zoom + 1}) : null),
          g({name: 'lv-after', opacity: 0}, Fo.hasA ? h('path', {d: scribble(ctx, `tci-after-${Fo.idx}`, R.stubX + R.h * 0.1, R.stubX + (R.x1 - R.stubX) * 0.5, R.y, R.h * 0.3), fill: 'none', stroke: WRITE_INK, 'stroke-width': 2.4 / C.zoom + 1}) : null),
          g({name: 'lv-trace', opacity: 0}),
        ),
        h('rect', {name: 'lv-ring', x: r(R.x0 - R.h * 0.08), y: r(R.top), width: r(R.x1 - R.x0 + R.h * 0.16), height: r(R.h), rx: r(6 / C.zoom + 2), fill: 'none', stroke: th.accent2, 'stroke-width': r(4 / C.zoom, 2), opacity: 0}),
        changedMarker(ctx, {name: 'lv-mark', x: R.x1 - 20 / C.zoom, y: R.top + R.h * 0.06 + (C.LT.f ? C.LT.f * 0.6 : 10 / C.zoom), radius: 17 / C.zoom, opacity: 0}),
      );
      return lens(ctx, {name: 'lens', source: C.source, dest: C.dest, frame: {x: 0, y: 0, w: ctx.design.w, h: ctx.design.h}, content, color: th.accent2});
  }
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const Fo = focusOf(P);
    P.__before = ctx.t.before;
    const lrows = legendRows(ctx, P, Fo);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'below', cols: 2}, {mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.36}]
        : [{mode: 'side', pw: 0.24}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.32}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) {
      for (const o0 of opts) {
        const LG = legendFor(ctx, lrows, F, o0);
        for (const split of [0.42, 0.38, 0.46, 0.5, 0.34, 0.56, 0.62]) {
          const c = compose(ctx, P, Fo, F, {...o0, split}, LG);
          const score = (c.S || 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * Math.min(1.2, (c.short || 0) / 0.4);
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (c.G && (!C || c.problems.length < C.problems.length)) C = c;
        }
      }
      if (best && F <= 19.5) break;
    }
    if (best) C = best;
    if (!C) C = compose(ctx, P, Fo, 16, {mode: 'side', pw: 0.3, split: 0.4}, legendFor(ctx, lrows, 16, {mode: 'side', pw: 0.3}));
    const G = C.G;
    const A = C.LG.area;
    // at rest the room is centred and enlarged within the whole area; it steps aside only while the lens is open
    const rs = clamp(Math.min(A.w * 0.99 / G.box.w, A.h * 0.99 / G.box.h), 1, 2.2);
    const rest = {s: rs, dx: A.x + A.w / 2 - rs * (G.box.x + G.box.w / 2), dy: A.y + A.h / 2 - rs * (G.box.y + G.box.h / 2)};
    const end = tcPose(ctx, G, WS, 1, {writeA: true, writeB: true, rows: Fo.rows, seed: 'tci'});
    const arms = tcArms(ctx, G, [end], 'st');
    const unit = bagUnit(ctx, G, 'st-bag');
    const L = {P, Fo, C, G, rest, end, arms, unit, rows: Fo.rows};
    const lp = lensParts(ctx, L);
    L.lensF = lp ? lp.frame : null;
    return L;
  },
  build(ctx, L) {
    const {C, G, Fo, P} = L;
    const th = ctx.theme;
    const N = tcSceneNodes(ctx, G, L, 'st', {seed: 'tci'});
    const SM = G.sheets[Fo.key];
    const R = Fo.idx >= 0 ? SM.rows[Fo.idx] : null;
    // after-state ink in the context (a fresh scribble for a non-empty after value)
    let afterInk = null;
    if (R && Fo.hasA) {
      const pts = sheetRowPoints(ctx, SM, Fo.idx, {len: clamp(0.35 + Fo.av.trim().length / 26, 0.35, 1)}, 'tci-after');
      afterInk = h('path', {name: 'ctx-after', d: scribble(ctx, `tci-after-${Fo.idx}`, pts.x0, pts.x1, R.y, pts.amp), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(2, R.h * 0.075), 2), 'stroke-linecap': 'round', opacity: 0});
    }
    const mkR = clamp(G.S * 0.075, 14, 24);
    const marker = R ? changedMarker(ctx, {name: 'marker', x: SM.x + SM.w - mkR * 0.4, y: R.y - R.h * 0.25, radius: mkR, opacity: 0}) : null;
    const clipId = 'st-win';
    const ctxGroup = g({name: 'ctxMove'},
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(G.box.x, G.box.y, G.box.w, G.box.h, 22)}))),
      g({'clip-path': ctx.ref(clipId)}, N.stage, N.sheets, afterInk, N.shadow, N.bag, N.arms, N.palms, N.pens, N.thumbs, N.persons),
      h('path', {d: roundRectPath(G.box.x, G.box.y, G.box.w, G.box.h, 22), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
      marker,
    );
    const lensNode = lensParts(ctx, L);
    const panels = C.LG.PL ? C.LG.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.LG.panel.x + i * (C.LG.PL.colW + C.F * 1.2), C.LG.panel.y)}, tcPanelNode(ctx, PLc))) : [];
    return g({name: 'scene'}, ctxGroup, lensNode ? g({name: 'lens-wrap', 'data-occludes': 1}, lensNode.node) : null, panels);
  },
  frame(ctx, L, u) {
    const {C, G, Fo, rest} = L;
    const nodes = {};
    // pose: everything at the end of the hand-off (static)
    const F = tcFrameNodes(ctx, G, L.end, L, 'st');
    Object.assign(nodes, F.nodes, tcWriteProps('st', L.rows, L.end.progress));
    // aside / back
    const kAside = ease.inOutCubic(seg(u, ...W.aside)) * (1 - ease.inOutCubic(seg(u, ...W.back)));
    const s = lerp(rest.s, 1, kAside), dx = lerp(rest.dx, 0, kAside), dy = lerp(rest.dy, 0, kAside);
    nodes.ctxMove = {transform: `translate(${r(dx)} ${r(dy)}) scale(${r(s, 4)})`};
    const openP = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    if (L.lensF) Object.assign(nodes, L.lensF(openP, openP));
    const lensOn = openP > 0.001;
    const after = u >= W.close[1] - 0.012; // the context shows the after state once the lens has (almost) closed
    // context copy of the focus row: before ink until the lens appears, blank while the lens holds its copy, after ink
    const fk = Fo.idx >= 0 ? `st-log${Fo.key}-w${Fo.idx}` : null;
    if (fk && L.rows[Fo.key][Fo.idx].filled) nodes[fk] = {'stroke-dashoffset': lensOn || after ? 100 : 0};
    if (Fo.idx >= 0 && Fo.hasA) nodes['ctx-after'] = {opacity: after ? 1 : 0};
    const mk = seg(u, ...W.marker);
    if (Fo.idx >= 0) nodes.marker = {opacity: r(mk, 3)};
    // inside the lens
    const ringK = seg(u, ...W.ring) * (1 - seg(u, ...W.close));
    const oldK = seg(u, ...W.fadeOld), trK = seg(u, ...W.trace), newK = seg(u, ...W.writeNew);
    // lens text prints only while the current magnification renders it at full size (never under the floor)
    const zNow = 1 + (C.zoom - 1) * openP;
    const tv = zNow >= C.zoom * 0.97 ? 1 : 0;
    if (Fo.idx >= 0) {
      if (ctx.show('key')) nodes['lv-txt'] = {opacity: tv};
      nodes['lv-ring'] = {opacity: r(ringK, 3)};
      nodes['lv-before'] = {opacity: r((1 - oldK) * tv, 3), transform: T(0, -oldK * (C.source.h * 0.04))};
      nodes['lv-trace'] = {opacity: r(trK * tv, 3)};
      nodes['lv-after'] = {opacity: r(newK * tv, 3)};
      nodes['lv-mark'] = {opacity: r(newK, 3)};
    }
    if (C.LG.PL) for (const col of C.LG.PL.cols) for (const row of col.rows) if (row.name === 'lg-after') nodes[row.name] = {opacity: r(seg(u, ...W.legend), 3)};
    const datum = newK >= 1 ? 'after' : oldK > 0 ? 'changing' : 'before';
    const phase = u < W.aside[1] ? 'context' : u < W.fadeOld[0] ? 'isolate' : u < W.close[0] ? 'substitute' : 'return';
    const src = C.source;
    return {
      nodes,
      semantic: {
        phase, datum, open: r(openP, 3), aside: r(kAside, 3), ring: r(ringK, 3), oldValue: r(1 - oldK, 3), trace: r(trK, 3), newValue: r(newK, 3), marker: r(mk, 3),
        contextRow: Fo.idx < 0 ? 'none' : after ? (Fo.hasA ? 'after-ink' : 'blank') : lensOn ? 'hidden' : (Fo.hasB ? 'before-ink' : 'blank'),
        focus: {sheet: Fo.key, row: Fo.idx}, before: Fo.bv, afterV: Fo.av,
        source: {x: r(src.x), y: r(src.y), w: r(src.w), h: r(src.h)}, dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)},
        zoom: r(C.zoom, 3), lensShort: r(C.short, 3), restScale: r(rest.s, 3),
        bag: {x: r(L.end.bag.x), y: r(L.end.bag.y)}, atB: L.end.atB, allReached: F.allReached,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), orient: G.orient,
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
    slug: 'evidence-custody-03-inspect',
    title: 'Custody transfer — a lens on the receiving sheet after the hand-off: one row\'s value is replaced (e.g. by a blank) and marked',
    titleEs: 'Transferencia de custodia — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Transferencia de custodia',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the hand-off room after the transfer — the sealed bag on B\'s desk, sheet A and sheet B written as supplied. The room steps aside and a lens opens on the focus sheet (by default sheet B) with its rows printed. One row\'s value is replaced by the alternative datum (by default a blank row, a documentary gap as supplied), with a trace of the before value; the lens closes, the room returns and a neutral Δ marks the changed row. Seeking back restores the before value. No inference about validity, responsibility or outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'transfer', 'inspect', 'lens', 'record sheet', 'documentary gap', 'changed datum', 'hand-off'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/transferencia-custodia.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
