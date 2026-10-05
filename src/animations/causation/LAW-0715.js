/**
 * LAW-0715 — Contribución de la persona afectada · contrast
 *
 * Storyboard (two complete lane scenes of equal size and timing; only WHICH
 * supplied conduct runs differs):
 *  0.00–0.17 base      Two identical scenes, A and B: the same slab, the same
 *                      two lanes, barriers, event pad and supplied steps, both
 *                      trolleys parked at their lane starts. Header chips "● A ·
 *                      Conduct of A · as supplied" and "◆ B · Conduct of B · the
 *                      affected person, as supplied" (equal chips, same colour).
 *                      At the change beat each head's text swaps in sequence
 *                      (old line out 0.200–0.212, new line in 0.214–0.226).
 *                      Shared facts are drawn ONCE in the band.
 *  0.17–0.40 change    One localized change per scene: a ● start pad under A's
 *                      lane-A trolley, a ◆ start pad under B's lane-B trolley
 *                      (0.20–0.34). Equal pads, equal weight. The "Changed fact"
 *                      chip names it.
 *  0.40–0.77 run       The same action runs in parallel, at the same time and
 *                      speed: in A the lane-A trolley rolls to its barrier, in B
 *                      the lane-B trolley rolls to its barrier (0.42–0.66); the
 *                      other trolley stays parked in each scene.
 *  0.77–1.00 guide     A solid ink guide joins A's running trolley to the same
 *                      spot in B, and a bracket over B's running lane carries
 *                      "Only this differs: which conduct runs". A neutral note
 *                      ("No winner, no conclusion") and the key "As supplied · no
 *                      conclusion drawn". Nothing reaches the event; no share,
 *                      fault or contributory doctrine is stated.
 * Wide boxes: A and B side by side. Tall boxes: A above B. Layout engine copied
 * from LAW-0711 (accepted causation-08 contrast).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0715
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  caFields, CA_STRINGS, CA_DEFAULTS, CA_ES_DEFAULTS, resolveCA, entryText, linkNotes, altText, glueN as gp, unwidow,
  CART_TOP, fieldGeom, fieldW, fieldH, itemPlaces, slabArt, cartArt, eventArt, itemArt, laneBarrier, floorArt,
  iconChip, flowRows, fitG, chipG, sideMark,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/contribucion-afectada.js';

const ID = 'LAW-0715';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], run: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0, 0.04], lvOut: [0.2, 0.212], lvIn: [0.214, 0.226], shared: [0, 0.05], stops: [0.2, 0.34], changed: [0.22, 0.3],
  roll: [0.42, 0.66],
  line: [0.77, 0.81], guide: [0.79, 0.84], note: [0.82, 0.87], key: [0.84, 0.89],
};
const ROW_GAP = 8, BAND_GAP = 12, HEAD_GAP = 8;

const strings = {
  en: {...CA_STRINGS.en, shared: 'Same in A and B (as supplied)', changed: 'Changed fact', guide: 'Only this differs', neutral: 'No winner, no conclusion: two scenes side by side', inA: 'runs in lane A', inB: 'runs in lane B', which: 'which supplied conduct runs'},
  es: {...CA_STRINGS.es, shared: 'Igual en A y B (según lo aportado)', changed: 'Hecho que cambia', guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos escenas comparadas', inA: 'avanza en el carril A', inB: 'avanza en el carril B', which: 'qué conducta aportada avanza'},
};

const sceneSchema = {
  ...caFields,
  ...contrastFields(),
};

const defaultParams = {
  ...CA_DEFAULTS,
  scenarioA: {label: 'Conduct of A', caption: 'as supplied'},
  scenarioB: {label: 'Conduct of B', caption: 'the affected person, as supplied'},
  changedFact: 'Only which conduct runs differs: lane A in A, lane B in B',
  sharedFacts: ['Same event, same lanes, same barriers'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'No winner, no conclusion: two scenes side by side'},
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...CA_ES_DEFAULTS,
  scenarioA: {label: 'Conducta de A', caption: 'según lo aportado'},
  scenarioB: {label: 'Conducta de B', caption: 'la persona afectada, según lo aportado'},
  changedFact: 'Solo cambia qué conducta avanza: carril A en A, carril B en B',
  sharedFacts: ['Mismo evento, mismos carriles, mismas barreras'],
  comparisonLabels: {guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos escenas comparadas'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['row']},
  square: {size: 24, minSize: 17, arr: ['row', 'column', 'textcol']},
  portrait: {size: 25, minSize: 17, arr: ['column']},
};
const RW_ = fieldW(), RH_ = fieldH();



/** Header chip: solid ●/◆ cue (equal weight, same colour) + "A · label" / "B · label". */
function headChip(ctx, it, size, maxW, textOn, hMin = 0) {
  const th = ctx.theme;
  const R = size * 0.8;
  const fo = {maxWidth: maxW - 2 * R - 34, size, minSize: size, maxLines: 4, weight: 700};
  const fit = textOn ? fitG(ctx, unwidow(gp(it.text), t0 => fitG(ctx, t0, fo)), fo) : null;
  // (the same head without its ring, shown before the change beat in the SAME frame)
  const fit0 = textOn && it.text0 ? fitG(ctx, unwidow(gp(it.text0), t0 => fitG(ctx, t0, fo)), fo) : null;
  const tw = Math.max(fit ? fit.width : 0, fit0 ? fit0.width : 0), th0 = Math.max(fit ? fit.height : 0, fit0 ? fit0.height : 0);
  const w = 2 * R + (fit ? 16 + tw + 18 : 12);
  const hh = Math.max(2 * R + 10, fit ? th0 + size * 0.8 : 0, hMin);
  return {
    hasText0: Boolean(fit0), w, h: hh, bad: fit ? fit.truncated || fit.broken || Boolean(fit0 && (fit0.truncated || fit0.broken)) : false,
    build(x, y, name) {
      const cy = y + hh / 2;
      return {node: g({name, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
        sideMark(ctx, {cx: x + R + 6, cy, s: R * 1.5, side: it.side}),
        fit0 ? g({name: `${name}-t0`}, textBlock(fit0, {x: x + 2 * R + 20, y: cy - fit0.height / 2, fill: th.ink})) : null,
        fit ? g({name: `${name}-t1`, opacity: fit0 ? 0 : 1}, textBlock(fit, {x: x + 2 * R + 20, y: cy - fit.height / 2, fill: th.ink})) : null,
      ), box: {x, y, w, h: hh}};
    },
  };
}

/** A stop pad on the plate (● / ◆, identical shape and weight). Local origin = the slot's centre on the plate. */

/** A start pad under a trolley (● / ◆ at its centre, identical shape and weight; shows once the trolley leaves it). */
function stopArt(ctx, {name, G, side}) {
  const th = ctx.theme;
  const rx = G.cartW * 0.72, ry = G.LT * 1.25;
  return g({name, opacity: 0},
    h('ellipse', {cx: 0, cy: 0, rx: r(rx), ry: r(ry), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3}),
    sideMark(ctx, {cx: 0, cy: 0, s: G.headS * 0.7, side}),
  );
}

function rangedChip(ctx, memo, key, it, size, mw0, maxLines) {
  const rk = `${size}|${key}`;
  let rs = memo.ranges.get(rk);
  if (!rs) { rs = []; memo.ranges.set(rk, rs); }
  for (const q of rs) {
    if (q.c.bad ? mw0 <= q.hi : q.c.w <= mw0 + 0.5 && (mw0 <= q.hi || q.c.lines === 1)) return q.c;
  }
  const c = {it, ...iconChip(ctx, it, {size, maxW: mw0, maxLines})};
  rs.push({hi: mw0, c});
  return c;
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, arr} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  const textcol = arr === 'textcol';
  const colW = textcol ? Math.round(full * cfg.colF) : 0;
  const gapL = arr === 'row' ? 34 : 24;
  const laneW = arr === 'row' ? (full - gapL) / 2 : textcol ? full - colW - 24 : full;
  const v = ctx.view, fs = Math.min(v.content.w / D.w, v.content.h / D.h);
  const need = arr === 'row' ? 0.4 : textcol ? 0.55 : 0.71;
  if (!cfg.fallback && laneW - 12 < need * v.width / fs + 2) return {bad: 'lane-share'};
  // headSide: each lane's head chip stands right of its field, at the field's top (B's guide chip under it)
  const side = Boolean(cfg.headSide);
  const hw = side ? Math.min(laneW * 0.4, 420) : laneW;
  const hk = `${size}|${Math.round(hw)}`;
  let heads = memo.heads.get(hk);
  if (!heads) {
    // (A's and B's head chips get the same height: equal frames for the two compared groupings)
    const h0 = Math.max(...base.heads.map(it => headChip(ctx, it, size, hw, textOn).h));
    heads = base.heads.map(it => headChip(ctx, it, size, hw, textOn, h0));
    memo.heads.set(hk, heads);
  }
  if (heads.some(q => q.bad) && !cfg.force) return {bad: 'head'};
  const headH = Math.max(...heads.map(q => q.h));
  // the guide chip beside B's field (measured once)
  const gk = `${size}|${Math.round(laneW)}|${cfg.wideGuide ? 1 : 0}`;
  let gc = memo.gc.get(gk);
  if (gc === undefined) {
    const o = {x: 0, y: 0, maxWidth: Math.max(size * 8, Math.min(laneW * (cfg.wideGuide ? 0.56 : 0.4), cfg.wideGuide ? 440 : 360)), size, maxLines: 6};
    gc = textOn ? chipG(ctx, unwidow(base.guideText, t0 => chipG(ctx, t0, o).fit), o) : null;
    if (gc) gc.text = unwidow(base.guideText, t0 => chipG(ctx, t0, o).fit);
    memo.gc.set(gk, gc);
  }
  if (gc && (gc.fit.truncated || gc.fit.broken) && !cfg.force) return {bad: 'guide'};
  // guideTop: the guide chip stands above B's field instead of beside it (the field takes the lane's width)
  const top = Boolean(cfg.guideTop) && !side;
  if (cfg.guideTop && side) return {bad: 'guideTop'};
  // guideBand: the guide chip joins the shared band (with a leader from the bracket), the fields take the lanes
  const gband = Boolean(cfg.guideBand) && !side && !top;
  if (cfg.guideBand && (side || cfg.guideTop)) return {bad: 'guideBand'};
  if (gband) gc = null;
  const gcW = side ? Math.max(gc ? gc.box.w : 0, ...heads.map(q => q.w)) + 30 : gc && !top ? gc.box.w + 36 : 0;
  const bw = textcol ? colW : full;
  const low = textcol && cfg.low;
  // (half: 1 = chips at most half the band wide, 2 = at most a third — three short chips to a row)
  const measureBand = (items, w, lines, half) => {
    const mw = half === 2 ? (w - 36) / 3 : half ? (w - 18) / 2 : Math.min(w, 760);
    // (measured longest text first: a band with a chip that does not fit is given up without measuring the rest)
    const bsz = [];
    const order = textOn ? items.map((it, i) => i).sort((a0, b0) => String(items[b0].text).length - String(items[a0].text).length) : [];
    for (const i of order) {
      const it = items[i];
      const c = rangedChip(ctx, memo, `${it.key}|${lines}`, it, size, it.key === 'sharedHead' ? w : mw, lines);
      if (c.bad || c.w > w + 0.5) return {bsz: [], bandH: 0, bad: true};
      bsz[i] = c;
    }
    const fl = flowRows(bsz, {x: 0, y: 0, w, gap: 18, rowGap: ROW_GAP});
    return {bsz, bandH: bsz.length ? fl.bottom : 0, bad: false};
  };
  const items = gband ? [base.guideItem, ...base.band] : base.band;
  const sk = `${size}|${Math.round(bw)}|${cfg.half}|${low}|${gband}`;
  let shared = memo.shared.get(sk);
  if (!shared) {
    shared = measureBand(low ? items.filter(it => it.when === 'shared') : items, bw, textcol ? 6 : 3, textcol ? 0 : cfg.half || 0);
    shared.low = low ? measureBand(items.filter(it => it.when !== 'shared'), laneW, 3, false) : null;
    memo.shared.set(sk, shared);
  }
  if ((shared.bad || (shared.low && shared.low.bad)) && !cfg.force) return {bad: 'shared'};
  if (textcol && shared.bandH > D.h) return {bad: 'col'};
  const bandH = shared.low ? (shared.low.bandH ? shared.low.bandH + BAND_GAP : 0) : shared.bandH && !textcol ? shared.bandH + BAND_GAP : 0;
  const avail = D.h - bandH - (arr !== 'row' ? gapL : 0);
  const perLaneH = arr === 'row' ? avail : avail / 2;
  const innerH = perLaneH - (side ? 0 : headH) - HEAD_GAP - (top && gc ? gc.box.h + 14 + 0 : 0);
  const PH = Math.min((laneW - gcW - 12) / RW_, (innerH - 16) / RH_);
  if (!(PH >= cfg.hMin)) return {bad: 'PH', PH};
  // the guide chip fits beside B's field, above B's floor (headSide: under B's head chip)
  if (gc && !top && gc.box.h + (side ? headH + 12 : 0) > RH_ * PH - 20) return {bad: 'guide-h'};
  if (side && headH > RH_ * PH * 0.5) return {bad: 'head-h'};
  if (cfg.dry) return {PH, size, cfg: {...cfg, dry: false}};
  return {PH, size, cfg, arr, laneW, laneH: perLaneH, gapL, heads, headH, shared, bandH, gc, gcW, colW, textcol, headSide: side, guideTop: top, guideBand: gband};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveCA(p);
    const A = p.scenarioA, B = p.scenarioB;
    const sharedRows = [
      {key: 'object', icon: 'event', text: `${p.origin.name} · ${t.lanes}`},
      {key: 'loss0', icon: 'loss', text: p.losses[0].label},
      // (the focus consequence's row carries no ring glyph: its grouping is the contrasted fact)
      ...M.entries.map(e => ({key: `ev${e.i}`, icon: 'item', item: e.i, lane: e.lane, text: entryText(e)})),
      ...p.sharedFacts.map((f, i) => ({key: `sf${i}`, icon: 'record', text: f})),
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: altText(ctx, a)})),
      ...linkNotes(ctx, M),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'loss', text: `${t.alsoNoted}: ${p.losses[1].label}`}] : []),
    ];
    // (the chips that appear later come first, so the shared rows shown from the first frame take the band's foot)
    const band = [
      {key: 'changed', icon: 'lanes', text: `${t.changed}: ${p.changedFact}`, when: 'changed'},
      {key: 'neutral', text: p.comparisonLabels.neutral || t.neutral, when: 'note'},
      {key: 'key', text: t.key, when: 'key'},
      {key: 'sharedHead', text: t.shared, when: 'shared'},
      ...sharedRows.map(rw => ({...rw, when: 'shared'})),
    ];
    const head = (k, S) => `${k} · ${S.label}${S.caption ? ` · ${S.caption}` : ''}`;
    const base = {
      M, heads: [
        {key: 'hA', side: 'before', text: `${head('A', A)} · ${t.inA}`, text0: head('A', A)},
        {key: 'hB', side: 'after', text: `${head('B', B)} · ${t.inB}`, text0: head('B', B)},
      ],
      band, guideText: gp(`${p.comparisonLabels.guide || t.guide}: ${t.which}`),
      memo: {shared: new Map(), gc: new Map(), heads: new Map(), ranges: new Map()},
    };
    base.guideItem = {key: 'guide', icon: 'lanes', text: base.guideText, when: 'guide'};
    const hMin = ctx.view.shape === 'portrait' ? 160 : 100;
    let pick = null, best = null;
    const why = [];
    const v0 = ctx.view, fs0 = Math.min(v0.content.w / ctx.design.w, v0.content.h / ctx.design.h);
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      if (best && pick && pick.subj && size < Math.max(best.size - 3, Math.min(best.size, 20)) - 1e-9) break;
      for (const arr of SH.arr) for (const half of arr === 'textcol' ? [0, 1] : [0, 1, 2]) for (const headSide of [false, true]) for (const guideTop of [false, true]) for (const guideBand of [false, true]) for (const wideGuide of [false, true]) for (const colF of arr === 'textcol' ? [0.28, 0.3, 0.32, 0.33] : [0]) {
        const low = arr === 'textcol' && half;
        const X = compose(ctx, base, {size, arr, half: arr === 'textcol' ? false : half, low, colF, headSide, guideTop, guideBand, wideGuide, hMin, dry: true});
        if (!X.cfg) { why.push(`${arr}/${half ? 'h' : ''}@${size}:${X.bad}${X.PH ? Math.round(X.PH) : ''}`); continue; }
        if (!best) best = X;
        // each field (plate, objects, markers, floor) reaches >= 0.21 of the frame height when it can (subject floor
        // 0.20 + margin); then text at >= 20 (the 19.5 px baseline floor); then the larger field
        const subj = (X.PH * RH_ + 16) * fs0 >= 0.21 * v0.height;
        const ok20 = s0 => s0 >= 20 - 1e-9;
        const key = q => [q.subj ? 1 : 0, ok20(q.size) ? 1 : 0, q.PH];
        X.subj = subj;
        if (!pick || (() => { const a = key(X), b = key(pick); return a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2] + 1e-6; })()) pick = X;
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    let Dv = ctx.design;
    // fallback: a taller virtual box scaled into the real one (flagged); last resort (e.g. the DOM-less text estimator):
    // text limits relaxed, flagged in semantic.problems — never throws
    for (const force of [false, true]) {
      for (let f = 1.1; f <= (force ? 12.01 : 4.01) && !L; f += force ? 0.5 : 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const arr of SH.arr) {
          if (L) break;
          const X = compose(c2, base, {size: SH.minSize, arr, hMin: force ? 20 : 60, fallback: true, colF: 0.3, force});
          if (X.heads) { L = X; Dv = c2.design; if (force) L.problems = ['no-layout-fits']; }
        }
      }
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 40);
    L.M = M;
    const full = Dv.w - 2 * MARGIN;
    const PH = L.PH;
    const lanesH = L.arr === 'row' ? L.laneH : 2 * L.laneH + L.gapL;
    const blockH = lanesH + L.bandH;
    // spare height goes mostly above the lanes, so the late chips (changed fact, note, key) never leave the foot empty
    let y = Math.max(0, (Dv.h - blockH) * 0.75);
    const lowY = y;
    if (L.shared && L.shared.low) y += L.bandH;
    const laneTop = [];
    if (L.arr === 'row') { laneTop.push(y, y); y += L.laneH; } else { laneTop.push(y); y += L.laneH + L.gapL; laneTop.push(y); y += L.laneH; }
    const laneX = L.arr === 'row' ? [MARGIN, MARGIN + L.laneW + L.gapL] : [MARGIN, MARGIN];
    L.lanes = [0, 1].map(i => {
      const x0 = laneX[i], y0 = laneTop[i];
      const hd = L.heads[i];
      const mw = RW_ * PH;
      const mx0 = x0 + Math.max(0, (L.laneW - mw - L.gcW) / 2);
      const F = y0 + L.laneH - 16;
      const G = fieldGeom(mx0, F, PH);
      const head = L.headSide ? hd.build(G.x1 + 24, G.top + 2, i ? 'hB' : 'hA') : hd.build(x0 + (L.laneW - hd.w) / 2, y0, i ? 'hB' : 'hA');
      // the running lane of this scene: lane a in A, lane b in B (the one contrasted fact)
      const run = i ? 'b' : 'a';
      return {i, x0, y0, head, F, G, mx0, run, places: itemPlaces(G, M)};
    });
    const [, lb] = L.lanes;
    // B's bracket spans its running trolley's path, just above the trolley's flag
    L.bx = [lb.G.cartX(0) - lb.G.cartW * 0.5, lb.G.cartX(1) + lb.G.cartW * 0.5];
    L.brY = lb.G.yB - (CART_TOP + 0.04) * PH;
    if (L.gc && L.guideTop) {
      const G = lb.G;
      const mid = (L.bx[0] + L.bx[1]) / 2;
      const w0 = L.gc.box.w;
      const chipX = clamp(mid - w0 / 2, lb.x0, lb.x0 + L.laneW - w0);
      const y0 = Math.max(lb.head.box.y + lb.head.box.h + 8, G.top - 10 - L.gc.box.h);
      L.guideChip = chipG(ctx, L.gc.text, {x: chipX, y: y0, maxWidth: L.gc.box.w + 1, size: L.size, maxLines: 6, fill: th.card, stroke: th.accent2, name: 'guide-chip'});
      L.guideLead = `M${r(mid)} ${r(L.brY - 2)}V${r(y0 + L.guideChip.box.h)}`;
    } else if (L.gc) {
      const G = lb.G;
      const chipX = G.x1 + 24;
      const y0 = L.headSide ? Math.max(lb.head.box.y + lb.head.box.h + 12, Math.min(L.brY - L.gc.box.h / 2, lb.F - 24 - L.gc.box.h)) : clamp(L.brY - L.gc.box.h / 2, G.top + 2, lb.F - 24 - L.gc.box.h);
      L.guideChip = chipG(ctx, L.gc.text, {x: chipX, y: y0, maxWidth: L.gc.box.w + 1, size: L.size, maxLines: 6, fill: th.card, stroke: th.accent2, name: 'guide-chip'});
      const my = clamp(L.brY, y0 + 14, y0 + L.guideChip.box.h - 14);
      const sx = L.bx[1] + 4;
      L.guideLead = Math.abs(my - L.brY) < 1 ? `M${r(sx)} ${r(L.brY)}H${r(chipX)}` : `M${r(sx)} ${r(L.brY)}H${r(chipX - 12)}V${r(my)}H${r(chipX)}`;
    }
    const sy = L.shared && L.shared.low ? lowY : y + BAND_GAP;
    L.bandNodes = [];
    if (L.shared.bsz.length) {
      const pl = L.textcol
        ? [...flowRows(L.shared.bsz, {x: MARGIN + L.laneW + 24, y: Math.max(0, (Dv.h - L.shared.bandH) / 2), w: L.colW, gap: 18, rowGap: ROW_GAP}).placed,
          ...(L.shared.low ? flowRows(L.shared.low.bsz, {x: MARGIN, y: sy, w: L.laneW, gap: 18, rowGap: ROW_GAP, center: true}).placed : [])]
        : flowRows(L.shared.bsz, {x: MARGIN, y: sy, w: full, gap: 18, rowGap: ROW_GAP, center: true}).placed;
      for (const q of pl) {
        const it = q.it.it;
        const st = it.key === 'changed' || it.key === 'guide' ? {fill: it.key === 'guide' ? th.card : th.accent2Soft, stroke: th.accent2} : it.key === 'sharedHead' ? {fill: th.paperShade, stroke: th.inkSoft} : {};
        const b = q.it.build(q.x, q.y, `band-${it.key}`, st);
        L.bandNodes.push({key: it.key, when: it.when, node: b.node, box: b.box});
      }
    }
    if (L.guideBand) {
      // the leader: from the bracket's right end, out past B's field, down beside it and into the guide chip's top
      const gb = L.bandNodes.find(b => b.key === 'guide');
      if (gb) {
        const G = lb.G;
        const xr = Math.min(lb.x0 + L.laneW - 4, G.x1 + 14);
        const cx0 = clamp(xr, gb.box.x + 20, gb.box.x + gb.box.w - 20);
        const yb = gb.box.y - 10;
        L.guideLead = `M${r(L.bx[1] + 4)} ${r(L.brY)}H${r(xr)}V${r(yb)}H${r(cx0)}V${r(gb.box.y)}`;
        L.guideBandLead = true;
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
    const laneNode = ln => {
      const n = ln.i ? 'B' : 'A';
      const G = ln.G;
      // the objects, barriers and trolleys, back to front (lane A behind lane B)
      const stand = [
        {y: G.py, node: g({transform: T(G.px, G.py)}, eventArt(ctx, {R: G.padR}))},
        ...ln.places.map(q => ({y: q.y, node: g({transform: T(q.x, q.y)}, itemArt(ctx, {i: q.i, s: q.s}))})),
        ...['a', 'b'].map(l => ({y: G.laneY(l) + 0.01, node: g({transform: T(G.xb, G.laneY(l))}, laneBarrier(ctx, {name: `lb${n}${l}`, G}))})),
        ...['a', 'b'].map(l => ({y: G.laneY(l) + 0.02, node: g({name: `cart${n}${l}`, transform: T(G.cartX(0), G.laneY(l))}, cartArt(ctx, {name: `ct${n}${l}`, PH: G.PH, side: l}))})),
      ].sort((a, b) => a.y - b.y);
      return g({name: `lane${n}`},
        floorArt(ctx, {name: `floor${n}`, x0: ln.x0 + 6, x1: ln.x0 + L.laneW - 6, floorY: ln.F}),
        g({name: `field${n}`},
          slabArt(ctx, {G}),
          // the localized change: A's ● start pad under its lane-A trolley, B's ◆ pad under its lane-B trolley
          g({name: `stop${n}`, transform: T(G.cartX(0), G.laneY(ln.run))}, stopArt(ctx, {name: `stop${n}-art`, G, side: ln.run})),
          stand.map(q => q.node)),
        ln.head.node,
      );
    };
    const [la, lb] = L.lanes;
    // the guide: A's running trolley carried to the same spot in B, routed above the fields
    const sA = {x: la.G.cartX(1), y: la.G.yA - CART_TOP * la.G.PH - 6}, sB = {x: lb.G.cartX(1), y: lb.G.yA - CART_TOP * lb.G.PH - 6};
    let lineD;
    if (L.arr === 'row') {
      const yy = Math.min(la.G.top, lb.G.top) - 6;
      lineD = `M${r(sA.x)} ${r(sA.y)}V${r(yy)}H${r(sB.x)}V${r(sB.y)}`;
    } else {
      const xl = la.G.x0 - 2;
      lineD = `M${r(sA.x)} ${r(sA.y)}V${r(la.G.top - 6)}H${r(xl)}V${r(lb.G.top - 6)}H${r(sB.x)}V${r(sB.y)}`;
    }
    const tick = L.brY + lb.G.PH * 0.06;
    const bD = `M${r(L.bx[0])} ${r(tick)}V${r(L.brY)}H${r(L.bx[1])}V${r(tick)}`;
    const bl = Math.abs(L.bx[1] - L.bx[0]) + 2 * (tick - L.brY) + 10;
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.lanes.map(laneNode),
      g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d: lineD, fill: 'none', stroke: th.ink, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}),
        h('path', {name: 'guide-bracket', d: bD, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(bl)} ${r(bl + 20)}`, 'stroke-dashoffset': r(bl)}),
        L.guideChip || L.guideBandLead ? h('path', {name: 'guide-lead', d: L.guideLead, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linejoin': 'round'}) : null),
      L.guideChip ? g({name: 'guide-chip-g', opacity: 0}, L.guideChip.node) : null,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const look = [];
    const f = ease.inOutCubic(seg(u, ...W.roll));
    const st = ease.outCubic(seg(u, ...W.stops));
    const pos = {};
    L.lanes.forEach(ln => {
      const n = ln.i ? 'B' : 'A';
      const G = ln.G;
      // the same roll, at the same time and speed, only on this scene's running lane; the other trolley stays parked
      const xs = {a: G.cartX(ln.run === 'a' ? f : 0), b: G.cartX(ln.run === 'b' ? f : 0)};
      for (const l of ['a', 'b']) nodes[`cart${n}${l}`] = {transform: T(xs[l], G.laneY(l))};
      pos[n] = {a: {x: r(xs.a), y: r(G.yA)}, b: {x: r(xs.b), y: r(G.yB)}};
      nodes[`stop${n}-art`] = {opacity: st > 0 ? 1 : 0};
      nodes[`stop${n}`] = {transform: T(G.cartX(0), G.laneY(ln.run) - (1 - st) * G.PH * 0.1)};
      const hn = ln.i ? 'hB' : 'hA';
      nodes[hn] = {opacity: r(seg(u, ...W.heads), 3)};
      if (L.heads[ln.i].hasText0) { nodes[`${hn}-t0`] = {opacity: r(1 - seg(u, ...W.lvOut), 3)}; nodes[`${hn}-t1`] = {opacity: r(seg(u, ...W.lvIn), 3)}; }
      // (scene-local look: each trolley's travel along its lane, the pad's progress)
      look.push({a: r((xs.a - G.cartX(0)) / G.PH, 3), b: r((xs.b - G.cartX(0)) / G.PH, 3), stop: r(st, 3), head: r(seg(u, ...W.heads), 3)});
    });
    nodes.guide = {opacity: r(seg(u, ...W.line), 3)};
    const lb = L.lanes[1];
    const tick = L.brY + lb.G.PH * 0.06;
    const bl = Math.abs(L.bx[1] - L.bx[0]) + 2 * (tick - L.brY) + 10;
    nodes['guide-bracket'] = {'stroke-dashoffset': r(bl * (1 - seg(u, ...W.guide)))};
    if (L.guideChip) nodes['guide-chip-g'] = {opacity: r(seg(u, ...W.guide), 3)};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'guide' ? seg(u, ...W.guide) : b.when === 'key' ? seg(u, ...W.key) : b.when === 'changed' ? seg(u, ...W.changed) : b.when === 'shared' ? seg(u, ...W.shared) : seg(u, ...W.note), 3)};
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.run[1] ? 'run' : 'guide',
      // before the change beat the two scenes are identical (no pad, no trolley has moved)
      lookA: u < W.stops[0] ? {...look[0], stop: 0} : look[0], lookB: u < W.stops[0] ? {...look[1], stop: 0} : look[1],
      stops: r(st, 3), roll: r(f, 3),
      cartAa: pos.A.a, cartAb: pos.A.b, cartBa: pos.B.a, cartBb: pos.B.b,
      runA: L.lanes[0].run, runB: L.lanes[1].run,
      guideShown: seg(u, ...W.guide) >= 1, keyShown: seg(u, ...W.key) >= 1,
      arrangement: L.arr,
      layout: {PH: r(L.PH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, why: L.why},
      ...(L.problems ? {problems: L.problems} : {}),
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-09-contrast',
    title: 'Affected person\'s contribution — two identical lane scenes that differ only in which supplied conduct runs: lane A in A, lane B in B',
    titleEs: 'Contribución de la persona afectada — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Contribución de la persona afectada',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical fictional lane scenes, A (conduct of A, ●) and B (conduct of B, the affected person, ◆): the same slab, lanes, barriers, event and supplied steps, both trolleys parked. One localized change each: a ● start pad under A\'s lane-A trolley, a ◆ pad under B\'s lane-B trolley. The same roll then runs in both at the same time and speed — lane A in A, lane B in B — and stops at the barrier. A guide line and a bracket mark the one difference. Shared facts drawn once. No winner, no conclusion; nothing is weighed, shared out or decided.',
    tags: ['causation', 'affected person', 'contrast', 'parallel lanes', 'two conducts', 'equal weight', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/contribucion-afectada.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
