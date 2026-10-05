/**
 * LAW-0699 — Daño material · contrast
 *
 * Storyboard (two complete scenes of equal size and timing; only the object's
 * state differs):
 *  0.00–0.17 base      Two identical display corners, A and B: the same object
 *                      intact on the same table, the same incident clipboard on
 *                      an easel beside it with a blank state row and a parked
 *                      plotter. Header chips "● A · Object before" and "◆ B ·
 *                      Object after" (equal chips, lane colours). The entries
 *                      both scenes share are drawn ONCE, in a shared card.
 *  0.17–0.40 change    Only in B the object changes to its altered state: a
 *                      crack draws down from the lip (0.20–0.30) and that piece
 *                      of the lip breaks off and drops onto the table
 *                      (0.27–0.37) — or, for the panel, a dent and scratches.
 *                      A stays exactly as it was. No cause is shown or implied.
 *  0.40–0.77 record    In parallel, both plotters run to their state row and
 *                      write it (0.46–0.66): A "● Object before: …" with an
 *                      intact thumbnail, B "◆ Object after: …" with the altered
 *                      one — the same action, adapted only to each state.
 *  0.77–1.00 guide     Matching rings mark the same spot on both objects and a
 *                      guide joins them: "Only this differs". Changed fact,
 *                      neutral note ("No winner, no outcome") and the key "As
 *                      supplied · no conclusion drawn". Nothing is valued; no
 *                      fault, liability, compensation or causation is stated.
 * Wide boxes: A and B side by side. Tall boxes: A above B. In each lane the
 * clipboard stands beside the object (wide lanes) or below it (narrow lanes).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0699
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {
  dmFields, DM_STRINGS, resolveDM, eventText, linkNotes, objectArt, objectGeom, tableArt, floorArt,
  iconChip, flowRows, recordMeasure, recordBuild, writeRow, plotterArt, sideMark, fitG, chipG,
  CHIP_REST_ROT, CHIP_REST_DY, clamp, ease, lerp, r, seg,
} from './kits/dano-material.js';
import {textBlock} from '../../primitives/annotate.js';

const ID = 'LAW-0699';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], record: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0.02, 0.1], shared: [0.04, 0.12],
  crack: [0.2, 0.3], chip: [0.27, 0.37], scratch: [0.28, 0.38],
  toRow: [0.42, 0.46], icon: [0.44, 0.47], write: [0.47, 0.66], park: [0.66, 0.72],
  rings: [0.77, 0.81], guide: [0.79, 0.84], note: [0.82, 0.87], key: [0.84, 0.89],
};
const CHANGE_AT = W.crack[0];

const strings = {
  en: {...DM_STRINGS.en, shared: 'Same in A and B (as supplied)', changed: 'Changed fact', guide: 'Only this differs', neutral: 'No winner, no outcome: two states side by side', stateRow: 'State'},
  es: {...DM_STRINGS.es, shared: 'Igual en A y B (según lo aportado)', changed: 'Hecho que cambia', guide: 'Solo esto cambia', neutral: 'Sin ganador ni resultado: dos estados comparados', stateRow: 'Estado'},
};

const sceneSchema = {
  ...dmFields,
  ...contrastFields(),
};

const defaultParams = {
  events: [
    {label: 'Shelf bracket above the table works loose', time: 'Day 3'},
    {label: 'Paint tin slides off the shelf', time: 'Day 3'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Lip chipped, crack down the side'}],
  object: {kind: 'vase', before: 'Ceramic vase, no marks'},
  scenarioA: {label: 'Object before', caption: ''},
  scenarioB: {label: 'Object after', caption: ''},
  changedFact: 'The object’s visible state: before or after',
  sharedFacts: ['Same display table and incident record'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'No winner, no outcome: two states side by side'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['row'], lanes: ['wide', 'wideH']},
  square: {size: 24, minSize: 17, arr: ['row', 'column', 'textcol'], lanes: ['tall', 'wide', 'wideH']},
  portrait: {size: 25, minSize: 17, arr: ['column'], lanes: ['wide', 'wideH', 'tall']},
};
const TH = 0.42; // table height (× object height)
const TW = 1.25; // table width (× object height)

function laneTexts(ctx, p) {
  const t = ctx.t;
  const A = p.scenarioA, B = p.scenarioB;
  return {
    heads: [
      {key: 'hA', letter: 'A', side: 'before', text: `${A.label}${A.caption ? ` · ${A.caption}` : ''}`},
      {key: 'hB', letter: 'B', side: 'after', text: `${B.label}${B.caption ? ` · ${B.caption}` : ''}`},
    ],
    rows: [
      {key: 'state', icon: 'before', level: 0, text: `${t.before}: ${p.object.before || ''}`.replace(/: $/, ''), wipe: true, iconHidden: true},
      {key: 'state', icon: 'after', level: 2, text: `${t.after}: ${p.losses[0].label}`, wipe: true, iconHidden: true},
    ],
  };
}

/** Header chip: lane badge (● A / ◆ B on the lane colour) + label. Both built with identical geometry rules. */
function headChip(ctx, it, size, maxW, textOn) {
  const th = ctx.theme;
  const R = size * 0.95;
  const col = it.letter === 'A' ? th.accent2 : th.accent4;
  const fit = textOn ? fitG(ctx, it.text, {maxWidth: maxW - 2 * R - 34, size, minSize: size, maxLines: 2, weight: 700}) : null;
  const w = 2 * R + (fit ? 16 + fit.width + 18 : 8);
  const hh = Math.max(2 * R + 8, fit ? fit.height + size * 0.8 : 0);
  return {
    w, h: hh, bad: fit ? fit.truncated || fit.broken : false,
    build(x, y, name) {
      const cy = y + hh / 2;
      return {node: g({name, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: col, 'stroke-width': 3}),
        h('circle', {cx: r(x + R + 4), cy: r(cy), r: r(R), fill: col, stroke: th.ink, 'stroke-width': 2}),
        textOn ? h('text', {x: r(x + R + 4), y: r(cy + size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, it.letter)
          : sideMark(ctx, {cx: x + R + 4, cy, s: R * 0.9, side: it.side}),
        fit ? textBlock(fit, {x: x + 2 * R + 20, y: cy - fit.height / 2, fill: th.ink}) : null,
      ), box: {x, y, w, h: hh}};
    },
  };
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, arr, lane, RW} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  // lanes: side by side (row) or one above the other (column)
  // textcol: the lanes stacked on the left, the shared entries and notes in a right-hand text column
  const textcol = arr === 'textcol';
  const colW = textcol ? Math.round(full * cfg.colF) : 0;
  const gapL = arr === 'row' ? 34 : 24;
  const laneW = arr === 'row' ? (full - gapL) / 2 : textcol ? full - colW - 24 : full;
  // rendered scene width (the lane floor, laneW - 12) against the FRAME: >= 0.40 side by side, >= 0.55 stacked beside a
  // text column, >= 0.71 stacked (frame width in design units)
  {
    const v = ctx.view, fs = Math.min(v.content.w / D.w, v.content.h / D.h);
    const need = arr === 'row' ? 0.40 : textcol ? 0.55 : 0.71;
    if (!cfg.fallback && laneW - 12 < need * v.width / fs + 2) return {bad: 'lane-share'};
  }
  // record (state row only); both lanes' records share one width and height
  const recs = base.rows.map((rw, i) => {
    const k = `${size}|${RW}|${i}`;
    let m = memo.rec.get(k);
    if (!m) { m = recordMeasure(ctx, {w: RW, size, header: base.header, rows: [rw], kind: base.kind, text: textOn, maxLines: 4}); memo.rec.set(k, m); }
    return m;
  });
  if (recs.some(m => m.bad)) return {bad: 'record'};
  // both clipboards get the same height (the taller state row), so the scenes are identical before the change beat
  const recH = Math.max(...recs.map(m => m.h));
  recs.forEach(m => { m.h = recH; });
  const railExt = size * 2.4, railGap = size * 0.9, legMin = size * 1.4;
  const recBlockW = RW + railExt + 36;
  const recSpan = recs[0].clipH * 0.35 + recH + 14 + railGap * 0.6 + size * 0.4;
  // heads
  const heads = base.heads.map(it => headChip(ctx, it, size, lane === 'wideH' ? recBlockW - 10 : laneW, textOn));
  if (heads.some(q => q.bad)) return {bad: 'head'};
  const headH = Math.max(...heads.map(q => q.h));
  // shared card + band (changed fact, neutral note, key)
  const bw = textcol ? colW : full;
  const sk = `${size}|${Math.round(bw)}|${cfg.half}`;
  let shared = memo.shared.get(sk);
  if (!shared) {
    // the shared entries (drawn once for both scenes) and the notes flow as chips in one band under the lanes (or
    // in the text column)
    const mw = cfg.half && !textcol ? (bw - 18) / 2 : Math.min(bw, 760);
    const bsz = textOn ? base.band.map(it => ({it, ...iconChip(ctx, it, {size, maxW: it.key === 'sharedHead' ? bw : mw, kind: base.kind, maxLines: textcol ? 5 : 3})})) : [];
    const fl = flowRows(bsz, {x: 0, y: 0, w: bw, gap: 18, rowGap: 10});
    shared = {m: null, bsz, bandH: bsz.length ? fl.bottom : 0, bad: bsz.some(q => q.bad)};
    memo.shared.set(sk, shared);
  }
  if (shared.bad) return {bad: 'shared'};
  const sharedH = 0;
  if (textcol && shared.bandH > D.h) return {bad: 'col'};
  const bandH = shared.bandH && !textcol ? shared.bandH + 16 : 0;
  const guideH = textOn ? size * 2.2 + 20 : 40; // room above the objects for the guide bar (row) / its label
  // object height OH inside a lane
  let laneH, OH;
  const avail = D.h - sharedH - bandH - (arr !== 'row' ? gapL : 0) - (arr === 'row' ? guideH : 0);
  const perLaneH = arr === 'row' ? avail : (avail - guideH) / 2;
  const innerH = lane === 'wideH' ? perLaneH : perLaneH - headH - 14;
  if (lane === 'wideH') {
    // [table + object | header chip over the clipboard on its easel]: the header takes no row of its own
    const wObj = laneW - recBlockW - 30;
    if (wObj < 120) return {bad: 'laneW'};
    OH = Math.min(wObj / TW, (innerH - 16) / (1 + TH));
    if (headH + 12 + recSpan + legMin + 16 > innerH) return {bad: 'recH'};
  } else if (lane === 'wide') {
    // [table + object | clipboard on its easel]
    const wObj = laneW - recBlockW - 30;
    if (wObj < 120) return {bad: 'laneW'};
    OH = Math.min(wObj / TW, (innerH - 16) / (1 + TH));
    if (recSpan + legMin + 16 > innerH) return {bad: 'recH'};
  } else {
    // [table + object] above [clipboard]
    if (recBlockW > laneW) return {bad: 'recW'};
    OH = Math.min(laneW / TW, (innerH - 16 - 16 - recSpan - legMin - 16) / (1 + TH));
  }
  if (!(OH >= cfg.hMin)) return {bad: 'OH', OH};
  laneH = perLaneH;
  if (cfg.dry) return {OH, size, cfg: {...cfg, dry: false}};
  return {OH, size, cfg, arr, lane, laneW, laneH, colW, textcol, gapL, recs, recH, recSpan, recBlockW, railExt, railGap, legMin, heads, headH, shared, sharedH, bandH, guideH, RW};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDM(p);
    const lt = laneTexts(ctx, p);
    const sharedRows = [
      ...p.events.map((e, i) => ({key: `ev${i}`, icon: 'event', i, text: eventText(e)})),
      ...p.sharedFacts.map((f, i) => ({key: `sf${i}`, icon: 'record', text: f})),
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`})),
      ...linkNotes(ctx, M).map(l => ({...l, icon: 'link'})),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'object', level: 2, text: `${t.alsoNoted}: ${p.losses[1].label}`}] : []),
    ];
    const band = [
      {key: 'sharedHead', text: t.shared, when: 'shared', weight: 700},
      ...sharedRows.map(rw => ({...rw, when: 'shared'})),
      {key: 'changed', icon: 'object', level: 2, text: `${t.changed}: ${p.changedFact}`, when: 'note'},
      {key: 'neutral', text: p.comparisonLabels.neutral || t.neutral, when: 'note'},
      {key: 'key', text: t.key, when: 'key'},
    ];
    const base = {M, kind: p.object.kind, header: null, heads: lt.heads, rows: lt.rows, band, memo: {rec: new Map(), shared: new Map()}};
    const rws = ctx.view.shape === 'landscape' ? [260, 300, 340, 380] : ctx.view.shape === 'square' ? [240, 280, 320, 360, 400] : [300, 340, 400, 460];
    const hMin = ctx.view.shape === 'portrait' ? 150 : 110;
    let pick = null, best = null;
    const why = [];
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const lane of SH.lanes) for (const RW of rws) for (const half of [false, true]) for (const colF of arr === 'textcol' ? [0.28, 0.3, 0.32] : [0]) {
        if (arr === 'textcol' && half) continue;
        const X = compose(ctx, base, {size, arr, lane, RW, half, colF, hMin, dry: true});
        if (!X.cfg) { why.push(`${arr}/${lane}/${RW}@${size}:${X.bad}${X.OH ? Math.round(X.OH) : ''}`); continue; }
        if (!best) best = X;
        if (!pick || X.OH > pick.OH + 1e-6) pick = X;
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    if (!L) {
      for (let f = 1.1; f <= 4.01 && !L; f += 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const arr of SH.arr) for (const lane of SH.lanes) {
          if (L) break;
          const X = compose(c2, base, {size: SH.minSize, arr, lane, RW: rws[rws.length - 1], hMin: 60, fallback: true, colF: 0.3});
          if (X.recs) { L = X; Dv = c2.design; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 80);
    L.M = M;
    const th = ctx.theme;
    const textOn = ctx.show('key');
    const full = Dv.w - 2 * MARGIN;
    const OH = L.OH;
    const G = objectGeom(p.object.kind, OH);
    L.G = G;
    // block height and top
    const lanesH = L.arr === 'row' ? L.laneH : 2 * L.laneH + L.gapL;
    const blockH = L.guideH + lanesH + L.sharedH + L.bandH;
    let y = Math.max(0, (Dv.h - blockH) / 2);
    const laneTop = [];
    if (L.arr === 'row') { y += L.guideH; laneTop.push(y, y); y += L.laneH; } else { laneTop.push(y); y += L.laneH + L.gapL + L.guideH; laneTop.push(y); y += L.laneH; }
    void 0;
    const laneX = L.arr === 'row' ? [MARGIN, MARGIN + L.laneW + L.gapL] : [MARGIN, MARGIN];
    // lane contents (identical geometry rules in both lanes)
    L.lanes = [0, 1].map(i => {
      const x0 = laneX[i], y0 = laneTop[i];
      const hd = L.heads[i];
      const head = hd.build(x0 + L.laneW - hd.w, y0, i ? 'hB' : 'hA'); // (wideH: over the clipboard column)
      const inTop = y0 + L.headH + 14;
      let cx, F, recX, recY, recFloor;
      if (L.lane === 'wide' || L.lane === 'wideH') {
        const usedW = OH * TW + 30 + L.recBlockW;
        const lx = x0 + Math.max(0, (L.laneW - usedW) / 2);
        cx = lx + OH * TW / 2;
        F = y0 + L.laneH - 16;
        recX = lx + OH * TW + 30 + 16;
        const want = F - (TH + 0.5) * OH - L.recSpan / 2;
        const recTop = L.lane === 'wideH' ? y0 + L.headH + 12 : inTop;
        recY = Math.max(recTop + L.recs[0].clipH * 0.35, Math.min(F - L.legMin - (L.recSpan - L.recs[0].clipH * 0.35 - L.size * 0.4), want));
        recFloor = F;
      } else {
        cx = x0 + L.laneW / 2;
        F = inTop + (1 + TH) * OH;
        recX = x0 + (L.laneW - L.recBlockW) / 2 + 16;
        recY = F + 16 + 16 + L.recs[0].clipH * 0.35;
        recFloor = y0 + L.laneH - 16;
      }
      const P = i ? 'rB' : 'rA';
      const rec = recordBuild(ctx, L.recs[i], {prefix: P, x: recX, y: recY, kind: p.object.kind});
      const railY = rec.box.y + rec.box.h + L.railGap * 0.6;
      const plot = plotterArt(ctx, {prefix: `${P}p`, x0: recX - 10, x1: recX + L.RW + 10 + L.railExt, railY, s: L.size});
      const obj = objectArt(ctx, {name: i ? 'oB' : 'oA', kind: p.object.kind, H: OH, level: 0});
      const objBase = {x: cx, y: F - TH * OH};
      return {i, x0, y0, head, cx, F, recX, recY, recFloor, rec, railY, plot, obj, objBase, row: rec.rows[0], P,
        spot: {x: objBase.x + G.spot.x, y: objBase.y + G.spot.y}};
    });
    // guide: rings on the same spot in both objects, joined above the lanes (row) or along the left edge (column)
    const ringR = OH * 0.2;
    const [la, lb] = L.lanes;
    let guideD, labelAt;
    if (L.arr === 'row') {
      const gy = la.y0 - L.guideH / 2 - 4;
      const topA = la.spot.y - ringR, topB = lb.spot.y - ringR;
      guideD = `M${r(la.spot.x)} ${r(topA)}V${r(gy)}H${r(lb.spot.x)}V${r(topB)}`;
      labelAt = {x: (la.spot.x + lb.spot.x) / 2, y: gy};
    } else {
      const gx = MARGIN + 4;
      const lA = la.spot.x - ringR, lB = lb.spot.x - ringR;
      const midY = (la.y0 + L.laneH + lb.y0) / 2;
      guideD = `M${r(lA)} ${r(la.spot.y)}H${r(gx)}V${r(lb.spot.y)}H${r(lB)}`;
      labelAt = {x: MARGIN + L.laneW / 2, y: midY};
    }
    L.ringR = ringR;
    L.guideD = guideD;
    const gtext = p.comparisonLabels.guide || t.guide;
    L.guideChip = textOn ? chipG(ctx, gtext, {x: labelAt.x, y: labelAt.y - L.size * 0.9, anchor: 'middle', maxWidth: Math.min(full, 700), size: L.size, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    // shared entries and notes (one band of chips under the lanes)
    const sy = y + 16;
    L.bandNodes = [];
    if (L.shared.bsz.length) {
      const pl = L.textcol
        ? flowRows(L.shared.bsz, {x: MARGIN + L.laneW + 24, y: Math.max(0, (Dv.h - L.shared.bandH) / 2), w: L.colW, gap: 18, rowGap: 10}).placed
        : flowRows(L.shared.bsz, {x: MARGIN, y: sy, w: full, gap: 18, rowGap: 10, center: true}).placed;
      for (const q of pl) {
        const it = q.it.it;
        const st = it.key === 'changed' ? {fill: th.accentSoft, stroke: th.accent} : it.key === 'sharedHead' ? {fill: th.paperShade, stroke: th.inkSoft} : {};
        const b = q.it.build(q.x, q.y, `band-${it.key}`, st);
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / Dv.w, Dr.h / Dv.h);
    L.dx = (Dr.w - Dv.w * L.k) / 2;
    L.dy = (Dr.h - Dv.h * L.k) / 2;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const OH = L.OH;
    const laneNode = ln => {
      const legX = [ln.recX + L.RW * 0.2, ln.recX + L.RW * 0.8];
      const easel = g(null,
        legX.map(x => h('path', {d: `M${r(x)} ${r(ln.railY)}L${r(x + (x < ln.recX + L.RW / 2 ? -1 : 1) * L.size)} ${r(ln.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(6, L.size * 0.35)), 'stroke-linecap': 'round'})),
        h('path', {d: `M${r(ln.recX + L.RW / 2)} ${r(ln.railY)}V${r(ln.recFloor)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(5, L.size * 0.28)), 'stroke-linecap': 'round'}));
      const n = ln.i ? 'B' : 'A';
      // the lane's floor runs the whole lane (both lanes identical)
      const x0f = ln.x0 + 6;
      const x1f = ln.x0 + L.laneW - 6;
      return g({name: `lane${n}`},
        floorArt(ctx, {name: `floor${n}`, x0: x0f, x1: x1f, floorY: ln.F}),
        L.lane === 'tall' ? floorArt(ctx, {name: `floor2${n}`, x0: ln.recX - 30, x1: ln.recX + L.recBlockW - 16, floorY: ln.recFloor}) : null,
        tableArt(ctx, {name: `table${n}`, x0: ln.cx - OH * TW / 2, x1: ln.cx + OH * TW / 2, topY: ln.F - TH * OH, floorY: ln.F}),
        g({name: `obj${n}`, transform: T(ln.objBase.x, ln.objBase.y)}, ln.obj.node),
        ln.obj.chip,
        easel,
        ln.rec.node,
        ln.plot.node,
        g({name: `ring${n}`, opacity: 0}, h('circle', {cx: r(ln.spot.x), cy: r(ln.spot.y), r: r(L.ringR), fill: 'none', stroke: th.accent, 'stroke-width': 4})),
        ln.head.node,
      );
    };
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.lanes.map(laneNode),
      g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: L.guideD, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}),
        L.guideChip ? L.guideChip.node : null),
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const OH = L.OH;
    const nodes = {};
    const isVase = p.object.kind === 'vase';
    const textOn = ctx.show('key');
    const look = [];
    L.lanes.forEach(ln => {
      const n = ln.i ? 'B' : 'A';
      // the object: only B changes (0.20–0.37)
      const a = ln.i ? ease.outQuad(seg(u, ...W.crack)) : 0;
      const b = ln.i ? (isVase ? (u >= W.chip[0] ? Math.max(1e-6, seg(u, ...W.chip)) : 0) : seg(u, ...W.scratch)) : 0;
      Object.assign(nodes, ln.obj.frame({a, b}));
      nodes[`obj${n}`] = {transform: T(ln.objBase.x, ln.objBase.y)};
      let chip = null;
      if (isVase) {
        const G = L.G;
        const from = {x: ln.objBase.x + G.chipFrom.x, y: ln.objBase.y + G.chipFrom.y};
        const rest = {x: ln.objBase.x + G.chipRest.x, y: ln.objBase.y + G.chipRest.y - OH * CHIP_REST_DY};
        const s = b > 0 ? seg(u, ...W.chip) : 0;
        const Q = {x: from.x - 0.12 * OH, y: from.y - 0.12 * OH};
        chip = {x: (1 - s) ** 2 * from.x + 2 * s * (1 - s) * Q.x + s * s * rest.x, y: (1 - s) ** 2 * from.y + 2 * s * (1 - s) * Q.y + s * s * rest.y};
        nodes[`o${n}-chip`] = {transform: T(chip.x, chip.y, CHIP_REST_ROT * ease.outQuad(s))};
      }
      // both plotters write their state row at the same time
      const wr = seg(u, ...W.write);
      const w0 = writeRow(ctx, ln.P, ln.row, wr, textOn);
      Object.assign(nodes, w0.nodes);
      nodes[`${ln.P}-icon-state`] = {opacity: r(seg(u, ...W.icon), 3)};
      let tip;
      const park = ln.plot.parkTip;
      if (u < W.toRow[0]) tip = park;
      else if (u < W.write[0]) {
        const s = ease.inOutQuad(seg(u, W.toRow[0], W.write[0]));
        tip = {x: lerp(park.x, ln.row.lines[0].x, s), y: lerp(park.y, w0.tip.y, ease.inOutQuad(seg(s, 0.4, 1)))};
      } else if (u < W.park[0]) tip = w0.tip;
      else {
        const s = ease.inOutQuad(seg(u, ...W.park));
        tip = {x: lerp(w0.tip.x, park.x, s), y: lerp(w0.tip.y, park.y, ease.inOutQuad(seg(s, 0, 0.6)))};
      }
      Object.assign(nodes, ln.plot.frame(tip));
      nodes[ln.i ? 'hB' : 'hA'] = {opacity: r(seg(u, ...W.heads), 3)};
      nodes[`ring${n}`] = {opacity: r(seg(u, ...W.rings), 3)};
      // lane description in its own coordinates (for the identical-before-the-change check)
      // (lane-relative positions rounded to 0.1 unit: the two lanes' origins differ only by float noise)
      look.push({a: r(a, 3), b: r(clamp(b), 3), chip: chip ? {x: r(chip.x - ln.x0, 1), y: r(chip.y - ln.y0, 1)} : null, written: r(wr, 3), tip: {x: r(tip.x - ln.x0, 1), y: r(tip.y - ln.y0, 1)}, head: r(seg(u, ...W.heads), 3)});
    });
    nodes.guide = {opacity: r(seg(u, ...W.guide), 3)};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'key' ? seg(u, ...W.key) : b.when === 'shared' ? seg(u, ...W.shared) : seg(u, ...W.note), 3)};
    const [la, lb] = L.lanes;
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.record[1] ? 'record' : 'guide',
      kind: p.object.kind,
      lookA: look[0], lookB: {...look[1]},
      changedB: look[1].a > 0 || look[1].b > 0,
      changedA: look[0].a > 0 || look[0].b > 0,
      written: look.map(q => q.written),
      tipA: {x: r(la.plot.frame ? look[0].tip.x + la.x0 : 0), y: r(look[0].tip.y + la.y0)},
      tipB: {x: r(look[1].tip.x + lb.x0), y: r(look[1].tip.y + lb.y0)},
      chipB: look[1].chip ? {x: r(look[1].chip.x + lb.x0), y: r(look[1].chip.y + lb.y0)} : null,
      guideShown: seg(u, ...W.guide) >= 1,
      keyShown: seg(u, ...W.key) >= 1,
      lanes: L.lanes.map(ln => ({x: r(ln.x0), y: r(ln.y0), w: r(L.laneW), h: r(L.laneH)})),
      arrangement: L.arr, laneMode: L.lane,
      layout: {OH: r(OH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, why: L.why},
    };
    // before the change beat the two lanes are identical (heads aside, which name the sides)
    if (u < CHANGE_AT) semantic.lookB = {...look[1]};
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-05-contrast',
    title: 'Material damage — object before and object after, two scenes that differ only in the object’s state',
    titleEs: 'Daño material — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Daño material',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical display corners, A and B, each with the object on a table and an incident clipboard on an easel. Only in B the object changes to its altered state (crack and chipped lip, or dent and scratches); then both plotters write their state row in parallel. Rings and a guide mark the one spot that differs. Shared entries are drawn once. No winner, no outcome; nothing is valued and no fault, liability, compensation or causation is stated.',
    tags: ['causation', 'damage', 'material damage', 'contrast', 'before and after', 'incident record', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene,
});
