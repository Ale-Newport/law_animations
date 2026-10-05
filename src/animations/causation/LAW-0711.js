/**
 * LAW-0711 — Alcance del daño · contrast
 *
 * Storyboard (two complete ring fields of equal size and timing; only the
 * supplied grouping of ONE consequence differs):
 *  0.00–0.17 base      Two identical fields, A and B: the same plate, Event A,
 *                      the same supplied consequences in their rings, both
 *                      rings with their ● / ◆ markers, and the focus
 *                      consequence (Consequence 3 by default) waiting at the
 *                      event's side. Header chips "● A · Immediate consequence
 *                      · as supplied" and "◆ B · Subsequent consequence · as
 *                      supplied, to be examined" (equal chips, same colour).
 *                      One frame per head; at the change beat its text swaps in
 *                      sequence, both heads alike: the line without a ring
 *                      fades out (0.200–0.212), then the line with the ring
 *                      fades in (0.214–0.226). The consequences both share are
 *                      drawn ONCE.
 *  0.17–0.40 change    One localized change on each plate: A gets a ● stop pad
 *                      at the inner slot, B a ◆ stop pad at the outer slot
 *                      (0.20–0.34). Equal pads, equal weight. The "Changed
 *                      fact" chip names it.
 *  0.40–0.77 run       In parallel the same action runs on both fields: the
 *                      focus consequence slides out of the event to the inner
 *                      slot (0.40–0.52). Then only on B it slides on across the
 *                      inner ring to the outer slot (0.58–0.74) — the same
 *                      action, adapted only to the contrasted fact.
 *  0.77–1.00 guide     A solid ink guide joins A's consequence to the same spot
 *                      on B, and a bracket on B over its path carries "Only this
 *                      differs: Consequence 3 · <grouping as supplied>". A
 *                      neutral note ("No winner, no
 *                      conclusion") and the key "As supplied · no conclusion
 *                      drawn". The rings are only a supplied grouping; neither
 *                      is excluded, faded or decided; no red.
 * Wide boxes: A and B side by side. Tall boxes: A above B. Layout engine copied
 * from LAW-0707 (accepted causation-07 contrast).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0711
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields, int} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  adFields, AD_STRINGS, AD_DEFAULTS, AD_ES_DEFAULTS, resolveAD, entryText, linkNotes, altText, glueN as gp, unwidow,
  FIELD, fieldGeom, fieldW, fieldH, plateArt, ringArt, postArt, eventArt, itemArt, floorArt,
  iconChip, flowRows, fitG, chipG, sideMark,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/alcance-dano.js';

const ID = 'LAW-0711';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], run: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0, 0.04], lvOut: [0.2, 0.212], lvIn: [0.214, 0.226], shared: [0, 0.05], stops: [0.2, 0.34], changed: [0.22, 0.3],
  slide: [0.4, 0.52], spread: [0.58, 0.74],
  line: [0.77, 0.81], guide: [0.79, 0.84], note: [0.82, 0.87], key: [0.84, 0.89],
};
// the focus consequence's path runs along angle 0 (to the right of the event); the ring markers stand at the back right
const PATH_A = 0, MARK_A = 300, MARK_STEM = 0.1;
const R0 = 0.26; // where the focus consequence waits (× PH from the event's centre): beside the event, not on it
const ITEM_K = 1.25; // the consequences stand a little larger here (the contrasted object stays a real object at 1:1)
// compact spacing (the fields keep the subject floor in square boxes with long texts): between band rows, above the
// band, between a head chip and its field
const ROW_GAP = 8, BAND_GAP = 12, HEAD_GAP = 8;
// this treatment's ring geometry (× PH): a wider inner ring, so the event, the inner consequences and the focus
// consequence's path stand apart; each slot keeps a whole object inside its ring (half an object = 0.18)
const RING = {R1: 0.6, R2: 0.95, rIn: 0.42, rOut: 0.775};
// angles (deg; 0 = the focus path, to the right; 90 = front) of the other consequences, in order of use: inner ones
// round the event's left half, outer ones spread round the whole annulus away from the path and the markers
const INNER_D = [180, 118, 242, 70, 290], OUTER_D = [180, 130, 230, 95, 265, 50];

/** Field geometry of this treatment: the kit's field with this treatment's ring radii. */
function geom(left, floorY, PH) {
  const G = fieldGeom(left, floorY, PH);
  return {...G, R1: RING.R1 * PH, R2: RING.R2 * PH, rIn: RING.rIn * PH, rOut: RING.rOut * PH, postX1: G.cx + RING.R1 * PH, postX2: G.cx + RING.R2 * PH};
}

