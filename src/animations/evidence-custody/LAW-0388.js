/**
 * LAW-0388 — Comparación de huellas digitales · inspect
 *
 * Storyboard (context: the state produced by the comparison — on the evidence bench the object in its open bag with
 * its tag, a light box holding the reference card (upper row) and the lifted card (lower row) with their symbolic
 * chains, every segment pair already linked (bridge = equal supplied symbols, open stubs = different), the reading
 * frame parked; a legend lists the item, cards, pair states, the context caption, the before / now values of the
 * focus datum, tag rows, custodians, times, the marker label and the key):
 *  0.00–0.20  context: the whole station centred and enlarged; the focus pair shows its before datum. The station
 *             steps aside (0.10–0.19, never below 0.45 of its rest scale) to make room for the lens.
 *  0.20–0.45  a lens opens beside the station: a real magnified copy (same coordinates) of the focus segment — the
 *             reference tile, the lifted tile, their link and the neighbouring tiles. The context copy of the datum
 *             (the lifted tile's glyph and the pair's link) goes blank in step with the lens appearing.
 *  0.45–0.75  one datum is substituted: the before symbol lifts out of the tile and shrinks into a small dashed
 *             "before" trace under it; the after symbol is drawn in; only the dependent link updates (the old link
 *             fades, the new one is drawn). The new state holds.
 *  0.75–1.00  the lens closes; the context shows the after symbol and link plus the neutral changed-datum marker (Δ).
 *             Nothing is inferred about identity or any outcome. Seeking back restores the before datum exactly.
 * @module animations/evidence-custody/LAW-0388
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, int, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {ecFields, localised, benchNode} from './kits/evidence-art.js';
import {
  FC_EN, FC_ES, fcFields, fcRecords, fcRecordLine, SYMBOLS, SYMBOL_NAMES, fcStage, cardArt, lightBoxArt, linkArt, readerArt,
  stationBag, glyphArt, tileBody, fcLegendFor, fcPanels,
} from './kits/comparacion-huellas.js';

const ID = 'LAW-0388';
const DURATION = 8000;
const W = {aside: [0.1, 0.19], open: [0.2, 0.32], ring: [0.34, 0.4], fadeOld: [0.45, 0.51], trace: [0.5, 0.56], writeNew: [0.54, 0.62], oldLink: [0.6, 0.64], newLink: [0.64, 0.7], close: [0.75, 0.81], back: [0.81, 0.9], marker: [0.82, 0.88], legend: [0.81, 0.86]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const MIN_ASIDE = 0.45; // the stepped-aside context keeps >= 45 % of its rest scale

const STRINGS = {
  en: {before: 'before', after: 'now', segment: 'Segment'},
  es: {before: 'antes', after: 'ahora', segment: 'Segmento'},
};

const SEG = [{a: 'arc', b: 'arc'}, {a: 'fork', b: 'fork'}, {a: 'loop', b: 'loop'}, {a: 'end', b: 'dot'}, {a: 'dot', b: 'dot'}];
const OWN_EN = {
  segments: SEG,
  focusTarget: 1,
  beforeValue: 'fork',
  afterValue: 'end',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'The light box after the comparison', marker: 'Only this datum was changed', field: 'Lifted chain symbol'},
};
const OWN_ES = {
  segments: SEG,
  focusTarget: 1,
  beforeValue: 'fork',
  afterValue: 'end',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'La caja de luz tras la comparación', marker: 'Solo este dato ha cambiado', field: 'Símbolo de la cadena levantada'},
};
const EN = {...FC_EN, ...OWN_EN};
const ES = {...FC_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...fcFields,
  focusTarget: int('Zero-based segment pair that is enlarged and whose lifted symbol is substituted (clamped to the segment count)', 0, 5),
  beforeValue: oneOf('Lifted symbol of that segment before the substitution (replaces the segment\'s own value a)', SYMBOLS),
  afterValue: oneOf('Lifted symbol after the substitution (the alternative datum)', SYMBOLS),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Minimum magnification of the lens against the context at rest (grows further when room allows)', 1.5, 4),
    placement: oneOf('Side where the lens opens (auto = the larger free side)', ['auto', 'left', 'right', 'top', 'bottom']),
  }, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
    field: str('Name of the substituted datum', 40),
  }, ['context', 'marker', 'field']),
};
const defaultParams = {...EN};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  const it = P.items[0];
  const nm = SYMBOL_NAMES[P.locale === 'es' ? 'es' : 'en'];
  const fld = `${ctx.t.segment} ${P.k + 1} · ${P.contextLabels.field}`;
  if (showKey) rows.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showAll) rows.push({kind: 'item', icon: 'fc-lightbox', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-cardA', text: P.cards.a, name: 'lg-cardA'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-cardB', text: P.cards.b, name: 'lg-cardB'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-same', text: P.matchLabels.same, name: 'lg-same'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-differ', text: P.matchLabels.differ, name: 'lg-differ'});
  if (showKey) rows.push({kind: 'item', icon: `fc-sym-${P.beforeValue}`, text: `${fld}: ${ctx.t.before} ${nm[P.beforeValue]}`, name: 'lg-before'});
  if (showKey) rows.push({kind: 'item', icon: `fc-sym-${P.afterValue}`, text: `${fld}: ${ctx.t.after} ${nm[P.afterValue]}`, name: 'lg-after'});
  if (showKey) rows.push({kind: 'item', icon: 'tag', text: recs.map(rw => fcRecordLine(rw, P.labels.blank)).join(' · '), name: 'lg-recs'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.custodians.map(c => `${c.name} · ${c.role}`).join('; '), name: 'lg-cus'});
  if (showAll) rows.push({kind: 'item', icon: 'clock', text: P.timestamps.map(t => `${t.label} · ${t.time}`).join('; '), name: 'lg-times'});
  if (showKey) rows.push({kind: 'state', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, LG, opt, vs) {
  const bench = LG.area;
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
  const G = fcStage(zoneCtx, {n: P.segments.length, rows: recs.length, kind: P.items[0].kind, arrangement: opt.arr, cardRest: false});
  const ts = G.ts, k = P.k;
  const ta = G.tileA(k), tb = G.tileB(k);
  const halfW = (1 + G.CM.tg / ts + 0.5 + 0.2) * ts;
  const source = {x: ta.x - halfW, y: tb.y - 0.8 * ts, w: halfW * 2, h: ta.y - tb.y + 2.2 * ts};
  const zoom = Math.min(zoneLens.w * 0.96 / source.w, zoneLens.h * 0.96 / source.h);
  const dest = {w: source.w * zoom, h: source.h * zoom};
  dest.x = zoneLens.x + (zoneLens.w - dest.w) / 2; dest.y = zoneLens.y + (zoneLens.h - dest.h) / 2;
  // rest: the station centred and enlarged in the whole mat (bounded so the aside view stays >= MIN_ASIDE of it)
  const E = G.stageBox;
  const rs = clamp(Math.min(mat.w * 0.96 / E.w, mat.h * 0.96 / E.h), 1, 1 / MIN_ASIDE);
  const rest = {s: rs, dx: mat.x + mat.w / 2 - rs * (E.x + E.w / 2), dy: mat.y + mat.h / 2 - rs * (E.y + E.h / 2)};
  const zoomRest = zoom / rs;
  const kf = Math.min(ctx.view.width, ctx.view.height);
  const lensBig = Math.min(dest.w, dest.h) * vs * kf / 1080 >= 0.355 * kf;
  const zoomOk = zoomRest >= Math.max(1.5, P.detailGeometry.zoom) - 1e-6;
  const restTs = ts * rs;
  const ok = (!LG.PL || LG.PL.ok) && G.fits && zoomOk && lensBig && restTs >= 44 && ts >= 30;
  return {bench, mat, LG, G, source, dest, zoom, zoomRest, rest, ok, restTs,
    problems: [LG.PL && !LG.PL.ok && 'panel-text', !G.fits && 'stage-fit', !zoomOk && 'zoom', !lensBig && 'lens-small', (restTs < 44 || ts < 30) && 'stage-small'].filter(Boolean)};
}

function pairNodes(ctx, L, pre, opts) {
  const {G, P} = L;
  const k = P.k, ts = G.ts;
  const tb = G.tileB(k), ta = G.tileA(k);
  const top = {x: tb.x, y: tb.y + ts * 0.5}, bot = {x: ta.x, y: ta.y - ts * 0.5};
  const sameB = P.beforeValue === P.segments[k].b, sameA = P.afterValue === P.segments[k].b;
  return g(null,
    g({name: `${pre}-linkB`}, linkArt(ctx, `${pre}-lb`, top, bot, sameB, ts)),
    g({name: `${pre}-linkA`, opacity: 0}, linkArt(ctx, `${pre}-la`, top, bot, sameA, ts)),
    g({transform: T(ta.x, ta.y)},
      g({name: `${pre}-before`}, glyphArt(P.beforeValue, ts)),
      g({name: `${pre}-after`, opacity: 0}, glyphArt(P.afterValue, ts))),
    opts.trace ? g({name: `${pre}-trace`, opacity: 0, transform: T(ta.x, ta.y + ts * 1.02)},
      h('path', {d: roundRectPath(-ts * 0.3, -ts * 0.3, ts * 0.6, ts * 0.6, ts * 0.1), fill: '#fbfaf6', stroke: '#6d7780', 'stroke-width': 2, 'stroke-dasharray': '5 4'}),
      glyphArt(P.beforeValue, ts * 0.6, {color: '#6d7780'})) : null,
  );
}

function stationArt(ctx, L, pre) {
  const {G, P} = L;
  const k = P.k;
  const segs = P.segments.map((s, i) => (i === k ? {a: P.beforeValue, b: s.b} : s));
  const links = segs.map((sg, i) => {
    if (i === k) return null;
    const tb = G.tileB(i), ta = G.tileA(i);
    return g({name: `${pre}-lkw${i}`}, linkArt(ctx, `${pre}-lk${i}`, {x: tb.x, y: tb.y + G.ts * 0.5}, {x: ta.x, y: ta.y - G.ts * 0.5}, sg.a === sg.b, G.ts));
  });
  return {segs, links};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const P = {...P0, k: clamp(P0.focusTarget, 0, P0.segments.length - 1)};
    const recs = fcRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const vs = Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'below', cols: 2}, {mode: 'below', cols: 3}]
        : [{mode: 'side', pw: 0.24}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.33}];
    const sps = [];
    for (const arr of ['wide', 'wideLow', 'tall']) for (const [orient, split] of [['h', 0.72], ['h', 0.66], ['h', 0.6], ['v', 0.64], ['v', 0.56], ['v', 0.5]]) sps.push({arr, orient, split});
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 1) break;
      for (const o0 of opts) {
        const LG = fcLegendFor(ctx, rows, F, o0);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const sp of sps) {
          const c = compose(ctx, P, recs, LG, sp, vs);
          c.F = F;
          const score = c.G.ts * Math.sqrt(c.rest.s) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * Math.min(1.3, c.zoomRest / 1.8);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    const L = {P, recs, C, G: C.G};
    const content = g(null,
      h('rect', {x: r(C.source.x - 40), y: r(C.source.y - 40), width: r(C.source.w + 80), height: r(C.source.h + 80), fill: '#f6fbfd'}),
      lightBoxArt(ctx, C.G.LB, {}),
      g({transform: T(C.G.slotB.x, C.G.slotB.y)}, cardArt(ctx, C.G.CM, {prefix: 'lzb', symbols: P.segments.map(s => s.b), role: 'b'})),
      g({transform: T(C.G.slotA.x, C.G.slotA.y)}, cardArt(ctx, C.G.CM, {prefix: 'lza', symbols: stationArt(ctx, L, 'x').segs.map(s => s.a), role: 'a', blankTiles: [P.k]})),
      stationArt(ctx, L, 'lz').links,
      pairNodes(ctx, L, 'lv', {trace: true}),
      h('rect', {name: 'lv-ring', x: r(C.G.tileA(P.k).x - C.G.ts * 0.68), y: r(C.G.tileA(P.k).y - C.G.ts * 0.68), width: r(C.G.ts * 1.36), height: r(C.G.ts * 1.36), rx: r(C.G.ts * 0.22), fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': 4, opacity: 0}),
    );
    L.Lz = lens(ctx, {name: 'lens', source: C.source, dest: C.dest, frame: C.bench, content, color: ctx.theme.accent2});
    return L;
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const st = stationArt(ctx, L, 'cx');
    const ta = G.tileA(P.k);
    const mR = Math.max(16, G.ts * 0.32);
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        g({name: 'ctxMove'},
          lightBoxArt(ctx, G.LB, {}),
          g({transform: T(G.slotB.x, G.slotB.y)}, cardArt(ctx, G.CM, {prefix: 'cxb', symbols: P.segments.map(s => s.b), role: 'b'})),
          g({transform: T(G.slotA.x, G.slotA.y)}, cardArt(ctx, G.CM, {prefix: 'cxa', symbols: st.segs.map(s => s.a), role: 'a', blankTiles: [P.k]})),
          stationBag(ctx, G, {prefix: 'st', rows: L.recs}),
          st.links,
          pairNodes(ctx, L, 'cf', {trace: false}),
          g({transform: T(G.park.x, G.park.y, G.park.a)}, readerArt(ctx, G.RM, {})),
          changedMarker(ctx, {name: 'marker', x: ta.x + G.ts * 0.5 + mR * 0.9, y: ta.y + G.ts * 0.5 + mR * 0.9, radius: mR, opacity: 0}),
        ),
      ),
      bench.frame,
      L.Lz.node,
      fcPanels(ctx, C.LG),
    );
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const nodes = {};
    const e = ease.inOutCubic;
    const pOpen = e(seg(u, ...W.open)) * (1 - e(seg(u, ...W.close)));
    Object.assign(nodes, L.Lz.frame(pOpen, pOpen));
    const ctxBefore = u < W.open[0] ? 1 : 0;
    const ctxAfter = u >= W.close[1] ? 1 : 0;
    nodes['cf-before'] = {opacity: ctxBefore};
    nodes['cf-after'] = {opacity: ctxAfter};
    nodes['cf-linkB'] = {opacity: ctxBefore};
    nodes['cf-linkA'] = {opacity: ctxAfter};
    const sameB = P.beforeValue === P.segments[P.k].b, sameA = P.afterValue === P.segments[P.k].b;
    const linkFull = (name, same) => (same ? {[`${name}`]: {opacity: 1}, [`${name}-bar`]: {'stroke-dashoffset': 0}} : {[`${name}`]: {opacity: 1}, [`${name}-stubA`]: {'stroke-dashoffset': 0}, [`${name}-stubB`]: {'stroke-dashoffset': 0}});
    Object.assign(nodes, linkFull('cf-lb', sameB), linkFull('cf-la', sameA), linkFull('lv-lb', sameB));
    P.segments.forEach((sg, i) => { if (i !== P.k) { Object.assign(nodes, linkFull(`cx-lk${i}`, sg.a === sg.b), linkFull(`lz-lk${i}`, sg.a === sg.b)); } });
    const kOld = seg(u, ...W.fadeOld), kTrace = seg(u, ...W.trace), kNew = seg(u, ...W.writeNew);
    const kOldLink = seg(u, ...W.oldLink), kNewLink = seg(u, ...W.newLink);
    const changeLink = sameA !== sameB;
    nodes['lv-before'] = {opacity: r(1 - kOld, 3), transform: T(0, kOld * G.ts * 0.5, 0, 1 - kOld * 0.4)};
    nodes['lv-trace'] = {opacity: r(kTrace, 3)};
    nodes['lv-after'] = {opacity: r(kNew, 3)};
    nodes['lv-linkB'] = {opacity: r(changeLink ? 1 - kOldLink : 1, 3)};
    nodes['lv-linkA'] = {opacity: changeLink && kNewLink > 0 ? 1 : 0};
    const dash = (100 * (1 - kNewLink)).toFixed(2);
    if (sameA) nodes['lv-la-bar'] = {'stroke-dashoffset': changeLink ? dash : 0};
    else { nodes['lv-la-stubA'] = {'stroke-dashoffset': changeLink ? dash : 0}; nodes['lv-la-stubB'] = {'stroke-dashoffset': changeLink ? dash : 0}; }
    nodes['lv-la'] = {opacity: 1};
    nodes['lv-ring'] = {opacity: r(seg(u, ...W.ring), 3)};
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3)};
    const kRest = 1 - e(seg(u, ...W.aside)) * (1 - e(seg(u, ...W.back)));
    const RS = C.rest;
    const sc = lerp(1, RS.s, kRest);
    nodes.ctxMove = {transform: T(RS.dx * kRest, RS.dy * kRest, 0, sc)};
    const ta = G.tileA(P.k);
    const focus = {x: ta.x * sc + RS.dx * kRest, y: ta.y * sc + RS.dy * kRest};
    if (C.LG.PL) for (const col of C.LG.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-after') nodes[row.name] = {opacity: r(kNew, 3)};
      if (row.name === 'lg-marker') nodes[row.name] = {opacity: r(seg(u, ...W.legend), 3)};
    }
    const shown = u < (W.fadeOld[0] + W.fadeOld[1]) / 2 ? 'before' : 'after';
    const phase = u < W.open[0] ? 'context' : u < W.open[1] ? 'open' : u < W.fadeOld[0] ? 'isolate' : u < W.newLink[1] ? 'substitute' : u < W.close[0] ? 'hold-new' : u < W.close[1] ? 'close' : 'return';
    const R = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    const linkNow = u < W.oldLink[0] ? (sameB ? 'bridge' : 'open') : u >= W.newLink[0] || !changeLink ? (sameA ? 'bridge' : 'open') : 'none';
    return {
      nodes,
      semantic: {
        phase, shown, value: shown === 'before' ? P.beforeValue : P.afterValue, link: linkNow,
        lensP: r(pOpen, 3), zoom: r(C.zoomRest, 3), ctxBefore, ctxAfter, lensBefore: r(1 - kOld, 3), lensAfter: r(kNew, 3), trace: r(kTrace, 3),
        marker: r(mk, 3), focusTile: {x: r(focus.x), y: r(focus.y)}, restK: r(kRest, 3), asideScale: r(1 / RS.s, 3),
        source: R(C.source), dest: R(C.dest), bench: R(C.bench),
        problems: C.problems, textPx: r(C.F, 1), ts: r(G.ts, 1), restTs: r(C.restTs, 1),
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
    slug: 'evidence-custody-07-inspect',
    title: 'Fingerprint comparison — a lens enlarges one segment pair of the two symbolic chains; the lifted symbol is substituted and only that pair\'s link updates, then the light box returns with a changed-datum marker',
    titleEs: 'Comparación de huellas digitales — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Comparación de huellas digitales',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the comparison station after the comparison — the object in its open bag with its tag, the light box with the reference and lifted cards and their symbolic chains, every segment pair linked (bridge or open stubs), the reading frame parked. The station steps aside (at least 45 % of its rest scale) and a lens opens with a real magnified copy (same coordinates) of one segment pair and its neighbours. The lifted symbol is substituted: the old symbol shrinks into a dashed "before" trace, the new one is drawn and only that pair\'s link updates. The lens closes and a neutral Δ marker sits beside the tile. Nothing about identity or outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'fingerprint', 'comparison', 'inspect', 'lens', 'changed datum', 'symbolic chain', 'segment', 'light box'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/comparacion-huellas.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