/** Places of the other consequences (the focus one is posed per frame on the path at angle 0). */
function places(G, M, fi) {
  let ki = 0, ko = 0;
  return M.entries.filter(e => e.i !== fi).map(e => {
    const inner = e.ring === 'inner';
    const deg = inner ? INNER_D[ki++ % INNER_D.length] : OUTER_D[ko++ % OUTER_D.length];
    return {i: e.i, ring: e.ring, deg, ...G.at(inner ? G.rIn : G.rOut, deg)};
  });
}

const strings = {
  en: {...AD_STRINGS.en, shared: 'Same in A and B (as supplied)', changed: 'Changed fact', guide: 'Only this differs', neutral: 'No winner, no conclusion: two groupings side by side', item: 'Consequence', inA: 'inner ring (A)', inB: 'outer ring (B)', asSupplied: 'as supplied'},
  es: {...AD_STRINGS.es, shared: 'Igual en A y B (según lo aportado)', changed: 'Hecho que cambia', guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos agrupaciones comparadas', item: 'Consecuencia', inA: 'anillo interior (A)', inB: 'anillo exterior (B)', asSupplied: 'según lo aportado'},
};

const sceneSchema = {
  ...adFields,
  ...contrastFields(),
  focusItem: int('Index (0-based) of the consequence whose supplied grouping differs: inner ring in A, outer ring in B (its own "ring" value is not used here)', 0, 5),
};

const defaultParams = {
  ...AD_DEFAULTS,
  scenarioA: {label: 'Immediate consequence', caption: 'as supplied'},
  scenarioB: {label: 'Subsequent consequence', caption: 'as supplied, to be examined'},
  changedFact: 'Only where Consequence 3 is grouped differs: inner ring in A, outer ring in B',
  sharedFacts: ['Same event, same consequences, same rings'],
  comparisonLabels: {guide: 'Only this differs', neutral: 'No winner, no conclusion: two groupings side by side'},
  focusItem: 2,
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...AD_ES_DEFAULTS,
  scenarioA: {label: 'Consecuencia inmediata', caption: 'según lo aportado'},
  scenarioB: {label: 'Consecuencia ulterior', caption: 'según lo aportado, por examinar'},
  changedFact: 'Solo cambia dónde se agrupa la consecuencia 3: anillo interior en A, exterior en B',
  sharedFacts: ['Mismo evento, mismas consecuencias, mismos anillos'],
  comparisonLabels: {guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos agrupaciones comparadas'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, arr: ['row']},
  square: {size: 24, minSize: 17, arr: ['row', 'column', 'textcol']},
  portrait: {size: 25, minSize: 17, arr: ['column']},
};
const RW_ = fieldW(), RH_ = fieldH();
// the bracket over B's path stands this far above the plate centre (× PH); the field's top is above it
const BR_UP = FIELD.item * 1.2 + 0.1;

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
function stopArt(ctx, {name, G, side}) {
  const th = ctx.theme;
  const rx = G.itemS * 0.62, ry = rx * G.K;
  return g({name, opacity: 0},
    h('ellipse', {cx: 0, cy: 0, rx: r(rx), ry: r(ry), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3}),
    h('path', {d: `M${r(rx + 4)} 0V${r(-G.itemS * 0.55)}`, stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    sideMark(ctx, {cx: rx + 4, cy: -G.itemS * 0.55 - G.headS * 0.4, s: G.headS * 0.8, side}),
  );
}

/**
 * A band chip measured for a width, at bounded cost: a chip measured for width W (w wide) is reused for any width in
 * [w, W] (it fits there; a one-line chip for any width >= w), a chip that does not fit width W is not measured again
 * for a narrower one.
 */
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
    const M = resolveAD(p);
    const fi = clamp(Math.round(p.focusItem ?? 0), 0, M.n - 1);
    const A = p.scenarioA, B = p.scenarioB;
    const sharedRows = [
      {key: 'object', icon: 'event', text: `${p.origin.name} · ${t.rings}`},
      // (the focus consequence's row carries no ring glyph: its grouping is the contrasted fact)
      ...M.entries.map(e => ({key: `ev${e.i}`, icon: 'item', item: e.i, ring: e.i === fi ? null : e.ring, text: entryText(e)})),
      ...p.sharedFacts.map((f, i) => ({key: `sf${i}`, icon: 'record', text: f})),
      ...M.alternatives.map((a, j) => ({key: `alt${j}`, icon: 'alt', text: altText(ctx, a)})),
      ...linkNotes(ctx, M),
      ...(p.losses[1] ? [{key: 'loss1', icon: 'grouping', text: `${t.alsoNoted}: ${p.losses[1].label}`}] : []),
    ];
    // (the chips that appear later come first, so the shared rows shown from the first frame take the band's foot)
    const band = [
      {key: 'changed', icon: 'rings', text: `${t.changed}: ${p.changedFact}`, when: 'changed'},
      {key: 'neutral', text: p.comparisonLabels.neutral || t.neutral, when: 'note'},
      {key: 'key', text: t.key, when: 'key'},
      {key: 'sharedHead', text: t.shared, when: 'shared'},
      ...sharedRows.map(rw => ({...rw, when: 'shared'})),
    ];
    const head = (k, S) => `${k} · ${S.label}${S.caption ? ` · ${S.caption}` : ''}`;
    const base = {
      M, fi, heads: [
        {key: 'hA', side: 'before', text: `${head('A', A)} · ${t.innerRing}`, text0: head('A', A)},
        {key: 'hB', side: 'after', text: `${head('B', B)} · ${t.outerRing}`, text0: head('B', B)},
      ],
      band, guideText: gp(`${p.comparisonLabels.guide || t.guide}: ${t.item} ${fi + 1} · ${p.losses[0].label}`),
      memo: {shared: new Map(), gc: new Map(), heads: new Map(), ranges: new Map()},
    };
    base.guideItem = {key: 'guide', icon: 'rings', text: base.guideText, when: 'guide'};
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
    L.M = M; L.fi = fi;
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
      const G = geom(mx0, F, PH);
      const head = L.headSide ? hd.build(G.x1 + 24, G.top + 2, i ? 'hB' : 'hA') : hd.build(x0 + (L.laneW - hd.w) / 2, y0, i ? 'hB' : 'hA');
      // the shared consequences (the focus one keeps the path at angle 0 free), the slots and the waiting spot
      const at = rr => G.at(rr, PATH_A);
      return {i, x0, y0, head, F, G, mx0, places: places(G, M, fi), p0: at(R0 * PH), pIn: at(G.rIn), pOut: at(G.rOut)};
    });
    const [, lb] = L.lanes;
    L.bx = [lb.pIn.x, lb.pOut.x];
    L.brY = lb.G.cy - BR_UP * PH;
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
      const slot = ln.i ? ln.pOut : ln.pIn;
      const m1 = G.at(G.R1, MARK_A), m2 = G.at(G.R2, MARK_A);
      // the objects and the markers, back to front; the focus consequence is posed per frame
      const stand = [
        {y: G.cy, node: g({transform: T(G.cx, G.cy)}, eventArt(ctx, {s: G.PH}))},
        ...ln.places.map(q => ({y: q.y, node: g({transform: T(q.x, q.y)}, itemArt(ctx, {i: q.i, s: G.itemS * ITEM_K}))})),
        {y: m1.y, node: g({name: `mk1${n}`, transform: T(m1.x, m1.y)}, postArt(ctx, {name: `mk1${n}p`, G, side: 'before', stem: MARK_STEM}))},
        {y: m2.y, node: g({name: `mk2${n}`, transform: T(m2.x, m2.y)}, postArt(ctx, {name: `mk2${n}p`, G, side: 'after', stem: MARK_STEM}))},
        {y: ln.p0.y + 0.01, node: g({name: `item${n}`, transform: T(ln.p0.x, ln.p0.y)}, itemArt(ctx, {i: L.fi, s: G.itemS * ITEM_K}))},
      ].sort((a, b) => a.y - b.y);
      return g({name: `lane${n}`},
        floorArt(ctx, {name: `floor${n}`, x0: ln.x0 + 6, x1: ln.x0 + L.laneW - 6, floorY: ln.F}),
        g({name: `field${n}`},
          plateArt(ctx, {G}),
          g({transform: T(G.cx, G.cy)}, ringArt(ctx, {R: G.R1, w: Math.max(5, G.PH * 0.028)})),
          g({transform: T(G.cx, G.cy)}, ringArt(ctx, {R: G.R2, w: Math.max(5, G.PH * 0.028)})),
          // the localized change: A's ● stop at the inner slot, B's ◆ stop at the outer slot (same shape and weight)
          g({name: `stop${n}`, transform: T(slot.x, slot.y)}, stopArt(ctx, {name: `stop${n}-art`, G, side: ln.i ? 'after' : 'before'})),
          stand.map(q => q.node)),
        ln.head.node,
      );
    };
    const [la, lb] = L.lanes;
    // the guide: A's consequence carried to the same spot on B, routed above the fields
    const topA = la.pIn.y - la.G.itemS * ITEM_K - 6, topB = lb.pIn.y - lb.G.itemS * ITEM_K - 6;
    let lineD;
    if (L.arr === 'row') {
      const yy = Math.min(la.G.top, lb.G.top) - 4;
      lineD = `M${r(la.pIn.x)} ${r(topA)}V${r(yy)}H${r(lb.pIn.x)}V${r(topB)}`;
    } else {
      const xl = la.G.x0 - 2;
      lineD = `M${r(la.pIn.x)} ${r(topA)}V${r(la.G.top - 4)}H${r(xl)}V${r(lb.G.top - 4)}H${r(lb.pIn.x)}V${r(topB)}`;
    }
    const tick = L.brY + lb.G.PH * 0.08;
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
    const sl = ease.inOutCubic(seg(u, ...W.slide));
    const st = ease.outCubic(seg(u, ...W.stops));
    L.lanes.forEach(ln => {
      const n = ln.i ? 'B' : 'A';
      const G = ln.G;
      const sp = ln.i ? ease.inOutCubic(seg(u, ...W.spread)) : 0;
      // the same slide on both (event → inner slot); then only B's goes on to the outer slot
      const rr = sp > 0 ? lerp(G.rIn, G.rOut, sp) : lerp(R0 * G.PH, G.rIn, sl);
      const pt = G.at(rr, PATH_A);
      nodes[`item${n}`] = {transform: T(pt.x, pt.y)};
      const slot = ln.i ? ln.pOut : ln.pIn;
      nodes[`stop${n}-art`] = {opacity: st > 0 ? 1 : 0};
      nodes[`stop${n}`] = {transform: T(slot.x, slot.y - (1 - st) * G.PH * 0.12)};
      // one head frame; its text swaps in sequence (no ring → ring), never both lines legible at once
      const hn = ln.i ? 'hB' : 'hA';
      nodes[hn] = {opacity: r(seg(u, ...W.heads), 3)};
      if (L.heads[ln.i].hasText0) { nodes[`${hn}-t0`] = {opacity: r(1 - seg(u, ...W.lvOut), 3)}; nodes[`${hn}-t1`] = {opacity: r(seg(u, ...W.lvIn), 3)}; }
      // (lane-local look: the focus consequence's position relative to the lane, the stop's progress)
      look.push({item: r(pt.x - ln.x0, 1), r: r(rr / G.PH, 3), stop: r(st, 3), head: r(seg(u, ...W.heads), 3)});
    });
    nodes.guide = {opacity: r(seg(u, ...W.line), 3)};
    const lb = L.lanes[1];
    const tick = L.brY + lb.G.PH * 0.08;
    const bl = Math.abs(L.bx[1] - L.bx[0]) + 2 * (tick - L.brY) + 10;
    nodes['guide-bracket'] = {'stroke-dashoffset': r(bl * (1 - seg(u, ...W.guide)))};
    if (L.guideChip) nodes['guide-chip-g'] = {opacity: r(seg(u, ...W.guide), 3)};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'guide' ? seg(u, ...W.guide) : b.when === 'key' ? seg(u, ...W.key) : b.when === 'changed' ? seg(u, ...W.changed) : b.when === 'shared' ? seg(u, ...W.shared) : seg(u, ...W.note), 3)};
    const [fA, fB] = L.lanes;
    const pos = (q, G) => (Math.abs(q.r - R0) < 1e-3 ? 'start' : Math.abs(q.r * G.PH - G.rIn) < 0.5 ? 'inner' : Math.abs(q.r * G.PH - G.rOut) < 0.5 ? 'outer' : 'moving');
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.run[1] ? 'run' : 'guide',
      // before the change beat the two lanes are identical (the stops are not yet in place)
      lookA: u < W.stops[0] ? {...look[0], stop: 0} : look[0], lookB: u < W.stops[0] ? {...look[1], stop: 0} : look[1],
      stops: r(st, 3), slide: r(sl, 3),
      posA: pos(look[0], fA.G), posB: pos(look[1], fB.G),
      itemA: {x: r(look[0].item + fA.x0), y: r(fA.pIn.y)},
      itemB: {x: r(look[1].item + fB.x0), y: r(fB.pIn.y)},
      guideShown: seg(u, ...W.guide) >= 1, keyShown: seg(u, ...W.key) >= 1,
      focusItem: L.fi,
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
    slug: 'causation-08-contrast',
    title: 'Scope of damage — immediate and subsequent consequence, two identical ring fields that differ only in where one supplied consequence is grouped',
    titleEs: 'Alcance del daño — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Alcance del daño',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical fictional ring fields, A (immediate consequence, ●) and B (subsequent consequence, ◆, to be examined): the same event, the same supplied consequences and the same two rings. One localized change each: a ● stop at A’s inner slot, a ◆ stop at B’s outer slot. The same action then runs on both — the focus consequence slides out of the event to the inner slot — and only on B it goes on across the inner ring to the outer slot. A guide line and a bracket on B mark the one difference, as supplied. Shared consequences drawn once. No winner, no conclusion; the rings are only a supplied grouping; nothing is tested, valued or decided.',
    tags: ['causation', 'scope of damage', 'contrast', 'immediate consequence', 'subsequent consequence', 'rings', 'grouping as supplied', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/alcance-dano.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
